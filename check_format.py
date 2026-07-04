import os, kagglehub

path = kagglehub.dataset_download('kaushikyh/indian-sign-language-words-with-landmarks')
filepath = os.path.join(path, 'ProcessedData_vivit', 'afternoon', 'MVI_4655.MOV')

with open(filepath, 'rb') as f:
    header = f.read(20)
    print("Header bytes:", header)
    
try:
    import numpy as np
    data = np.load(filepath, allow_pickle=True)
    print("Shape:", data.shape)
    print("Sample:", data[0][:5])
except Exception as e:
    print("Failed to load as numpy array:", e)
