"""
Visualization Utilities
Generates confusion matrix plots, accuracy distribution charts, and metrics tables.
"""

from typing import List, Optional
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns


def plot_confusion_matrix(
    cm: np.ndarray,
    class_names: List[str],
    save_path: Optional[str] = "assets/confusion_matrix.png",
    title: str = "Sign Language Classification Confusion Matrix",
) -> plt.Figure:
    """
    Renders and optionally saves a high-resolution confusion matrix heatmap.
    """
    fig, ax = plt.subplots(figsize=(12, 10))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
        cbar=True,
        ax=ax,
    )
    ax.set_title(title, fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Predicted Sign", fontsize=12)
    ax.set_ylabel("True Sign", fontsize=12)
    plt.xticks(rotation=45)
    plt.yticks(rotation=0)
    plt.tight_layout()

    if save_path:
        fig.savefig(save_path, dpi=300)

    return fig
