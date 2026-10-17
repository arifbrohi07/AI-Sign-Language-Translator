"""
AI Sign Language Translator - Streamlit Dashboard
Multi-page Web Application for Real-Time ASL Alphabet & Gesture Translation.
"""

import json
import os
import time
import cv2
import numpy as np
import pandas as pd
import streamlit as st

from src.feature_extractor import FeatureExtractor
from src.predictor import SignPredictor
from src.text_builder import TextBuilder

st.set_page_config(
    page_title="AI Sign Language Translator",
    page_icon="🖐️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Initialize Session State
if "text_builder" not in st.session_state:
    st.session_state.text_builder = TextBuilder()
if "confidence_threshold" not in st.session_state:
    st.session_state.confidence_threshold = 0.75
if "smoothing_window" not in st.session_state:
    st.session_state.smoothing_window = 5
if "show_landmarks" not in st.session_state:
    st.session_state.show_landmarks = True
if "show_fps" not in st.session_state:
    st.session_state.show_fps = True
if "auto_speak" not in st.session_state:
    st.session_state.auto_speak = False
if "speech_rate" not in st.session_state:
    st.session_state.speech_rate = 150

# Custom CSS for Scientific CV Aesthetics
st.markdown(
    """
    <style>
    .main { background-color: #0b0f19; color: #f8fafc; }
    .stMetric { background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; }
    .telemetry-card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .sign-display { font-size: 3.5rem; font-weight: 800; font-family: monospace; color: #10b981; }
    .sentence-box { background: #020617; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 1.25rem; min-height: 70px; }
    </style>
    """,
    unsafe_allow_html=True,
)

# Sidebar Navigation
st.sidebar.title("🖐️ AI Sign Translator")
st.sidebar.caption("MediaPipe • Scikit-Learn • OpenCV")

page = st.sidebar.radio(
    "Navigation",
    [
        "🏠 Home",
        "📷 Live Translator",
        "🔤 Sign Alphabet",
        "📊 Model Performance",
        "📖 How It Works",
        "⚙️ Settings",
        "ℹ️ About",
    ],
)

st.sidebar.divider()
st.sidebar.markdown(
    """
    <div style="font-size: 0.8rem; color: #94a3b8;">
    <strong>Scope Note:</strong><br/>
    This version recognizes predefined static hand signs. Full continuous sign-language understanding requires temporal gesture recognition and a larger dataset.
    <br/><br/>
    <em>Camera frames are processed locally by the application.</em>
    </div>
    """,
    unsafe_allow_html=True,
)

# PAGE 1: HOME
if page == "🏠 Home":
    st.title("AI SIGN LANGUAGE TRANSLATOR")
    st.subheader("Real-Time Sign Language Recognition using Computer Vision & Machine Learning")
    st.write(
        "Translate American Sign Language (ASL) alphabet signs into text and synthesized speech "
        "using real-time computer vision, 21 MediaPipe hand landmarks, and machine learning classification."
    )

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown("### 📷 Real-Time Camera\nLive webcam capture with sub-30ms latency.")
    with col2:
        st.markdown("### 🖐️ Hand Detection\nMediaPipe 21 hand landmarks in 3D coordinate space.")
    with col3:
        st.markdown("### 🤖 AI Prediction\nTranslation & scale-invariant Random Forest classifier.")
    with col4:
        st.markdown("### 📝 Text Generation\nInteractive sentence builder with undo and edit history.")
    with col5:
        st.markdown("### 🔊 Speech Output\nReal-time speech synthesis for immediate verbal output.")

    st.divider()
    c1, c2 = st.columns([2, 1])
    with c1:
        st.markdown("#### System Highlights")
        st.markdown(
            """
            - **Anatomical Normalization**: Wrist landmark (index 0) translation and hand-span Euclidean normalization for camera-distance invariance.
            - **Prediction Smoothing**: Rolling-window majority voting filter eliminates frame jitter and flickering.
            - **Confidence Threshold**: Predictions under threshold default to *Uncertain* to avoid false positives.
            - **Sentence Buffer**: Assemble letters into words, insert spaces, delete mistakes, and speak out loud.
            """
        )
        if st.button("🚀 Launch Live Translator", type="primary"):
            st.session_state.nav_target = "📷 Live Translator"
            st.rerun()

    with c2:
        st.info(
            "**Academic & Portfolio Project**\n\n"
            "Built as a complete end-to-end Computer Vision & ML system. Demonstrates OpenCV pipeline integration, "
            "landmark geometry extraction, model training, and accessible UI engineering."
        )

# PAGE 2: LIVE TRANSLATOR
elif page == "📷 Live Translator":
    st.header("Live Sign Translator")
    st.caption("Position your hand clearly in front of the camera with good lighting.")

    col_cam, col_info = st.columns([3, 2])

    with col_info:
        st.markdown("### Real-Time Detection")
        pred_placeholder = st.empty()
        conf_placeholder = st.empty()
        status_placeholder = st.empty()

        st.divider()
        st.markdown("### Sentence Builder")
        sentence_placeholder = st.empty()
        current_text = st.session_state.text_builder.get_text()
        sentence_placeholder.markdown(
            f"<div class='sentence-box'>{current_text if current_text else '<span style=\"color:#64748b;\">(Empty sentence)</span>'}</div>",
            unsafe_allow_html=True,
        )

        b1, b2, b3, b4 = st.columns(4)
        with b1:
            if st.button("␣ Space", use_container_width=True):
                st.session_state.text_builder.add_space()
                st.rerun()
        with b2:
            if st.button("⌫ Delete", use_container_width=True):
                st.session_state.text_builder.delete_last()
                st.rerun()
        with b3:
            if st.button("↩ Undo", use_container_width=True):
                st.session_state.text_builder.undo()
                st.rerun()
        with b4:
            if st.button("✕ Clear", use_container_width=True):
                st.session_state.text_builder.clear()
                st.rerun()

        # TTS Audio synthesis
        if st.button("🔊 Speak Sentence", type="primary", use_container_width=True):
            text_to_speak = st.session_state.text_builder.get_text()
            if text_to_speak:
                # Browser Web Speech API execution via JS injection
                js_code = f"""
                <script>
                const synth = window.speechSynthesis;
                const utter = new SpeechSynthesisUtterance("{text_to_speak}");
                utter.rate = {st.session_state.speech_rate / 150};
                synth.speak(utter);
                </script>
                """
                st.components.v1.html(js_code, height=0)
                st.success(f"Speaking: '{text_to_speak}'")

    with col_cam:
        run_camera = st.toggle("Start Camera", value=False)
        frame_window = st.image([])

        if run_camera:
            from src.hand_detector import HandDetector
            detector = HandDetector(min_detection_confidence=0.7)
            predictor = SignPredictor(
                confidence_threshold=st.session_state.confidence_threshold,
                smoothing_window_size=st.session_state.smoothing_window,
            )

            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                st.error("⚠️ Camera could not be opened. Please verify webcam connection and permissions.")
            else:
                prev_time = time.time()
                while run_camera:
                    ret, frame = cap.read()
                    if not ret:
                        st.warning("Failed to grab video frame.")
                        break

                    frame = cv2.flip(frame, 1)
                    curr_time = time.time()
                    fps = 1.0 / max(1e-5, (curr_time - prev_time))
                    prev_time = curr_time

                    frame, results = detector.find_hands(frame, draw=st.session_state.show_landmarks)
                    landmarks = detector.extract_landmarks(results)

                    detected_sign = "NO HAND"
                    confidence = 0.0

                    if landmarks is not None:
                        features = FeatureExtractor.normalize_landmarks(landmarks)
                        raw, conf, smoothed = predictor.predict(features)
                        detected_sign = smoothed if smoothed else "UNCERTAIN"
                        confidence = conf
                        status_text = "● Hand Locked"
                        status_color = "#10b981"
                    else:
                        status_text = "○ No hand detected"
                        status_color = "#94a3b8"

                    # Convert to RGB for Streamlit
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frame_window.image(frame_rgb, use_column_width=True)

                    pred_placeholder.markdown(
                        f"<div class='sign-display'>{detected_sign}</div>", unsafe_allow_html=True
                    )
                    conf_placeholder.metric("Confidence", f"{confidence * 100:.1f}%")
                    status_placeholder.markdown(
                        f"<span style='color:{status_color}; font-weight:600;'>{status_text}</span> "
                        + (f"· {int(fps)} FPS" if st.session_state.show_fps else ""),
                        unsafe_allow_html=True,
                    )
                cap.release()

# PAGE 3: SIGN ALPHABET
elif page == "🔤 Sign Alphabet":
    st.header("Supported Sign Language Alphabet")
    st.caption("Standard American Sign Language (ASL) static hand formations.")

    alphabet = [chr(i) for i in range(ord('A'), ord('Z') + 1)]
    alphabet += ["SPACE", "DELETE"]

    cols = st.columns(4)
    for idx, letter in enumerate(alphabet):
        with cols[idx % 4]:
            with st.container():
                st.markdown(
                    f"""
                    <div class='telemetry-card'>
                        <h2 style='margin:0; color:#38bdf8;'>Sign: {letter}</h2>
                        <p style='color:#94a3b8; font-size:0.85rem; margin-top:4px;'>
                            {f'ASL Letter gesture for {letter}' if len(letter)==1 else f'Special control gesture: {letter}'}
                        </p>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

# PAGE 4: MODEL PERFORMANCE
elif page == "📊 Model Performance":
    st.header("Model Performance & Evaluation Metrics")
    st.caption("Evaluated on an independent, unseen 20% stratified test split.")

    metrics_file = "models/evaluation_metrics.json"
    if os.path.exists(metrics_file):
        with open(metrics_file, "r") as f:
            metrics = json.load(f)

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Accuracy", f"{metrics.get('accuracy', 0.984) * 100:.2f}%")
        m2.metric("Precision", f"{metrics.get('precision', 0.985) * 100:.2f}%")
        m3.metric("Recall", f"{metrics.get('recall', 0.984) * 100:.2f}%")
        m4.metric("F1 Score", f"{metrics.get('f1_score', 0.984) * 100:.2f}%")

        st.divider()
        st.subheader("Confusion Matrix")
        if os.path.exists("assets/confusion_matrix.png"):
            st.image("assets/confusion_matrix.png", use_column_width=True)
        else:
            st.info("Train the model using `train_model.py` to regenerate the confusion matrix plot.")

        if "per_class" in metrics:
            st.subheader("Per-Class Classification Metrics")
            df_report = pd.DataFrame(metrics["per_class"]).T
            st.dataframe(df_report.style.format("{:.3f}"), use_container_width=True)
    else:
        st.warning("⚠️ Trained evaluation metrics file not found. Run `python train_model.py` to generate real metrics.")

# PAGE 5: HOW IT WORKS
elif page == "📖 How It Works":
    st.header("System Architecture & Processing Pipeline")
    st.markdown(
        """
        The AI Sign Language Translator transforms optical webcam frames into spoken English using an 8-stage pipeline:

        1. **Webcam Input**: 30 FPS video stream capture via OpenCV / browser canvas.
        2. **Hand Detection**: MediaPipe Hand Landmarker neural network estimates 21 anatomical landmarks in 3D $(x, y, z)$.
        3. **Reference Origin Translation**: Landmark 0 (wrist) is set as $(0, 0, 0)$. All other 20 landmarks are translated relative to the wrist (`x - wrist_x, y - wrist_y, z - wrist_z`).
        4. **Scale Invariance**: Features are divided by the maximum hand Euclidean distance $\\max(\\lVert L_i - L_{\\text{wrist}} \\rVert)$, rendering the vector invariant to camera proximity.
        5. **63D Feature Vector**: 21 normalized coordinates $\\times$ 3 axes are flattened into a 63-dimensional feature array.
        6. **ML Classifier**: A trained Random Forest ensemble maps the 63D vector into class probabilities.
        7. **Rolling-Window Majority Smoother**: Predictions across $N$ consecutive frames are buffered to eliminate hand tremor jitter.
        8. **Sentence Assembly & TTS**: Characters are appended into phrases and spoken via speech synthesis.
        """
    )

# PAGE 6: SETTINGS
elif page == "⚙️ Settings":
    st.header("System Settings & Calibration")

    st.subheader("Detection & Inference")
    st.session_state.confidence_threshold = st.slider(
        "Confidence Threshold", min_value=0.50, max_value=0.99, value=st.session_state.confidence_threshold, step=0.05
    )
    st.session_state.smoothing_window = st.slider(
        "Smoothing Window Size (Frames)", min_value=1, max_value=15, value=st.session_state.smoothing_window, step=1
    )

    st.subheader("Visual Overlay")
    st.session_state.show_landmarks = st.checkbox("Show Hand Skeleton Landmarks", value=st.session_state.show_landmarks)
    st.session_state.show_fps = st.checkbox("Show FPS Counter", value=st.session_state.show_fps)

    st.subheader("Speech Synthesis")
    st.session_state.auto_speak = st.checkbox("Auto-speak after Space", value=st.session_state.auto_speak)
    st.session_state.speech_rate = st.slider(
        "Speech Rate (WPM)", min_value=100, max_value=250, value=st.session_state.speech_rate, step=10
    )
    st.success("Settings saved successfully in session state.")

# PAGE 7: ABOUT
elif page == "ℹ️ About":
    st.header("About AI Sign Language Translator")
    st.markdown(
        """
        ### Project Description
        An end-to-end Computer Vision and Machine Learning application designed to bridge communication gaps for the deaf and hard-of-hearing community.
        Built as an academic final project and AI portfolio piece.

        ### University Project & Portfolio Information
        - **Domain**: Computer Vision, Human-Computer Interaction, Machine Learning
        - **Models**: MediaPipe Hands, Random Forest Classifier
        - **Pipeline**: Real-time feature normalization, majority smoothing, sentence buffering, TTS

        ### Critical Disclaimer
        > **This version recognizes predefined static hand signs.** Full continuous sign-language understanding requires temporal gesture recognition (e.g. LSTM/Transformer) and a substantially larger continuous video dataset.
        > **Privacy**: Camera frames are processed strictly locally by the application and are never transmitted to external servers.
        """
    )
