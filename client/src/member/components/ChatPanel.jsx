import { useState, useEffect, useRef } from 'react';
import { getChat, postMessage } from '../../shared/services/api';
import { supabase } from '../../shared/services/supabase';

export default function ChatPanel({ sessionId }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    async function loadMessages() {
        try {
            const { data } = await getChat();
            setMessages(data.messages || []);
        } catch { }
    }

    useEffect(() => {
        if (!sessionId) return;
        loadMessages();

        const channel = supabase
            .channel('chat-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
                () => loadMessages())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [sessionId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function send(e) {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            await postMessage(text.trim());
            setText('');
        } catch { } finally { setSending(false); }
    }

    const partyColor = (party = '') => {
        const p = party.toLowerCase();
        if (p.includes('bjp')) return 'bg-saffron/20 text-saffron';
        if (p.includes('inc') || p.includes('congress')) return 'bg-blue-100 text-blue-700';
        if (p.includes('aap')) return 'bg-india-green/20 text-india-green';
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="flex flex-col h-[420px] lg:h-[600px] bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <span className="material-symbols-outlined text-saffron">forum</span>
                <h3 className="font-bold text-neutral-dark text-sm">Session Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 no-scrollbar">
                {messages.length === 0 && (
                    <p className="text-center text-gray-300 text-sm italic mt-8">No messages yet. Say something!</p>
                )}
                {messages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${partyColor(msg.member?.party)}`}>
                            {msg.member?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[10px] font-bold text-neutral-dark truncate">{msg.member?.name}</span>
                                <span className={`text-[9px] px-1 rounded font-bold ${partyColor(msg.member?.party)}`}>{msg.member?.party}</span>
                            </div>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 break-words">{msg.content}</p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="p-3 border-t border-gray-100 flex gap-2">
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={500}
                    placeholder="Share your thoughts..."
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-saffron"
                />
                <button type="submit" disabled={!text.trim() || sending}
                    className="h-10 w-10 rounded-lg bg-saffron text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </form>
        </div>
    );
}
