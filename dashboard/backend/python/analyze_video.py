#!/usr/bin/env python3
"""
Video Analysis Wrapper Script
Processes CCTV footage using the DOT404 escalation detection pipeline
and outputs structured JSON results.
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
    IMPORTS_AVAILABLE = True
except ImportError as e:
    IMPORTS_AVAILABLE = False
    IMPORT_ERROR = str(e)

GRID = (3, 3)
MODEL_PATH = os.path.join(DOT404_PATH, 'models', 'yolov8n.pt')


def analyze_video(video_path: str, video_id: str) -> dict:
    """
    Analyze video and return frame-by-frame metrics.
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
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
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
    
    # Initialize smoothers
    ema_fast = EMASmoother(0.15)
    ema_slow = EMASmoother(0.05)
    hyst = HysteresisFilter(0.05, 0.03)
    limiter = RateLimiter(0.015)
    heat_smoother = HeatmapSmoother(GRID)
    
    frames_data = []
    frame_number = 0
    sample_interval = max(1, int(fps / 5))  # Sample 5 frames per second max
    
    print(f"[PROGRESS] Processing video: {total_frames} frames at {fps} fps", file=sys.stderr)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_number += 1
        
        # Skip frames for efficiency
        if frame_number % sample_interval != 0:
            continue
        
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
        total_variance = 0
        total_entropy = 0
        for v, h in local_metrics:
            e = (
                0.4 * np.clip(d_rate / 5.0, 0, 1) +
                0.35 * np.clip(v / 10.0, 0, 1) +
                0.25 * np.clip(h / 3.0, 0, 1)
            )
            local_energies.append(float(e))
            total_variance += v
            total_entropy += h
        
        # Escalation pipeline
        contrast_energy = escalation_contrast(local_energies)
        raw = squash_escalation(contrast_energy)
        
        s = ema_fast.update(raw)
        s = ema_slow.update(s)
        s = hyst.update(s)
        s = limiter.update(s)
        
        # Calculate motion intensity (average magnitude)
        mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        motion_intensity = float(np.mean(mag))
        
        # Timestamp for this frame
        timestamp = datetime.now().isoformat()
        time_in_video = frame_number / fps
        
        frame_data = {
            "frame_number": frame_number,
            "time_in_video": round(time_in_video, 2),
            "timestamp": timestamp,
            "escalation_score": round(float(s), 4),
            "motion_intensity": round(motion_intensity, 4),
            "person_count": people,
            "local_energies": [round(e, 4) for e in local_energies],
            "velocity_variance": round(total_variance / len(local_metrics), 4) if local_metrics else 0,
            "directional_entropy": round(total_entropy / len(local_metrics), 4) if local_metrics else 0
        }
        
        frames_data.append(frame_data)
        prev_gray = gray
        
        if frame_number % (sample_interval * 10) == 0:
            print(f"[PROGRESS] Processed frame {frame_number}/{total_frames}", file=sys.stderr)
    
    cap.release()
    
    # Compute summary
    if frames_data:
        escalations = [f["escalation_score"] for f in frames_data]
        motions = [f["motion_intensity"] for f in frames_data]
        counts = [f["person_count"] for f in frames_data]
        
        summary = {
            "avg_escalation": round(sum(escalations) / len(escalations), 4),
            "max_escalation": round(max(escalations), 4),
            "min_escalation": round(min(escalations), 4),
            "avg_motion": round(sum(motions) / len(motions), 4),
            "avg_person_count": round(sum(counts) / len(counts), 2),
            "max_person_count": max(counts),
            "total_frames_processed": len(frames_data),
            "duration_seconds": round(frame_number / fps, 2)
        }
    else:
        summary = {}
    
    return {
        "success": True,
        "video_id": video_id,
        "video_path": video_path,
        "frames": frames_data,
        "summary": summary,
        "metadata": {
            "fps": fps,
            "total_frames": total_frames,
            "grid_size": GRID,
            "analyzed_at": datetime.now().isoformat()
        }
    }


def main():
    if len(sys.argv) < 3:
        result = {
            "success": False,
            "error": "Usage: python analyze_video.py <video_path> <video_id>"
        }
        print(json.dumps(result))
        sys.exit(1)
    
    video_path = sys.argv[1]
    video_id = sys.argv[2]
    
    result = analyze_video(video_path, video_id)
    print(json.dumps(result))
    
    if not result["success"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
