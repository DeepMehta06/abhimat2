export default function Leaderboard({ leaderboard }) {
    if (!leaderboard?.length) {
        return (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-soft">
                <span className="material-symbols-outlined text-5xl text-gray-200">emoji_events</span>
                <p className="text-gray-400 mt-3 font-medium">No points awarded yet.</p>
            </div>
        );
    }

    const partyColors = ['bg-saffron/20 text-saffron', 'bg-india-green/20 text-india-green', 'bg-ashoka-blue/20 text-ashoka-blue', 'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600'];
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <span className="material-symbols-outlined text-saffron">leaderboard</span>
                <h3 className="font-bold text-neutral-dark">Team Leaderboard</h3>
            </div>
            <div className="flex flex-col">
                {leaderboard.map((entry, idx) => (
                    <div key={entry.party} className={`flex items-center gap-4 px-4 py-3.5 ${idx < leaderboard.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <span className="text-xl w-6 text-center">{medals[idx] || `${idx + 1}`}</span>
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-black ${partyColors[idx % partyColors.length]}`}>
                            {entry.party?.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-neutral-dark">{entry.party}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-saffron tabular-nums">{entry.points}</span>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">pts</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
