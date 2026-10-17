"""
Data Collection Script
Captures webcam frames, detects hand landmarks via MediaPipe, normalizes features,
and appends them to data/landmarks.csv.
"""

import argparse
import csv
import os
import sys
import time
import cv2

from src.hand_detector import HandDetector
from src.feature_extractor import FeatureExtractor


def main():
    parser = argparse.ArgumentParser(description="Collect Sign Language Hand Landmark Samples")
    parser.add_argument("--sign", type=str, default="A", help="Sign class label to collect (e.g. A-Z, SPACE, DELETE)")
    parser.add_argument("--output", type=str, default="data/landmarks.csv", help="Target CSV output path")
    parser.add_argument("--samples", type=int, default=50, help="Target number of samples to collect")
    parser.add_argument("--camera", type=int, default=0, help="Webcam device index")
    args = parser.parse_args()

    target_sign = args.sign.strip().upper()
    os.makedirs(os.path.dirname(args.output), exist_ok=True)

    # Initialize CSV header if file doesn't exist
    file_exists = os.path.exists(args.output)
    if not file_exists:
        with open(args.output, mode="w", newline="") as f:
            writer = csv.writer(f)
            headers = FeatureExtractor.get_feature_column_names() + ["label"]
            writer.writerow(headers)

    detector = HandDetector(min_detection_confidence=0.7)
    cap = cv2.VideoCapture(args.camera)

    if not cap.isOpened():
        print(f"Error: Could not open camera {args.camera}.")
        sys.exit(1)

    print("=" * 60)
    print(f"  AI Sign Language Data Collector: Sign '{target_sign}'")
    print("  Controls:")
    print("    [SPACE]   : Capture current sample")
    print("    [A]       : Toggle auto-capture mode (every 200ms)")
    print("    [Q]       : Quit and save")
    print("=" * 60)

    collected_count = 0
    auto_capture = False
    last_auto_time = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        # Flip for mirror view
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape

        # Detect hands
        frame, results = detector.find_hands(frame, draw=True)
        landmarks = detector.extract_landmarks(results)

        status_text = "Hand Detected" if landmarks else "No Hand"
        status_color = (0, 255, 0) if landmarks else (0, 0, 255)

        # UI Overlay
        cv2.rectangle(frame, (10, 10), (380, 110), (20, 20, 20), -1)
        cv2.putText(frame, f"Target Sign: {target_sign}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(frame, f"Samples: {collected_count}/{args.samples} | {status_text}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)
        mode_text = "Auto-Capture ON" if auto_capture else "Manual (SPACE)"
        cv2.putText(frame, f"Mode: {mode_text}", (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

        cv2.imshow("Sign Language Data Collection", frame)
        key = cv2.waitKey(1) & 0xFF

        current_time = time.time()
        should_capture = False

        if key == ord(' '):
            should_capture = True
        elif key == ord('a') or key == ord('A'):
            auto_capture = not auto_capture
        elif key == ord('q') or key == ord('Q'):
            break

        if auto_capture and (current_time - last_auto_time > 0.25):
            should_capture = True
            last_auto_time = current_time

        if should_capture and landmarks is not None:
            features = FeatureExtractor.normalize_landmarks(landmarks)
            row = list(features) + [target_sign]
            with open(args.output, mode="a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(row)
            collected_count += 1
            print(f"Captured sample {collected_count}/{args.samples} for sign '{target_sign}'")

            if collected_count >= args.samples:
                print(f"Target count of {args.samples} reached for '{target_sign}'!")
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Done! Collected {collected_count} samples saved to {args.output}")


if __name__ == "__main__":
    main()
