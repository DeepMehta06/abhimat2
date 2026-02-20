import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { id, member_id, name, party, role }
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function moderatorOnly(req, res, next) {
    if (req.user?.role !== 'moderator') {
        return res.status(403).json({ error: 'Moderator access required' });
    }
    next();
}
