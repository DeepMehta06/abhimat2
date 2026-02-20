import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware, moderatorOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /polls — moderator creates a poll
router.post('/', authMiddleware, moderatorOnly, async (req, res) => {
    const { question, options } = req.body;
    // options = ["Option A", "Option B", ...]
    if (!question || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'question and at least 2 options required' });
    }

    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    if (!session) return res.status(400).json({ error: 'No active session' });

    // Close any existing active poll first
    await supabase.from('polls').update({ is_active: false }).eq('session_id', session.id).eq('is_active', true);

    const formattedOptions = options.map((text, idx) => ({ id: idx + 1, text }));

    const { data, error } = await supabase
        .from('polls')
        .insert({ session_id: session.id, question, options: formattedOptions, is_active: true })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ poll: data });
});

// GET /polls/active — get current active poll with vote counts
router.get('/active', authMiddleware, async (req, res) => {
    const { data: session } = await supabase
        .from('sessions').select('id').eq('is_active', true).single();
    if (!session) return res.json({ poll: null });

    const { data: poll } = await supabase
        .from('polls').select('*').eq('session_id', session.id).eq('is_active', true).single();
    if (!poll) return res.json({ poll: null });

    // Get vote counts per option
    const { data: votes } = await supabase
        .from('poll_votes').select('option_id').eq('poll_id', poll.id);

    const voteCounts = {};
    (votes || []).forEach(v => {
        voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1;
    });

    // Check if current user voted
    const { data: myVote } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id)
        .eq('member_id', req.user.id)
        .maybeSingle();

    res.json({
        poll: {
            ...poll,
            vote_counts: voteCounts,
            total_votes: (votes || []).length,
            my_vote: myVote?.option_id || null,
        }
    });
});

// POST /polls/:id/vote — cast a vote
router.post('/:id/vote', authMiddleware, async (req, res) => {
    const { option_id } = req.body;
    if (!option_id) return res.status(400).json({ error: 'option_id required' });

    // Check poll is active
    const { data: poll } = await supabase.from('polls').select('*').eq('id', req.params.id).single();
    if (!poll?.is_active) return res.status(400).json({ error: 'Poll is not active' });

    // Check not already voted
    const { data: existing } = await supabase
        .from('poll_votes').select('id').eq('poll_id', poll.id).eq('member_id', req.user.id).maybeSingle();
    if (existing) return res.status(409).json({ error: 'Already voted' });

    const { error } = await supabase
        .from('poll_votes')
        .insert({ poll_id: poll.id, member_id: req.user.id, option_id });

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ success: true });
});

// PATCH /polls/:id/close — close poll and award points to a party
router.patch('/:id/close', authMiddleware, moderatorOnly, async (req, res) => {
    const { party, points } = req.body;

    await supabase.from('polls').update({ is_active: false }).eq('id', req.params.id);

    if (party && points) {
        const { data: session } = await supabase.from('sessions').select('id').eq('is_active', true).single();

        // Upsert party points
        const { data: existing } = await supabase
            .from('team_points').select('id, points').eq('session_id', session.id).eq('party', party).maybeSingle();

        if (existing) {
            await supabase.from('team_points').update({ points: existing.points + points }).eq('id', existing.id);
        } else {
            await supabase.from('team_points').insert({ session_id: session.id, party, points });
        }
    }

    res.json({ success: true });
});

export default router;
