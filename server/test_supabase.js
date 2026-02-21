import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSessionActive() {
    console.log("Testing /session/active query...");
    const { data, error } = await supabase
        .from('sessions')
        .select(`
      id, title, is_active, stage, created_at,
      current_speaker:members!sessions_current_speaker_id_fkey(id, name, party, constituency)
    `)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error("Error from /session/active query:", error.code, error.message, error.details, error.hint);
    } else {
        console.log("Data from /session/active query:", data);
    }
}

async function testQueue() {
    console.log("\nTesting /queue query...");
    const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single();

    if (!session) {
        console.log("No active session for queue");
        return;
    }

    const { data, error } = await supabase
        .from('speaker_queue')
        .select(`
      id, status, priority_score, raised_at, speaking_started_at,
      member:members(id, name, party, constituency, speeches_count)
    `)
        .eq('session_id', session.id)
        .in('status', ['waiting', 'speaking'])
        .order('priority_score', { ascending: true })
        .order('raised_at', { ascending: true });

    if (error) {
        console.error("Error from /queue query:", error.code, error.message, error.details, error.hint);
    } else {
        console.log("Data from /queue query:", data);
    }
}

async function main() {
    await testSessionActive();
    await testQueue();
}

main();
