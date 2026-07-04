import tensorflow as tf

print("Loading isl_model.h5...")
model = tf.keras.models.load_model('isl_model.h5')

print("Converting to TFLite (Built-ins only)...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS]

try:
    tflite_model = converter.convert()
    with open('isl_model_fixed.tflite', 'wb') as f:
        f.write(tflite_model)
    print("Success! Saved as isl_model_fixed.tflite")
except Exception as e:
    print("Conversion Failed:", e)
