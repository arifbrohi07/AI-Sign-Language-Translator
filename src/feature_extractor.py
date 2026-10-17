"""
Feature Extractor Module
Converts raw 21 (x, y, z) landmarks into a normalized, translation- and scale-invariant
63-dimensional feature vector.
"""

from typing import List, Tuple
import numpy as np


class FeatureExtractor:
    """
    Normalizes 21 3D landmarks relative to the wrist (landmark 0) and scales
    by maximum hand span to ensure scale and position invariance.
    """

    @staticmethod
    def normalize_landmarks(landmarks: List[Tuple[float, float, float]]) -> np.ndarray:
        """
        Normalize 21 (x, y, z) landmarks:
        1. Translate coordinate system so wrist (point 0) is at origin (0, 0, 0).
        2. Compute maximum Euclidean distance from wrist to any landmark (hand scale).
        3. Divide all translated coordinates by hand scale.

        Returns:
            np.ndarray: 1D array of length 63 containing normalized [x0, y0, z0, ..., x20, y20, z20]
        """
        if len(landmarks) != 21:
            raise ValueError(f"Expected 21 landmarks, received {len(landmarks)}")

        arr = np.array(landmarks, dtype=np.float32)  # shape (21, 3)

        # 1. Wrist reference translation (wrist is at index 0)
        wrist = arr[0]
        translated = arr - wrist

        # 2. Hand scale estimation (maximum Euclidean distance from wrist)
        distances = np.linalg.norm(translated, axis=1)
        max_dist = np.max(distances)

        # Guard against zero division
        if max_dist < 1e-6:
            max_dist = 1.0

        # 3. Scale normalization
        normalized = translated / max_dist

        # Flatten into 63-element feature vector
        return normalized.flatten()

    @staticmethod
    def get_feature_column_names() -> List[str]:
        """
        Returns CSV column headers: x1,y1,z1,x2,y2,z2,...,x21,y21,z21
        """
        cols = []
        for i in range(1, 22):
            cols.extend([f"x{i}", f"y{i}", f"z{i}"])
        return cols
