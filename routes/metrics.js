import express from "express";
import { v4 as uuidv4 } from "uuid"; // Generate session IDs if missing
import Event from "../models/Event.js";
import { broadcastUpdate } from "../server.js"; // ✅ WebSocket updates

const router = express.Router();

// ✅ Log a Page View with Session Tracking
router.post("/page-view", async (req, res) => {
  try {
    let { sessionId, page, referrer } = req.body;

    if (!page) return res.status(400).json({ error: "Page is required" });

    if (!sessionId) {
      sessionId = uuidv4(); // ✅ Generate new session ID if missing
    }

    const newEvent = new Event({ sessionId, eventType: "page_view", page, referrer });
    await newEvent.save();

    broadcastUpdate({ eventType: "page_view", page, referrer, sessionId });

    res.json({ message: "Page view logged successfully", sessionId });
  } catch (error) {
    res.status(500).json({ error: "Failed to log page view" });
  }
});

// ✅ Log an Article Read with Session Tracking
router.post("/article-read", async (req, res) => {
  try {
    let { sessionId, article, duration } = req.body;

    if (!article || duration < 30) return res.status(400).json({ error: "Invalid article read" });

    if (!sessionId) {
      sessionId = uuidv4();
    }

    const newEvent = new Event({ sessionId, eventType: "article_read", page: article, duration });
    await newEvent.save();

    broadcastUpdate({ eventType: "article_read", article, duration, sessionId });

    res.json({ message: "Article read logged successfully", sessionId });
  } catch (error) {
    res.status(500).json({ error: "Failed to log article read" });
  }
});

// ✅ Log a Click Event with Session Tracking
router.post("/click", async (req, res) => {
  try {
    let { sessionId, clicked, target } = req.body;

    if (!clicked || !target) return res.status(400).json({ error: "Click data required" });

    if (!sessionId) {
      sessionId = uuidv4();
    }

    const newEvent = new Event({ sessionId, eventType: "click", details: { clicked, target } });
    await newEvent.save();

    broadcastUpdate({ eventType: "click", clicked, target, sessionId });

    res.json({ message: "Click logged successfully", sessionId });
  } catch (error) {
    res.status(500).json({ error: "Failed to log click" });
  }
});

// ✅ Retrieve Session-Based Analytics
router.get("/session-stats", async (req, res) => {
  try {
    const sessionStats = await Event.aggregate([
      { $group: { _id: "$sessionId", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ sessionStats });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve session stats" });
  }
});

export default router;
