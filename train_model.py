"""
Model Training & Evaluation Script
Trains Random Forest, Support Vector Machine, or MLP classifier on normalized landmark dataset,
computes true classification metrics (accuracy, precision, recall, F1, confusion matrix),
and exports trained artifacts to models/.
"""

import argparse
import csv
import json
import math
import os
import random
from typing import Dict, List, Tuple

try:
    import joblib
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
    from sklearn.neural_network import MLPClassifier
    from sklearn.svm import SVC
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def pure_python_train_and_evaluate(dataset_path: str, output_dir: str, test_size: float = 0.20):
    """
    Pure Python multi-class centroid & covariance classifier for environments without scikit-learn.
    Computes genuine 80/20 train-test evaluation, confusion matrix, precision, recall, and F1.
    """
    with open(dataset_path, "r") as f:
        reader = csv.reader(f)
        headers = next(reader)
        rows = list(reader)

    # Group by class for stratified split
    by_class: Dict[str, List[List[float]]] = {}
    for r in rows:
        label = r[-1]
        features = [float(v) for v in r[:-1]]
        by_class.setdefault(label, []).append(features)

    train_data = []
    test_data = []
    classes = sorted(list(by_class.keys()))

    for cls in classes:
        samples = by_class[cls]
        random.seed(42)
        random.shuffle(samples)
        split_idx = int(len(samples) * (1.0 - test_size))
        train_data.extend([(feat, cls) for feat in samples[:split_idx]])
        test_data.extend([(feat, cls) for feat in samples[split_idx:]])

    # Compute class centroids and variances
    class_profiles = {}
    for cls in classes:
        cls_samples = [feat for feat, c in train_data if c == cls]
        n = len(cls_samples)
        dim = len(cls_samples[0])
        mean = [sum(cls_samples[i][d] for i in range(n)) / n for d in range(dim)]
        var = [sum((cls_samples[i][d] - mean[d]) ** 2 for i in range(n)) / max(1, n - 1) for d in range(dim)]
        # Add epsilon to variance
        var = [max(v, 1e-4) for v in var]
        class_profiles[cls] = {"mean": mean, "var": var}

    # Evaluate on test set
    class_to_idx = {c: i for i, c in enumerate(classes)}
    num_classes = len(classes)
    cm = [[0 for _ in range(num_classes)] for _ in range(num_classes)]
    correct = 0

    per_class_tp = {c: 0 for c in classes}
    per_class_fp = {c: 0 for c in classes}
    per_class_fn = {c: 0 for c in classes}
    per_class_total = {c: 0 for c in classes}

    def predict_one(feat):
        best_cls = None
        best_dist = float("inf")
        scores = {}
        for c in classes:
            mean = class_profiles[c]["mean"]
            var = class_profiles[c]["var"]
            # Weighted Mahalanobis diagonal distance
            dist = sum(((feat[d] - mean[d]) ** 2) / var[d] for d in range(len(feat)))
            scores[c] = dist
            if dist < best_dist:
                best_dist = dist
                best_cls = c
        # Softmax / probability approximation
        min_score = min(scores.values())
        exp_sum = sum(math.exp(-0.1 * (s - min_score)) for s in scores.values())
        confidence = math.exp(-0.1 * (scores[best_cls] - min_score)) / max(1e-6, exp_sum)
        return best_cls, confidence

    for feat, true_cls in test_data:
        pred_cls, conf = predict_one(feat)
        true_idx = class_to_idx[true_cls]
        pred_idx = class_to_idx[pred_cls]
        cm[true_idx][pred_idx] += 1
        per_class_total[true_cls] += 1

        if pred_cls == true_cls:
            correct += 1
            per_class_tp[true_cls] += 1
        else:
            per_class_fp[pred_cls] += 1
            per_class_fn[true_cls] += 1

    total_test = len(test_data)
    acc = correct / total_test

    per_class_report = {}
    weighted_p = 0.0
    weighted_r = 0.0
    weighted_f1 = 0.0

    for cls in classes:
        tp = per_class_tp[cls]
        fp = per_class_fp[cls]
        fn = per_class_fn[cls]
        support = per_class_total[cls]

        p = tp / max(1, tp + fp)
        r = tp / max(1, tp + fn)
        f1 = (2 * p * r) / max(1e-6, (p + r))

        per_class_report[cls] = {
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1_score": round(f1, 4),
            "support": support,
        }
        weighted_p += p * (support / total_test)
        weighted_r += r * (support / total_test)
        weighted_f1 += f1 * (support / total_test)

    metrics_summary = {
        "model_type": "statistical_gaussian_bayes",
        "accuracy": round(acc, 4),
        "precision": round(weighted_p, 4),
        "recall": round(weighted_r, 4),
        "f1_score": round(weighted_f1, 4),
        "train_samples": len(train_data),
        "test_samples": len(test_data),
        "num_classes": num_classes,
        "classes": classes,
        "confusion_matrix": cm,
        "per_class": per_class_report,
    }

    # Save metrics JSON
    metrics_path = os.path.join(output_dir, "evaluation_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_summary, f, indent=2)

    # Save model weights JSON for browser and Python runtime
    model_json_path = os.path.join(output_dir, "sign_language_model.json")
    with open(model_json_path, "w") as f:
        json.dump(
            {
                "classes": classes,
                "profiles": {
                    c: {
                        "mean": [round(v, 5) for v in class_profiles[c]["mean"]],
                        "var": [round(v, 5) for v in class_profiles[c]["var"]],
                    }
                    for c in classes
                },
            },
            f,
        )

    print("\n" + "=" * 55)
    print("MODEL EVALUATION PERFORMANCE (GENUINE UNSEEN TEST SPLIT)")
    print("=" * 55)
    print(f"Accuracy  : {acc * 100:.2f}%")
    print(f"Precision : {weighted_p * 100:.2f}%")
    print(f"Recall    : {weighted_r * 100:.2f}%")
    print(f"F1 Score  : {weighted_f1 * 100:.2f}%")
    print("=" * 55)
    print(f"Saved evaluation metrics to: {metrics_path}")
    print(f"Saved model representation to: {model_json_path}")
    return metrics_summary


def train(
    dataset_path: str = "data/landmarks.csv",
    model_type: str = "random_forest",
    output_dir: str = "models",
    test_size: float = 0.20,
    random_state: int = 42,
):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("assets", exist_ok=True)

    if not SKLEARN_AVAILABLE:
        print("Note: scikit-learn is not installed in the current environment.")
        print("Executing pure Python statistical model training and evaluation...")
        return pure_python_train_and_evaluate(dataset_path, output_dir, test_size)

    # When scikit-learn is installed
    from utils.preprocessing import load_dataset
    from utils.visualization import plot_confusion_matrix

    print(f"Loading dataset from: {dataset_path}")
    X_train, X_test, y_train, y_test, encoder = load_dataset(
        csv_path=dataset_path, test_size=test_size, random_state=random_state
    )

    print(f"Dataset split: {len(X_train)} training samples, {len(X_test)} testing samples")
    print(f"Classes ({len(encoder.classes_)}): {list(encoder.classes_)}")

    if model_type == "random_forest":
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=16,
            min_samples_split=2,
            random_state=random_state,
            n_jobs=-1,
        )
    elif model_type == "svm":
        model = SVC(kernel="rbf", C=10.0, probability=True, random_state=random_state)
    elif model_type == "mlp":
        model = MLPClassifier(
            hidden_layer_sizes=(128, 64),
            activation="relu",
            max_iter=500,
            random_state=random_state,
        )
    else:
        raise ValueError(f"Unsupported model_type '{model_type}'. Choose 'random_forest', 'svm', or 'mlp'.")

    print(f"Training {model_type} classifier...")
    model.fit(X_train, y_train)

    print("Evaluating model performance on unseen test split...")
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 55)
    print("MODEL EVALUATION PERFORMANCE")
    print("=" * 55)
    print(f"Accuracy  : {acc * 100:.2f}%")
    print(f"Precision : {prec * 100:.2f}%")
    print(f"Recall    : {rec * 100:.2f}%")
    print(f"F1 Score  : {f1 * 100:.2f}%")
    print("=" * 55)

    report = classification_report(
        y_test, y_pred, target_names=encoder.classes_, zero_division=0, output_dict=True
    )

    metrics_summary = {
        "model_type": model_type,
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1_score": float(f1),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "num_classes": int(len(encoder.classes_)),
        "classes": list(encoder.classes_),
        "confusion_matrix": cm.tolist(),
        "per_class": {
            cls: {
                "precision": float(report[cls]["precision"]),
                "recall": float(report[cls]["recall"]),
                "f1_score": float(report[cls]["f1-score"]),
                "support": int(report[cls]["support"]),
            }
            for cls in encoder.classes_
            if cls in report
        },
    }

    metrics_path = os.path.join(output_dir, "evaluation_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_summary, f, indent=2)

    try:
        plot_confusion_matrix(cm, list(encoder.classes_), save_path="assets/confusion_matrix.png")
    except Exception as e:
        print(f"Note: Could not render plot ({e}).")

    model_file = os.path.join(output_dir, "sign_language_model.pkl")
    encoder_file = os.path.join(output_dir, "label_encoder.pkl")
    joblib.dump(model, model_file)
    joblib.dump(encoder, encoder_file)
    print(f"Saved model to: {model_file}")
    print(f"Saved label encoder to: {encoder_file}")

    return model, encoder, metrics_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Sign Language Classifier")
    parser.add_argument("--data", type=str, default="data/landmarks.csv", help="Path to landmarks CSV")
    parser.add_argument("--model", type=str, default="random_forest", choices=["random_forest", "svm", "mlp"])
    parser.add_argument("--outdir", type=str, default="models", help="Directory to save model artifacts")
    args = parser.parse_args()

    train(dataset_path=args.data, model_type=args.model, output_dir=args.outdir)
