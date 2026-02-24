import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /session/active
router.get('/active', authMiddleware, async (req, res) => {
    const { data, error } = await supabase
        .from('sessions')
        .select(`
      id, title, is_active, stage, created_at,
      current_speaker:members!sessions_current_speaker_id_fkey(id, name, party, constituency)
    `)
        .eq('is_active', true)
        .single();

    if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ error: error.message });
    }
    res.json({ session: data || null });
});

// POST /session/stage
router.post('/stage', authMiddleware, async (req, res) => {
    // Both moderators and perhaps admins can change stage. But let's restrict to moderator.
    if (req.user?.role !== 'moderator') {
        return res.status(403).json({ error: 'Moderator access required' });
    }

    const { session_id, stage } = req.body;
    if (!['waiting_room', 'first_bill', 'one_on_one', 'third_round'].includes(stage)) {
        return res.status(400).json({ error: 'Invalid stage' });
    }

    const { error } = await supabase
        .from('sessions')
        .update({ stage })
        .eq('id', session_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, stage });
});

export default router;
