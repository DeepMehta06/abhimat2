import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { getActiveSession, getQueue, getActivePoll } from '../../shared/services/api';
import { supabase } from '../../shared/services/supabase';
import TopBar from '../../shared/components/TopBar';
import FloorStatus from '../../shared/components/FloorStatus';
import RaiseHandButton from '../components/RaiseHandButton';
import ChatPanel from '../components/ChatPanel';
import PollCard from '../components/PollCard';

export default function MemberDashboard() {
    const { user, refreshUser } = useAuth();
    const [session, setSession] = useState(null);
    const [queue, setQueue] = useState([]);
    const [poll, setPoll] = useState(null);
    const [tab, setTab] = useState('home'); // 'home' | 'chat' | 'polls'

    const myQueueEntry = queue.find(q => q.member?.id === user?.id);

    const loadAll = useCallback(async () => {
        try {
            const [sessRes, queueRes, pollRes] = await Promise.all([
                getActiveSession(),
                getQueue(),
                getActivePoll(),
            ]);
            setSession(sessRes.data.session);
            setQueue(queueRes.data.queue || []);
            setPoll(pollRes.data.poll);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        loadAll();

        // Realtime subscriptions
        const sub = supabase
            .channel('member-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, loadAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'speaker_queue' }, loadAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, loadAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, loadAll)
            // When speeches_count changes in the DB, refresh the logged-in user's profile
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'members', filter: `id=eq.${user?.id}` },
                refreshUser
            )
            .subscribe();

        return () => supabase.removeChannel(sub);
    }, [loadAll]);

    const speechesLeft = Math.max(0, 2 - (user?.speeches_count || 0));

    return (
        <div className="bg-background-light font-display antialiased text-neutral-dark pb-24 min-h-screen">
            {/* Dot pattern bg */}
            <div className="fixed inset-0 pointer-events-none z-[-1] bg-pattern" />

            <TopBar session={session} liveCount={queue.length} />

            <main className="flex flex-col gap-5 p-4 max-w-md mx-auto w-full">

                {/* Member card */}
                <section className="bg-white rounded-xl p-5 shadow-soft border-t-4 border-t-saffron border-x border-b border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -mr-8 -mt-8" />
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-saffron/20 to-india-green/20 flex items-center justify-center text-2xl font-black text-saffron shadow-sm border border-gray-100 shrink-0">
                            {user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-neutral-dark leading-tight truncate">{user?.name}</h2>
                            <p className="text-saffron text-sm font-semibold mt-1">Member of Parliament</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-india-green/10 text-india-green border border-india-green/20 uppercase">
                                    Active
                                </span>
                                <span className="text-xs text-gray-500 font-medium">· {user?.constituency || user?.party}</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Speeches Left</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-black text-neutral-dark">{speechesLeft}</span>
                                <span className="text-sm font-bold text-gray-400">/ 2</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-accent transition-all" style={{ width: `${(speechesLeft / 2) * 100}%` }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Party</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xl font-black text-india-green">{user?.party || '—'}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">{user?.member_id}</p>
                        </div>
                    </div>
                </section>

                {/* Action row */}
                {tab === 'home' && (
                    <>
                        <section className="grid grid-cols-12 gap-4">
                            <RaiseHandButton queueEntry={myQueueEntry} onUpdate={loadAll} />
                            <button
                                onClick={() => setTab('polls')}
                                className="col-span-4 group relative overflow-hidden rounded-xl bg-accent text-neutral-dark p-5 flex flex-col justify-between h-32 transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
                            >
                                <div className="absolute right-0 bottom-0 opacity-20 translate-x-2 translate-y-2">
                                    <span className="material-symbols-outlined text-[100px]">monitoring</span>
                                </div>
                                <span className="material-symbols-outlined text-3xl">monitoring</span>
                                <span className="text-sm font-black tracking-tight text-left leading-tight uppercase">Polls</span>
                            </button>
                        </section>

                        {/* My queue position banner */}
                        {myQueueEntry && (
                            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-accent text-neutral-dark flex items-center justify-center text-[10px] font-black ring-2 ring-white shadow-sm">YOU</div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-neutral-dark">
                                        You're #{queue.filter(q => q.status === 'waiting').findIndex(q => q.member?.id === user?.id) + 1} in queue
                                    </p>
                                    <p className="text-[10px] text-india-green font-black uppercase tracking-wide">Prepare your notes!</p>
                                </div>
                            </div>
                        )}

                        <FloorStatus session={session} queue={queue} />
                    </>
                )}

                {tab === 'chat' && <ChatPanel sessionId={session?.id} />}

                {tab === 'polls' && (
                    <div className="flex flex-col gap-4">
                        {poll ? (
                            <PollCard poll={poll} onVoted={loadAll} />
                        ) : (
                            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-soft">
                                <span className="material-symbols-outlined text-5xl text-gray-200">bar_chart</span>
                                <p className="text-gray-400 mt-3 font-medium">No active poll right now.</p>
                                <p className="text-[11px] text-gray-300 mt-1">The moderator will create one soon.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-6 pt-2 z-50">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    {[
                        { id: 'home', icon: 'dashboard', label: 'Session' },
                        { id: 'chat', icon: 'forum', label: 'Chat' },
                        { id: 'polls', icon: 'leaderboard', label: 'Polls' },
                    ].map(({ id, icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex flex-col items-center gap-1 transition-colors ${tab === id ? 'text-saffron' : 'text-gray-400'}`}
                        >
                            <span className={`material-symbols-outlined text-[28px] ${tab === id ? 'fill-[1]' : ''}`}>{icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
