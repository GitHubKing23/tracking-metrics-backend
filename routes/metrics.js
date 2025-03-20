import express from "express";
import { v4 as uuidv4 } from "uuid"; // Generate session IDs
import Event from "../models/Event.js";
import { broadcastUpdate } from "../server.js";

const router = express.Router();

// ✅ Track User Device & IP
const getUserInfo = (req) => {
  return {
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
    userAgent: req.headers["user-agent"] || "Unknown",
  };
};

// ✅ Log a New Session Start
router.post("/session-start", async (req, res) => {
  try {
    let { sessionId } = req.body;
    if (!sessionId) sessionId = uuidv4();

    const userInfo = getUserInfo(req);

    const newEvent = new Event({
      sessionId,
      eventType: "session_start",
      details: userInfo,
    });
    await newEvent.save();

    broadcastUpdate({ eventType: "session_start", sessionId });

    res.json({ message: "Session started successfully", sessionId });
  } catch (error) {
    res.status(500).json({ error: "Failed to start session" });
  }
});

// ✅ Log a Page View with User-Agent & IP
router.post("/page-view", async (req, res) => {
  try {
    let { sessionId, page, referrer } = req.body;
    if (!page) return res.status(400).json({ error: "Page is required" });

    if (!sessionId) sessionId = uuidv4();
    
    const userInfo = getUserInfo(req);

    const newEvent = new Event({
      sessionId,
      eventType: "page_view",
      page,
      referrer,
      details: userInfo, // ✅ Stores IP & User-Agent
    });
    await newEvent.save();

    broadcastUpdate({ eventType: "page_view", page, referrer, sessionId });

    res.json({ message: "Page view logged successfully", sessionId });
  } catch (error) {
    res.status(500).json({ error: "Failed to log page view" });
  }
});

// ✅ Log an Article Read with IP & Device Info
router.post("/article-read", async (req, res) => {
  try {
    let { sessionId, article, duration } = req.body;
    if (!article || duration < 30) return res.status(400).json({ error: "Invalid article read" });

    if (!sessionId) sessionId = uuidv4();
    
    const userInfo = getUserInfo(req);

    const newEvent = new Event({
      sessionId,
      eventType: "article_read",
      page: article,
      duration,
      details: userInfo,
    });
    await newEvent.save();

    broadcastUpdate({ eventType: "article_read", article, duration, sessionId });

    res.json({ message: "Article read logged successfully", sessionId });
  } catch (error) {
    res.status(500).json({ error: "Failed to log article read" });
  }
});

// ✅ Log a Click Event with Timestamp
router.post("/click", async (req, res) => {
  try {
    let { sessionId, clicked, target } = req.body;
    if (!clicked || !target) return res.status(400).json({ error: "Click data required" });

    if (!sessionId) sessionId = uuidv4();
    
    const userInfo = getUserInfo(req);

    const newEvent = new Event({
      sessionId,
      eventType: "click",
      details: { clicked, target, timestamp: new Date(), ...userInfo },
    });
    await newEvent.save();

    broadcastUpdate({ eventType: "click", clicked, target, sessionId });

    res.json({ message: "Click logged successfully", sessionId });
  } catch (error) {
    res.status(500).json({ error: "Failed to log click" });
  }
});

// ✅ Log a Session End
router.post("/session-end", async (req, res) => {
  try {
    let { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID is required" });

    const newEvent = new Event({
      sessionId,
      eventType: "session_end",
      timestamp: new Date(),
    });
    await newEvent.save();

    broadcastUpdate({ eventType: "session_end", sessionId });

    res.json({ message: "Session ended successfully", sessionId });
  } catch (error) {
    res.status(500).json({ error: "Failed to end session" });
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
