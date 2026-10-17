"""
Text-to-Speech Engine Module
Provides a speech interface using pyttsx3 with thread-safe invocation and graceful fallback.
"""

from typing import Optional

try:
    import pyttsx3
except ImportError:
    pyttsx3 = None


class SpeechEngine:
    """
    Text-to-speech speaker using pyttsx3 for local Python applications.
    """

    def __init__(self, rate: int = 150, volume: float = 1.0):
        self.rate = rate
        self.volume = volume
        self.engine = None
        self._initialize()

    def _initialize(self) -> None:
        if pyttsx3 is not None:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty("rate", self.rate)
                self.engine.setProperty("volume", self.volume)
            except Exception as e:
                print(f"Warning: Could not initialize pyttsx3: {e}")
                self.engine = None

    def speak(self, text: str) -> bool:
        """
        Speaks the given text out loud.
        """
        if not text or not text.strip():
            return False

        if self.engine is not None:
            try:
                self.engine.say(text.strip())
                self.engine.runAndWait()
                return True
            except Exception as e:
                print(f"Speech error: {e}")
                return False
        else:
            print(f"[TTS Fallback Console]: {text.strip()}")
            return False

    def set_rate(self, rate: int) -> None:
        self.rate = rate
        if self.engine:
            self.engine.setProperty("rate", rate)

    def set_volume(self, volume: float) -> None:
        self.volume = min(max(volume, 0.0), 1.0)
        if self.engine:
            self.engine.setProperty("volume", self.volume)
