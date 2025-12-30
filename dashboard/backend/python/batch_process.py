#!/usr/bin/env python3
"""
Batch process all videos in DOT404/videos directory
Generates heatmap overlay visualizations for each video
"""

import os
import sys
import json
from pathlib import Path

# Add the python directory to path for imports
SCRIPT_DIR = Path(__file__).parent.absolute()
sys.path.insert(0, str(SCRIPT_DIR))

from process_video import process_video_with_overlay

# Paths
DOT404_VIDEOS = Path(__file__).parent.parent.parent.parent / 'DOT404' / 'videos'
OUTPUT_DIR = SCRIPT_DIR.parent / 'uploads' / 'processed'

def get_video_files():
    """Get list of video files in DOT404/videos"""
    video_extensions = {'.mp4', '.webm', '.avi', '.mov', '.mkv'}
    videos = []
    
    if DOT404_VIDEOS.exists():
        for f in DOT404_VIDEOS.iterdir():
            if f.suffix.lower() in video_extensions:
                videos.append(f)
    
    return sorted(videos, key=lambda x: x.name)

def process_all_videos():
    """Process all videos and return results"""
    videos = get_video_files()
    
    if not videos:
        return {
            "success": False,
            "error": f"No videos found in {DOT404_VIDEOS}"
        }
    
    print(f"[INFO] Found {len(videos)} videos to process", file=sys.stderr)
    
    results = []
    for i, video_path in enumerate(videos):
        video_id = video_path.stem  # Use filename without extension as ID
        
        print(f"[PROGRESS] Processing video {i+1}/{len(videos)}: {video_path.name}", file=sys.stderr)
        
        try:
            result = process_video_with_overlay(
                str(video_path), 
                video_id,
                'webm'  # Output as webm for browser compatibility
            )
            
            if result.get('success'):
                results.append({
                    "video_id": video_id,
                    "input_path": str(video_path),
                    "output_url": result.get('output_url'),
                    "output_path": result.get('output_path'),
                    "summary": result.get('summary', {}),
                    "status": "success"
                })
                print(f"[SUCCESS] Processed {video_path.name}", file=sys.stderr)
            else:
                results.append({
                    "video_id": video_id,
                    "input_path": str(video_path),
                    "error": result.get('error', 'Unknown error'),
                    "status": "failed"
                })
                print(f"[ERROR] Failed {video_path.name}: {result.get('error')}", file=sys.stderr)
                
        except Exception as e:
            results.append({
                "video_id": video_id,
                "input_path": str(video_path),
                "error": str(e),
                "status": "failed"
            })
            print(f"[ERROR] Exception {video_path.name}: {e}", file=sys.stderr)
    
    successful = [r for r in results if r['status'] == 'success']
    failed = [r for r in results if r['status'] == 'failed']
    
    return {
        "success": True,
        "total": len(videos),
        "processed": len(successful),
        "failed": len(failed),
        "results": results
    }

def main():
    result = process_all_videos()
    print(json.dumps(result, indent=2))
    
    if not result["success"]:
        sys.exit(1)

if __name__ == "__main__":
    main()
