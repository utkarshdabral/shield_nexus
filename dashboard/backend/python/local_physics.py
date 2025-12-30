from escalation import velocity_energy, directional_entropy

def local_motion_metrics(flow, frame_shape, grid=(3, 3)):
    """
    Calculates physics metrics for each grid cell.
    Now uses velocity_energy (mean speed) instead of variance.
    """
    # frame_shape might be the small flow shape (h, w), handle gracefully
    h, w = frame_shape[:2]
    rows, cols = grid
    metrics = []

    for r in range(rows):
        for c in range(cols):
            # Calculate grid cell coordinates
            y1 = int(r * h // rows)
            y2 = int((r + 1) * h // rows)
            x1 = int(c * w // cols)
            x2 = int((c + 1) * w // cols)

            # Extract flow for this specific cell
            cell_flow = flow[y1:y2, x1:x2]

            if cell_flow.size == 0:
                metrics.append((0.0, 0.0))
                continue

            # NEW: Use velocity_energy (Mean Magnitude)
            # This detects if this specific block is running fast
            v = velocity_energy(cell_flow, magnitude_threshold=2.0)
            
            # Entropy (Chaos)
            h_val = directional_entropy(cell_flow, magnitude_threshold=2.0)
            
            metrics.append((v, h_val))

    return metrics