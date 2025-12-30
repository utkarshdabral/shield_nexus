import cv2
import numpy as np
import torch
import torchvision.transforms.functional as F
from torchvision.models.detection import retinanet_resnet50_fpn_v2, RetinaNet_ResNet50_FPN_V2_Weights
from torchvision.models.optical_flow import raft_small, Raft_Small_Weights
import argparse
import sys
import os

from escalation import hybrid_escalation_score, squash_escalation
from local_physics import local_motion_metrics
from smoothing import EMASmoother, HysteresisFilter
from heatmap import build_heatmap
from heatmap_smoothing import HeatmapSmoother

# ================= CONFIGURATION =================
GRID = (4, 4)

# Resolution must be divisible by 8 for RAFT
PROC_W, PROC_H = 480, 272 

# Hardware Acceleration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
if torch.backends.mps.is_available():
    DEVICE = "mps"

print(f"Running on: {DEVICE}")

# ================= 1. MODEL LOADER =================

def load_models():
    print("Loading RetinaNet (Dense Crowd Detection)...")
    # RetinaNet is better than YOLO for small objects (heads in crowds)
    det_weights = RetinaNet_ResNet50_FPN_V2_Weights.DEFAULT
    detector = retinanet_resnet50_fpn_v2(weights=det_weights).to(DEVICE).eval()
    preprocess_det = det_weights.transforms()

    print("Loading RAFT (Neural Optical Flow)...")
    # RAFT ignores wind/camera noise better than standard CV2 flow
    flow_weights = Raft_Small_Weights.DEFAULT
    flow_model = raft_small(weights=flow_weights).to(DEVICE).eval()
    preprocess_flow = flow_weights.transforms()

    return detector, preprocess_det, flow_model, preprocess_flow

# ================= 2. HELPERS =================

def get_people_count(detector, img_tensor):
    """Runs RetinaNet to count people with Hypersensitivity"""
    try:
        with torch.no_grad():
            preds = detector([img_tensor])[0]
        
        # CRITICAL FIX: Confidence > 0.05 (Very Low)
        # We accept "garbage" detections because in a crowd, even low-conf blobs are usually people.
        # This prevents the "Density: 1.0" bug.
        mask = (preds['labels'] == 1) & (preds['scores'] > 0.05)
        count = mask.sum().item()
        return count
    except Exception as e:
        print(f"Warning: Detection failed on frame: {e}")
        return 0

def get_raft_flow(model, transforms, img1, img2):
    """Runs RAFT to get clean Optical Flow"""
    # 1. Convert to Tensor
    img1_batch = F.to_tensor(img1).to(DEVICE).unsqueeze(0)
    img2_batch = F.to_tensor(img2).to(DEVICE).unsqueeze(0)
    
    # 2. Preprocess (Must pass BOTH together)
    img1_batch, img2_batch = transforms(img1_batch, img2_batch)

    # 3. Inference
    with torch.no_grad():
        list_of_flows = model(img1_batch, img2_batch)
    
    # 4. Extract Result (Permute to H,W,2 for physics engine)
    predicted_flow = list_of_flows[-1][0].permute(1, 2, 0).cpu().numpy()
    return predicted_flow

# ================= 3. MAIN LOOP =================

def process_video(input_path, output_path):
    print(f"Processing video: {input_path}")
    print(f"Output path: {output_path}")

    detector, t_det, flow_model, t_flow = load_models()
    cap = cv2.VideoCapture(input_path)

    ret, prev = cap.read()
    if not ret: 
        print("Error: Could not read video.")
        return

    # Resize initial frame
    prev = cv2.resize(prev, (PROC_W, PROC_H))
    
    # Video Writer Output Setup
    # Use 'vp80' for WebM which is web friendly, or mp4v for mp4
    # If output path ends in .webm use VP80, else mp4v
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0: fps = 30.0
    
    fourcc = cv2.VideoWriter_fourcc(*'vp80') if output_path.endswith('.webm') else cv2.VideoWriter_fourcc(*'mp4v')
    out_writer = cv2.VideoWriter(output_path, fourcc, fps, (PROC_W, PROC_H))

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total frames: {total_frames}")

    # Initialize Smoothers
    ema = EMASmoother(0.15)
    hyst = HysteresisFilter(0.1, 0.05)
    heat_smoother = HeatmapSmoother(GRID, alpha=0.3)
    
    avg_density = 1.0
    frame_count = 0
    video_metrics = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        frame_count += 1
        
        # Log progress every 10 frames
        if frame_count % 10 == 0:
            progress = (frame_count / total_frames) * 100
            print(f"[PROGRESS] {progress:.1f}%")
            sys.stdout.flush()

        frame_proc = cv2.resize(frame, (PROC_W, PROC_H))

        # --- A. NEURAL OPTICAL FLOW (RAFT) ---
        flow = get_raft_flow(flow_model, t_flow, prev, frame_proc)

        # --- B. DENSE DETECTION (RetinaNet) ---
        # Run every 10th frame to save performance
        if frame_count % 10 == 0:
            img_tensor = F.to_tensor(frame_proc).to(DEVICE)
            raw_ppl = get_people_count(detector, img_tensor)
            
            # Normalize density. We assume ~20 people is a "crowd" in this view.
            # max(1.0) ensures that if detection fails, physics still runs.
            avg_density = max(1.0, raw_ppl / 10.0) 

        # --- C. PHYSICS ENGINE ---
        local_metrics = local_motion_metrics(flow, (PROC_H, PROC_W), GRID)

        local_energies = []
        for v, h in local_metrics:
            # CRITICAL FIX: Signal Boosting
            # RAFT gives small float values. We multiply by 2.0 to make them visible.
            # v * 2.0 = Velocity Gain
            # h * 1.5 = Entropy (Chaos) Gain
            e = (0.7 * np.clip(v * 2.0, 0, 1) + 
                 0.3 * np.clip(h * 1.5, 0, 1))
            local_energies.append(float(e))

        # --- D. SCORING ---
        raw_score = hybrid_escalation_score(local_energies)
        
        # Combined Risk = Motion Chaos * Crowd Density
        final_risk = squash_escalation(raw_score * avg_density)

        s = ema.update(final_risk)
        s = hyst.update(s)

        # --- E. VISUALIZATION ---
        heat_smoother.update(local_energies)
        stable_local = heat_smoother.spatial_smooth()
        heatmap = build_heatmap(stable_local.flatten(), GRID, (PROC_H, PROC_W))
        
        # Overlay heatmap on processed frame
        overlay = cv2.addWeighted(frame_proc, 0.6, heatmap, 0.4, 0)

        # --- HUD (Heads Up Display) ---
        # Dynamic Color: Green -> Yellow -> Red
        color = (0, 255, 0)
        if s > 0.4: color = (0, 255, 255) # Yellow
        if s > 0.7: color = (0, 0, 255)   # Red

        # Draw Background Box
        cv2.rectangle(overlay, (10, 10), (420, 60), (0,0,0), -1)
        
        # Draw Text
        text = f"RISK: {s:.2f} | DENSITY: {avg_density:.1f}"
        cv2.putText(overlay, text, (20, 45), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        # Save frame
        out_writer.write(overlay)
        
        # Collect Metrics
        video_metrics.append({
            "frame": frame_count,
            "timestamp_ms": cap.get(cv2.CAP_PROP_POS_MSEC),
            "escalation_score": float(s),
            "crowd_density": float(avg_density),
            "motion_intensity": float(np.mean([x['v'] if isinstance(x, dict) else x[0] for x in local_metrics]) if local_metrics else 0), # Simplified msg for motion
            "person_count": 0 # Not strictly counted every frame, can infer from density
        })

        prev = frame_proc

    cap.release()
    out_writer.release()
    
    # Save Metrics to JSON
    json_path = output_path.replace('.webm', '.json').replace('.mp4', '.json')
    import json
    with open(json_path, 'w') as f:
        json.dump(video_metrics, f, indent=2)
        
    print(f"Processing complete. Video saved to {output_path}")
    print(f"Metrics saved to {json_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='DOT404 Video Processor')
    parser.add_argument('--input', type=str, required=True, help='Path to input video')
    parser.add_argument('--output', type=str, required=True, help='Path to output processed video')
    args = parser.parse_args()

    process_video(args.input, args.output)


