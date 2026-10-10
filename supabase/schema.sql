-- ============================================================
-- HandForBrand Dashboard — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text default 'Owner',
  plan        text default 'Free plan',
  business_name text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── customers ────────────────────────────────────────────────
create table if not exists public.customers (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  phone      text,
  email      text,
  notes      text,
  source     text default 'Manual',
  created_at timestamptz default now()
);

-- ── products ─────────────────────────────────────────────────
create table if not exists public.products (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  price      numeric(12,2) not null default 0,
  category   text,
  created_at timestamptz default now()
);

-- ── orders ───────────────────────────────────────────────────
create table if not exists public.orders (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  order_no    text not null,
  customer_id uuid references public.customers(id) on delete set null,
  progress    text not null default 'Order Placed',
  assigned_to text,
  due_date    date,
  priority    text default 'No priority',
  status      text default 'Open',
  notes       text,
  created_at  timestamptz default now()
);

-- ── order_items ───────────────────────────────────────────────
create table if not exists public.order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  qty          int not null default 1,
  unit_price   numeric(12,2) not null default 0,
  created_at   timestamptz default now()
);

-- ── payments ─────────────────────────────────────────────────
create table if not exists public.payments (
  id                 uuid primary key default uuid_generate_v4(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  base_price         numeric(12,2) default 0,
  advance_due        numeric(12,2) default 0,
  balance_due        numeric(12,2) default 0,
  advance_collected  numeric(12,2) default 0,
  is_full_paid       boolean default false,
  created_at         timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.customers   enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.payments    enable row level security;

-- profiles: users can only read/write their own profile
create policy "profiles: own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- customers: scoped to user_id
create policy "customers: own" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- products: scoped to user_id
create policy "products: own" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- orders: scoped to user_id
create policy "orders: own" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- order_items: accessible if the parent order belongs to the user
create policy "order_items: own via orders" on public.order_items
  for all using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

-- payments: accessible if the parent order belongs to the user
create policy "payments: own via orders" on public.payments
  for all using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and o.user_id = auth.uid()
    )
  );
