#!/bin/bash

COUNT=$1
if [ -z "$COUNT" ]; then
  COUNT=1
fi

ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"Admin@Raksha2026!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Injecting $COUNT alerts..."

for i in $(seq 1 $COUNT); do
  # Generate SSH Brute Force signature flow array
  FEATS="[450.0, 120.0, 512.0, 0.85"
  for j in $(seq 5 84); do FEATS="${FEATS}, 5.0"; done
  FEATS="${FEATS}]"
  
  curl -s -X POST http://localhost:8080/api/v1/alerts/ingest-flow \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{
      \"sourceIp\": \"185.220.101.$i\",
      \"destinationIp\": \"10.0.0.15\",
      \"sourcePort\": 54321,
      \"destinationPort\": 22,
      \"flowFeatures\": $FEATS
    }" > /dev/null
    
  echo "Alert $i injected"
  sleep 0.5
done

echo "Done"
