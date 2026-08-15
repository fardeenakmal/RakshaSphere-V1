#!/bin/bash
echo "Waiting for services to be healthy..."
sleep 20
curl -s http://localhost:8080/api/v1/system/health | grep -o '"overallStatus":"HEALTHY"'
echo "Stopping Redis and AI Engine..."
docker stop raksha-redis raksha-ai-engine
sleep 10
echo "Checking health again (expected DOWN/DEGRADED)..."
curl -s http://localhost:8080/api/v1/system/health | grep -o '"overallStatus":"[^"]*"'
echo "Starting Redis and AI Engine..."
docker start raksha-redis raksha-ai-engine
sleep 15
echo "Checking health again (expected HEALTHY)..."
curl -s http://localhost:8080/api/v1/system/health | grep -o '"overallStatus":"[^"]*"'
