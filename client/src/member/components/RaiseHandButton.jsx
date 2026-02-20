import { useState } from 'react';
import { raiseHand, lowerHand } from '../../shared/services/api';

export default function RaiseHandButton({ queueEntry, onUpdate }) {
    const [loading, setLoading] = useState(false);

    const isWaiting = queueEntry?.status === 'waiting';
    const isSpeaking = queueEntry?.status === 'speaking';

    async function handleRaise() {
        setLoading(true);
        try { await raiseHand(); onUpdate(); } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function handleLower() {
        setLoading(true);
        try { await lowerHand(); onUpdate(); } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    if (isSpeaking) {
        return (
            <button disabled className="col-span-8 group relative overflow-hidden rounded-xl bg-saffron text-white p-5 flex flex-col justify-between h-32 shadow-lg shadow-saffron/20">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                    <span className="material-symbols-outlined text-[120px]">mic</span>
                </div>
                <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm">mic</span>
                    <span className="bg-white/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse">Speaking</span>
                </div>
                <span className="text-xl font-black tracking-tighter text-left mt-2">YOU'RE ON!</span>
            </button>
        );
    }

    if (isWaiting) {
        return (
            <button
                onClick={handleLower}
                disabled={loading}
                className="col-span-8 group relative overflow-hidden rounded-xl bg-amber-500 text-white p-5 flex flex-col justify-between h-32 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                    <span className="material-symbols-outlined text-[120px]">hourglass_top</span>
                </div>
                <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm animate-bounce">front_hand</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">In Queue</span>
                </div>
                <span className="text-xl font-black tracking-tighter text-left mt-2">{loading ? 'LOWERING...' : 'LOWER HAND'}</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleRaise}
            disabled={loading}
            className="col-span-8 group relative overflow-hidden rounded-xl bg-india-green text-white p-5 flex flex-col justify-between h-32 transition-all shadow-lg shadow-india-green/20 active:scale-[0.98]"
        >
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                <span className="material-symbols-outlined text-[120px]">front_hand</span>
            </div>
            <div className="flex items-center justify-between w-full">
                <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm">front_hand</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">Priority</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-left mt-2">{loading ? 'RAISING...' : 'RAISE HAND'}</span>
        </button>
    );
}
