import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addDASHMODCredentials() {
    try {
        console.log("=== Adding DASHMOD Dashboard Credentials ===\n");

        // Check if DASHMOD already exists
        console.log("1. Checking if DASHMOD exists...");
        const { data: existingUser, error: checkError } = await supabase
            .from('members')
            .select('*')
            .eq('member_id', 'DASHMOD')
            .single();

        if (existingUser) {
            console.log("✅ DASHMOD already exists. Updating credentials...\n");
            
            // Update the existing entry
            const { data: updated, error: updateError } = await supabase
                .from('members')
                .update({
                    party: 'DASH',
                    name: 'Dashboard Moderator',
                    role: 'moderator',
                    constituency: 'Admin Panel',
                    alignment: null
                })
                .eq('member_id', 'DASHMOD')
                .select();

            if (updateError) {
                console.error("❌ Error updating DASHMOD:", updateError.message);
                return;
            }

            console.log("✅ DASHMOD credentials updated successfully!");
            console.log("\nCredentials:");
            console.log("├─ Username: DASHMOD");
            console.log("├─ Password: DASH");
            console.log("├─ Role: moderator");
            console.log("└─ Access: Dashboard Panel\n");
            
        } else if (checkError && checkError.code === 'PGRST116') {
            console.log("❌ DASHMOD not found. Creating new entry...\n");
            
            // Create new entry
            const { data: created, error: createError } = await supabase
                .from('members')
                .insert({
                    member_id: 'DASHMOD',
                    name: 'Dashboard Moderator',
                    party: 'DASH',
                    constituency: 'Admin Panel',
                    alignment: null,
                    role: 'moderator',
                    speeches_count: 0
                })
                .select();

            if (createError) {
                console.error("❌ Error creating DASHMOD:", createError.message);
                return;
            }

            console.log("✅ DASHMOD created successfully!");
            console.log("\nCredentials:");
            console.log("├─ Username: DASHMOD");
            console.log("├─ Password: DASH");
            console.log("├─ Role: moderator");
            console.log("└─ Access: Dashboard Panel\n");
        }

        // Verify the credentials work
        console.log("2. Verifying credentials...\n");
        const { data: verifyUser, error: verifyError } = await supabase
            .from('members')
            .select('*')
            .eq('member_id', 'DASHMOD')
            .single();

        if (verifyError) {
            console.error("❌ Verification failed:", verifyError.message);
            return;
        }

        if (verifyUser.party === 'DASH') {
            console.log("✅ Credentials verified!");
            console.log("\nUser Details:");
            console.log(",─────────────────────────────────");
            console.log(`│ Member ID: ${verifyUser.member_id}`);
            console.log(`│ Name: ${verifyUser.name}`);
            console.log(`│ Party (Password): ${verifyUser.party}`);
            console.log(`│ Role: ${verifyUser.role}`);
            console.log(`│ Constituency: ${verifyUser.constituency}`);
            console.log("└─────────────────────────────────\n");
            console.log("✅ Ready to login with DASHMOD / DASH\n");
        } else {
            console.error("❌ Verification failed: Party field mismatch");
        }

    } catch (err) {
        console.error("❌ Unexpected error:", err.message);
    }
}

addDASHMODCredentials();
