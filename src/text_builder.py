"""
Sentence and Text Builder Module
Manages state for assembling letters into words and sentences with undo history.
"""

from typing import List


class TextBuilder:
    """
    Sentence builder that maintains text, history stack for undo, and editing operations.
    """

    def __init__(self, initial_text: str = ""):
        self.current_text: str = initial_text
        self.history: List[str] = [initial_text]

    def _push_state(self, new_text: str) -> None:
        if new_text != self.current_text:
            self.history.append(self.current_text)
            self.current_text = new_text

    def add_letter(self, letter: str) -> str:
        """
        Adds a single sign letter or special command to the sentence.
        """
        if not letter or letter in ("UNCERTAIN", "NOTHING"):
            return self.current_text

        letter_clean = letter.strip().upper()
        if letter_clean == "SPACE":
            return self.add_space()
        if letter_clean == "DELETE":
            return self.delete_last()

        new_text = self.current_text + letter_clean
        self._push_state(new_text)
        return self.current_text

    def add_space(self) -> str:
        """
        Appends a space if the last character is not already a space.
        """
        if self.current_text and not self.current_text.endswith(" "):
            self._push_state(self.current_text + " ")
        return self.current_text

    def delete_last(self) -> str:
        """
        Deletes the last character (Backspace).
        """
        if len(self.current_text) > 0:
            self._push_state(self.current_text[:-1])
        return self.current_text

    def undo(self) -> str:
        """
        Reverts to the previous text state.
        """
        if self.history:
            self.current_text = self.history.pop()
        return self.current_text

    def clear(self) -> str:
        """
        Clears the entire text buffer.
        """
        if self.current_text:
            self._push_state("")
        return self.current_text

    def get_text(self) -> str:
        return self.current_text
