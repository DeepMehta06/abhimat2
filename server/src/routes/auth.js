import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabase.js';

const router = express.Router();

// POST /auth/login
// Body: { member_id: "BJP12345", password: "BJP" }
router.post('/login', async (req, res) => {
    const { member_id, password } = req.body;
    if (!member_id || !password) {
        return res.status(400).json({ error: 'member_id and password required' });
    }

    // Fetch member from DB
    const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('member_id', member_id.toUpperCase())
        .single();

    if (error || !member) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Password = party name (case-insensitive)
    const expectedPassword = member.party.toLowerCase();
    if (password.toLowerCase() !== expectedPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        {
            id: member.id,
            member_id: member.member_id,
            name: member.name,
            party: member.party,
            constituency: member.constituency,
            role: member.role,
            speeches_count: member.speeches_count,
        },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
    );

    res.json({
        token,
        user: {
            id: member.id,
            member_id: member.member_id,
            name: member.name,
            party: member.party,
            constituency: member.constituency,
            role: member.role,
            speeches_count: member.speeches_count,
        },
    });
});

// GET /auth/me - refresh user info
router.get('/me', async (req, res) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        const { data: member } = await supabase
            .from('members')
            .select('id,member_id,name,party,constituency,role,speeches_count')
            .eq('id', payload.id)
            .single();
        res.json({ user: member });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
