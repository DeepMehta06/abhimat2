import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDASHMOD() {
    try {
        console.log("Checking current DASHMOD record...\n");

        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('member_id', 'DASHMOD');

        if (error) {
            console.error("Error:", error.message);
            return;
        }

        console.log("Current DASHMOD record:");
        console.log(JSON.stringify(data, null, 2));
        
        if (data && data.length > 0) {
            console.log(`\nCurrent role: "${data[0].role}"`);
            console.log("Valid roles: 'member', 'moderator', 'judge', 'display'");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkDASHMOD();
