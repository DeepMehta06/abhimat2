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

async function testDASHMODConnection() {
    console.log("\n=== Testing DASHMOD Connection ===");
    
    try {
        // Test connection first
        console.log("1. Testing Supabase connection...");
        const { data: connectionTest, error: connectionError } = await supabase
            .from('sessions')
            .select('id')
            .limit(1);
        
        if (connectionError) {
            console.error("❌ Connection Error:", connectionError.message);
            return;
        }
        console.log("✅ Connection Successful");

        // Check for DASHMOD in members table
        console.log("\n2. Searching for DASHMOD in members table...");
        const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('*')
            .ilike('name', '%DASHMOD%');
        
        if (memberError) {
            console.error("❌ Error searching members:", memberError.message);
        } else {
            if (memberData && memberData.length > 0) {
                console.log("✅ Found DASHMOD in members:", memberData);
            } else {
                console.log("❌ DASHMOD NOT found in members table");
            }
        }

        // Check for DASHMOD in parties table (if exists)
        console.log("\n3. Searching for DASHMOD in parties table...");
        const { data: partyData, error: partyError } = await supabase
            .from('parties')
            .select('*')
            .ilike('name', '%DASHMOD%');
        
        if (partyError) {
            console.error("⚠️ Parties table may not exist or error:", partyError.message);
        } else {
            if (partyData && partyData.length > 0) {
                console.log("✅ Found DASHMOD in parties:", partyData);
            } else {
                console.log("❌ DASHMOD NOT found in parties table");
            }
        }

        // Check for DASHMOD in sessions table
        console.log("\n4. Searching for DASHMOD in sessions table...");
        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .ilike('title', '%DASHMOD%');
        
        if (sessionError) {
            console.error("❌ Error searching sessions:", sessionError.message);
        } else {
            if (sessionData && sessionData.length > 0) {
                console.log("✅ Found DASHMOD in sessions:", sessionData);
            } else {
                console.log("❌ DASHMOD NOT found in sessions table");
            }
        }

        console.log("\n=== Test Complete ===\n");
    } catch (err) {
        console.error("❌ Unexpected error:", err.message);
    }
}

async function main() {
    await testDASHMODConnection();
    await testSessionActive();
    await testQueue();
}

main();
