const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:5000");

ws.on("open", () => console.log("✅ WebSocket Connected"));

ws.on("message", (data) => console.log("📩 New Update:", data.toString()));

ws.on("close", () => console.log("🔌 WebSocket Disconnected"));

ws.on("error", (err) => console.error("❌ WebSocket Error:", err));
