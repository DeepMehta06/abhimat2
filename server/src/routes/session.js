import express from "express";
import { supabase } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { raiseHandAccessStore, raiseHandWindowStore } from "../index.js";

// Create and subscribe to the broadcast channel ONCE at module load
const raiseHandChannel = supabase.channel("raise-hand-updates");
raiseHandChannel.subscribe((status) => {
  console.log("Raise hand broadcast channel status:", status);
});

// Broadcast helper — uses the pre-subscribed channel
async function broadcastRaiseHandWindowState(sessionId, isEnabled, isWindowActive, timeRemaining) {
  try {
    await raiseHandChannel.send({
      type: "broadcast",
      event: "window_state_changed",
      payload: {
        sessionId,
        isEnabled,
        isWindowActive,
        timeRemaining,
      },
    });
  } catch (err) {
    console.error("Failed to broadcast raise hand state:", err);
  }
}

const router = express.Router();

// GET /session/active
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, title, is_active, stage, created_at, current_speaker:members!sessions_current_speaker_id_fkey(id, name, party, constituency)",
      )
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Session fetch error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ session: data || null });
  } catch (err) {
    console.error("Session fetch exception:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /session/stage
router.post("/stage", authMiddleware, async (req, res) => {
  // Both moderators and perhaps admins can change stage. But let's restrict to moderator.
  if (req.user?.role !== "moderator") {
    return res.status(403).json({ error: "Moderator access required" });
  }

  const { session_id, stage } = req.body;
  if (
    !["waiting_room", "first_bill", "one_on_one", "third_round"].includes(stage)
  ) {
    return res.status(400).json({ error: "Invalid stage" });
  }

  const { error } = await supabase
    .from("sessions")
    .update({ stage })
    .eq("id", session_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, stage });
});

// GET /session/raise-hand/status
router.get("/raise-hand/status", authMiddleware, async (req, res) => {
  // Disable caching so members always get fresh state (no 304s)
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("ETag", false);
  try {
    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id")
      .eq("is_active", true)
      .single();

    if (sessionError || !session) {
      return res.json({
        isEnabled: false,
        isWindowActive: false,
        timeRemaining: 0,
      });
    }

    const isEnabled = raiseHandAccessStore.get(session.id) !== false;
    const window = raiseHandWindowStore.get(session.id);
    const now = Date.now();

    let isWindowActive = false;
    let timeRemaining = 0;
    let hasRaised = false;

    if (window && now < window.windowEnd) {
      isWindowActive = true;
      timeRemaining = Math.max(0, window.windowEnd - now);
      hasRaised = window.pressedMembers.has(req.user.id);
    }

    res.json({
      isEnabled,
      isWindowActive,
      timeRemaining,
      hasRaised,
    });
  } catch (err) {
    console.error("Raise hand status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /session/raise-hand
router.patch("/raise-hand", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "moderator") {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const { raise_hand_enabled } = req.body;
    if (typeof raise_hand_enabled !== "boolean") {
      return res
        .status(400)
        .json({ error: "raise_hand_enabled must be a boolean" });
    }

    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id")
      .eq("is_active", true)
      .single();

    if (sessionError || !session) {
      return res.status(400).json({ error: "No active session" });
    }

    // Store in memory
    raiseHandAccessStore.set(session.id, raise_hand_enabled);

    // If enabling, create a new 5-second window
    if (raise_hand_enabled) {
      const now = Date.now();
      const windowEnd = now + 40000; // 40 seconds
      raiseHandWindowStore.set(session.id, {
        windowStart: now,
        windowEnd,
        pressedMembers: new Set(),
      });

      // Broadcast window activation
      await broadcastRaiseHandWindowState(session.id, true, true, 40000);

      // Auto-expire window after 40 seconds
      setTimeout(() => {
        if (raiseHandWindowStore.has(session.id)) {
          raiseHandWindowStore.delete(session.id);
        }
        raiseHandAccessStore.set(session.id, false);
        // Broadcast window expiration
        broadcastRaiseHandWindowState(session.id, false, false, 0);
      }, 40000);
    } else {
      // If disabling, clear the window
      raiseHandWindowStore.delete(session.id);
      await broadcastRaiseHandWindowState(session.id, false, false, 0);
    }

    res.json({ success: true, raise_hand_enabled });
  } catch (err) {
    console.error("Raise hand toggle error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
