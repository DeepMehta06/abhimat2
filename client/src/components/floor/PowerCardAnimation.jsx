import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSessionStore from '../../store/useSessionStore';

export default function PowerCardAnimation() {
    const { interruptInfo, challengeInfo, timerLimit } = useSessionStore();
    const [notifications, setNotifications] = useState([]);
    const prevInterrupt = useRef(null);
    const prevChallenge = useRef(null);
    const prevTimerLimit = useRef(timerLimit);
    const idCounter = useRef(0);

    const addNotification = (text, icon, color) => {
        const id = ++idCounter.current;
        setNotifications(prev => [...prev, { id, text, icon, color }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3500);
    };

    useEffect(() => {
        if (interruptInfo && !prevInterrupt.current) {
            addNotification(
                `${interruptInfo.name} used INTERRUPT`,
                'flash_on',
                'bg-amber-500'
            );
        }
        prevInterrupt.current = interruptInfo;
    }, [interruptInfo]);

    useEffect(() => {
        if (challengeInfo && !prevChallenge.current) {
            addNotification(
                `${challengeInfo.name1} used CHALLENGE`,
                'sports_mma',
                'bg-rose-500'
            );
        }
        prevChallenge.current = challengeInfo;
    }, [challengeInfo]);

    useEffect(() => {
        if (timerLimit > prevTimerLimit.current) {
            addNotification(
                `+${timerLimit - prevTimerLimit.current}s added to timer`,
                'more_time',
                'bg-india-green'
            );
        }
        prevTimerLimit.current = timerLimit;
    }, [timerLimit]);

    return (
        <div className="fixed top-20 right-4 z-[9998] flex flex-col gap-2 items-end pointer-events-none max-w-xs">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        className={`${n.color} text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto`}
                        initial={{ opacity: 0, x: 60, scale: 0.85 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.85 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        <span className="material-symbols-outlined text-lg">{n.icon}</span>
                        <span className="text-sm font-bold">{n.text}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
