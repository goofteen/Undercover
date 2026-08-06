-- Undercover Game Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Rooms table
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  room_code text not null unique,
  host_player_id uuid,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  undercover_count int not null default 1,
  mrwhite_count int not null default 0,
  turn_time_sec int not null default 60,
  word_pair jsonb,
  created_at timestamptz default now()
);

-- Players table
create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  room_code text not null references rooms(room_code) on delete cascade,
  name text not null,
  role text check (role in ('civilian', 'undercover', 'mrwhite')),
  is_eliminated boolean not null default false,
  is_host boolean not null default false,
  join_order int not null default 0,
  created_at timestamptz default now()
);

-- Game state table
create table if not exists game_state (
  room_code text primary key references rooms(room_code) on delete cascade,
  phase text not null default 'lobby' check (
    phase in ('lobby', 'reveal', 'description', 'voting', 'elimination', 'mrwhite_guess', 'gameover')
  ),
  current_player_index int not null default 0,
  round int not null default 1,
  votes jsonb not null default '{}',
  descriptions jsonb not null default '{}',
  winner text check (winner in ('civilian', 'impostor', 'mrwhite')),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table rooms enable row level security;
alter table players enable row level security;
alter table game_state enable row level security;

-- Allow all operations for anonymous users (game doesn't require auth)
create policy "Allow all for rooms" on rooms for all using (true) with check (true);
create policy "Allow all for players" on players for all using (true) with check (true);
create policy "Allow all for game_state" on game_state for all using (true) with check (true);

-- Enable Realtime for all tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table game_state;

-- Auto-delete old finished rooms (optional cleanup)
-- You can set up a pg_cron job or just let them accumulate
