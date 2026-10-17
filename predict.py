"""
Real-time Sign Language Prediction Script
Captures webcam video, extracts landmarks, runs ML inference with smoothing and confidence threshold,
and enables real-time sentence construction and speech synthesis.
"""

import argparse
import sys
import time
import cv2

from src.hand_detector import HandDetector
from src.feature_extractor import FeatureExtractor
from src.predictor import SignPredictor
from src.text_builder import TextBuilder
from src.speech import SpeechEngine


def main():
    parser = argparse.ArgumentParser(description="Real-Time Sign Language Translator")
    parser.add_argument("--camera", type=int, default=0, help="Camera device index")
    parser.add_argument("--model", type=str, default="models/sign_language_model.pkl", help="Model file path")
    parser.add_argument("--encoder", type=str, default="models/label_encoder.pkl", help="Label encoder path")
    parser.add_argument("--threshold", type=float, default=0.75, help="Confidence threshold (0.0 - 1.0)")
    parser.add_argument("--smoothing", type=int, default=5, help="Smoothing window size")
    parser.add_argument("--autospeak", action="store_true", help="Auto-speak words on space")
    args = parser.parse_args()

    detector = HandDetector(min_detection_confidence=0.7)
    predictor = SignPredictor(
        model_path=args.model,
        encoder_path=args.encoder,
        confidence_threshold=args.threshold,
        smoothing_window_size=args.smoothing,
    )

    if not predictor.is_ready():
        print("=" * 60)
        print("ERROR: Trained model artifacts not found!")
        print("Please train the model first by running:")
        print("    python train_model.py")
        print("=" * 60)
        sys.exit(1)

    text_builder = TextBuilder()
    speech_engine = SpeechEngine()

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print(f"Error: Unable to open webcam at index {args.camera}.")
        sys.exit(1)

    print("=" * 60)
    print("  AI SIGN LANGUAGE TRANSLATOR - REAL-TIME PREDICTOR")
    print("  Controls:")
    print("    [ENTER]      : Append currently detected stable sign to text")
    print("    [SPACE]      : Insert space")
    print("    [BACKSPACE]  : Delete last character")
    print("    [U]          : Undo last edit")
    print("    [C]          : Clear text")
    print("    [S]          : Speak current sentence aloud")
    print("    [Q]          : Quit")
    print("=" * 60)

    fps_time = time.time()
    fps = 0.0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab video frame.")
            break

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape

        # Measure FPS
        curr_time = time.time()
        fps = 0.9 * fps + 0.1 * (1.0 / max(1e-5, (curr_time - fps_time)))
        fps_time = curr_time

        # Detect landmarks
        frame, results = detector.find_hands(frame, draw=True)
        landmarks = detector.extract_landmarks(results)

        predicted_sign = "NO HAND"
        confidence = 0.0
        smoothed_sign = "NO HAND"

        if landmarks is not None:
            features = FeatureExtractor.normalize_landmarks(landmarks)
            raw_sign, conf, smoothed = predictor.predict(features)
            predicted_sign = raw_sign or "UNCERTAIN"
            confidence = conf
            smoothed_sign = smoothed or "UNCERTAIN"
        else:
            predictor.clear_buffer()

        # UI Overlay - Top Telemetry Banner
        cv2.rectangle(frame, (0, 0), (w, 85), (15, 23, 42), -1)
        cv2.line(frame, (0, 85), (w, 85), (51, 65, 85), 2)

        # Status & Prediction
        sign_color = (16, 185, 129) if smoothed_sign not in ("UNCERTAIN", "NO HAND") else (148, 163, 184)
        cv2.putText(frame, f"SIGN: {smoothed_sign}", (20, 42), cv2.FONT_HERSHEY_SIMPLEX, 1.1, sign_color, 2)
        cv2.putText(frame, f"Conf: {confidence * 100:.1f}%", (260, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (203, 213, 225), 2)
        cv2.putText(frame, f"FPS: {int(fps)}", (w - 120, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (56, 189, 248), 2)
        cv2.putText(frame, f"Raw: {predicted_sign} | Window: {args.smoothing}", (20, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (148, 163, 184), 1)

        # Bottom Sentence Builder Banner
        cv2.rectangle(frame, (0, h - 90), (w, h), (15, 23, 42), -1)
        cv2.line(frame, (0, h - 90), (w, h - 90), (51, 65, 85), 2)

        sentence = text_builder.get_text() or "(Sentence empty - hold sign and press ENTER)"
        cv2.putText(frame, "CURRENT SENTENCE:", (20, h - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (148, 163, 184), 1)
        cv2.putText(frame, sentence, (20, h - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2)

        cv2.imshow("AI Sign Language Translator", frame)
        key = cv2.waitKey(1) & 0xFF

        if key == 13:  # ENTER: Add current smoothed sign
            if smoothed_sign not in ("UNCERTAIN", "NO HAND"):
                text_builder.add_letter(smoothed_sign)
                print(f"Added letter: {smoothed_sign} -> '{text_builder.get_text()}'")
        elif key == 32:  # SPACE
            text_builder.add_space()
            if args.autospeak:
                speech_engine.speak(text_builder.get_text())
        elif key == 8 or key == 127:  # BACKSPACE
            text_builder.delete_last()
        elif key == ord('u') or key == ord('U'):  # Undo
            text_builder.undo()
        elif key == ord('c') or key == ord('C'):  # Clear
            text_builder.clear()
        elif key == ord('s') or key == ord('S'):  # Speak
            text = text_builder.get_text()
            if text:
                print(f"Speaking: '{text}'")
                speech_engine.speak(text)
        elif key == ord('q') or key == ord('Q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
