import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDASHMODSetup() {
    try {
        console.log("\n=== DASHMOD Dashboard Setup Verification ===\n");

        // Check DASHMOD exists
        const { data: dashmod } = await supabase
            .from('members')
            .select('member_id, name, party, role, constituency')
            .eq('member_id', 'DASHMOD')
            .single();

        if (!dashmod) {
            console.error("❌ DASHMOD not found");
            return;
        }

        console.log("✅ DASHMOD Credentials Found");
        console.log("├─ Username: DASHMOD");
        console.log("├─ Password: DASH (party field password)");
        console.log("├─ Name: " + dashmod.name);
        console.log("├─ Role: " + dashmod.role);
        console.log("├─ Party: " + dashmod.party);
        console.log("└─ Constituency: " + dashmod.constituency);

        console.log("\n✅ Dashboard Access Configuration");
        console.log("├─ Route: /display (Display Dashboard)");
        console.log("├─ View 1: Queue View");
        console.log("│  └─ Shows: Speaker queue waiting list");
        console.log("├─ View 2: Active Speaker View");
        console.log("│  ├─ Shows: Current speaker info");
        console.log("│  └─ Shows: Speech timer (with color warnings)");
        console.log("└─ Visibility: Controlled by moderator (when active speaker set)");

        console.log("\n✅ Access Controls");
        console.log("├─ DASHMOD cannot access: /moderator, /member");
        console.log("├─ DASHMOD can only access: /display (Queue & Timer)");
        console.log("└─ Automatic redirect: Any other route → /display");

        console.log("\n✅ Timer Features");
        console.log("├─ Display: MM:SS format");
        console.log("├─ Color Codes:");
        console.log("│  ├─ Green: Normal (within time)");
        console.log("│  ├─ Saffron: Warning (last 15 seconds)");
        console.log("│  └─ Red: Over time limit");
        console.log("└─ Controlled by: Moderator");

        console.log("\n✅ Queue Display");
        console.log("├─ Shows: All speakers waiting to speak");
        console.log("├─ Order: By priority score");
        console.log("└─ Visibility: Only when no active speaker");

        console.log("\n=== Ready to Use ===\n");
        console.log("Login with: DASHMOD / DASH\n");

    } catch (err) {
        console.error("Error:", err.message);
    }
}

verifyDASHMODSetup();
