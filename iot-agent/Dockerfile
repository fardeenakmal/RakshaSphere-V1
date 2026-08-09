# Dockerfile for RakshaSphere IoT Edge Security Daemon Simulation
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY config.json .
COPY agent.py .

CMD ["python", "agent.py"]
