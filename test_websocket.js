const WebSocket = require('ws');

const socket = new WebSocket("wss://peachpuff-alligator-715719.hostingersite.com/gsd/api/websocket_Server/"); 

socket.onopen = () => {
  console.log("✅ Connected to WebSocket");
};

socket.onerror = (err) => {
  console.error("❌ WebSocket error", err);
};

socket.onclose = () => {
  console.log("⚠️ WebSocket closed");
};

socket.onmessage = (event) => {
  console.log("📨 Received message:", event.data);
};
