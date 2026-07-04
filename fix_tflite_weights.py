import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Input, Reshape
import json

print("Loading original model weights...")
original_model = tf.keras.models.load_model('isl_model.h5')

# We need to find num_classes from the last layer
num_classes = original_model.layers[-1].units
print(f"Num classes: {num_classes}")

print("Building unrolled model...")
FRAME_WINDOW = 30
NUM_LANDMARKS = 543

unrolled_model = Sequential()
unrolled_model.add(Input(shape=(FRAME_WINDOW, NUM_LANDMARKS, 3)))
unrolled_model.add(Reshape((FRAME_WINDOW, NUM_LANDMARKS * 3)))
unrolled_model.add(LSTM(64, return_sequences=True, activation='relu', unroll=True))
unrolled_model.add(LSTM(128, return_sequences=False, activation='relu', unroll=True))
unrolled_model.add(Dense(64, activation='relu'))
unrolled_model.add(Dense(32, activation='relu'))
unrolled_model.add(Dense(num_classes, activation='softmax'))

print("Transferring weights...")
unrolled_model.set_weights(original_model.get_weights())

print("Converting to TFLite...")
converter = tf.lite.TFLiteConverter.from_keras_model(unrolled_model)
# Disable Select TF Ops so it works natively on the Web
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS]

try:
    tflite_model = converter.convert()
    with open('web-app/public/isl_model.tflite', 'wb') as f:
        f.write(tflite_model)
    print("Success! Overwrote web-app/public/isl_model.tflite with native Web-compatible version.")
except Exception as e:
    print("Conversion Failed:", e)
