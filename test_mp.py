import mediapipe as mp
import pkgutil
print("MediaPipe version:", mp.__version__)
print("Modules in mp:", [name for _, name, _ in pkgutil.iter_modules(mp.__path__)])
try:
    print("Has solutions?", hasattr(mp, 'solutions'))
except Exception as e:
    print(e)
