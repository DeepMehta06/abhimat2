import { create } from 'zustand';
import { supabase } from '../shared/services/supabase';
import { getActiveSession, updateSessionStage, getActivePoll, getLeaderboard } from '../shared/services/api';

const useSessionStore = create((set, get) => ({
    session: null,
    stage: 'first_bill',
    activeSpeaker: null,
    currentSpeakerStartedAt: null,

    // Timer state
    timer: 0,
    timerLimit: 60,
    isTimerRunning: false,
    interruptInfo: null,
    challengeInfo: null,
    intervalId: null,

    // Additional session state
    poll: null,
    leaderboard: [],
    gradingStatus: null,
    isLoading: false,
    error: null,
    channel: null,

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    fetchActiveSession: async () => {
        set({ isLoading: true, error: null });
        try {
            const [sessRes, pollRes, leadRes] = await Promise.all([
                getActiveSession(),
                getActivePoll(),
                getLeaderboard()
            ]);
            const sess = sessRes.data.session;
            const activeSpk = sess?.current_speaker;
            set({
                session: sess,
                stage: sess?.stage || 'first_bill',
                activeSpeaker: activeSpk,
                poll: pollRes.data.poll,
                leaderboard: leadRes.data.leaderboard || []
            });

            // Reconstruct timer if someone is speaking
            if (!activeSpk) {
                get().resetTimer();
            } else if (!get().isTimerRunning && !get().intervalId) {
                get().startTimer(get().timerLimit || 60, get().timer || 0);
            }
        } catch (err) {
            set({ error: err.response?.data?.error || err.message || 'Failed to fetch session' });
        } finally {
            set({ isLoading: false });
        }
    },

    syncTimerWithStartedAt: (startedAt) => {
        if (!startedAt) return;
        const state = get();
        if (state.interruptInfo || state.challengeInfo) return;
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        set({ timer: Math.max(0, elapsed), currentSpeakerStartedAt: startedAt });

        if (!state.isTimerRunning && !state.intervalId) {
            state.startTimer(state.timerLimit, Math.max(0, elapsed));
        }
    },

    initRealtimeSession: () => {
        const { channel, fetchActiveSession } = get();
        if (channel) return;

        fetchActiveSession();

        const newChannel = supabase.channel('global-session-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchActiveSession())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => fetchActiveSession())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => fetchActiveSession())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_points' }, () => fetchActiveSession())
            .on('broadcast', { event: 'card_used' }, (payload) => {
                const { card_type, user_name } = payload.payload;
                const state = get();
                if (card_type === 'add_time') {
                    set({ timerLimit: state.timerLimit + 60 });
                }
                else if (card_type === 'interrupt') {
                    set({ isTimerRunning: false, interruptInfo: { name: user_name, time_left: 20 } });
                }
                else if (card_type === 'challenge') {
                    set({ isTimerRunning: false, challengeInfo: { phase: 1, name1: user_name, name2: state.activeSpeaker?.name || 'Speaker', time_left: 90 } });
                }
            })
            .subscribe();

        set({ channel: newChannel });
    },

    updateStage: async (newStage) => {
        const { session } = get();
        if (!session) return;
        try {
            await updateSessionStage(session.id, newStage);
            set({ stage: newStage });
        } catch (err) {
            set({ error: 'Failed to update stage' });
        }
    },

    startTimer: (duration = 60, startElapsed = null) => {
        const { intervalId, timer, timerLimit } = get();
        if (intervalId) clearInterval(intervalId);

        set({
            timerLimit: duration !== null ? duration : timerLimit,
            timer: startElapsed !== null ? startElapsed : timer,
            isTimerRunning: true,
            interruptInfo: null,
            challengeInfo: null
        });

        const newIntervalId = setInterval(() => {
            const state = get();

            if (state.interruptInfo) {
                if (state.interruptInfo.time_left <= 1) {
                    set({ isTimerRunning: true, timerLimit: state.timerLimit + 30, interruptInfo: null });
                } else {
                    set({ interruptInfo: { ...state.interruptInfo, time_left: state.interruptInfo.time_left - 1 } });
                }
                return;
            }

            if (state.challengeInfo) {
                if (state.challengeInfo.time_left <= 1) {
                    if (state.challengeInfo.phase === 1) {
                        set({ challengeInfo: { ...state.challengeInfo, phase: 2, time_left: 90 } });
                    } else {
                        set({ isTimerRunning: true, timerLimit: state.timerLimit + 30, challengeInfo: null });
                    }
                } else {
                    set({ challengeInfo: { ...state.challengeInfo, time_left: state.challengeInfo.time_left - 1 } });
                }
                return;
            }

            if (state.isTimerRunning) {
                set({ timer: state.timer + 1 });
            }
        }, 1000);

        set({ intervalId: newIntervalId });
    },

    pauseTimer: () => set({ isTimerRunning: false }),

    resetTimer: () => {
        const { intervalId } = get();
        if (intervalId) clearInterval(intervalId);
        set({ timer: 0, timerLimit: 60, isTimerRunning: false, intervalId: null, interruptInfo: null, challengeInfo: null, currentSpeakerStartedAt: null });
    },

    cleanupRealtime: () => {
        const { channel, intervalId } = get();
        if (channel) supabase.removeChannel(channel);
        if (intervalId) clearInterval(intervalId);
        set({ channel: null, intervalId: null });
    }
}));

export default useSessionStore;
