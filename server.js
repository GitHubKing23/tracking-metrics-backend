import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { WebSocketServer } from "ws";
import metricsRoutes from "./routes/metrics.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Environment Validation
if (!process.env.MONGO_URI) {
  console.error(`[❌ ERROR] MongoDB URI is missing! Check your .env file.`);
  process.exit(1);
}

// ✅ MongoDB Connection with Improved Logging
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log(`[✅ SUCCESS] MongoDB Connected at ${new Date().toISOString()}`)
  )
  .catch((err) => {
    console.error(`[❌ ERROR] MongoDB Connection Failed: ${err.message}`);
    process.exit(1); // Stops API if DB fails
  });

app.use("/metrics", metricsRoutes);

// ✅ Health Check Route (for uptime monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "✅ API Running",
    database: mongoose.connection.readyState === 1 ? "Connected ✅" : "Disconnected ❌",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Bind Server to IPv4 (0.0.0.0) to Allow External Access
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[🚀 SERVER] Running on http://0.0.0.0:${PORT} at ${new Date().toISOString()}`);
});

// ✅ WebSocket Server for Real-Time Tracking
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log(`[🔗 CONNECTED] New WebSocket client at ${new Date().toISOString()}`);

  ws.on("message", (message) => {
    console.log(`[📩 MESSAGE] Received: ${message.toString()} at ${new Date().toISOString()}`);
  });

  ws.on("close", () => {
    console.log(`[🔌 DISCONNECTED] WebSocket client disconnected at ${new Date().toISOString()}`);
  });
});

// ✅ Broadcast function to send live updates to all clients
const broadcastUpdate = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = WebSocket OPEN
      client.send(JSON.stringify(data));
    }
  });
};

// ✅ Global Error Handler (Prevents API from crashing)
app.use((err, req, res, next) => {
  console.error(`[❌ GLOBAL ERROR] ${err.message} at ${new Date().toISOString()}`);
  res.status(500).json({ error: "Internal Server Error" });
});

export { broadcastUpdate };
