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
### Passo 1 — Checkout / Supabase / WhatsApp
- `handleFinalize` estava enviando payload com schema errado (`customer`, `total`) → Supabase rejeitava silenciosamente
- **Correção:** payload agora usa o schema real `{order_number, name, phone, items, value, status}`
- Agora o pedido é registrado no Supabase → polling de 5s sincroniza no painel CRM
- WhatsApp agora usa `config.whatsapp` (não mais hardcoded)
- Tela "PEDIDO PRONTO! #XXXXX" aparece após sucesso, com botão "Enviar WhatsApp" em nova aba
- Validações básicas (nome, telefone 10+ dígitos, carrinho não-vazio) antes do submit
- **Testado:** criado pedido #94158 e confirmado via API do Supabase ✅

### Passo 1 — Notificações do admin
- 🔔 Badge vermelho pulsante no ícone CRM com contador de pedidos novos
- 🔊 Som de notificação (Web Audio API, sem asset externo)
- 🔔 Push do navegador/celular (permissão solicitada ao logar)
- `updateOrderStatus` agora persiste no Supabase (antes era só local)

### Passo 2 (22/04/2026) — Melhorias de e-commerce
Lógica de venda confirmada (já existia, validada com o usuário):
- Pedido novo → NÃO baixa estoque, vai pro CRM como "NOVO"
- Admin "Concluir" → baixa estoque do tamanho, soma na Receita e TM
- Admin "Cancelar" → não mexe em nada
- Produto com todos tamanhos = 0 → some do catálogo cliente, fica visível no admin

Novas features implementadas:
- 🔥 **Badges** "MAIS VENDIDO (Top)" (sales ≥ 10, ícone Flame) e já tinha "Restam X" (≤3)
- 🔍 **Filtro por tamanho disponível** — chip horizontal acima do grid, lista só tamanhos com estoque > 0
- 📊 **Gráfico real de vendas** (últimos 7 dias) no Dashboard usando `recharts` — barras por dia com tooltip de valor e pedidos. Receita no topo agora é apenas de pedidos CONCLUÍDOS (não mais todos não-cancelados)
- 📥 **Exportar CSV** no CRM — botão no topo, gera arquivo `pedidos-YYYY-MM-DD.csv` com BOM UTF-8 (abre no Excel)
- 👤 **"Meus Pedidos" do cliente** — botão no home, cliente digita WhatsApp e vê seus pedidos (query direta no Supabase por `phone`)

### Ajustes de infra
- `vite.config.ts`: `allowedHosts: true` (preview externo do Emergent)

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
