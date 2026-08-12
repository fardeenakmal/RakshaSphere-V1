FROM python:3.12-slim

WORKDIR /app

# Install only what's needed
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY manager.py .

# Create log directory
RUN mkdir -p /logs

EXPOSE 6000

CMD ["python", "manager.py"]
