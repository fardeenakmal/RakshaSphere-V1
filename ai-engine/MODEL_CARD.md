
# RakshaSphere AI Engine — Model Card (V1.1.0)

## Model Overview
- **Model Name**: RakshaSphere Ensemble Intrusion Detector
- **Model Version**: `1.1.0`
- **Model Architecture**: `sklearn.ensemble.RandomForestClassifier` (`n_estimators=100`, `max_depth=20`, `random_state=42`)
- **Inference Server**: FastAPI microservice (`inference_server.py`) running on `http://localhost:5000`
- **Inference Endpoints**:
  - `GET /health` — Microservice health & model manifest
  - `POST /predict` — Real-time threat classification & risk scoring
  - `POST /explain` — Feature attribution dossier (top risk contributors)
  - `POST /batch-predict` — Multi-flow batch inference

---

## Dataset & Preprocessing
- **Dataset**: **Synthetic Flow Dataset** (`SYNTHETIC_DATA`)
- **Dataset Origin**: Generated in memory by `generate_synthetic_flow_dataset()` in [`ai-engine/train.py`](file:///home/fardeen/RakshaSphere/ai-engine/train.py) (1,600 samples total, 400 samples/class).
- **Feature Count**: 84 features (CICFlowMeter network flow feature specification defined in [`feature_names.py`](file:///home/fardeen/RakshaSphere/ai-engine/preprocessing/feature_names.py) and [`feature_schema.json`](file:///home/fardeen/RakshaSphere/ai-engine/preprocessing/feature_schema.json)).
- **Classes (5 Target Categories)**:
  1. `BENIGN`
  2. `SSH_BRUTE_FORCE`
  3. `HTTP_SQL_INJECTION`
  4. `TELNET_MIRAI`
  5. `DDoS_SYN_FLOOD`
- **Preprocessing Pipeline**: `MinMaxScaler(feature_range=(0, 1))` with `np.nan_to_num` handling (`nan=0.0`, `posinf=1e6`, `neginf=-1e6`).

---

## Training & Evaluation Methodology
- **Training Method**: Supervised Random Forest training on scaled synthetic feature vectors.
- **Evaluation Split**: Independent synthetic test dataset ($2,500$ samples, $500$ per class, seed `999`).
- **Empirical Evaluation Metrics**:
  - **Accuracy**: $100.00\%$
  - **Precision (Macro / Weighted)**: $100.00\%$
  - **Recall (Macro / Weighted)**: $100.00\%$
  - **F1 Score (Macro / Weighted)**: $100.00\%$
  - **ROC-AUC (OVR)**: $1.0000$
  - **Internal Inference Latency**: ~2.15 ms / flow
  - **HTTP End-to-End Latency**: ~39.92 ms / flow

---

## Limitations & Known Failure Modes

> [!WARNING]
> **Synthetic Dataset Limitation**: The 100.00% metrics reflect synthetic Gaussian cluster separability in the generated training set. This model was **NOT** trained on real-world raw PCAP or CIC-IDS2017 files, and training accuracy must not be conflated with real-world network generalization.

- **Anomaly Detection Limitation**: Anomaly reconstruction loss is computed via a simulated distance formula against a hardcoded constant scalar ($0.1$) in [`pipeline.py`](file:///home/fardeen/RakshaSphere/ai-engine/inference/pipeline.py#L74). No trained neural network Autoencoder model exists.
- **Explainability Limitation**: Feature attribution uses Random Forest Gini feature importances weighted by input vector magnitudes. The `shap` Python package is omitted from dependencies and exact Shapley values are not computed.
