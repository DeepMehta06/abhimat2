import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateDASHMODRole() {
    try {
        console.log("Updating DASHMOD role to 'display' (Queue & Timer View)...\n");

        // First delete the old one if incorrect
        const { data: updated, error } = await supabase
            .from('members')
            .update({ role: 'display' })
            .match({ member_id: 'DASHMOD' })
            .select();

        if (error) {
            console.error("❌ Error:", error);
            return;
        }

        console.log("✅ DASHMOD role updated to 'display'");
        console.log("Updated record:", updated);
        console.log("\n✅ DASHMOD will now access the Queue & Timer Dashboard");
        
        // Verify
        const { data: verify } = await supabase
            .from('members')
            .select('member_id, role')
            .eq('member_id', 'DASHMOD')
            .single();
        
        console.log("\nVerification - Current role:", verify.role);
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

updateDASHMODRole();
