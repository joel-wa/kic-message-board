-- Dedicated Pop Pond state. The older kic_messages table is left untouched.
begin;
create table if not exists public.pop_pond_state (
 id text primary key,
 data jsonb not null check (jsonb_typeof(data->'posts') = 'array'),
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.pop_pond_state enable row level security;
revoke all on public.pop_pond_state from public, anon, authenticated;
grant select, insert, update on public.pop_pond_state to service_role;
commit;
