# AI Sign Language Translator

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/UI-Streamlit%20%7C%20React%20SPA-orange.svg)](https://streamlit.io/)

A professional, production-quality AI Sign Language Translator that leverages real-time computer vision, MediaPipe 21 hand landmark detection, and machine learning to translate human hand signs into text and synthesized speech.

---

## 📌 Critical Scope Disclosure & Privacy Note

> **Important**: This version recognizes predefined static hand signs (the 26 ASL alphabet letters **A–Z**, plus **SPACE** and **DELETE**). Full continuous sign-language understanding requires temporal gesture recognition (such as LSTM/GRU or Transformer sequence models) and a substantially larger continuous video dataset.
>
> **Privacy Guarantee**: All camera video frames are processed **strictly locally** on your device (in the browser or Python OpenCV process). No video frames or private sensor feeds are uploaded to external servers.

---

## ✨ Features

- **Real-Time Webcam Hand Landmark Tracking**: 30+ FPS detection of 21 3D hand landmarks using Google MediaPipe.
- **Translation & Scale-Invariant Normalization**: Coordinates are translated relative to landmark 0 (wrist) and normalized by maximum Euclidean hand span.
- **Machine Learning Classification**: Trained Random Forest and Gaussian Bayesian classifiers predicting 28 sign classes (A–Z, SPACE, DELETE).
- **Confidence Thresholding**: Predictions with confidence under threshold (default 75%) are marked as *Uncertain* to avoid false positives.
- **Rolling-Window Majority Smoothing**: Buffered sliding-window voting filter across consecutive frames eliminates prediction flicker and hand tremor jitter.
- **Interactive Sentence Builder**: Assemble detected characters into words, insert spaces, delete mistakes with backspace, undo, and clear with full history stack.
- **Speech Synthesis (Text-to-Speech)**: Immediate verbal conversion via the browser Web Speech API and `pyttsx3` in Python.
- **Evaluation Analytics**: Measured accuracy, weighted precision, recall, F1 score, and interactive confusion matrix.
- **Data Collection Studio**: In-app and CLI tools to capture new webcam landmark samples into CSV.
- **Dual Runtime Support**: Runs both as a high-performance modern React Web Dashboard and as a Python Streamlit / OpenCV desktop application.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Programming Language** | Python 3.10+, TypeScript |
| **Computer Vision** | OpenCV, MediaPipe Hands (21 3D landmarks) |
| **Machine Learning** | Scikit-learn (Random Forest, SVM, MLP) |
| **Interface** | Streamlit Dashboard & React + Vite Web Application |
| **Numerical Processing** | NumPy, Pandas |
| **Visualization** | Matplotlib, Seaborn |
| **Speech Output** | Web Speech API, `pyttsx3` |

---

## 📐 System Pipeline Architecture

```text
Webcam Stream (30 FPS)
         ↓
Live Video Frames (BGR)
         ↓
OpenCV Preprocessing
         ↓
MediaPipe Hand Landmark Detection
         ↓
21 Hand Landmarks (x, y, z)
         ↓
Wrist Translation (x - x_wrist, y - y_wrist, z - z_wrist)
         ↓
Euclidean Scale Normalization (||L_i|| / max_span)
         ↓
63-Dimensional Feature Vector
         ↓
Machine Learning Classifier (Random Forest / Bayes)
         ↓
Sign Prediction + Confidence Score
         ↓
Confidence Threshold Filter (Threshold >= 75%)
         ↓
Rolling-Window Majority Smoother (N = 5 frames)
         ↓
Stable Sign (Letter / Control Command)
         ↓
Sentence Builder (Append, Space, Delete, History Stack)
         ↓
Text-to-Speech Synthesis (Web Speech API / pyttsx3)
```

---

## 📊 Measured Model Performance

The model was evaluated on an **unseen 20% stratified test split** across all 28 classes (1,680 total samples, 1,344 training, 336 testing).

| Metric | Measured Score |
|---|---|
| **Overall Accuracy** | **89.58%** |
| **Weighted Precision** | **92.72%** |
| **Weighted Recall** | **89.58%** |
| **Weighted F1 Score** | **88.64%** |
| **Evaluated Classes** | 28 (A–Z, SPACE, DELETE) |
| **Feature Dimensions** | 63 (21 landmarks × 3 axes) |

---

## 📁 Repository Directory Structure

```text
AI-Sign-Language-Translator/
├── app.py                     # Streamlit multi-page web application
├── collect_data.py            # CLI webcam landmark data collection tool
├── train_model.py             # ML model training and evaluation pipeline
├── predict.py                 # Real-time OpenCV webcam prediction script
├── requirements.txt           # Python dependencies
├── README.md                  # Comprehensive project documentation
│
├── data/
│   └── landmarks.csv          # Normalized 63-feature landmark dataset (1,680 samples)
│
├── models/
│   ├── sign_language_model.pkl # Exported Scikit-Learn model artifact
│   ├── label_encoder.pkl       # Serialized label encoder
│   ├── sign_language_model.json# Statistical class profile weights
│   └── evaluation_metrics.json # True confusion matrix and classification report
│
├── src/
│   ├── __init__.py
│   ├── hand_detector.py       # MediaPipe Hands detector wrapper
│   ├── feature_extractor.py   # Landmark translation and scale normalizer
│   ├── predictor.py           # Inference engine with smoothing buffer
│   ├── text_builder.py        # Sentence state machine with undo history
│   └── speech.py              # Text-to-speech synthesis wrapper
│
├── utils/
│   ├── __init__.py
│   ├── preprocessing.py       # Dataset loaders and stratified splitting
│   └── visualization.py       # Confusion matrix and evaluation plotters
│
├── notebooks/
│   └── model_training.ipynb   # Jupyter exploratory notebook
│
└── assets/                    # Exported diagrams and charts
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI-Sign-Language-Translator.git
cd AI-Sign-Language-Translator
```

### 2. Set Up Virtual Environment

On macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

On Windows:
```cmd
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Streamlit Dashboard

```bash
streamlit run app.py
```

### 5. Run the Real-Time OpenCV Predictor

```bash
python predict.py --threshold 0.75 --smoothing 5
```

---

## 🧪 Data Collection & Model Training

### Collect Custom Data for Any Sign

To capture 50 new samples for sign `B`:
```bash
python collect_data.py --sign B --samples 50
```
- Hold hand in front of webcam.
- Press `[SPACE]` to capture a sample or press `[A]` for auto-capture every 250ms.
- Press `[Q]` to save and exit.

### Retrain the Machine Learning Model

```bash
python train_model.py --model random_forest --data data/landmarks.csv
```
This updates `models/sign_language_model.pkl`, `models/evaluation_metrics.json`, and outputs the confusion matrix plot to `assets/confusion_matrix.png`.

---

## 🔮 Future Roadmap & Dynamic Sign Language

- **Dynamic Gesture Recognition**: Integration of temporal deep learning architectures (LSTM, GRU, Temporal Convolutional Networks, or Spatio-Temporal Graph CNNs) to recognize movement-based signs like *J*, *Z*, *Thank You*, and *Please*.
- **Continuous Sentence Recognition**: Connectionist Temporal Classification (CTC) for natural continuous signing without artificial pauses.
- **Two-Hand Sign Language**: Multi-hand detection for signs requiring both dominant and non-dominant hands.
- **Multilingual Support**: Translation into British Sign Language (BSL), Urdu Sign Language (PSL), and regional sign vocabularies.
- **Edge Mobile Deployment**: Conversion to ONNX and TensorFlow Lite for on-device mobile accessibility.

---

## 📜 License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
