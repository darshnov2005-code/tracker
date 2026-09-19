create extension if not exists pgcrypto;
create table if not exists public.transactions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 asset_type text not null check(asset_type in ('STOCK','MF')), symbol text not null, name text not null, isin text,
 exchange text check(exchange in ('NSE','BSE') or exchange is null), tx_type text not null check(tx_type in ('BUY','SELL')),
 quantity numeric not null check(quantity>0), price numeric not null check(price>=0), fees numeric not null default 0,
 trade_date date not null, notes text, created_at timestamptz default now()
);
create table if not exists public.goals(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, target numeric not null check(target>0), target_date date not null, starting_value numeric not null default 0, created_at timestamptz default now()
);
alter table public.transactions enable row level security; alter table public.goals enable row level security;
create policy "own transactions" on public.transactions for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own goals" on public.goals for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

