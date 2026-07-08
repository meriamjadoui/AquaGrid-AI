"""
generate_data.py
-----------------
Generates synthetic training data for the AquaGrid-AI leak detection model.

Why synthetic data?
We don't have real historical sensor logs yet (Firebase logging is not
long-running in production). To bootstrap a genuinely trained model, we
simulate realistic flowRate / reservoirLevel time series, inject leak
events, and compute the same features the original hand-coded
leak_model.js was using -- but this time we generate LABELS from a known
ground truth (whether a leak was actually injected), not from a hand-tuned
threshold. The model then learns the mapping itself.

Output: data/synthetic_leak_data.csv
Columns: currentloss, rollingmeanloss, rollingstdloss, consecutivehigh, is_leak
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

N_SEQUENCES = 400          # number of independent simulated "sessions"
TICKS_PER_SEQUENCE = 60    # 60 ticks per session (~3 min of data at 3s/tick)
WINDOW = 5                 # rolling window size (matches leak_model.js)
LOSS_THRESHOLD_FOR_CONSEC = 0.15  # matches consecutiveHigh logic in JS

def simulate_sequence(leak_probability=0.35):
    """
    Simulates one sensor session. With some probability, injects a leak
    starting at a random tick that persists to the end of the sequence.
    Returns arrays of flowRate, reservoirLevel, and the ground-truth
    leak label per tick.
    """
    has_leak = np.random.rand() < leak_probability
    leak_start = np.random.randint(20, 45) if has_leak else None

    base_flow = np.random.uniform(2.0, 6.0)       # L/min baseline
    base_level = np.random.uniform(40.0, 90.0)    # % reservoir level

    flow_rate = []
    reservoir_level = []
    labels = []

    level = base_level

    for t in range(TICKS_PER_SEQUENCE):
        # Normal noise on flow and level
        flow = base_flow + np.random.normal(0, 0.3)
        level_drop = flow * 0.05 + np.random.normal(0, 0.1)

        is_leaking = has_leak and t >= leak_start

        if is_leaking:
            # Leak = extra unaccounted water loss -> flow reads higher
            # relative to how much the reservoir level actually drops
            leak_intensity = np.random.uniform(1.5, 3.5)
            flow += leak_intensity
            level_drop *= 0.6  # reservoir doesn't drop proportionally as fast

        level = max(level - level_drop, 1.0)

        flow_rate.append(max(flow, 0.01))
        reservoir_level.append(level)
        labels.append(1 if is_leaking else 0)

    return np.array(flow_rate), np.array(reservoir_level), np.array(labels)


def compute_features(flow_rate, reservoir_level):
    """
    Recreates the exact feature engineering from leak_model.js:
      lossRatio = flowRate / max(reservoirLevel, 1)
      rollingmeanloss = mean of last WINDOW lossRatio values
      rollingstdloss  = std of same window
      consecutivehigh = consecutive ticks where lossRatio > 0.15
    """
    n = len(flow_rate)
    loss_ratio = flow_rate / np.maximum(reservoir_level, 1.0)

    rolling_mean = np.zeros(n)
    rolling_std = np.zeros(n)
    consecutive_high = np.zeros(n)

    consec = 0
    for t in range(n):
        window = loss_ratio[max(0, t - WINDOW + 1):t + 1]
        rolling_mean[t] = window.mean()
        rolling_std[t] = window.std()

        if loss_ratio[t] > LOSS_THRESHOLD_FOR_CONSEC:
            consec += 1
        else:
            consec = 0
        consecutive_high[t] = consec

    return loss_ratio, rolling_mean, rolling_std, consecutive_high


def main():
    rows = []

    for _ in range(N_SEQUENCES):
        flow_rate, reservoir_level, labels = simulate_sequence()
        loss_ratio, rolling_mean, rolling_std, consecutive_high = compute_features(
            flow_rate, reservoir_level
        )

        for t in range(len(flow_rate)):
            rows.append({
                "currentloss": loss_ratio[t],
                "rollingmeanloss": rolling_mean[t],
                "rollingstdloss": rolling_std[t],
                "consecutivehigh": consecutive_high[t],
                "is_leak": labels[t],
            })

    df = pd.DataFrame(rows)

    os.makedirs("data", exist_ok=True)
    out_path = "data/synthetic_leak_data.csv"
    df.to_csv(out_path, index=False)

    print(f"Generated {len(df)} rows -> {out_path}")
    print(f"Leak ratio: {df['is_leak'].mean():.2%} positive class")
    print(df.describe())


if __name__ == "__main__":
    main()
