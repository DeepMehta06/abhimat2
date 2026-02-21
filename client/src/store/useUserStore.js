import { create } from 'zustand';
import { supabase } from '../shared/services/supabase';
import { getMe, getPowerCards, usePowerCard as apiUsePowerCard } from '../shared/services/api';
import useSessionStore from './useSessionStore';
import useQueueStore from './useQueueStore';

const useUserStore = create((set, get) => ({
    user: null,
    token: localStorage.getItem('abhimat_token') || null,
    role: null,
    powerCards: [],
    channel: null,
    error: null,

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    setUser: (user, token) => {
        if (token) {
            localStorage.setItem('abhimat_token', token);
        }
        if (user) {
            localStorage.setItem('abhimat_user', JSON.stringify(user));
            set({ user, token: token || get().token, role: user.role });
        }
    },

    logout: () => {
        localStorage.removeItem('abhimat_token');
        localStorage.removeItem('abhimat_user');
        set({ user: null, token: null, role: null, powerCards: [] });

        const { channel } = get();
        if (channel) {
            supabase.removeChannel(channel);
            set({ channel: null });
        }

        useSessionStore.getState().cleanupRealtime();
        useQueueStore.getState().cleanupRealtime();
        window.location.href = '/';
    },

    refreshUser: async () => {
        try {
            const res = await getMe();
            get().setUser(res.data.user);
        } catch {
            get().logout();
        }
    },

    initRealtimeUser: () => {
        const { channel, user, refreshUser } = get();
        if (channel || !user?.id) return;

        const newChannel = supabase.channel('user-profile-channel')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'members', filter: `id=eq.${user?.id}` },
                refreshUser
            )
            .subscribe();

        set({ channel: newChannel });
    },

    fetchCards: async () => {
        try {
            const res = await getPowerCards();
            set({ powerCards: res.data?.cards || [] });
        } catch (err) {
            set({ error: err.response?.data?.error || err.message });
        }
    },

    usePowerCard: async (cardId, targetMemberId) => {
        try {
            await apiUsePowerCard(cardId, targetMemberId);
            await get().fetchCards();
        } catch (err) {
            set({ error: err.response?.data?.error || err.message });
            throw err;
        }
    }
}));

// Initialize user correctly safely
try {
    const storedUser = JSON.parse(localStorage.getItem('abhimat_user'));
    if (storedUser) {
        useUserStore.setState({ user: storedUser, role: storedUser.role });
    }
} catch (e) {
    // Ignore
}

export default useUserStore;
