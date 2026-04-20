-- =====================================================================
-- FLUXO OUTLET — Setup da tabela `products` no Supabase
-- =====================================================================
-- COMO USAR:
-- 1. Abra https://supabase.com/dashboard/project/tapgnlrjhrhewqlpahvg/sql/new
-- 2. Cole TODO este arquivo e clique em "Run"
-- 3. Pronto: o site vai começar a ler/gravar produtos no Supabase.
-- =====================================================================

-- 1. Tabela
create table if not exists public.products (
  id           bigint primary key,
  sku          text not null,
  name         text not null,
  price        numeric(10,2) not null default 0,
  category     text not null default 'GERAL',
  image        text,
  stock        int  not null default 0,
  sales        int  not null default 0,
  sizes        jsonb not null default '[]'::jsonb,
  featured     boolean not null default false,
  updated_at   timestamptz not null default now()
);

-- 2. RLS
alter table public.products enable row level security;

-- Leitura pública (vitrine do cliente)
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (true);

-- Escrita liberada para anon (Master Control roda no navegador com a anon key).
-- Se mais tarde você quiser proteger isso, troque "to anon" por uma policy
-- baseada em auth.uid() depois de implementar login no painel.
drop policy if exists "products_anon_write" on public.products;
create policy "products_anon_write"
  on public.products
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 3. Seed inicial (mesmos produtos default do app)
insert into public.products (id, sku, name, price, category, image, stock, sales, sizes, featured) values
  (1,'CAM-BRA-001','Camiseta Branca Basic',89.90,'VESTUÁRIO','https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',25,12,'[{"size":"P","stock":5},{"size":"M","stock":10},{"size":"G","stock":10}]'::jsonb,true),
  (2,'CAL-JOG-001','Calça Jogger Tech',169.90,'VESTUÁRIO','https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800',15,8,'[{"size":"38","stock":5},{"size":"40","stock":5},{"size":"42","stock":5}]'::jsonb,false),
  (3,'TEN-RUN-002','Tênis Running Fluxo',299.90,'CALÇADOS','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',2,45,'[{"size":"39","stock":1},{"size":"41","stock":1}]'::jsonb,true),
  (4,'BON-PRE-003','Boné Archer Black',79.90,'ACESSÓRIOS','https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',0,120,'[{"size":"U","stock":0}]'::jsonb,false),
  (5,'9059','Calça Super Skinny Malibu Rasgada',189.90,'VESTUÁRIO','https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',10,5,'[{"size":"38","stock":5},{"size":"40","stock":5}]'::jsonb,true)
on conflict (id) do nothing;
