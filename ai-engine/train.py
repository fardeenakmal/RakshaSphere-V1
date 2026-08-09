"""
RakshaSphere AI Engine — Model Training & Calibration Script
Generates 84-feature training vectors, trains Random Forest ensemble classifier & scaler,
evaluates precision/recall/F1 metrics, and serializes binaries into models/ directory.
Supports Optuna hyperparameter loading.
"""

import numpy as np
import json
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from preprocessing.feature_scaler import FeatureScaler, FEATURE_COUNT

CLASSES = [
    "BENIGN",
    "SSH_BRUTE_FORCE",
    "HTTP_SQL_INJECTION",
    "TELNET_MIRAI",
    "DDoS_SYN_FLOOD"
]

def generate_synthetic_flow_dataset(num_samples_per_class=400):
    """Generates synthetic CICFlowMeter 84-feature vectors representing distinct network flow profiles."""
    X_list = []
    y_list = []

    np.random.seed(42)

    for class_idx, class_name in enumerate(CLASSES):
        base_features = np.zeros((num_samples_per_class, FEATURE_COUNT))
        
        if class_name == "BENIGN":
            # Normal web/network traffic features
            base_features[:, 0] = np.random.normal(1200, 300, num_samples_per_class) # Flow Duration
            base_features[:, 1] = np.random.normal(15, 5, num_samples_per_class)     # Total Fwd Packets
            base_features[:, 2] = np.random.normal(512, 100, num_samples_per_class)   # Packet Length Mean
            base_features[:, 3] = np.random.normal(0.01, 0.005, num_samples_per_class)# Anomaly Feature
        elif class_name == "SSH_BRUTE_FORCE":
            # SSH Brute Force signature: Rapid connection retries, fixed packet size
            base_features[:, 0] = np.random.normal(450, 50, num_samples_per_class)
            base_features[:, 1] = np.random.normal(120, 20, num_samples_per_class)
            base_features[:, 2] = np.random.normal(512, 10, num_samples_per_class)
            base_features[:, 3] = np.random.normal(0.85, 0.05, num_samples_per_class)
        elif class_name == "HTTP_SQL_INJECTION":
            # Web SQLi: Larger request body length, higher entropy
            base_features[:, 0] = np.random.normal(1400, 200, num_samples_per_class)
            base_features[:, 1] = np.random.normal(45, 10, num_samples_per_class)
            base_features[:, 2] = np.random.normal(920, 150, num_samples_per_class)
            base_features[:, 3] = np.random.normal(0.78, 0.08, num_samples_per_class)
        elif class_name == "TELNET_MIRAI":
            # IoT Mirai: Small packet sizes, repeated SYN/Telnet probes
            base_features[:, 0] = np.random.normal(3100, 500, num_samples_per_class)
            base_features[:, 1] = np.random.normal(10, 2, num_samples_per_class)
            base_features[:, 2] = np.random.normal(64, 5, num_samples_per_class)
            base_features[:, 3] = np.random.normal(0.65, 0.1, num_samples_per_class)
        elif class_name == "DDoS_SYN_FLOOD":
            # SYN Flood: Massive packet count, minimal flow duration
            base_features[:, 0] = np.random.normal(50, 10, num_samples_per_class)
            base_features[:, 1] = np.random.normal(1500, 200, num_samples_per_class)
            base_features[:, 2] = np.random.normal(128, 20, num_samples_per_class)
            base_features[:, 3] = np.random.normal(0.95, 0.02, num_samples_per_class)

        # Fill remaining features with random noise for realism
        for i in range(4, FEATURE_COUNT):
            base_features[:, i] = np.random.exponential(scale=10.0, size=num_samples_per_class)

        X_list.append(base_features)
        y_list.append(np.full(num_samples_per_class, class_name))

    X = np.vstack(X_list)
    y = np.concatenate(y_list)
    return X, y

def main():
    print("🚀 Initializing RakshaSphere AI Model Training Pipeline...")
    X, y = generate_synthetic_flow_dataset()
    print(f"📊 Dataset generated: {X.shape[0]} samples with {X.shape[1]} flow features each.")

    # Shuffle dataset
    indices = np.arange(X.shape[0])
    np.random.shuffle(indices)
    X, y = X[indices], y[indices]

    # Split Train / Test
    split_idx = int(0.8 * len(X))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    # Scale Features
    scaler = FeatureScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Check for Optuna hyperparameters
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    optuna_path = os.path.join(models_dir, "optuna_params.json")
    rf_params = {"n_estimators": 100, "max_depth": 20, "random_state": 42}

    if os.path.exists(optuna_path):
        try:
            with open(optuna_path, "r") as f:
                opt_data = json.load(f)
                rf_params.update(opt_data.get("bestParams", {}))
            print("⚙️ Loaded Optuna tuned hyperparameter configuration.")
        except Exception as e:
            print(f"⚠️ Could not load Optuna params: {e}")

    # Train Random Forest Classifier
    clf = RandomForestClassifier(**rf_params)
    clf.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = clf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')

    print(f"✅ Training Complete. Model Accuracy: {acc * 100:.2f}%, F1 Score: {f1 * 100:.2f}%")

    os.makedirs(models_dir, exist_ok=True)
    scaler.save(os.path.join(models_dir, "scaler.pkl"))
    joblib.dump(clf, os.path.join(models_dir, "classifier.pkl"))

    # Manifest metadata
    manifest = {
        "modelName": "RakshaSphere Ensemble Intrusion Detector",
        "version": "1.1.0",
        "featureCount": FEATURE_COUNT,
        "classes": CLASSES,
        "accuracyPct": round(acc * 100, 2),
        "f1ScorePct": round(f1 * 100, 2),
        "trainingSamples": len(X_train),
        "hyperparameters": rf_params
    }

    with open(os.path.join(models_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"📦 Serialized artifacts saved in {models_dir}")

if __name__ == "__main__":
    main()
