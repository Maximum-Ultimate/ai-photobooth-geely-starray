// src/utils/wsService.js
let ws;
let isConnected = false;
let reconnectTimer;
const gateway = "ws://192.168.8.100:80"; // ganti IP ESP32

const listeners = new Set(); // buat simpan callback onMessage

function connect() {
  ws = new WebSocket(gateway);

  ws.onopen = () => {
    isConnected = true;
    console.log("✅ Connected to ESP32");
  };

  ws.onmessage = (event) => {
    console.log("📩 ESP32 says:", event.data);
    listeners.forEach((cb) => cb(event.data));
  };

  ws.onclose = () => {
    isConnected = false;
    console.log("⚠️ WebSocket closed, reconnecting...");
    reconnectTimer = setTimeout(connect, 1000);
  };

  ws.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
    ws.close();
  };
}

function sendMessage(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(msg);
    console.log("📤 Sent:", msg);
  } else {
    console.warn("⚠️ WebSocket not ready, dropping:", msg);
  }
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback); // return unsubscribe fn
}

// auto connect pas module diimport
connect();

export default {
  sendMessage,
  subscribe,
  get isConnected() {
    return isConnected;
  },
};
