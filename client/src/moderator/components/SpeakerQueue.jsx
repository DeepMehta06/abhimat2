import { approveSpeaker, revokeMic, markDone } from '../../shared/services/api';
import { useState, useEffect } from 'react';

const DONE_UNLOCK_SECONDS = 60; // 1 minute

// ── Live elapsed-time hook ────────────────────────────────────────────────────
function useElapsedSeconds(startedAt) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt) { setElapsed(0); return; }

        const tick = () => {
            const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
            setElapsed(Math.max(0, secs));
        };
        tick(); // immediate first tick
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt]);

    return elapsed;
}

// ── Speaking Timer display ────────────────────────────────────────────────────
function SpeakingTimer({ startedAt }) {
    const elapsed = useElapsedSeconds(startedAt);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    return (
        <span className="font-mono text-xs font-bold text-saffron tracking-wider">
            {mins}:{secs}
        </span>
    );
}

// ── Done-button with unlock countdown ────────────────────────────────────────
function DoneButton({ startedAt, onClick, loading }) {
    const elapsed = useElapsedSeconds(startedAt);
    const remaining = Math.max(0, DONE_UNLOCK_SECONDS - elapsed);
    const unlocked = remaining === 0;

    return (
        <button
            onClick={onClick}
            disabled={!unlocked || loading}
            className={`flex-1 font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm
                ${unlocked
                    ? 'bg-india-green hover:bg-india-green/90 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
        >
            <span className="material-symbols-outlined text-base">check_circle</span>
            {loading ? 'Marking...' : unlocked ? 'DONE' : `DONE (${remaining}s)`}
        </button>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SpeakerQueue({ queue, currentSpeaker, onUpdate, userRole }) {
    const [loading, setLoading] = useState(null);
    const isJudge = userRole === 'judge';

    async function handle(action, id = null) {
        setLoading(action);
        try {
            if (action === 'approve') await approveSpeaker(id);
            else if (action === 'revoke') await revokeMic();
            else if (action === 'done') await markDone();
            onUpdate();
        } catch (e) { console.error(e); }
        finally { setLoading(null); }
    }

    const waiting = (queue || []).filter(q => q.status === 'waiting');

    // Find the queue entry for the current speaker to get speaking_started_at
    const speakingEntry = (queue || []).find(q => q.status === 'speaking');
    const startedAt = speakingEntry?.speaking_started_at ?? null;

    return (
        <div className="flex flex-col gap-4">
            {/* Currently Speaking */}
            <section className="space-y-3">
                <h2 className="text-lg font-bold text-neutral-dark">Currently Speaking</h2>
                {currentSpeaker ? (
                    <div className="bg-white rounded-xl shadow-sm border-2 border-saffron overflow-hidden">
                        <div className="p-4 flex gap-4">
                            <div className="h-16 w-16 rounded-lg bg-saffron/20 flex items-center justify-center text-saffron text-2xl font-black shrink-0">
                                {currentSpeaker.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex flex-col justify-between py-1 flex-1">
                                <div>
                                    <p className="text-lg font-bold text-neutral-dark">{currentSpeaker.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{currentSpeaker.party} · {currentSpeaker.constituency}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-saffron tracking-widest uppercase animate-pulse">MIC ON</span>
                                    {startedAt && (
                                        <>
                                            <span className="text-gray-300">·</span>
                                            <SpeakingTimer startedAt={startedAt} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-saffron/5 p-3 flex gap-2">
                            {/* Judges cannot mark done or revoke, only Moderators */}
                            {!isJudge ? (
                                <>
                                    {/* Done — unlocks after 1 minute */}
                                    <DoneButton
                                        startedAt={startedAt}
                                        onClick={() => handle('done')}
                                        loading={loading === 'done'}
                                    />
                                    {/* Revoke — always available */}
                                    <button
                                        onClick={() => handle('revoke')}
                                        disabled={loading === 'revoke'}
                                        className="flex-1 bg-alert-red hover:bg-red-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">mic_off</span>
                                        {loading === 'revoke' ? 'Revoking...' : 'REVOKE MIC'}
                                    </button>
                                </>
                            ) : (
                                <div className="flex-1 text-center py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    Moderator manages the floor. Please grade below.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-soft">
                        <span className="material-symbols-outlined text-4xl text-gray-200">mic_none</span>
                        <p className="text-gray-400 mt-2 text-sm">No one is speaking. Approve someone below.</p>
                    </div>
                )}
            </section>

            {/* Queue */}
            <section className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-neutral-dark">Speaker Queue</h2>
                    <span className="text-xs font-semibold text-saffron">{waiting.length} waiting</span>
                </div>
                <div className="flex flex-col gap-2">
                    {waiting.length === 0 && (
                        <p className="text-center text-gray-300 text-sm italic py-6">Queue is empty</p>
                    )}
                    {waiting.map((entry, idx) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-soft">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                                <div className="h-10 w-10 rounded-full bg-saffron/10 flex items-center justify-center text-saffron font-bold text-sm">
                                    {entry.member?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-neutral-dark">{entry.member?.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{entry.member?.party} · {entry.member?.speeches_count || 0} speech{entry.member?.speeches_count !== 1 ? 'es' : ''}</p>
                                </div>
                            </div>
                            {!isJudge && (
                                <button
                                    onClick={() => handle('approve', entry.id)}
                                    disabled={!!currentSpeaker || loading === 'approve'}
                                    className="h-9 px-3 rounded-lg bg-india-green/10 text-india-green font-bold text-xs flex items-center gap-1 disabled:opacity-40 hover:bg-india-green hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">check</span>
                                    Approve
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
