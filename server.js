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

if (!process.env.MONGO_URI) {
  console.error("MongoDB URI is missing! Check your .env file.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Failed:", err));

app.use("/metrics", metricsRoutes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ✅ WebSocket Server for Real-Time Tracking
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });

  ws.on("close", () => {
    console.log("Client disconnected");
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

export { broadcastUpdate };
