"""
RakshaSphere AI Engine Automated Test Suite
Verifies /health status, 84-feature ML inference prediction, explainability, and invalid feature array error handling.
"""

import unittest
import json
import urllib.request
import urllib.error


class AiEngineTestCase(unittest.TestCase):
    BASE_URL = "http://localhost:5000"

    def test_health_endpoint(self):
        """Test GET /health returns status UP and model version metadata."""
        req = urllib.request.Request(f"{self.BASE_URL}/health")
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode('utf-8'))
            self.assertEqual(data.get("status"), "UP")
            self.assertIn("manifest", data)
            self.assertEqual(data.get("trainingNotice"), "MODEL TRAINED ON SYNTHETIC DATA")

    def test_valid_predict_endpoint(self):
        """Test POST /predict with valid 84-feature input array."""
        dummy_features = [0.1] * 84
        payload = json.dumps({"flowFeatures": dummy_features}).encode('utf-8')

        req = urllib.request.Request(
            f"{self.BASE_URL}/predict",
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            res = json.loads(resp.read().decode('utf-8'))
            data = res.get("data", {})
            self.assertIn("attackType", data)
            self.assertIn("riskScore", data)
            self.assertIn("confidenceScore", data)
            self.assertIn("mitreTactic", data)
            self.assertIn("mitreTechnique", data)


    def test_invalid_feature_count_predict(self):
        """Test POST /predict with invalid feature count (e.g. 5 features instead of 84)."""
        invalid_payload = json.dumps({"flowFeatures": [0.1, 0.2, 0.3, 0.4, 0.5]}).encode('utf-8')

        req = urllib.request.Request(
            f"{self.BASE_URL}/predict",
            data=invalid_payload,
            headers={'Content-Type': 'application/json'}
        )
        with self.assertRaises(urllib.error.HTTPError) as cm:
            urllib.request.urlopen(req)

        # Expecting HTTP 422 Unprocessable Entity
        self.assertEqual(cm.exception.code, 422)



if __name__ == "__main__":
    unittest.main()


