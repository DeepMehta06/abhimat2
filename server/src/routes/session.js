import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /session/active
router.get('/active', authMiddleware, async (req, res) => {
    const { data, error } = await supabase
        .from('sessions')
        .select(`
      id, title, is_active, created_at,
      current_speaker:members!sessions_current_speaker_id_fkey(id, name, party, constituency)
    `)
        .eq('is_active', true)
        .single();

    if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ error: error.message });
    }
    res.json({ session: data || null });
});

export default router;
