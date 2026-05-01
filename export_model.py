import pickle
import json
import numpy as np

def tree_to_json(tree):
    tree_ = tree.tree_
    def recurse(node):
        if tree_.feature[node] != -2:  # Not a leaf
            return {
                "feature": int(tree_.feature[node]),
                "threshold": float(tree_.threshold[node]),
                "left": recurse(tree_.children_left[node]),
                "right": recurse(tree_.children_right[node])
            }
        else:
            # Return the class probabilities or the most frequent class
            # tree_.value[node] is an array of shape (1, n_classes)
            values = tree_.value[node][0]
            class_idx = int(np.argmax(values))
            return {"class": class_idx}
            
    return recurse(0)

def export_rf(model_path, output_path):
    with open(model_path, "rb") as f:
        data = pickle.load(f)
    
    rf_model = data["model"]
    # If it's a wrapper or has labels, handle it
    # In realtime_detection.py, rf_model = model["model"]
    
    forest = []
    for estimator in rf_model.estimators_:
        forest.append(tree_to_json(estimator))
    
    # We also need the classes
    classes = rf_model.classes_.tolist()
    
    output = {
        "classes": classes,
        "forest": forest
    }
    
    with open(output_path, "w") as f:
        json.dump(output, f)
    print(f"Model exported to {output_path}")

if __name__ == "__main__":
    export_rf("ASL_model.p", "model.json")
