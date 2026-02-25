import express from "express";
import { supabase } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { raiseHandAccessStore } from "../index.js";

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

    res.json({ success: true, raise_hand_enabled });
  } catch (err) {
    console.error("Raise hand toggle error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
