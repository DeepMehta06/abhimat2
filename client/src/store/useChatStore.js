import { create } from 'zustand';
import { supabase } from '../shared/services/supabase';
import { getChat, postMessage, clearChat as apiClearChat } from '../shared/services/api';

const useChatStore = create((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,
    channel: null,
    activeRoomId: null,

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    fetchMessages: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await getChat();
            set({ messages: data.messages || [] });
        } catch (err) {
            set({ error: err.response?.data?.error || err.message || 'Failed to fetch chat' });
        } finally {
            set({ isLoading: false });
        }
    },

    sendMessage: async (content) => {
        try {
            await postMessage(content);
        } catch (err) {
            set({ error: err.response?.data?.error || err.message });
            throw err;
        }
    },

    clearChat: async () => {
        try {
            await apiClearChat();
            set({ messages: [] });
        } catch (err) {
            set({ error: err.response?.data?.error || err.message });
            throw err;
        }
    },

    initChatRealtime: (roomId) => {
        const { channel, activeRoomId, fetchMessages } = get();

        if (channel && activeRoomId === roomId) return;

        if (channel && activeRoomId !== roomId) {
            get().cleanupRealtime();
        }

        set({ activeRoomId: roomId });
        fetchMessages();

        const newChannel = supabase.channel(`chat-room-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `session_id=eq.${roomId}`
                },
                () => {
                    get().fetchMessages();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'chat_messages'
                },
                () => {
                    get().fetchMessages();
                }
            )
            .subscribe();

        set({ channel: newChannel });
    },

    cleanupRealtime: () => {
        const { channel } = get();
        if (channel) supabase.removeChannel(channel);
        set({ channel: null, activeRoomId: null, messages: [] });
    }
}));

export default useChatStore;
