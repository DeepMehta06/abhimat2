import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { getActiveSession, getQueue, getActivePoll, getLeaderboard } from '../../shared/services/api';
import { supabase } from '../../shared/services/supabase';
import TopBar from '../../shared/components/TopBar';
import FloorStatus from '../../shared/components/FloorStatus';
import SpeakerQueue from '../components/SpeakerQueue';
import PollCreator from '../components/PollCreator';
import Leaderboard from '../components/Leaderboard';

const PARTIES = ['BJP', 'INC', 'AAP', 'TMC', 'SP', 'BSP'];

export default function ModeratorDashboard() {
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const [queue, setQueue] = useState([]);
    const [poll, setPoll] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [tab, setTab] = useState('session'); // 'session' | 'polls' | 'stats'

    const loadAll = useCallback(async () => {
        try {
            const [sessRes, queueRes, pollRes, pointsRes] = await Promise.all([
                getActiveSession(),
                getQueue(),
                getActivePoll(),
                getLeaderboard(),
            ]);
            setSession(sessRes.data.session);
            setQueue(queueRes.data.queue || []);
            setPoll(pollRes.data.poll);
            setLeaderboard(pointsRes.data.leaderboard || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        loadAll();

        const sub = supabase
            .channel('mod-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, loadAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'speaker_queue' }, loadAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, loadAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, loadAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_points' }, loadAll)
            .subscribe();

        return () => supabase.removeChannel(sub);
    }, [loadAll]);

    const partyBreakdown = PARTIES.map(p => ({
        party: p,
        count: queue.filter(q => q.member?.party === p).length,
    })).filter(p => p.count > 0);

    const totalInQueue = queue.filter(q => q.status === 'waiting').length;

    return (
        <div className="bg-background-light font-display antialiased text-neutral-dark pb-24 min-h-screen">
            <TopBar session={session} liveCount={queue.length} />

            <main className="flex flex-col gap-5 p-4 max-w-md mx-auto w-full">

                {/* Party representation bar */}
                {partyBreakdown.length > 0 && (
                    <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100 space-y-2">
                        <div className="flex justify-between items-end">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Party Representation</h2>
                            <span className="text-xs font-medium text-gray-400">{totalInQueue} in queue</span>
                        </div>
                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100">
                            {partyBreakdown.map((p, i) => {
                                const pct = Math.round((p.count / totalInQueue) * 100);
                                const colors = ['bg-saffron', 'bg-india-green', 'bg-ashoka-blue', 'bg-amber-400', 'bg-purple-500', 'bg-pink-400'];
                                return <div key={p.party} className={`h-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} title={p.party} />;
                            })}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {partyBreakdown.map((p, i) => {
                                const colors = ['bg-saffron', 'bg-india-green', 'bg-ashoka-blue', 'bg-amber-400', 'bg-purple-500', 'bg-pink-400'];
                                return (
                                    <div key={p.party} className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                                        <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                                        {p.party} ({p.count})
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {tab === 'session' && (
                    <>
                        <SpeakerQueue
                            queue={queue}
                            currentSpeaker={session?.current_speaker}
                            onUpdate={loadAll}
                        />
                        <FloorStatus session={session} queue={queue} />
                    </>
                )}

                {tab === 'polls' && (
                    <PollCreator activePoll={poll} parties={PARTIES} onUpdate={loadAll} />
                )}

                {tab === 'stats' && (
                    <>
                        <Leaderboard leaderboard={leaderboard} />
                    </>
                )}
            </main>

            {/* Bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-6 pt-2 z-50">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    {[
                        { id: 'session', icon: 'dashboard', label: 'Session' },
                        { id: 'polls', icon: 'bar_chart', label: 'Polls' },
                        { id: 'stats', icon: 'leaderboard', label: 'Stats' },
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
