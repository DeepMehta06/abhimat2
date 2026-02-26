import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const teams = [
    // GOVERNMENT
    { member_id: 'EXPRESS', party: 'eXpress', team_leader: 'Aryan Maurya', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'PARIVARTAN', party: 'ParivartanSena', team_leader: 'Arsh Khanolkar', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'RAD', party: 'Rashtriya Anusandhan Dal (RAD)', team_leader: 'Kedar Sawant', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'RGP', party: 'Rashtriya Ganjamukt Paksh', team_leader: 'Samudra Banerjee', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'BNS', party: 'Bhavans Navnirman Sena', team_leader: 'Jay Jagtap', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'BJP', party: 'Baddie Janta Party', team_leader: 'Aaditya Jadhav', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'SSP', party: 'Samata Shakti Party', team_leader: 'Samiksha Gondhalekar', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'SAHIL', party: 'Sahil Vishwasrao', team_leader: 'Sahil Vishwasrao', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'VOX', party: 'Vox Veritas', team_leader: 'Shreyas Kapale', alignment: 'government', role: 'member', profile_completed: false },
    { member_id: 'YKP', party: 'Yuva Kalyan Party', team_leader: 'Vardaman Vyas', alignment: 'government', role: 'member', profile_completed: false },

    // OPPOSITION
    { member_id: 'RPP', party: 'Rashtriya Pragati Paksha (RPP)', team_leader: 'Arush Ashutosh Hirlekar', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'JMB', party: 'Janta Mukti Bahini', team_leader: 'Deeip Dicondwar', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'MMP', party: 'Mango Man\'s Party', team_leader: 'Agastya Kalavar', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'BPP', party: 'Bharat Prabodhan Party', team_leader: 'Tanishka Mehta', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'SHIGHRA', party: 'शीघ्रमेव स्वर्णोदयः', team_leader: 'Aditya soni', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'RSS', party: 'RSS People\'s Party', team_leader: 'Shourya Sarkate', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'BVP', party: 'BHARAT VIKAS PARTY (BVP)', team_leader: 'Swanand Dixit', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'ARG', party: 'Aura Reform Group', team_leader: 'Shantanu Pawar', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'AKSHAY', party: 'Akshay Bhaban', team_leader: 'Akshay Bhaban', alignment: 'opposition', role: 'member', profile_completed: false },
    { member_id: 'SWARAJYA', party: 'Swarajya Teja', team_leader: 'Mrunal Nalawade', alignment: 'opposition', role: 'member', profile_completed: false },
];

async function insertTeams() {
    console.log('Inserting teams into Supabase...');

    const { data, error } = await supabase
        .from('members')
        .upsert(teams, { onConflict: 'member_id' });

    if (error) {
        console.error('Error inserting teams:', error);
    } else {
        console.log('Successfully inserted/updated', teams.length, 'teams.');
    }

    // Also initialize team points to 0 for the active session
    const { data: session } = await supabase.from('sessions').select('id').eq('is_active', true).single();
    if (session) {
        console.log('Found active session', session.id, 'Adding initial points objects');
        const pointEntries = teams.map(t => ({ session_id: session.id, party: t.party, points: 0 }));
        const { error: pointsError } = await supabase
            .from('team_points')
            .upsert(pointEntries, { onConflict: 'session_id, party' });
        if (pointsError) {
            console.error('Error adding team points init', pointsError);
        } else {
            console.log('Successfully set initial points to 0.');
        }
    }
}

insertTeams();
