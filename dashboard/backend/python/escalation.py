import numpy as np
import cv2

# ================= BASIC CROWD PHYSICS =================

def velocity_energy(flow, magnitude_threshold=0.5): # CHANGED: Lowered from 2.0 to 0.5
    """
    Returns the raw kinetic energy. 
    Threshold lowered to 0.5 to detect slower/distant crowds.
    """
    mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    mag[mag < magnitude_threshold] = 0
    return float(np.mean(mag))

def directional_entropy(flow, bins=16, magnitude_threshold=0.5): # CHANGED: Lowered from 2.0
    mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    valid_indices = mag > magnitude_threshold
    
    if not np.any(valid_indices):
        return 0.0

    ang = ang[valid_indices].flatten()
    bin_edges = np.linspace(0, 2 * np.pi, bins + 1)
    hist, _ = np.histogram(ang, bins=bin_edges)
    hist = hist / (hist.sum() + 1e-8)
    return float(-np.sum(hist * np.log(hist + 1e-8)))

# ================= IMPROVED ESCALATION =================

def hybrid_escalation_score(local_scores):
    e = np.asarray(local_scores, dtype=np.float32)
    if e.size == 0: return 0.0

    mean_e = np.mean(e)
    var_e = np.var(e)
    max_e = np.max(e)

    # RE-BALANCED:
    # If the variance is high (fighting), boost score significantly.
    score = (0.5 * max_e) + (0.3 * mean_e) + (0.2 * var_e)
    return float(score)

def squash_escalation(x, tau=0.3, gamma=5.0): # CHANGED: Lowered tau from 0.5 to 0.3
    # This makes the score turn "Red" much easier/earlier
    return float(1.0 / (1.0 + np.exp(-gamma * (x - tau))))