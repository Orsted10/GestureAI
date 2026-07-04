import kagglehub
import os

print("Downloading dataset...")
path = kagglehub.dataset_download("kaushikyh/indian-sign-language-words-with-landmarks")
print("Path to dataset files:", path)

# List the files in the directory to see what we're working with
for root, dirs, files in os.walk(path):
    level = root.replace(path, '').count(os.sep)
    indent = ' ' * 4 * (level)
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 4 * (level + 1)
    for f in files[:5]: # just print first 5 files per dir
        print(f"{subindent}{f}")
    if len(files) > 5:
        print(f"{subindent}... ({len(files)} files total)")
