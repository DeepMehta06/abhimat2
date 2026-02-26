import { supabase } from './src/supabase.js';

async function syncPartyNames() {
    const { data: parties, error } = await supabase.from('party_details').select('*');
    if (error) {
        console.error("Error fetching parties:", error);
        return;
    }

    for (const party of parties) {
        const newName = party.members_data.map(m => m.name).join(' & ');
        console.log(`Updating ${party.party} to ${newName}`);
        await supabase
            .from('members')
            .update({ name: newName })
            .eq('party', party.party);
    }
    console.log("Done syncing.");
    process.exit(0);
}

syncPartyNames();
