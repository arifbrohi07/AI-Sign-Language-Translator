"""
Hand Detection Module
Wraps MediaPipe Hands to detect 21 3D hand landmarks from video frames.
"""

from typing import List, Optional, Tuple, Any
import cv2
import numpy as np

try:
    import mediapipe as mp
except ImportError:
    mp = None


class HandDetector:
    """
    Initializes and manages the MediaPipe Hand Landmarker model.
    Processes BGR frames and extracts 21 key landmarks with visual skeletons.
    """

    HAND_CONNECTIONS = [
        (0, 1), (1, 2), (2, 3), (3, 4),        # Thumb
        (0, 5), (5, 6), (6, 7), (7, 8),        # Index finger
        (5, 9), (9, 10), (10, 11), (11, 12),   # Middle finger
        (9, 13), (13, 14), (14, 15), (15, 16), # Ring finger
        (13, 17), (17, 18), (18, 19), (19, 20), # Pinky
        (0, 17)                                # Palm base
    ]

    def __init__(
        self,
        static_image_mode: bool = False,
        max_num_hands: int = 1,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.5,
    ):
        self.static_image_mode = static_image_mode
        self.max_num_hands = max_num_hands
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence

        if mp is not None:
            self.mp_hands = mp.solutions.hands
            self.hands = self.mp_hands.Hands(
                static_image_mode=self.static_image_mode,
                max_num_hands=self.max_num_hands,
                min_detection_confidence=self.min_detection_confidence,
                min_tracking_confidence=self.min_tracking_confidence,
            )
            self.mp_draw = mp.solutions.drawing_utils
            self.mp_drawing_styles = mp.solutions.drawing_styles
        else:
            self.mp_hands = None
            self.hands = None
            self.mp_draw = None

    def find_hands(
        self, frame: np.ndarray, draw: bool = True
    ) -> Tuple[np.ndarray, Optional[Any]]:
        """
        Process a BGR frame, locate hands, and optionally draw landmarks.
        """
        if self.hands is None:
            return frame, None

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(img_rgb)

        if results.multi_hand_landmarks and draw:
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_draw.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style(),
                )

        return frame, results

    def extract_landmarks(self, results: Any) -> Optional[List[Tuple[float, float, float]]]:
        """
        Extract 21 (x, y, z) landmarks from the primary detected hand.
        Returns a list of 21 tuples [(x, y, z), ...] or None if no hand detected.
        """
        if not results or not results.multi_hand_landmarks:
            return None

        primary_hand = results.multi_hand_landmarks[0]
        landmarks = []
        for lm in primary_hand.landmark:
            landmarks.append((float(lm.x), float(lm.y), float(lm.z)))

        return landmarks
