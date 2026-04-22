-- =====================================================================
-- FLUXO OUTLET — Setup da tabela `orders` no Supabase
-- =====================================================================
-- COMO USAR:
-- 1. Abra https://supabase.com/dashboard/project/tapgnlrjhrhewqlpahvg/sql/new
-- 2. Cole TODO este arquivo e clique em "Run"
-- 3. Pronto: o site começa a salvar pedidos no Supabase em tempo real.
-- =====================================================================

-- 1. Tabela de pedidos
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  customer     jsonb not null default '{}'::jsonb,   -- { name, phone, address, ... }
  items        jsonb not null default '[]'::jsonb,   -- [{ id, name, price, qty, size, image }]
  total        numeric(10,2) not null default 0,
  status       text not null default 'pending',      -- pending | confirmed | cancelled
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Índice para listar mais recentes primeiro
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- 2. RLS
alter table public.orders enable row level security;

-- Cliente final (anon) pode CRIAR pedido, mas não ler os outros.
drop policy if exists "orders_anon_insert" on public.orders;
create policy "orders_anon_insert"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

-- Leitura/atualização: liberado para anon enquanto o painel rodar com a anon key.
-- Quando você implementar login no Master Control, troque por uma policy
-- baseada em auth.uid() / role.
drop policy if exists "orders_admin_read" on public.orders;
create policy "orders_admin_read"
  on public.orders
  for select
  to anon, authenticated
  using (true);

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
  on public.orders
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
  on public.orders
  for delete
  to anon, authenticated
  using (true);

-- 3. Trigger para manter updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();
