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
        .select(`id, content, created_at, is_golden, golden_at, 
                 member:members(id, name, party)`)
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .range(page * limit, page * limit + limit - 1);

    if (error) return res.status(500).json({ error: error.message });
    
    // Fetch grader info separately if needed
    res.json({ messages: (data || []).reverse() });
});
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

// DELETE /chat — clear chat for active session (moderator only)
router.delete('/', authMiddleware, async (req, res) => {
    if (req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Only moderators can clear the chat' });
    }

    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    if (!session) return res.status(400).json({ error: 'No active session' });

    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', session.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Chat cleared successfully' });
});

// PATCH /chat/:messageId/golden — mark/unmark message as golden
router.patch('/:messageId/golden', authMiddleware, async (req, res) => {
    const { messageId } = req.params;
    const isGolden = req.body.is_golden !== false;

    // Verify message exists and get message details
    const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('id, member_id, session_id')
        .eq('id', messageId)
        .single();

    if (fetchError || !message) {
        return res.status(404).json({ error: 'Message not found' });
    }

    // Only allow members to mark their own messages or moderators to mark any
    if (req.user.id !== message.member_id && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'You can only mark your own messages as golden' });
    }

    // Update the message
    const updateData = {
        is_golden: isGolden,
        golden_by_id: isGolden ? req.user.id : null,
        golden_at: isGolden ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
        .from('chat_messages')
        .update(updateData)
        .eq('id', messageId)
        .select(`id, content, created_at, is_golden, golden_at, golden_by_id,
                 member:members(id, name, party)`)
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: data });
});

export default router;
