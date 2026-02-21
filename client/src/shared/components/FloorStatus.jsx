import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export default function FloorStatus({ session, queue }) {
    const [elapsed, setElapsed] = useState(0);
    const [limit, setLimit] = useState(60); // Default 1 min
    const [isPaused, setIsPaused] = useState(false);

    // Interrupt state
    const [interruptInfo, setInterruptInfo] = useState(null); // { name: string, time_left: number }

    // Challenge state
    const [challengeInfo, setChallengeInfo] = useState(null); // { phase: 1|2, name1, name2, time_left }

    const currentSpeaker = session?.current_speaker;
    const waiting = (queue || []).filter(q => q.status === 'waiting');

    // Timer logic
    useEffect(() => {
        if (!currentSpeaker) {
            setElapsed(0);
            setLimit(60);
            setIsPaused(false);
            setInterruptInfo(null);
            setChallengeInfo(null);
            return;
        }

        const interval = setInterval(() => {
            // Handle Interrupt State
            if (interruptInfo) {
                setInterruptInfo(prev => {
                    if (prev.time_left <= 1) {
                        setIsPaused(false); // Resume main timer
                        setLimit(l => l + 30); // +30s to counter
                        return null; // End interrupt
                    }
                    return { ...prev, time_left: prev.time_left - 1 };
                });
                return;
            }

            // Handle Challenge State
            if (challengeInfo) {
                setChallengeInfo(prev => {
                    if (prev.time_left <= 1) {
                        if (prev.phase === 1) {
                            // Switch to phase 2
                            return { ...prev, phase: 2, time_left: 90 }; // 1.5 mins
                        }
                        // End challenge
                        return null;
                    }
                    return { ...prev, time_left: prev.time_left - 1 };
                });
                return;
            }

            if (!isPaused) {
                setElapsed(e => e + 1);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [currentSpeaker?.id, isPaused, interruptInfo, challengeInfo]);

    // Realtime listener for Power Cards
    useEffect(() => {
        const channel = supabase.channel('power-cards')
            .on('broadcast', { event: 'card_used' }, (payload) => {
                const { card_type, user_name } = payload.payload;

                if (card_type === 'add_time') {
                    // For simplicity, just add 60s to current limit immediately
                    setLimit(l => l + 60);
                }
                else if (card_type === 'interrupt') {
                    setIsPaused(true);
                    setInterruptInfo({ name: user_name, time_left: 20 });
                }
                else if (card_type === 'challenge') {
                    setIsPaused(true);
                    setChallengeInfo({ phase: 1, name1: user_name, name2: currentSpeaker?.name, time_left: 90 });
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentSpeaker?.name]);

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <section className="bg-white rounded-xl shadow-soft border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-neutral-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-saffron">podium</span>
                    Floor Status
                </h3>
                {interruptInfo || challengeInfo ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-full uppercase border border-rose-200 animate-pulse">
                        Power Card Active
                    </span>
                ) : (
                    <span className="text-[10px] font-bold text-india-green bg-india-green/10 px-2 py-1 rounded-full uppercase border border-india-green/10">
                        Live Feed
                    </span>
                )}
            </div>

            {/* Current Speaker / Active State */}
            <div className="p-4 bg-gradient-to-r from-saffron/5 to-accent/5">

                {interruptInfo && (
                    <div className="mb-4 bg-amber-100 p-3 rounded-lg border border-amber-300">
                        <div className="flex justify-between items-center text-amber-900 font-bold">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">flash_on</span> INTERRUPT</span>
                            <span className="text-xl tabular-nums">{fmt(interruptInfo.time_left)}</span>
                        </div>
                        <p className="text-sm mt-1">{interruptInfo.name} has the floor!</p>
                    </div>
                )}

                {challengeInfo && (
                    <div className="mb-4 bg-rose-100 p-3 rounded-lg border border-rose-300">
                        <div className="flex justify-between items-center text-rose-900 font-bold">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">sports_mma</span> CHALLENGE (Phase {challengeInfo.phase})</span>
                            <span className="text-xl tabular-nums">{fmt(challengeInfo.time_left)}</span>
                        </div>
                        <p className="text-sm mt-1">{challengeInfo.phase === 1 ? challengeInfo.name1 : challengeInfo.name2} is speaking.</p>
                    </div>
                )}

                <div className={`transition-opacity ${isPaused ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-saffron uppercase tracking-[0.2em]">Now Speaking</span>
                        <div className="flex items-center gap-2">
                            <div className="font-mono text-xl font-bold text-saffron tabular-nums bg-white px-2 py-0.5 rounded border border-saffron/20 shadow-sm">
                                {fmt(elapsed)} <span className="text-xs text-gray-400">/ {fmt(limit)}</span>
                            </div>
                        </div>
                    </div>
                    {currentSpeaker ? (
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-saffron/20 ring-2 ring-saffron shadow-sm flex items-center justify-center text-saffron font-bold text-lg">
                                {currentSpeaker.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <p className="font-bold text-neutral-dark text-lg leading-none">{currentSpeaker.name}</p>
                                <p className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wide">
                                    {currentSpeaker.party} · {currentSpeaker.constituency || ''}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 font-medium italic">No one is speaking right now</p>
                    )}
                </div>
            </div>

            {/* Queue up next */}
            <div className="p-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Up Next</p>
                {waiting.length === 0 && (
                    <p className="text-sm text-gray-300 italic">Queue is empty</p>
                )}
                {waiting.slice(0, 3).map((entry, idx) => (
                    <div key={entry.id} className="flex items-center gap-3 opacity-70">
                        <span className="text-xs font-bold text-gray-400 w-4 text-center">{idx + 1}</span>
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                            {entry.member?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-dark truncate">{entry.member?.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-medium">{entry.member?.party}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
