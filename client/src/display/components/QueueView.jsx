import React from 'react';
import useQueueStore from '../../store/useQueueStore';

export default function QueueView() {
    const { queue } = useQueueStore();
    const waitingQueue = queue.filter(q => q.status === 'waiting');

    return (
        <div className="w-full h-full flex flex-col items-center justify-start p-8 md:p-12 overflow-hidden">
            <div className="mb-10 text-center">
                <h1 className="text-5xl md:text-7xl font-black text-neutral-dark mb-4 tracking-tighter">SPEAKER QUEUE</h1>
                <div className="h-1.5 w-32 bg-saffron mx-auto rounded-full" />
                <p className="text-xl md:text-2xl font-medium text-gray-500 mt-6">Waiting to speak</p>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-4 custom-scrollbar pb-10">
                {waitingQueue.length > 0 ? (
                    waitingQueue.map((entry, idx) => (
                        <div key={entry.id} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 flex flex-col gap-4 relative overflow-hidden transition-transform animate-in fade-in slide-in-from-bottom flex-shrink-0">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-saffron/10 to-transparent rounded-bl-full" />
                            <div className="flex justify-between items-start">
                                <div className="text-5xl font-black text-gray-100 absolute bottom-4 right-4 z-0 pointer-events-none select-none tracking-tighter mix-blend-multiply">#{idx + 1}</div>
                                <div className="flex gap-4 items-center z-10">
                                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-2xl text-saffron border border-gray-200 shadow-sm shrink-0">
                                        {entry.member?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <h3 className="text-xl font-bold text-neutral-dark truncate leading-tight">{entry.member?.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-india-green/10 text-india-green uppercase shadow-sm whitespace-nowrap">
                                                {entry.member?.party || 'Independent'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-semibold text-gray-500 z-10 border-t border-gray-100 pt-3 mt-1 truncate">
                                Constituency: <span className="text-neutral-dark">{entry.member?.constituency || 'SYS'}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">diversity_3</span>
                        <p className="text-xl font-bold text-gray-400">The queue is currently empty.</p>
                        <p className="text-gray-400 mt-2">Members can raise their hand from their dashboard.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
