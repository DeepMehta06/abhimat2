-- ============================================================
--  ABHIMAT '26 – FULL RESET + CLEAN SCHEMA
--  Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- ─── STEP 1: Drop everything cleanly ───────────────────────
drop table if exists team_points    cascade;
drop table if exists poll_votes     cascade;
drop table if exists polls          cascade;
drop table if exists chat_messages  cascade;
drop table if exists speaker_queue  cascade;
drop table if exists sessions       cascade;
drop table if exists members        cascade;

-- Note: DROP TABLE CASCADE above automatically removes tables from supabase_realtime publication

-- ─── STEP 2: Enable UUID extension ────────────────────────
create extension if not exists "pgcrypto";

-- ─── STEP 3: Create tables ─────────────────────────────────

-- MEMBERS
create table members (
  id              uuid primary key default gen_random_uuid(),
  member_id       text unique not null,
  name            text not null,
  party           text not null,
  constituency    text default '',
  role            text not null default 'member'
                  check (role in ('member', 'moderator')),
  speeches_count  int not null default 0,
  created_at      timestamptz default now()
);

-- SESSIONS (only 1 can be active at a time)
create table sessions (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  is_active           boolean not null default false,
  current_speaker_id  uuid references members(id) on delete set null,
  created_at          timestamptz default now()
);
create unique index sessions_one_active on sessions (is_active) where is_active = true;

-- SPEAKER QUEUE
create table speaker_queue (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references sessions(id) on delete cascade,
  member_id            uuid not null references members(id) on delete cascade,
  status               text not null default 'waiting'
                       check (status in ('waiting', 'speaking', 'done', 'skipped')),
  priority_score       float not null default 0,
  raised_at            timestamptz default now(),
  speaking_started_at  timestamptz
);
create index sq_session_status on speaker_queue (session_id, status);

-- CHAT MESSAGES
create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz default now()
);
create index chat_session_ts on chat_messages (session_id, created_at desc);

-- POLLS
create table polls (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  question    text not null,
  options     jsonb not null default '[]',
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

-- POLL VOTES (1 vote per member per poll enforced by unique constraint)
create table poll_votes (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references polls(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  option_id   int not null,
  unique (poll_id, member_id)
);

-- TEAM POINTS
create table team_points (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  party       text not null,
  points      int not null default 0,
  unique (session_id, party)
);

-- ─── STEP 4: Row Level Security ────────────────────────────
-- RLS enabled but open for anon reads so Realtime works on client
-- All writes go through server (Express + service_role key)

alter table members        enable row level security;
alter table sessions       enable row level security;
alter table speaker_queue  enable row level security;
alter table chat_messages  enable row level security;
alter table polls          enable row level security;
alter table poll_votes     enable row level security;
alter table team_points    enable row level security;

-- Public read policies (anon + authenticated)
create policy "read_members"      on members        for select using (true);
create policy "read_sessions"     on sessions       for select using (true);
create policy "read_queue"        on speaker_queue  for select using (true);
create policy "read_chat"         on chat_messages  for select using (true);
create policy "read_polls"        on polls          for select using (true);
create policy "read_poll_votes"   on poll_votes     for select using (true);
create policy "read_team_points"  on team_points    for select using (true);

-- DEV: Full write access for anon (replace with service_role in production)
create policy "write_members"      on members        for all using (true) with check (true);
create policy "write_sessions"     on sessions       for all using (true) with check (true);
create policy "write_queue"        on speaker_queue  for all using (true) with check (true);
create policy "write_chat"         on chat_messages  for all using (true) with check (true);
create policy "write_polls"        on polls          for all using (true) with check (true);
create policy "write_poll_votes"   on poll_votes     for all using (true) with check (true);
create policy "write_team_points"  on team_points    for all using (true) with check (true);


-- ─── STEP 5: Enable Realtime ───────────────────────────────
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table speaker_queue;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_votes;
alter publication supabase_realtime add table team_points;

-- ─── STEP 6: Seed Data ─────────────────────────────────────

-- Moderator (password = "MOD", member_id = "MOD00001")
insert into members (member_id, name, party, constituency, role) values
  ('MOD00001', 'Chief Moderator', 'MOD', 'Central Hall', 'moderator');

-- Sample members from different parties
-- Password for each = their Party name (e.g. BJP, INC, AAP, TMC)
insert into members (member_id, name, party, constituency, role) values
  ('BJP10001', 'Rajesh Kumar Sharma',  'BJP', 'Varanasi',       'member'),
  ('BJP10002', 'Priya Sharma',         'BJP', 'Gandhinagar',    'member'),
  ('BJP10003', 'Vikram Malhotra',      'BJP', 'Lucknow',        'member'),
  ('INC20001', 'Arjun Singh',          'INC', 'Amethi',         'member'),
  ('INC20002', 'Priya Mehta',          'INC', 'Raebareli',      'member'),
  ('INC20003', 'Fatima Khan',          'INC', 'Saharanpur',     'member'),
  ('AAP30001', 'Rahul Verma',          'AAP', 'New Delhi East', 'member'),
  ('AAP30002', 'Sunita Yadav',         'AAP', 'Chandni Chowk', 'member'),
  ('TMC40001', 'Saurav Bose',          'TMC', 'Kolkata North',  'member'),
  ('TMC40002', 'Ananya Chatterjee',    'TMC', 'Howrah',         'member');

-- Active session
insert into sessions (title, is_active) values
  ('Budget Debate 2026 – Lok Sabha', true);

-- Leaderboard starting points (all zero)
insert into team_points (session_id, party, points)
select s.id, p.party, 0
from sessions s,
     (values ('BJP'), ('INC'), ('AAP'), ('TMC')) as p(party)
where s.is_active = true;
