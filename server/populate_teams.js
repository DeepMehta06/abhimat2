/**
 * Script to populate team/party members for ABHIMAT '26
 * Run with: node server/populate_teams.js
 */

import { supabase } from './src/supabase.js';

const teams = [
  // Government Teams
  {
    party: 'eXpress',
    teamLeader: 'Aryan Maurya',
    memberIdPrefix: 'EXPRESS',
    alignment: 'government'
  },
  {
    party: 'ParivartanSena',
    teamLeader: 'Arsh Khanolkar',
    memberIdPrefix: 'PARIVARTAN',
    alignment: 'government'
  },
  {
    party: 'Rashtriya Anusandhan Dal (RAD)',
    teamLeader: 'Kedar Sawant',
    memberIdPrefix: 'RAD',
    alignment: 'government'
  },
  {
    party: 'Rashtriya Ganjamukt Paksh',
    teamLeader: 'Samudra Banerjee',
    memberIdPrefix: 'RGP',
    alignment: 'government'
  },
  {
    party: 'Bhavans Navnirman Sena',
    teamLeader: 'Jay Jagtap',
    memberIdPrefix: 'BNS',
    alignment: 'government'
  },
  {
    party: 'Baddie Janta Party',
    teamLeader: 'Aaditya Jadhav',
    memberIdPrefix: 'BJP',
    alignment: 'government'
  },
  {
    party: 'Samata Shakti Party',
    teamLeader: 'Samiksha Gondhalekar',
    memberIdPrefix: 'SSP',
    alignment: 'government'
  },
  {
    party: 'Sahil Vishwasrao',
    teamLeader: 'Sahil Vishwasrao',
    memberIdPrefix: 'SAHIL',
    alignment: 'government'
  },
  {
    party: 'Vox Veritas',
    teamLeader: 'Shreyas Kapale',
    memberIdPrefix: 'VOX',
    alignment: 'government'
  },
  {
    party: 'Yuva Kalyan Party',
    teamLeader: 'Vardaman Vyas',
    memberIdPrefix: 'YKP',
    alignment: 'government'
  },
  // Opposition Teams
  {
    party: 'Rashtriya Pragati Paksha (RPP)',
    teamLeader: 'Arush Ashutosh Hirlekar',
    memberIdPrefix: 'RPP',
    alignment: 'opposition'
  },
  {
    party: 'Janta Mukti Bahini',
    teamLeader: 'Deeip Dicondwar',
    memberIdPrefix: 'JMB',
    alignment: 'opposition'
  },
  {
    party: 'Mango Man\'s Party',
    teamLeader: 'Agastya Kalavar',
    memberIdPrefix: 'MMP',
    alignment: 'opposition'
  },
  {
    party: 'Bharat Prabodhan Party',
    teamLeader: 'Tanishka Mehta',
    memberIdPrefix: 'BPP',
    alignment: 'opposition'
  },
  {
    party: 'शीघ्रमेव स्वर्णोदयः',
    teamLeader: 'Aditya soni',
    memberIdPrefix: 'SHIGHRA',
    alignment: 'opposition'
  },
  {
    party: 'RSS People\'s Party',
    teamLeader: 'Shourya Sarkate',
    memberIdPrefix: 'RSS',
    alignment: 'opposition'
  },
  {
    party: 'BHARAT VIKAS PARTY (BVP)',
    teamLeader: 'Swanand Dixit',
    memberIdPrefix: 'BVP',
    alignment: 'opposition'
  },
  {
    party: 'Aura Reform Group',
    teamLeader: 'Shantanu Pawar',
    memberIdPrefix: 'ARG',
    alignment: 'opposition'
  },
  {
    party: 'Akshay Bhaban',
    teamLeader: 'Akshay Bhaban',
    memberIdPrefix: 'AKSHAY',
    alignment: 'opposition'
  },
  {
    party: 'Swarajya Teja',
    teamLeader: 'Mrunal Nalawade',
    memberIdPrefix: 'SWARAJYA',
    alignment: 'opposition'
  }
];

function generateRandomDigits() {
  return Math.floor(100 + Math.random() * 900).toString(); // 3 digits: 100-999
}

async function populateTeams() {
  console.log('🚀 Starting team population...\n');

  const membersToInsert = [];

  for (const team of teams) {
    // Generate unique member_id
    const randomDigits = generateRandomDigits();
    const memberId = `${team.memberIdPrefix}_${randomDigits}`;

    membersToInsert.push({
      member_id: memberId,
      name: null, // Will be filled by user during profile completion
      party: team.party,
      team_leader: team.teamLeader,
      constituency: '',
      alignment: team.alignment,
      role: 'member',
      profile_completed: false,
      speeches_count: 0
    });

    console.log(`✅ Generated: ${memberId.padEnd(20)} | Party: ${team.party.padEnd(35)} | Leader: ${team.teamLeader}`);
  }

  console.log(`\n📊 Total members to insert: ${membersToInsert.length}\n`);
  console.log('💾 Inserting into database...\n');

  // Insert all members
  const { data, error } = await supabase
    .from('members')
    .insert(membersToInsert)
    .select();

  if (error) {
    console.error('❌ Error inserting members:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data.length} team members!\n`);
  
  // Display credentials summary
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    📋 LOGIN CREDENTIALS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  console.log('🟢 GOVERNMENT TEAMS:');
  console.log('─────────────────────────────────────────────────────────────────');
  
  for (const member of data.filter(m => m.alignment === 'government')) {
    console.log(`Username: ${member.member_id.padEnd(20)} | Password: ${member.party}`);
    console.log(`Leader:   ${member.team_leader.padEnd(20)}`);
    console.log('');
  }
  
  console.log('\n🟠 OPPOSITION TEAMS:');
  console.log('─────────────────────────────────────────────────────────────────');
  
  for (const member of data.filter(m => m.alignment === 'opposition')) {
    console.log(`Username: ${member.member_id.padEnd(20)} | Password: ${member.party}`);
    console.log(`Leader:   ${member.team_leader.padEnd(20)}`);
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('\n✨ All done! Users can now login and complete their profiles.');
  console.log('📝 Remember: Password for each team is their party name!\n');
}

populateTeams().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
