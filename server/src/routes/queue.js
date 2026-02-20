import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /queue  — sorted by priority_score ASC then raised_at ASC
router.get('/', authMiddleware, async (req, res) => {
    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    if (!session) return res.json({ queue: [] });

    const { data, error } = await supabase
        .from('speaker_queue')
        .select(`
      id, status, priority_score, raised_at, speaking_started_at,
      member:members(id, name, party, constituency, speeches_count)
    `)
        .eq('session_id', session.id)
        .in('status', ['waiting', 'speaking'])
        .order('priority_score', { ascending: true })
        .order('raised_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ queue: data || [] });
});

export default router;
