import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /points — team leaderboard
router.get('/', authMiddleware, async (req, res) => {
    const { data: session } = await supabase.from('sessions').select('id').eq('is_active', true).single();
    if (!session) return res.json({ leaderboard: [] });

    const { data, error } = await supabase
        .from('team_points')
        .select('party, points')
        .eq('session_id', session.id)
        .order('points', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ leaderboard: data || [] });
});

export default router;
