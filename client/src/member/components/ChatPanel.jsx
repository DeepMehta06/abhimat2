import { useState, useEffect, useRef } from 'react';
import useChatStore from '../../store/useChatStore';
import useUserStore from '../../store/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPanel({ sessionId }) {
    const { messages, sendMessage, initChatRealtime, isLoading, clearChat } = useChatStore();
    const { user, role } = useUserStore();
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearing, setClearing] = useState(false);
    const bottomRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const { scrollHeight, clientHeight } = containerRef.current;
        containerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!sessionId) return;
        initChatRealtime(sessionId);
    }, [sessionId, initChatRealtime]);

    async function send(e) {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            await sendMessage(text.trim());
            setText('');
        } catch { } finally { setSending(false); }
    }

    async function handleClearChat() {
        setClearing(true);
        try {
            await clearChat();
            setShowClearConfirm(false);
        } catch { } finally { setClearing(false); }
    }

    const partyColor = (party = '') => {
        const p = party.toLowerCase();
        if (p.includes('bjp')) return 'bg-saffron/20 text-saffron';
        if (p.includes('inc') || p.includes('congress')) return 'bg-blue-100 text-blue-700';
        if (p.includes('aap')) return 'bg-india-green/20 text-india-green';
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="flex flex-col h-[420px] lg:h-[600px] bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden transition-shadow hover:shadow-md relative">
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <span className="material-symbols-outlined text-saffron">forum</span>
                <h3 className="font-bold text-neutral-dark text-sm">Session Chat</h3>
                <span className="ml-auto text-[10px] bg-india-green/10 text-india-green px-2 py-0.5 rounded font-bold uppercase border border-india-green/20">Live</span>
                {role === 'moderator' && (
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="ml-1 text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 uppercase transition-colors"
                        title="Clear all messages"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Clear Chat Confirmation Modal */}
            <AnimatePresence>
                {showClearConfirm && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-dark/30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl p-6 shadow-xl border border-gray-100 max-w-xs w-full mx-4 flex flex-col items-center gap-4"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <span className="material-symbols-outlined text-3xl text-rose-500">delete_sweep</span>
                            <p className="text-sm font-bold text-neutral-dark text-center">Clear all chat messages?</p>
                            <p className="text-xs text-gray-500 text-center">This will remove all messages for every participant in this session. This action cannot be undone.</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    disabled={clearing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearChat}
                                    disabled={clearing}
                                    className="flex-1 py-2 text-sm font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
                                >
                                    {clearing ? 'Clearing...' : 'Clear All'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar bg-slate-50/30"
            >
                {isLoading && messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <span className="material-symbols-outlined animate-spin text-saffron text-2xl">autorenew</span>
                    </div>
                )}

                {!isLoading && messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-gray-300">chat_bubble</span>
                        </div>
                        <p className="text-gray-400 text-sm font-medium">No messages yet.</p>
                        <p className="text-gray-300 text-xs mt-1">Start the conversation!</p>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map(msg => {
                        const isMe = msg.member?.id === user?.id;
                        return (
                            <motion.div
                                key={msg.id}
                                className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                layout
                            >
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${partyColor(msg.member?.party)}`}>
                                    {msg.member?.name?.charAt(0) || '?'}
                                </div>
                                <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-baseline gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-[10px] font-bold text-neutral-dark truncate">{msg.member?.name}</span>
                                        <span className={`text-[9px] px-1 rounded font-bold ${partyColor(msg.member?.party)}`}>{msg.member?.party}</span>
                                    </div>
                                    <div
                                        className={`text-sm px-4 py-2.5 break-words shadow-sm
                                            ${isMe
                                                ? 'bg-saffron text-white rounded-2xl rounded-tr-sm'
                                                : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[9px] text-gray-400 font-medium">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={bottomRef} className="h-0 w-0" />
            </div>

            {/* Input */}
            <form onSubmit={send} className="p-3 border-t border-gray-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)] relative z-10 flex gap-2">
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={500}
                    placeholder="Share your thoughts..."
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-saffron/20 focus:border-saffron transition-all"
                />
                <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="h-11 w-11 shrink-0 rounded-xl bg-saffron text-white flex items-center justify-center disabled:opacity-40 disabled:scale-100 hover:bg-[#e68a2d] hover:shadow-md active:scale-95 transition-all"
                >
                    {sending
                        ? <span className="material-symbols-outlined text-xl animate-spin">autorenew</span>
                        : <span className="material-symbols-outlined text-xl">send</span>
                    }
                </button>
            </form>
        </div>
    );
}
