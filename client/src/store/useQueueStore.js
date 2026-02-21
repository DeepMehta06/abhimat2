import { create } from 'zustand';
import { supabase } from '../shared/services/supabase';
import { getQueue, raiseHand, approveSpeaker, markDone, revokeMic } from '../shared/services/api';
import useSessionStore from './useSessionStore';

const useQueueStore = create((set, get) => ({
    queue: [],
    isQueueLoading: false,
    channel: null,
    error: null,

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    fetchQueue: async () => {
        set({ isQueueLoading: true, error: null });
        try {
            const res = await getQueue();
            const queueList = res.data.queue || [];
            set({ queue: queueList });

            // Sync timer with speaking entry
            const speaking = queueList.find(q => q.status === 'speaking');
            if (speaking && speaking.speaking_started_at) {
                useSessionStore.getState().syncTimerWithStartedAt(speaking.speaking_started_at);
            }
        } catch (err) {
            set({ error: err.response?.data?.error || err.message || 'Failed to fetch queue' });
        } finally {
            set({ isQueueLoading: false });
        }
    },

    initQueueRealtime: () => {
        const { channel, fetchQueue } = get();
        if (channel) return;

        fetchQueue();
        const newChannel = supabase.channel('global-queue-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'speaker_queue' }, () => {
                fetchQueue();
            })
            .subscribe();

        set({ channel: newChannel });
    },

    raiseHand: async () => {
        try { await raiseHand(); await get().fetchQueue(); }
        catch (err) { set({ error: err.response?.data?.error || err.message }); }
    },

    approveSpeaker: async (id) => {
        try { await approveSpeaker(id); await get().fetchQueue(); }
        catch (err) { set({ error: err.response?.data?.error || err.message }); throw err; }
    },

    markDone: async () => {
        try { await markDone(); await get().fetchQueue(); }
        catch (err) { set({ error: err.response?.data?.error || err.message }); throw err; }
    },

    revokeSpeaker: async () => {
        try { await revokeMic(); await get().fetchQueue(); }
        catch (err) { set({ error: err.response?.data?.error || err.message }); throw err; }
    },

    cleanupRealtime: () => {
        const { channel } = get();
        if (channel) supabase.removeChannel(channel);
        set({ channel: null });
    }
}));

export default useQueueStore;
