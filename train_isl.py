import os
import cv2
import json
import numpy as np
import tensorflow as tf
import mediapipe as mp
import kagglehub
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Input, Reshape

# ── 1. CONFIGURATION ──────────────────────────────────────────────────────────
FRAME_WINDOW = 30      # Must match DetectorEngine.tsx
NUM_LANDMARKS = 543    # 468 (Face) + 21 (LH) + 33 (Pose) + 21 (RH)
DATASET_PATH = kagglehub.dataset_download('kaushikyh/indian-sign-language-words-with-landmarks')
VIDEOS_DIR = os.path.join(DATASET_PATH, 'ProcessedData_vivit')

# ── 2. MEDIAPIPE SETUP ────────────────────────────────────────────────────────
mp_holistic = mp.solutions.holistic

def extract_keypoints(results):
    """
    Extracts 543 landmarks (XYZ) mimicking the JS extractKeypoints logic.
    Returns shape: (543, 3)
    """
    def take(lms, n):
        if not lms or not hasattr(lms, 'landmark'):
            return np.zeros((n, 3))
        # Handle cases where face mesh has 478 landmarks (we only want 468)
        count = min(len(lms.landmark), n)
        res = np.zeros((n, 3))
        for i in range(count):
            res[i] = [lms.landmark[i].x, lms.landmark[i].y, lms.landmark[i].z]
        return res

    face = take(results.face_landmarks, 468)
    lh = take(results.left_hand_landmarks, 21)
    pose = take(results.pose_landmarks, 33)
    rh = take(results.right_hand_landmarks, 21)
    return np.concatenate([face, lh, pose, rh])

# ── 3. DATA EXTRACTION ────────────────────────────────────────────────────────
def process_video(video_path, holistic):
    cap = cv2.VideoCapture(video_path)
    frames = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Convert BGR to RGB for MediaPipe
        image, results = process_frame(frame, holistic)
        keypoints = extract_keypoints(results)
        frames.append(keypoints)
        
    cap.release()
    
    # Pad or truncate to FRAME_WINDOW
    if len(frames) == 0:
        return np.zeros((FRAME_WINDOW, NUM_LANDMARKS, 3))
        
    if len(frames) < FRAME_WINDOW:
        # Pad with zeros at the end
        padding = np.zeros((FRAME_WINDOW - len(frames), NUM_LANDMARKS, 3))
        frames = np.concatenate([frames, padding])
    else:
        # Truncate to first FRAME_WINDOW frames
        frames = frames[:FRAME_WINDOW]
        
    return np.array(frames)

def process_frame(image, holistic):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image.flags.writeable = False
    results = holistic.process(image)
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    return image, results

# ── 4. BUILD DATASET ──────────────────────────────────────────────────────────
X, y = [], []
actions = []
label_map = {}

print("Scanning dataset directory...")
words = sorted(os.listdir(VIDEOS_DIR))

# Map words to integers
for i, word in enumerate(words):
    label_map[word] = i
    actions.append(word)

print(f"Found {len(words)} words in dataset.")
print("Extracting landmarks (this will take a while)...")

with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
    for word in words:
        word_dir = os.path.join(VIDEOS_DIR, word)
        if not os.path.isdir(word_dir): continue
        
        videos = [f for f in os.listdir(word_dir) if f.endswith('.MOV')]
        print(f"Processing '{word}' ({len(videos)} videos)...")
        
        for video in videos:
            video_path = os.path.join(word_dir, video)
            sequence = process_video(video_path, holistic)
            X.append(sequence)
            y.append(label_map[word])

X = np.array(X)
y = to_categorical(y).astype(int)

print("Data extraction complete!")
print(f"X shape: {X.shape}")
print(f"y shape: {y.shape}")

# Save label dictionary for the web app
signs_dict = {str(v): k for k, v in label_map.items()}
with open('isl_signs.json', 'w') as f:
    json.dump(signs_dict, f, indent=2)
print("Saved isl_signs.json")

# Split Data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1)

# ── 5. TRAIN MODEL ────────────────────────────────────────────────────────────
print("Training Neural Network...")

model = Sequential()
model.add(Input(shape=(FRAME_WINDOW, NUM_LANDMARKS, 3)))
# Flatten features for LSTM
model.add(Reshape((FRAME_WINDOW, NUM_LANDMARKS * 3)))
model.add(LSTM(64, return_sequences=True, activation='relu'))
model.add(LSTM(128, return_sequences=False, activation='relu'))
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(len(actions), activation='softmax'))

model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

model.fit(X_train, y_train, epochs=150, batch_size=32, validation_data=(X_test, y_test))

model.save('isl_model.h5')
print("Model saved as isl_model.h5")

# ── 6. CONVERT TO TFLITE ──────────────────────────────────────────────────────
print("Converting to TensorFlow Lite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# These options ensure maximum compatibility with MediaPipe/Web TFLite backend
converter.target_spec.supported_ops = [
  tf.lite.OpsSet.TFLITE_BUILTINS,
  tf.lite.OpsSet.SELECT_TF_OPS
]
tflite_model = converter.convert()

with open('isl_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("Conversion complete! Created 'isl_model.tflite'")
print("DONE! You can now copy isl_model.tflite and isl_signs.json to your web-app/public folder.")
