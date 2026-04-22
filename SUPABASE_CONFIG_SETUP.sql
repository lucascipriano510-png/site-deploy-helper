-- =====================================================================
-- FLUXO OUTLET — Passo 3: site_config + bucket de storage da logo
-- =====================================================================
-- COMO USAR:
-- 1. Abra https://supabase.com/dashboard/project/tapgnlrjhrhewqlpahvg/sql/new
-- 2. Cole TODO este arquivo e clique em "Run"
-- 3. Vá em Authentication → Users → "Add user" e cadastre:
--        Email: lucascipriano510@gmail.com
--        Password: METODOFLUXO
--        Auto Confirm User: ✅ marcado
-- =====================================================================

-- 1. Tabela de configuração global do site (uma linha só, id='main')
create table if not exists public.site_config (
  id               text primary key default 'main',
  brand_name       text not null default 'FLUXO OUTLET EXCLUSIVE',
  whatsapp         text not null default '5534984148067',
  location         text not null default 'UBERABA, MG',
  min_order        numeric not null default 0,
  pixel_id         text not null default '',
  logo_url         text not null default '',
  logo_zoom        numeric not null default 1.5,
  marquee_phrases  jsonb  not null default '["ALTO PADRÃO EM CADA DETALHE","ENVIO PRIORITÁRIO","COLEÇÕES LIMITADAS","DESIGN AUTÊNTICO E EXCLUSIVO"]'::jsonb,
  updated_at       timestamptz not null default now()
);

-- Garante que existe a linha 'main'
insert into public.site_config (id) values ('main')
on conflict (id) do nothing;

-- 2. RLS: leitura pública, escrita só para usuário autenticado (admin logado)
alter table public.site_config enable row level security;

drop policy if exists "site_config_public_read" on public.site_config;
create policy "site_config_public_read"
  on public.site_config for select
  to anon, authenticated
  using (true);

drop policy if exists "site_config_admin_write" on public.site_config;
create policy "site_config_admin_write"
  on public.site_config for all
  to authenticated
  using (true) with check (true);

-- 3. Trigger de updated_at
create or replace function public.site_config_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists site_config_updated_at on public.site_config;
create trigger site_config_updated_at
before update on public.site_config
for each row execute function public.site_config_set_updated_at();

-- 4. Blindar escrita de products/orders: só admin autenticado
--    (antes estava liberado pra anon — agora fica mais seguro)
drop policy if exists "products_anon_write" on public.products;
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
  on public.products for all
  to authenticated
  using (true) with check (true);

-- orders: anon pode CRIAR pedido (cliente final), só admin altera/deleta
drop policy if exists "orders_admin_read" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_admin_delete" on public.orders;

create policy "orders_admin_read"
  on public.orders for select
  to anon, authenticated
  using (true);

create policy "orders_admin_update"
  on public.orders for update
  to authenticated
  using (true) with check (true);

create policy "orders_admin_delete"
  on public.orders for delete
  to authenticated
  using (true);

-- =====================================================================
-- FIM. Depois de rodar, crie o usuário admin em Authentication → Users.
-- =====================================================================
