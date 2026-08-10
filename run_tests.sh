#!/bin/bash

echo "Starting STOMP Test Orchestrator..."

echo "Waiting 10 seconds for subagent to login..."
sleep 10

echo "Injecting 1 alert..."
./inject_alerts.sh 1

echo "Waiting 5 seconds..."
sleep 5

echo "Injecting 5 alerts..."
./inject_alerts.sh 5

echo "Waiting 5 seconds..."
sleep 5

echo "Restarting backend to test disconnect/reconnect..."
cd docker && docker compose restart backend
echo "Backend restarted. Waiting 20 seconds for it to fully start up and STOMP to reconnect..."
sleep 20
cd ..

echo "Injecting final alert after reconnect..."
./inject_alerts.sh 1

echo "Test complete."
