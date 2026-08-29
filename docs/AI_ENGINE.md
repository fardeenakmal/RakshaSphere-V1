# RakshaSphere — AI Inference Engine

> **Source of truth:** `ai-engine/inference_server.py`, `ai-engine/inference/`, `ai-engine/train.py`, `ai-engine/models/manifest.json`, `ai-engine/MODEL_CARD.md`.

---

## IMPORTANT: Training Data Notice

> **The model is trained on SYNTHETIC DATA only.**  
> The classifier was trained on Gaussian-cluster-generated synthetic network flow vectors, not on real captured network traffic (PCAP files or CIC-IDS2017 datasets). The 100% accuracy metrics reflect synthetic data separability, not real-world generalization.

---

## Overview

The AI Engine is a **FastAPI** microservice running on port `5000`. It hosts a pre-trained `RandomForestClassifier` that classifies 84-feature network flow vectors into five threat categories. It also provides anomaly detection (via a fixed-constant simulation) and feature attribution via Gini importance.

---

## Service Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Service status, model readiness, manifest |
| `POST` | `/predict` | None | Threat classification for a single 84-feature flow vector |
| `POST` | `/explain` | None | Feature attribution (top-K contributors) |
| `POST` | `/batch-predict` | None | Batch classification for multiple flow vectors |

---

## Feature Vector Schema

- **Count:** 84 float features per flow
- **Standard:** CICFlowMeter network flow feature specification
- **Schema source:** `ai-engine/preprocessing/feature_names.py` and `ai-engine/preprocessing/feature_schema.json`

### Input Format (POST /predict)

```json
{
  "flowFeatures": [450.0, 120.0, 512.0, 0.85, 5.0, 5.0, ...],  // exactly 84 values
  "topK": 5
}
```

---

## Threat Classification

### Attack Classes (5 categories)

| Class ID | Class Name | Example MITRE Mapping |
|----------|-----------|----------------------|
| 0 | `BENIGN` | None |
| 1 | `SSH_BRUTE_FORCE` | T1110 (Brute Force) |
| 2 | `HTTP_SQL_INJECTION` | T1190 (Exploit Public-Facing App) |
| 3 | `TELNET_MIRAI` | T1046 (Network Service Discovery) |
| 4 | `DDoS_SYN_FLOOD` | T1498 (Network Denial of Service) |

### Inference Pipeline (pipeline.py)

1. Receive 84-float feature vector
2. `np.nan_to_num()` — replace NaN/Inf with 0.0/1e6/-1e6
3. `MinMaxScaler.transform()` — scale to [0, 1] range using trained scaler
4. `RandomForestClassifier.predict()` → attack class label
5. `RandomForestClassifier.predict_proba()` → confidence score for predicted class
6. **Risk score calculation:**
   - Base score from class: CRITICAL=95, HIGH=80, MEDIUM=60, LOW=40, BENIGN=5
   - Adjusted by confidence: `base + (confidence - 0.5) * 10`
   - Capped to [0, 100]
7. **Anomaly score (MSE):** `max(0, 0.1 - confidence * 0.1)` — simulated via fixed formula, **not a trained autoencoder**
8. **MITRE mapping:** Hardcoded class→MITRE lookup in `pipeline.py`

### Prediction Response

```json
{
  "success": true,
  "data": {
    "attackType": "SSH_BRUTE_FORCE",
    "severity": "HIGH",
    "riskScore": 85,
    "confidenceScore": 0.97,
    "mitreTactic": "Initial Access",
    "mitreTechnique": "Brute Force",
    "mitreId": "T1110",
    "reconstructionMse": 0.003
  }
}
```

---

## Explainability (POST /explain)

Returns top-K features contributing most to the prediction. Uses **Random Forest Gini feature importances** weighted by input vector magnitudes.

> **Note:** The endpoint docstring mentions "SHAP" but the actual implementation uses Gini importances from `RandomForestClassifier.feature_importances_`, not SHAP Shapley values. The `shap` Python package is not installed.

### Explanation Response

```json
{
  "success": true,
  "data": {
    "attackType": "SSH_BRUTE_FORCE",
    "topFeatures": [
      { "featureName": "Flow Duration", "importance": 0.45, "inputValue": 450.0 },
      ...
    ]
  }
}
```

---

## Batch Prediction (POST /batch-predict)

Accepts an array of flow vectors and returns results only for vectors with exactly 84 features. Vectors with invalid lengths are silently skipped.

---

## Model Artifacts

| File | Description |
|------|-------------|
| `ai-engine/models/classifier.pkl` | Trained `RandomForestClassifier` (n_estimators=100, max_depth=20) — 1.7 MB |
| `ai-engine/models/scaler.pkl` | Fitted `MinMaxScaler` |
| `ai-engine/models/manifest.json` | Model version, training date, accuracy metrics |
| `ai-engine/models/optuna_params.json` | Hyperparameter optimization results from Optuna |
| `ai-engine/models/test.txt` | Placeholder note: "ONLY SYNTHETIC DATA IS TRAINED" |

---

## Reported Training Metrics

From `manifest.json` and `MODEL_CARD.md`:

| Metric | Value |
|--------|-------|
| Accuracy | 100.00% |
| Precision (macro/weighted) | 100.00% |
| Recall (macro/weighted) | 100.00% |
| F1 Score | 100.00% |
| ROC-AUC (OVR) | 1.0000 |
| Internal inference latency | ~2.15 ms/flow |
| HTTP end-to-end latency | ~39.92 ms/flow |

> **Caution:** 100% metrics are expected for synthetic Gaussian-cluster data with high class separability. These metrics **do not represent real-world detection rates.**

---

## Health Check Response

```json
{
  "status": "UP",
  "service": "RakshaSphere AI Inference Engine",
  "modelReady": true,
  "trainingNotice": "MODEL TRAINED ON SYNTHETIC DATA",
  "manifest": { "version": "1.1.0", "modelName": "RakshaSphere Ensemble Intrusion Detector", ... }
}
```

---

## Known Limitations

1. **Synthetic training data** — model generalization to real network traffic is unvalidated
2. **Anomaly detection** — MSE score is computed via `max(0, 0.1 - confidence * 0.1)`, not a real autoencoder
3. **Explainability** — Gini importances are used, not SHAP Shapley values despite the docstring
4. **No authentication** on AI endpoints — they are internal-only service endpoints, not exposed directly to users
5. **No model retraining pipeline** — the model is static; `train.py` and `optuna_tuner.py` are available for manual retraining
