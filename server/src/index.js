import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRouter from './routes/auth.js';
import sessionRouter from './routes/session.js';
import handRouter from './routes/hand.js';
import queueRouter from './routes/queue.js';
import speakerRouter from './routes/speaker.js';
import chatRouter from './routes/chat.js';
import pollsRouter from './routes/polls.js';
import pointsRouter from './routes/points.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security & logging
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Global rate limiter — raised for events where all users share same WiFi IP
// 1000 req/min per IP supports ~200 participants comfortably
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/auth'), // login must never be blocked
});
app.use(limiter);

// Hand-raise limiter — per IP, raised for shared WiFi scenarios
// 30 per 10s per IP = ~200 people can all raise hands without hitting limit
const handLimiter = rateLimit({ windowMs: 10 * 1000, max: 30, legacyHeaders: false });

// Routes
app.use('/auth', authRouter);
app.use('/session', sessionRouter);
app.use('/hand', handLimiter, handRouter);
app.use('/queue', queueRouter);
app.use('/speaker', speakerRouter);
app.use('/chat', chatRouter);
app.use('/polls', pollsRouter);
app.use('/points', pointsRouter);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
    console.log(`🏛️  Abhimat server running on http://localhost:${PORT}`);
});

export default app;
