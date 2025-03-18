import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true }, // ✅ Track session ID
  eventType: { type: String, required: true }, // Type of event (page_view, click, etc.)
  page: { type: String, default: "" }, // Page where the event happened
  referrer: { type: String, default: "" }, // Where the user came from
  duration: { type: Number, default: 0 }, // For tracking time spent (article reads, videos)
  details: { type: Object, default: {} }, // Extra metadata (clicked links, search queries)
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Event", EventSchema);
