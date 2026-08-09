import time
import json
import random
import requests
from datetime import datetime

AI_ENGINE_URL = "http://localhost:5000/predict"
BACKEND_URL = "http://localhost:8080/api/v1/alerts"

def generate_mock_flow_features(is_malicious=False):
    # Generates 84 features exactly as expected by the AI engine
    features = [0.0] * 84
    
    # Feature 0: Flow Duration, Feature 1: Total Fwd Packets, etc.
    if is_malicious:
        # Simulate SSH Bruteforce or DoS
        features[0] = random.uniform(1000, 5000)      # High duration
        features[1] = random.uniform(50, 500)         # High forward packets
        features[2] = random.uniform(50, 500)         # High backward packets
        features[3] = random.uniform(1000, 50000)     # Total Length of Fwd Packets
        features[4] = random.uniform(1000, 50000)     # Total Length of Bwd Packets
        features[5] = random.uniform(500, 1500)       # Fwd Packet Length Max
    else:
        # Simulate Benign Web Traffic
        features[0] = random.uniform(10, 100)
        features[1] = random.uniform(1, 10)
        features[2] = random.uniform(1, 10)
        features[3] = random.uniform(100, 1000)
        features[4] = random.uniform(100, 1000)
        features[5] = random.uniform(50, 150)
        
    return features

def run_sniffer_loop():
    print("🚀 Starting RakshaSphere Live Sniffer (Scapy / CICFlowMeter Simulator)")
    print("Capturing live flow vectors and streaming to AI Engine (:5000)...")
    print("-" * 60)
    
    counter = 0
    while True:
        counter += 1
        # Generate 1 malicious flow for every 3 benign flows
        is_malicious = (counter % 4 == 0)
        flow_features = generate_mock_flow_features(is_malicious)
        
        # 1. Post to AI Engine
        try:
            start_time = time.time()
            ai_res = requests.post(AI_ENGINE_URL, json={"flowFeatures": flow_features}, timeout=2)
            ai_res.raise_for_status()
            ai_data = ai_res.json()["data"]
            latency = (time.time() - start_time) * 1000
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] AI Infer: {ai_data['attackType']} (Score: {ai_data['riskScore']:.0f}) in {latency:.1f}ms")
            
            # 2. Check Risk Score Threshold
            if ai_data["riskScore"] >= 70:
                print(f"   ⚠️ HIGH RISK ANOMALY DETECTED! Forwarding to Backend Core (:8080)...")
                
                # Mock IPs for demonstration
                src_ip = f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}"
                
                alert_payload = {
                    "sourceIp": src_ip,
                    "destinationIp": "192.168.0.101",
                    "sourcePort": random.randint(1024, 65535),
                    "destinationPort": random.choice([22, 80, 443, 3306]),
                    "attackType": ai_data["attackType"],
                    "severity": ai_data["severity"],
                    "riskScore": ai_data["riskScore"],
                    "confidence": 0.99,
                    "mitreTactic": ai_data["mitreTactic"],
                    "mitreTechnique": ai_data["mitreTechnique"],
                    "mitreId": ai_data["mitreId"]
                }
                
                # Forward to Spring Boot
                try:
                    bk_res = requests.post(BACKEND_URL, json=alert_payload, timeout=2)
                    bk_res.raise_for_status()
                    print(f"   ✅ Alert successfully dispatched to Spring Boot Core.")
                except Exception as bk_err:
                    print(f"   ❌ Failed to send to Backend: {bk_err}")
                    
        except Exception as e:
            print(f"❌ Failed to reach AI Engine: {e}")
            
        # Sleep for a bit before the next packet
        time.sleep(random.uniform(1.5, 3.5))

if __name__ == "__main__":
    run_sniffer_loop()
