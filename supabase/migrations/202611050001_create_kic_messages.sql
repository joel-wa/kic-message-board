-- Run once in the selected Supabase project's SQL Editor.
begin;
create table public.kic_messages (
  id bigint generated always as identity primary key,
  author text not null check (char_length(btrim(author)) between 1 and 80),
  text text not null check (char_length(btrim(text)) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.kic_messages enable row level security;
-- Visitors use the existing Node API. Direct anonymous database access is denied.
revoke all on table public.kic_messages from anon, authenticated;
grant select, insert on table public.kic_messages to service_role;
grant usage on sequence public.kic_messages_id_seq to service_role;
insert into public.kic_messages (author, text) values
  ('Aki', 'Hello from the KIC lecture!'),
  ('Ren', 'I am learning how the frontend talks to the backend.'),
  ('Mina', 'This message came from the server API.');
commit;
