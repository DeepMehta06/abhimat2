import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware, moderatorOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /hand/raise  — concurrency-safe via RPC
router.post('/raise', authMiddleware, async (req, res) => {
    const memberId = req.user.id;

    // Get active session
    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    if (!session) return res.status(400).json({ error: 'No active session' });

    // Check if already in queue
    const { data: existing } = await supabase
        .from('speaker_queue')
        .select('id, status')
        .eq('session_id', session.id)
        .eq('member_id', memberId)
        .in('status', ['waiting', 'speaking'])
        .maybeSingle();

    if (existing) return res.status(409).json({ error: 'Already in queue', status: existing.status });

    // Priority score: fewer speeches = lower number = higher priority
    const speechCount = req.user.speeches_count || 0;
    const priorityScore = speechCount * 10;

    const { data, error } = await supabase
        .from('speaker_queue')
        .insert({
            session_id: session.id,
            member_id: memberId,
            status: 'waiting',
            priority_score: priorityScore,
        })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ entry: data });
});

// DELETE /hand/lower
router.delete('/lower', authMiddleware, async (req, res) => {
    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    if (!session) return res.status(400).json({ error: 'No active session' });

    const { error } = await supabase
        .from('speaker_queue')
        .update({ status: 'skipped' })
        .eq('session_id', session.id)
        .eq('member_id', req.user.id)
        .eq('status', 'waiting');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

export default router;
