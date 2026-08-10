const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

async function testStomp() {
  console.log("Acquiring admin token...");
  const authRes = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@Raksha2026!' })
  });
  
  const authData = await authRes.json();
  const token = authData.data.token;
  
  console.log("Token acquired. Connecting to STOMP...");
  
  const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws-soc'),
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    onConnect: () => {
      console.log("✅ STOMP connected successfully with JWT!");
      client.subscribe('/topic/alerts', (message) => {
        console.log("✅ Received alert via STOMP: " + message.body.substring(0, 50) + "...");
        client.deactivate();
        process.exit(0);
      });
      
      // Inject an alert to trigger the broadcast
      console.log("Injecting alert via REST...");
      fetch('http://localhost:8080/api/v1/alerts/ingest-flow', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceIp: "1.2.3.4",
          destinationIp: "5.6.7.8",
          sourcePort: 1234,
          destinationPort: 80,
          flowFeatures: Array(84).fill(1.5)
        })
      });
    },
    onStompError: (frame) => {
      console.error("❌ STOMP Error: " + frame.headers['message']);
      process.exit(1);
    },
    onWebSocketError: (event) => {
      console.error("❌ WebSocket Error", event);
      process.exit(1);
    }
  });
  
  client.activate();
}

testStomp();
