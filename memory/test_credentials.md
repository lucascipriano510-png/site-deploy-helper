# Credenciais de Teste — FLUXO OUTLET

## Painel Admin (Master Control)
- **Usuário:** `Fluxo034`
- **Senha:** `METODOFLUXO`
- **Acesso:** toque duplo (double-tap) no rodapé ou área secreta do site — abre modal de login.

## Supabase
- **URL:** https://tapgnlrjhrhewqlpahvg.supabase.co
- **Anon/Publishable key:** `sb_publishable_XaGrDdX2df8qolf2WocwuQ_FsVP1-kW`
- Schema da tabela `orders` (real, confirmado via API):
  - `id` (int, auto), `order_number` (text, NOT NULL), `name` (text, NOT NULL),
    `phone` (text), `items` (jsonb), `value` (numeric), `status` (text, default 'NOVO'),
    `created_at` (timestamptz)

## WhatsApp do lojista (padrão)
- `5534984148067` (configurável em Setup Global do admin)
