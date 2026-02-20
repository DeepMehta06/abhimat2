import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /chat?page=0 — paginated chat for active session
router.get('/', authMiddleware, async (req, res) => {
    const page = parseInt(req.query.page || '0');
    const limit = 50;

    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    if (!session) return res.json({ messages: [] });

    const { data, error } = await supabase
        .from('chat_messages')
        .select('id, content, created_at, member:members(id, name, party)')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .range(page * limit, page * limit + limit - 1);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ messages: (data || []).reverse() });
});

// POST /chat — post a message
router.post('/', authMiddleware, async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
    if (content.length > 500) return res.status(400).json({ error: 'Message too long (max 500 chars)' });

    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    if (!session) return res.status(400).json({ error: 'No active session' });

    const { data, error } = await supabase
        .from('chat_messages')
        .insert({ session_id: session.id, member_id: req.user.id, content: content.trim() })
        .select('id, content, created_at, member:members(id, name, party)')
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: data });
});

export default router;
