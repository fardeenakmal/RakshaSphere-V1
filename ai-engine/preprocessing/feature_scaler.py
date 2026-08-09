"""
RakshaSphere AI Engine — Feature Scaling & Normalization Module
Handles feature vector bounds checking and MinMaxScaler transformations for 84 CICFlowMeter flow features.
"""

import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

FEATURE_COUNT = 84

class FeatureScaler:
    def __init__(self):
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.is_fitted = False

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        """Fit scaler on training array and transform to [0, 1] range."""
        X_clean = np.nan_to_num(X, nan=0.0, posinf=1e6, neginf=-1e6)
        scaled = self.scaler.fit_transform(X_clean)
        self.is_fitted = True
        return scaled

    def transform(self, X: np.ndarray) -> np.ndarray:
        """Transform input feature array."""
        if not self.is_fitted:
            raise RuntimeError("Scaler must be fitted or loaded before transform")
        X_clean = np.nan_to_num(X, nan=0.0, posinf=1e6, neginf=-1e6)
        return self.scaler.transform(X_clean)

    def save(self, filepath: str):
        """Serialize scaler object using joblib."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.scaler, filepath)

    def load(self, filepath: str):
        """Load serialized scaler object."""
        self.scaler = joblib.load(filepath)
        self.is_fitted = True
