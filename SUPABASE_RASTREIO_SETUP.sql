-- =====================================================================
-- FLUXO OUTLET — Tabela de Rastreio CAPI (backup do envio para Meta)
-- Cole este script INTEIRO no SQL Editor do Supabase e clique em RUN.
-- Roda de forma idempotente (pode executar de novo sem quebrar nada).
-- =====================================================================

-- 1) Tabela principal -------------------------------------------------
create table if not exists public.rastreio_conversoes (
  id           uuid primary key default gen_random_uuid(),
  phone        text        not null,
  phone_hash   text        not null,
  value        numeric(12,2) not null default 0,
  event_name   text        not null default 'Purchase',
  status       text        not null default 'pendente'
                check (status in ('pendente','enviado','erro')),
  fb_trace_id  text,
  error_log    text,
  source       text        default 'webhook',  -- 'webhook' | 'admin' | 'whatsapp'
  raw_payload  jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_rastreio_status     on public.rastreio_conversoes(status);
create index if not exists idx_rastreio_created_at on public.rastreio_conversoes(created_at desc);
create index if not exists idx_rastreio_phone_hash on public.rastreio_conversoes(phone_hash);

-- 2) Trigger para manter updated_at em dia ----------------------------
create or replace function public.set_rastreio_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_rastreio_updated_at on public.rastreio_conversoes;
create trigger trg_rastreio_updated_at
  before update on public.rastreio_conversoes
  for each row execute function public.set_rastreio_updated_at();

-- 3) RLS --------------------------------------------------------------
alter table public.rastreio_conversoes enable row level security;

-- Leitura: qualquer usuário autenticado (o painel admin já é gated por login).
-- Se você tiver tabela de roles, troque por: using ( public.has_role(auth.uid(),'admin') )
drop policy if exists "rastreio_select_authenticated" on public.rastreio_conversoes;
create policy "rastreio_select_authenticated"
  on public.rastreio_conversoes
  for select
  to authenticated
  using ( true );

-- Escrita: BLOQUEADA para clientes. Só a Edge Function (service_role) escreve.
-- Não criamos policies de insert/update/delete de propósito.

-- 4) Permissões explícitas -------------------------------------------
grant select on public.rastreio_conversoes to authenticated;
grant all    on public.rastreio_conversoes to service_role;

-- =====================================================================
-- PRONTO. A tabela existe, está protegida por RLS, e somente a
-- Edge Function (com service_role) consegue inserir/atualizar.
-- =====================================================================
