"""
Dataset Generator Script
Generates a realistic, anatomically grounded dataset of normalized 21 hand landmarks (63 features)
for all 26 ASL alphabet signs (A-Z) plus SPACE and DELETE using standard library.
"""

import csv
import math
import os
import random


def get_base_skeleton(sign: str):
    """
    Returns 21 landmarks [(x, y, z), ...] for canonical ASL hand shape.
    Coordinates represent hand with wrist at (0, 0, 0).
    Negative Y is UP (towards fingertips).
    Positive X is RIGHT.
    Positive Z is OUT towards camera.
    """
    coords = [[0.0, 0.0, 0.0] for _ in range(21)]
    coords[0] = [0.0, 0.0, 0.0]

    # Knuckle base positions (MCP joints 5, 9, 13, 17)
    coords[5] = [-0.15, -0.40, 0.0]   # Index MCP
    coords[9] = [-0.03, -0.42, 0.0]   # Middle MCP
    coords[13] = [0.08, -0.39, 0.0]   # Ring MCP
    coords[17] = [0.18, -0.34, 0.0]   # Pinky MCP

    # Thumb CMC (1) and MCP (2)
    coords[1] = [-0.18, -0.15, 0.02]
    coords[2] = [-0.28, -0.26, 0.04]

    # 0 = closed/fist, 1 = straight up, 2 = bent/hook, 3 = curved (C/O), 4 = horizontal, 5 = 45 forward, 6 = down
    finger_states = {"index": 0, "middle": 0, "ring": 0, "pinky": 0}
    thumb_state = "side"

    if sign == 'A':
        thumb_state = "side"
    elif sign == 'B':
        finger_states = {"index": 1, "middle": 1, "ring": 1, "pinky": 1}
        thumb_state = "over_palm"
    elif sign == 'C':
        finger_states = {"index": 3, "middle": 3, "ring": 3, "pinky": 3}
        thumb_state = "curved"
    elif sign == 'D':
        finger_states = {"index": 1, "middle": 2, "ring": 2, "pinky": 2}
        thumb_state = "touch_middle"
    elif sign == 'E':
        finger_states = {"index": 2, "middle": 2, "ring": 2, "pinky": 2}
        thumb_state = "tucked_under"
    elif sign == 'F':
        finger_states = {"index": 2, "middle": 1, "ring": 1, "pinky": 1}
        thumb_state = "touch_index"
    elif sign == 'G':
        finger_states = {"index": 4, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "parallel_index"
    elif sign == 'H':
        finger_states = {"index": 4, "middle": 4, "ring": 0, "pinky": 0}
        thumb_state = "parallel_index"
    elif sign == 'I':
        finger_states = {"index": 0, "middle": 0, "ring": 0, "pinky": 1}
        thumb_state = "over"
    elif sign == 'J':
        finger_states = {"index": 0, "middle": 0, "ring": 0, "pinky": 2}
        thumb_state = "over"
    elif sign == 'K':
        finger_states = {"index": 1, "middle": 5, "ring": 0, "pinky": 0}
        thumb_state = "between_index_middle"
    elif sign == 'L':
        finger_states = {"index": 1, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "out_90"
    elif sign == 'M':
        finger_states = {"index": 0, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "under_3"
    elif sign == 'N':
        finger_states = {"index": 0, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "under_2"
    elif sign == 'O':
        finger_states = {"index": 3, "middle": 3, "ring": 3, "pinky": 3}
        thumb_state = "touch_all"
    elif sign == 'P':
        finger_states = {"index": 6, "middle": 6, "ring": 0, "pinky": 0}
        thumb_state = "between_index_middle"
    elif sign == 'Q':
        finger_states = {"index": 6, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "parallel_down"
    elif sign == 'R':
        finger_states = {"index": 1, "middle": 1, "ring": 0, "pinky": 0}
        thumb_state = "over"
    elif sign == 'S':
        finger_states = {"index": 0, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "over"
    elif sign == 'T':
        finger_states = {"index": 0, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "under_1"
    elif sign == 'U':
        finger_states = {"index": 1, "middle": 1, "ring": 0, "pinky": 0}
        thumb_state = "over"
    elif sign == 'V':
        finger_states = {"index": 1, "middle": 1, "ring": 0, "pinky": 0}
        thumb_state = "over"
    elif sign == 'W':
        finger_states = {"index": 1, "middle": 1, "ring": 1, "pinky": 0}
        thumb_state = "touch_pinky"
    elif sign == 'X':
        finger_states = {"index": 2, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "over"
    elif sign == 'Y':
        finger_states = {"index": 0, "middle": 0, "ring": 0, "pinky": 1}
        thumb_state = "out_90"
    elif sign == 'Z':
        finger_states = {"index": 4, "middle": 0, "ring": 0, "pinky": 0}
        thumb_state = "over"
    elif sign == 'SPACE':
        finger_states = {"index": 1, "middle": 1, "ring": 1, "pinky": 1}
        thumb_state = "flat_horizontal"
    elif sign == 'DELETE':
        finger_states = {"index": 6, "middle": 6, "ring": 6, "pinky": 6}
        thumb_state = "side"

    def place_finger(mcp_idx: int, state: int, spread_x: float = 0.0):
        mcp = coords[mcp_idx]
        pip_idx = mcp_idx + 1
        dip_idx = mcp_idx + 2
        tip_idx = mcp_idx + 3

        if state == 1:
            coords[pip_idx] = [mcp[0] + spread_x * 0.3, mcp[1] - 0.15, mcp[2]]
            coords[dip_idx] = [coords[pip_idx][0] + spread_x * 0.3, coords[pip_idx][1] - 0.12, mcp[2]]
            coords[tip_idx] = [coords[dip_idx][0] + spread_x * 0.4, coords[dip_idx][1] - 0.11, mcp[2]]
        elif state == 0:
            coords[pip_idx] = [mcp[0], mcp[1] - 0.06, mcp[2] + 0.08]
            coords[dip_idx] = [coords[pip_idx][0], coords[pip_idx][1] + 0.08, coords[pip_idx][2] + 0.05]
            coords[tip_idx] = [coords[dip_idx][0], coords[dip_idx][1] + 0.07, coords[dip_idx][2] - 0.02]
        elif state == 2:
            coords[pip_idx] = [mcp[0], mcp[1] - 0.10, mcp[2] + 0.04]
            coords[dip_idx] = [coords[pip_idx][0], coords[pip_idx][1] - 0.03, coords[pip_idx][2] + 0.08]
            coords[tip_idx] = [coords[dip_idx][0], coords[dip_idx][1] + 0.05, coords[dip_idx][2] + 0.06]
        elif state == 3:
            coords[pip_idx] = [mcp[0], mcp[1] - 0.11, mcp[2] + 0.06]
            coords[dip_idx] = [coords[pip_idx][0] - 0.03, coords[pip_idx][1] - 0.06, coords[pip_idx][2] + 0.12]
            coords[tip_idx] = [coords[dip_idx][0] - 0.05, coords[dip_idx][1] + 0.02, coords[dip_idx][2] + 0.13]
        elif state == 4:
            coords[pip_idx] = [mcp[0] - 0.12, mcp[1] - 0.05, mcp[2] + 0.02]
            coords[dip_idx] = [coords[pip_idx][0] - 0.10, coords[pip_idx][1] - 0.03, coords[pip_idx][2] + 0.02]
            coords[tip_idx] = [coords[dip_idx][0] - 0.10, coords[dip_idx][1] - 0.02, coords[dip_idx][2] + 0.02]
        elif state == 5:
            coords[pip_idx] = [mcp[0], mcp[1] - 0.12, mcp[2] + 0.08]
            coords[dip_idx] = [coords[pip_idx][0], coords[pip_idx][1] - 0.10, coords[pip_idx][2] + 0.10]
            coords[tip_idx] = [coords[dip_idx][0], coords[dip_idx][1] - 0.08, coords[dip_idx][2] + 0.12]
        elif state == 6:
            coords[pip_idx] = [mcp[0], mcp[1] + 0.12, mcp[2] + 0.02]
            coords[dip_idx] = [coords[pip_idx][0], coords[pip_idx][1] + 0.10, coords[pip_idx][2] + 0.02]
            coords[tip_idx] = [coords[dip_idx][0], coords[dip_idx][1] + 0.10, coords[dip_idx][2] + 0.02]

    v_spread = 0.08 if sign == 'V' else 0.01
    w_spread = 0.06 if sign == 'W' else 0.01

    place_finger(5, finger_states["index"], spread_x=-v_spread - w_spread)
    place_finger(9, finger_states["middle"], spread_x=v_spread)
    place_finger(13, finger_states["ring"], spread_x=w_spread)
    place_finger(17, finger_states["pinky"], spread_x=w_spread * 1.5)

    if sign == 'R':
        coords[8][0] += 0.04
        coords[12][0] -= 0.04

    # Thumb positions (CMC=1, MCP=2, IP=3, Tip=4)
    mcp_t = coords[2]
    if thumb_state == "side":
        coords[3] = [mcp_t[0] + 0.05, mcp_t[1] - 0.10, mcp_t[2] + 0.02]
        coords[4] = [coords[3][0] + 0.04, coords[3][1] - 0.08, coords[3][2] + 0.02]
    elif thumb_state == "over":
        coords[3] = [mcp_t[0] + 0.12, mcp_t[1] - 0.06, mcp_t[2] + 0.08]
        coords[4] = [coords[3][0] + 0.10, coords[3][1], coords[3][2] + 0.07]
    elif thumb_state == "over_palm":
        coords[3] = [mcp_t[0] + 0.14, mcp_t[1] - 0.03, mcp_t[2] + 0.04]
        coords[4] = [coords[3][0] + 0.08, coords[3][1] + 0.02, coords[3][2] + 0.03]
    elif thumb_state == "out_90":
        coords[3] = [mcp_t[0] - 0.15, mcp_t[1], mcp_t[2] + 0.01]
        coords[4] = [coords[3][0] - 0.12, coords[3][1], coords[3][2] + 0.01]
    elif thumb_state == "curved":
        coords[3] = [mcp_t[0] + 0.02, mcp_t[1] - 0.10, mcp_t[2] + 0.10]
        coords[4] = [coords[3][0] + 0.05, coords[3][1] - 0.05, coords[3][2] + 0.12]
    elif thumb_state == "touch_index":
        coords[3] = [mcp_t[0] + 0.08, mcp_t[1] - 0.08, mcp_t[2] + 0.07]
        coords[4] = [coords[8][0] + 0.01, coords[8][1] + 0.01, coords[8][2]]
    elif thumb_state == "touch_middle":
        coords[3] = [mcp_t[0] + 0.10, mcp_t[1] - 0.08, mcp_t[2] + 0.06]
        coords[4] = [coords[12][0] + 0.01, coords[12][1] + 0.01, coords[12][2]]
    elif thumb_state == "touch_all":
        coords[3] = [mcp_t[0] + 0.08, mcp_t[1] - 0.12, mcp_t[2] + 0.10]
        coords[4] = [coords[8][0] + 0.01, coords[8][1] + 0.01, coords[8][2]]
    elif thumb_state == "between_index_middle":
        coords[3] = [mcp_t[0] + 0.08, mcp_t[1] - 0.12, mcp_t[2] + 0.06]
        coords[4] = [coords[3][0] + 0.05, coords[3][1] - 0.08, coords[3][2] + 0.06]
    elif thumb_state == "parallel_index":
        coords[3] = [mcp_t[0] - 0.10, mcp_t[1] - 0.03, mcp_t[2] + 0.02]
        coords[4] = [coords[3][0] - 0.08, coords[3][1] - 0.02, coords[3][2] + 0.02]
    elif thumb_state == "parallel_down":
        coords[3] = [mcp_t[0], mcp_t[1] + 0.10, mcp_t[2] + 0.02]
        coords[4] = [coords[3][0], coords[3][1] + 0.08, coords[3][2] + 0.02]
    elif thumb_state == "tucked_under":
        coords[3] = [mcp_t[0] + 0.10, mcp_t[1] + 0.02, mcp_t[2] + 0.05]
        coords[4] = [coords[3][0] + 0.08, coords[3][1] + 0.04, coords[3][2] + 0.03]
    elif thumb_state == "under_1":
        coords[3] = [mcp_t[0] + 0.10, mcp_t[1] - 0.08, mcp_t[2] + 0.05]
        coords[4] = [coords[3][0] + 0.05, coords[3][1] - 0.05, coords[3][2] + 0.06]
    elif thumb_state == "under_2":
        coords[3] = [mcp_t[0] + 0.14, mcp_t[1] - 0.08, mcp_t[2] + 0.05]
        coords[4] = [coords[3][0] + 0.05, coords[3][1] - 0.04, coords[3][2] + 0.06]
    elif thumb_state == "under_3":
        coords[3] = [mcp_t[0] + 0.18, mcp_t[1] - 0.08, mcp_t[2] + 0.05]
        coords[4] = [coords[3][0] + 0.05, coords[3][1] - 0.03, coords[3][2] + 0.06]
    elif thumb_state == "touch_pinky":
        coords[3] = [mcp_t[0] + 0.16, mcp_t[1] - 0.04, mcp_t[2] + 0.06]
        coords[4] = [coords[20][0] + 0.01, coords[20][1] + 0.01, coords[20][2]]
    elif thumb_state == "flat_horizontal":
        coords[3] = [mcp_t[0] + 0.12, mcp_t[1], mcp_t[2] + 0.02]
        coords[4] = [coords[3][0] + 0.10, coords[3][1], coords[3][2] + 0.01]
    else:
        coords[3] = [mcp_t[0] + 0.05, mcp_t[1] - 0.10, mcp_t[2] + 0.02]
        coords[4] = [coords[3][0] + 0.04, coords[3][1] - 0.08, coords[3][2] + 0.02]

    return coords


def augment_landmarks(base_coords, jitter=0.012, angle_jitter=0.06):
    roll = random.gauss(0, angle_jitter)
    pitch = random.gauss(0, angle_jitter)
    yaw = random.gauss(0, angle_jitter)

    cos_r, sin_r = math.cos(roll), math.sin(roll)
    cos_p, sin_p = math.cos(pitch), math.sin(pitch)
    cos_y, sin_y = math.cos(yaw), math.sin(yaw)

    scale = random.uniform(0.88, 1.12)
    augmented = []

    for idx, (x, y, z) in enumerate(base_coords):
        if idx == 0:
            augmented.append([0.0, 0.0, 0.0])
            continue

        # Rotation
        # Rx
        y1 = y * cos_p - z * sin_p
        z1 = y * sin_p + z * cos_p
        # Ry
        x2 = x * cos_y + z1 * sin_y
        z2 = -x * sin_y + z1 * cos_y
        # Rz
        x3 = x2 * cos_r - y1 * sin_r
        y3 = x2 * sin_r + y1 * cos_r

        # Scale + Noise
        nx = random.gauss(0, jitter)
        ny = random.gauss(0, jitter)
        nz = random.gauss(0, jitter)

        augmented.append([x3 * scale + nx, y3 * scale + ny, z2 * scale + nz])

    return augmented


def normalize_sample(landmarks_21):
    # Wrist is index 0
    wrist = landmarks_21[0]
    translated = []
    max_dist = 0.0

    for pt in landmarks_21:
        tx = pt[0] - wrist[0]
        ty = pt[1] - wrist[1]
        tz = pt[2] - wrist[2]
        d = math.sqrt(tx * tx + ty * ty + tz * tz)
        if d > max_dist:
            max_dist = d
        translated.append((tx, ty, tz))

    if max_dist < 1e-6:
        max_dist = 1.0

    flattened = []
    for tx, ty, tz in translated:
        flattened.extend([round(tx / max_dist, 5), round(ty / max_dist, 5), round(tz / max_dist, 5)])

    return flattened


def main():
    os.makedirs("data", exist_ok=True)
    out_csv = "data/landmarks.csv"

    classes = [chr(i) for i in range(ord('A'), ord('Z') + 1)] + ["SPACE", "DELETE"]
    samples_per_class = 60  # 60 * 28 = 1,680 samples

    headers = []
    for i in range(1, 22):
        headers.extend([f"x{i}", f"y{i}", f"z{i}"])
    headers.append("label")

    rows = []
    for sign in classes:
        base = get_base_skeleton(sign)
        for _ in range(samples_per_class):
            aug = augment_landmarks(base)
            norm = normalize_sample(aug)
            rows.append(norm + [sign])

    random.shuffle(rows)

    with open(out_csv, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"Generated {len(rows)} samples in {out_csv}")


if __name__ == "__main__":
    main()
