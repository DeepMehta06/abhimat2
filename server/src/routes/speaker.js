import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware, moderatorOnly } from '../middleware/auth.js';

const router = express.Router();

// PATCH /speaker/approve/:queueId — moderator approves next speaker
router.patch('/approve/:queueId', authMiddleware, moderatorOnly, async (req, res) => {
    const { queueId } = req.params;

    // Get the queue entry
    const { data: entry, error: entryErr } = await supabase
        .from('speaker_queue')
        .select('id, member_id, session_id')
        .eq('id', queueId)
        .single();

    if (entryErr || !entry) return res.status(404).json({ error: 'Queue entry not found' });

    // Set current speaker on session
    const { error: sessErr } = await supabase
        .from('sessions')
        .update({ current_speaker_id: entry.member_id })
        .eq('id', entry.session_id);

    if (sessErr) return res.status(500).json({ error: sessErr.message });

    // Mark queue entry as speaking + record start time
    await supabase
        .from('speaker_queue')
        .update({ status: 'speaking', speaking_started_at: new Date().toISOString() })
        .eq('id', queueId);

    res.json({ success: true });
});

// PATCH /speaker/revoke — moderator revokes mic from current speaker
router.patch('/revoke', authMiddleware, moderatorOnly, async (req, res) => {
    const { data: session } = await supabase
        .from('sessions')
        .select('id, current_speaker_id')
        .eq('is_active', true)
        .single();

    if (!session?.current_speaker_id) return res.status(400).json({ error: 'No current speaker' });

    const speakerId = session.current_speaker_id;

    // Update queue entry status to 'skipped'
    await supabase
        .from('speaker_queue')
        .update({ status: 'skipped' })
        .eq('session_id', session.id)
        .eq('member_id', speakerId)
        .eq('status', 'speaking');

    // Increment speeches_count — mic was granted, counts as a speech used
    const { data: member } = await supabase
        .from('members')
        .select('speeches_count')
        .eq('id', speakerId)
        .single();

    await supabase
        .from('members')
        .update({ speeches_count: (member?.speeches_count || 0) + 1 })
        .eq('id', speakerId);

    // Clear current speaker
    await supabase
        .from('sessions')
        .update({ current_speaker_id: null })
        .eq('id', session.id);

    res.json({ success: true });
});

// PATCH /speaker/done — moderator marks speech done, increments count
router.patch('/done', authMiddleware, moderatorOnly, async (req, res) => {
    const { data: session } = await supabase
        .from('sessions')
        .select('id, current_speaker_id')
        .eq('is_active', true)
        .single();

    if (!session?.current_speaker_id) return res.status(400).json({ error: 'No current speaker' });

    const speakerId = session.current_speaker_id;

    // Update queue entry to done
    await supabase
        .from('speaker_queue')
        .update({ status: 'done' })
        .eq('session_id', session.id)
        .eq('member_id', speakerId)
        .eq('status', 'speaking');

    // Increment speeches_count
    const { data: member } = await supabase
        .from('members')
        .select('speeches_count')
        .eq('id', speakerId)
        .single();

    await supabase
        .from('members')
        .update({ speeches_count: (member?.speeches_count || 0) + 1 })
        .eq('id', speakerId);

    // Clear current speaker
    await supabase
        .from('sessions')
        .update({ current_speaker_id: null })
        .eq('id', session.id);

    res.json({ success: true });
});

export default router;
