#!/usr/bin/env python3
"""
Video Processing Script for Dashboard Visualization
Processes CCTV footage using DOT404 pipeline and outputs
processed frames with heatmap overlay as a video file.
"""

import sys
import os
import json
import cv2
import numpy as np
from datetime import datetime

# Add DOT404 to path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DOT404_PATH = os.path.join(SCRIPT_DIR, '..', '..', '..', 'DOT404')
sys.path.insert(0, DOT404_PATH)

try:
    from ultralytics import YOLO
    from escalation import velocity_variance, directional_entropy, density_rate, escalation_contrast, squash_escalation
    from local_physics import local_motion_metrics
    from smoothing import EMASmoother, HysteresisFilter
    from rate_limiter import RateLimiter
    from heatmap_smoothing import HeatmapSmoother
    from heatmap import build_heatmap
    IMPORTS_AVAILABLE = True
except ImportError as e:
    IMPORTS_AVAILABLE = False
    IMPORT_ERROR = str(e)

GRID = (3, 3)
MODEL_PATH = os.path.join(DOT404_PATH, 'models', 'yolov8n.pt')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', 'uploads', 'processed')


def risk_color(score):
    """Get color based on escalation score"""
    if score < 0.3:
        return (0, 200, 0)  # Green
    elif score < 0.6:
        return (0, 200, 200)  # Yellow
    else:
        return (0, 0, 255)  # Red


def draw_grid(frame, grid):
    """Draw grid overlay on frame"""
    h, w = frame.shape[:2]
    rows, cols = grid
    for r in range(1, rows):
        cv2.line(frame, (0, r*h//rows), (w, r*h//rows), (255, 255, 255), 1)
    for c in range(1, cols):
        cv2.line(frame, (c*w//cols, 0), (c*w//cols, h), (255, 255, 255), 1)


def process_video_with_overlay(video_path: str, video_id: str, output_format: str = 'webm') -> dict:
    """
    Process video and output with heatmap overlay.
    Returns path to processed video and frame-by-frame metrics.
    """
    if not IMPORTS_AVAILABLE:
        return {
            "success": False,
            "error": f"Required imports not available: {IMPORT_ERROR}"
        }
    
    if not os.path.exists(video_path):
        return {
            "success": False,
            "error": f"Video file not found: {video_path}"
        }
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "success": False,
            "error": f"Failed to open video: {video_path}"
        }
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Output path
    output_filename = f"{video_id}_processed.{output_format}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # Setup video writer
    if output_format == 'webm':
        fourcc = cv2.VideoWriter_fourcc(*'VP80')
    else:
        # Try H.264 (avc1) for better browser compatibility
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
    
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Fallback to mp4v if avc1 fails
    if not out.isOpened() and output_format == 'mp4':
        print("[WARNING] avc1 codec failed, falling back to mp4v", file=sys.stderr)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    if not out.isOpened():
        return {
            "success": False,
            "error": "Failed to create output video writer"
        }
    
    # Load YOLO model
    try:
        model = YOLO(MODEL_PATH)
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to load YOLO model: {str(e)}"
        }
    
    # Initialize first frame
    ret, prev = cap.read()
    if not ret:
        return {
            "success": False,
            "error": "Failed to read first frame"
        }
    
    prev_gray = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
    
    # Initialize smoothers (same as main.py)
    ema_fast = EMASmoother(0.15)
    ema_slow = EMASmoother(0.05)
    hyst = HysteresisFilter(0.05, 0.03)
    limiter = RateLimiter(0.015)
    heat_smoother = HeatmapSmoother(GRID)
    
    frames_data = []
    frame_number = 0
    
    print(f"[PROGRESS] Processing video: {total_frames} frames at {fps} fps", file=sys.stderr)
    print(f"[PROGRESS] Output: {output_path}", file=sys.stderr)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_number += 1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Optical flow
        flow = cv2.calcOpticalFlowFarneback(
            prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
        )
        
        # Person detection
        results = model(frame, conf=0.3, classes=[0], verbose=False)
        people = len(results[0].boxes)
        d_rate = density_rate(people)
        
        # Local motion metrics
        local_metrics = local_motion_metrics(flow, frame.shape, GRID)
        
        # Compute local energies
        local_energies = []
        for v, h in local_metrics:
            e = (
                0.4 * np.clip(d_rate / 5.0, 0, 1) +
                0.35 * np.clip(v / 10.0, 0, 1) +
                0.25 * np.clip(h / 3.0, 0, 1)
            )
            local_energies.append(float(e))
        
        # Escalation pipeline
        contrast_energy = escalation_contrast(local_energies)
        raw = squash_escalation(contrast_energy)
        
        s = ema_fast.update(raw)
        s = ema_slow.update(s)
        s = hyst.update(s)
        s = limiter.update(s)
        
        # Update heatmap
        heat_smoother.update(local_energies)
        stable_local = heat_smoother.spatial_smooth()
        
        # Build heatmap overlay (same as main.py)
        heatmap = build_heatmap(stable_local.flatten(), GRID, frame.shape)
        
        # Create overlay (same as main.py)
        overlay = cv2.addWeighted(frame, 0.6, heatmap, 0.4, 0)
        draw_grid(overlay, GRID)
        
        # Draw escalation score box (only escalation, no density/people count)
        cv2.rectangle(overlay, (10, 10), (360, 60), (0, 0, 0), -1)
        cv2.putText(
            overlay,
            f"Escalation Risk: {s:.2f}",
            (20, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.85,
            risk_color(s),
            2
        )
        
        # Write processed frame
        out.write(overlay)
        
        # Store metrics
        if frame_number % 5 == 0:  # Sample every 5th frame for metrics
            frames_data.append({
                "frame_number": frame_number,
                "time_in_video": round(frame_number / fps, 2),
                "escalation_score": round(float(s), 4),
                "person_count": people,
                "local_energies": [round(e, 4) for e in local_energies]
            })
        
        prev_gray = gray
        
        if frame_number % 100 == 0:
            print(f"[PROGRESS] Processed frame {frame_number}/{total_frames}", file=sys.stderr)
    
    cap.release()
    out.release()
    
    # Compute summary
    if frames_data:
        escalations = [f["escalation_score"] for f in frames_data]
        counts = [f["person_count"] for f in frames_data]
        
        summary = {
            "avg_escalation": round(sum(escalations) / len(escalations), 4),
            "max_escalation": round(max(escalations), 4),
            "avg_person_count": round(sum(counts) / len(counts), 2),
            "total_frames_processed": frame_number,
            "duration_seconds": round(frame_number / fps, 2)
        }
    else:
        summary = {}
    
    # Get relative path for URL
    relative_output_path = f"/uploads/processed/{output_filename}"
    
    return {
        "success": True,
        "video_id": video_id,
        "output_path": output_path,
        "output_url": relative_output_path,
        "frames": frames_data,
        "summary": summary,
        "metadata": {
            "fps": fps,
            "width": width,
            "height": height,
            "total_frames": total_frames,
            "output_format": output_format,
            "analyzed_at": datetime.now().isoformat()
        }
    }


def main():
    if len(sys.argv) < 3:
        result = {
            "success": False,
            "error": "Usage: python process_video.py <video_path> <video_id> [output_format]"
        }
        print(json.dumps(result))
        sys.exit(1)
    
    video_path = sys.argv[1]
    video_id = sys.argv[2]
    output_format = sys.argv[3] if len(sys.argv) > 3 else 'mp4'
    
    result = process_video_with_overlay(video_path, video_id, output_format)
    print(json.dumps(result))
    
    if not result["success"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
