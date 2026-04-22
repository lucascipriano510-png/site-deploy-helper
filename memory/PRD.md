# PRD — FLUXO OUTLET (Site Catálogo + Painel Admin)

## Problema original (22/04/2026)
O usuário tinha várias falhas acumuladas no seu site catálogo:
1. Botão "Finalizar Pedido → Enviar WhatsApp" não funcionava
2. Pedidos não apareciam em `cem/clientes` (painel CRM)
3. Pedidos não eram salvos no Supabase (não chegavam no celular do dono)
4. Produtos adicionados pelo admin não apareciam para outros clientes
5. Faltam funcionalidades comuns de e-commerce (quer sugestões)

## Arquitetura
- **Frontend:** React 19 + Vite 7 + Tailwind v4 (SPA única)
- **Backend:** Supabase (PostgreSQL + PostgREST + RLS)
- **Tabelas:**
  - `products` — `id, sku, name, price, category, image, stock, sales, sizes (jsonb), featured, updated_at`
  - `orders` — `id, order_number, name, phone, items (jsonb), value, status, created_at`
- **Credenciais admin:** user `Fluxo034` / senha `METODOFLUXO` (gesto duplo-toque no footer abre login)

## Correções aplicadas (22/04/2026)
### Bug 1,2,3 — Checkout / Supabase / WhatsApp
- `handleFinalize` estava enviando payload com schema errado (`customer`, `total`) → Supabase rejeitava silenciosamente
- **Correção:** payload agora usa o schema real `{order_number, name, phone, items, value, status}`
- Agora o pedido é registrado no Supabase → polling de 5s sincroniza no painel CRM
- WhatsApp agora usa `config.whatsapp` (não mais hardcoded)
- Tela "PEDIDO PRONTO! #XXXXX" aparece após sucesso, com botão "Enviar WhatsApp" em nova aba
- Validações básicas (nome, telefone 10+ dígitos, carrinho não-vazio) antes do submit
- **Testado:** criado pedido #94158 e confirmado via API do Supabase ✅

### Bug 4 — Produtos sincronizados
- `upsertProduct` + polling de 5s já funcionavam; confirmado que aparecem em outros navegadores (validado via API: produto "CAMISA PREMIUM" criada pelo admin aparece no GET /products)

### Novas funcionalidades
- 🔔 **Badge de novos pedidos** — contador vermelho pulsante no ícone CRM do painel
- 🔊 **Som de notificação** — beep sintetizado (Web Audio API, sem asset externo) quando chega pedido novo
- 🔔 **Notificação de desktop/celular** — pede permissão ao logar; aparece como push
- ✅ `updateOrderStatus` agora persiste no Supabase (antes era só local)
- `mapOrderRow` normaliza formatos de `items` (string JSON ou array), status (case-insensitive)

### Ajustes de infra
- `vite.config.ts`: `allowedHosts: true` (para o preview externo do Emergent funcionar)

## Backlog (P0/P1)
### P0 — já combinado com usuário
Nenhum pendente no passo 1.

### P1 — próximas funcionalidades sugeridas (aguardando OK do usuário)
- 🔍 Busca global com filtros (categoria + faixa de preço + tamanho disponível)
- 🏷️ Cupons de desconto (% ou R$ fixo) configuráveis no Setup
- 🔥 Badge "Mais Vendido" / "Últimas Peças" automático
- 📊 Dashboard com gráfico de vendas por dia/semana (recharts)
- 👤 Histórico de pedidos do cliente (por telefone, sem login)
- ⭐ Avaliações com estrelas por produto
- 🚚 Cálculo de frete por CEP (PAC/Sedex via API)
- 💬 FAQ / Central de Ajuda
- 📧 Exportar CSV de pedidos

### P2 — backlog futuro
- Login real no admin via Supabase Auth (hoje é pass fixo no código)
- Múltiplas fotos por produto (galeria)
- PWA installable (manifest.json + service worker)

## Status atual
✅ Site funcional end-to-end: cliente compra → pedido vai pro Supabase → admin recebe no painel com som/badge → confirma venda → estoque baixa.
