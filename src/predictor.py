"""
Real-time Sign Predictor Module
Provides model inference, confidence thresholding, and rolling-window smoothing.
"""

from collections import Counter, deque
import os
from typing import Optional, Tuple
import joblib
import numpy as np


class SignPredictor:
    """
    Predicts sign language labels with confidence scores and majority-vote smoothing.
    """

    def __init__(
        self,
        model_path: str = "models/sign_language_model.pkl",
        encoder_path: str = "models/label_encoder.pkl",
        confidence_threshold: float = 0.75,
        smoothing_window_size: int = 5,
    ):
        self.model_path = model_path
        self.encoder_path = encoder_path
        self.confidence_threshold = confidence_threshold
        self.smoothing_window_size = smoothing_window_size

        self.model = None
        self.encoder = None
        self.prediction_buffer = deque(maxlen=smoothing_window_size)
        self.load_model()

    def load_model(self) -> bool:
        """
        Loads the trained scikit-learn classifier and label encoder.
        """
        if os.path.exists(self.model_path) and os.path.exists(self.encoder_path):
            try:
                self.model = joblib.load(self.model_path)
                self.encoder = joblib.load(self.encoder_path)
                return True
            except Exception as e:
                print(f"Error loading pkl model: {e}")

        # JSON model fallback
        json_path = os.path.join(os.path.dirname(self.model_path), "sign_language_model.json")
        if os.path.exists(json_path):
            try:
                import json
                with open(json_path, "r") as f:
                    self.json_model = json.load(f)
                self.classes = self.json_model["classes"]
                self.profiles = self.json_model["profiles"]
                return True
            except Exception as e:
                print(f"Error loading json model: {e}")
        return False

    def is_ready(self) -> bool:
        has_pkl = self.model is not None and self.encoder is not None
        has_json = hasattr(self, "profiles") and self.profiles is not None
        return has_pkl or has_json

    def set_smoothing_window(self, window_size: int) -> None:
        self.smoothing_window_size = max(1, window_size)
        self.prediction_buffer = deque(maxlen=self.smoothing_window_size)

    def set_confidence_threshold(self, threshold: float) -> None:
        self.confidence_threshold = min(max(threshold, 0.0), 1.0)

    def predict(
        self, feature_vector: np.ndarray
    ) -> Tuple[Optional[str], float, Optional[str]]:
        """
        Predict sign from normalized 63-feature vector.

        Returns:
            Tuple: (raw_label, confidence, smoothed_label)
                   or (None, 0.0, None) if model missing or uncertain.
        """
        if not self.is_ready():
            return None, 0.0, None

        x = feature_vector.reshape(1, -1)

        # Get probabilities if supported
        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba(x)[0]
            max_idx = np.argmax(probabilities)
            confidence = float(probabilities[max_idx])
            raw_encoded = self.model.classes_[max_idx]
        else:
            raw_encoded = self.model.predict(x)[0]
            confidence = 1.0

        if self.encoder is not None:
            raw_label = str(self.encoder.inverse_transform([raw_encoded])[0])
        else:
            raw_label = str(raw_encoded)

        # Confidence threshold check
        if confidence < self.confidence_threshold:
            self.prediction_buffer.append("UNCERTAIN")
            return raw_label, confidence, "UNCERTAIN"

        # Push to smoothing buffer
        self.prediction_buffer.append(raw_label)

        # Majority vote across smoothing window
        counts = Counter(self.prediction_buffer)
        most_common_label, count = counts.most_common(1)[0]

        # Require majority agreement in window
        if count >= (len(self.prediction_buffer) // 2 + 1):
            smoothed_label = most_common_label
        else:
            smoothed_label = "UNCERTAIN"

        return raw_label, confidence, smoothed_label

    def clear_buffer(self) -> None:
        self.prediction_buffer.clear()
