-- ============================================================
-- DJ Arts & Crafts Dashboard — Supabase Schema & Permissions
-- Run this in the Supabase SQL Editor: https://app.supabase.com
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. Create or update tables ──────────────────────────────

-- customers
create table if not exists public.customers (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid,
  name       text not null,
  phone      text,
  email      text,
  notes      text,
  source     text default 'Manual',
  created_at timestamptz default now()
);

-- products
create table if not exists public.products (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid,
  name       text not null,
  price      numeric(12,2) not null default 0,
  category   text,
  created_at timestamptz default now()
);

-- orders
create table if not exists public.orders (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid,
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

-- order_items
create table if not exists public.order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  qty          int not null default 1,
  unit_price   numeric(12,2) not null default 0,
  created_at   timestamptz default now()
);

-- payments
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

-- team
create table if not exists public.team (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  role            text not null default 'Staff',
  email           text,
  phone           text,
  status          text default 'Active',
  assigned_orders int default 0,
  created_at      timestamptz default now()
);

-- ── 2. Allow direct access (No email login required) ────────

-- Drop old foreign key constraints on auth.users if they exist
alter table public.orders alter column user_id drop not null;
alter table public.customers alter column user_id drop not null;
alter table public.products alter column user_id drop not null;

alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.customers drop constraint if exists customers_user_id_fkey;
alter table public.products drop constraint if exists products_user_id_fkey;

-- Disable Row Level Security so anon client can store & retrieve orders
alter table public.orders disable row level security;
alter table public.customers disable row level security;
alter table public.products disable row level security;
alter table public.order_items disable row level security;
alter table public.payments disable row level security;
alter table public.team disable row level security;

-- Grant permissions to public (anon & authenticated roles)
grant all on public.orders to anon, authenticated;
grant all on public.customers to anon, authenticated;
grant all on public.products to anon, authenticated;
grant all on public.order_items to anon, authenticated;
grant all on public.payments to anon, authenticated;
grant all on public.team to anon, authenticated;
