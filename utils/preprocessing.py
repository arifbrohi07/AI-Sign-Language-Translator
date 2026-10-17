"""
Data Preprocessing Utilities
Loads landmark dataset, handles train-test splits, and feature validation.
"""

from typing import Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


def load_dataset(
    csv_path: str = "data/landmarks.csv",
    test_size: float = 0.20,
    random_state: int = 42,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, LabelEncoder]:
    """
    Loads normalized landmark CSV dataset and splits into train and test sets.
    Features are columns 0 through 62, target is 'label'.

    Returns:
        X_train, X_test, y_train, y_test, label_encoder
    """
    df = pd.read_csv(csv_path)

    if "label" not in df.columns:
        raise ValueError("CSV missing required 'label' target column.")

    feature_cols = [c for c in df.columns if c != "label"]
    if len(feature_cols) != 63:
        raise ValueError(f"Expected 63 landmark features, found {len(feature_cols)}")

    X = df[feature_cols].values.astype(np.float32)
    y_raw = df["label"].astype(str).values

    encoder = LabelEncoder()
    y = encoder.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    return X_train, X_test, y_train, y_test, encoder
