import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

// Generic hook to subscribe to a Supabase Realtime table and keep local state in sync
export function useRealtime(table, filter, fetcher) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef(null);

    async function refresh() {
        try {
            const result = await fetcher();
            setData(result);
        } catch (e) {
            console.error(`useRealtime ${table}:`, e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();

        const channel = supabase
            .channel(`realtime:${table}:${JSON.stringify(filter)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => refresh())
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    }, [table, JSON.stringify(filter)]);

    return { data, loading, refresh };
}
