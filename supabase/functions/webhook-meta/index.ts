// =====================================================================
// FLUXO OUTLET — Edge Function: webhook-meta
// Recebe POST { phone, value } e dispara:
//   1) INSERT 'pendente'  -> Supabase
//   2) SHA-256 do phone limpo
//   3) POST Meta Graph API v19.0 (Conversions API) — evento Purchase
//   4) UPDATE 'enviado' (com fb_trace_id) ou 'erro' (com log)
//
// Auth aceita:
//   - Header  x-webhook-secret: META_WEBHOOK_SECRET           (serviços externos)
//   - Header  Authorization: Bearer <jwt do usuário logado>   (chamadas do app)
//
// Deploy:
//   supabase functions deploy webhook-meta --no-verify-jwt
//   (usamos --no-verify-jwt porque a função faz a checagem manual,
//    permitindo os DOIS modos de auth)
// =====================================================================

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ----- CORS ----------------------------------------------------------
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-webhook-secret, apikey',
};

// ----- Helpers -------------------------------------------------------
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function cleanPhone(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

// ----- Handler -------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  // Env vars
  const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')!;
  const META_PIXEL_ID             = Deno.env.get('META_PIXEL_ID')!;
  const META_ACCESS_TOKEN         = Deno.env.get('META_ACCESS_TOKEN')!;
  const META_WEBHOOK_SECRET       = Deno.env.get('META_WEBHOOK_SECRET')!;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !META_PIXEL_ID || !META_ACCESS_TOKEN) {
    return json({ error: 'Missing server env vars' }, 500);
  }

  // ---------- AUTH (aceita os DOIS modos) ----------
  const headerSecret = req.headers.get('x-webhook-secret') || '';
  const authHeader   = req.headers.get('Authorization') || '';
  let authorized = false;
  let authMode: 'secret' | 'session' | null = null;

  if (META_WEBHOOK_SECRET && headerSecret && headerSecret === META_WEBHOOK_SECRET) {
    authorized = true;
    authMode = 'secret';
  } else if (authHeader.startsWith('Bearer ')) {
    // Valida JWT do usuário com a anon key
    const token = authHeader.slice(7);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (user) {
      authorized = true;
      authMode = 'session';
    }
  }

  if (!authorized) return json({ error: 'Unauthorized' }, 401);

  // ---------- PARSE BODY ----------
  let body: any;
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const phoneRaw = String(body?.phone ?? '').trim();
  const value    = Number(body?.value ?? 0);
  const eventName = String(body?.event_name || 'Purchase');
  const source   = String(body?.source || (authMode === 'session' ? 'admin' : 'webhook'));

  if (!phoneRaw)            return json({ error: 'phone is required' }, 400);
  if (!Number.isFinite(value) || value < 0) return json({ error: 'value must be a non-negative number' }, 400);

  const phoneClean = cleanPhone(phoneRaw);
  if (phoneClean.length < 8) return json({ error: 'phone is invalid' }, 400);

  // ---------- SUPABASE (service_role) ----------
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) INSERT pendente -------------------------------------------------
  const phoneHash = await sha256(phoneClean);

  const { data: inserted, error: insertErr } = await admin
    .from('rastreio_conversoes')
    .insert({
      phone: phoneClean,
      phone_hash: phoneHash,
      value,
      event_name: eventName,
      status: 'pendente',
      source,
      raw_payload: body,
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    return json({ error: 'Failed to persist event', details: insertErr?.message }, 500);
  }

  const rowId = inserted.id;

  // 2) META CAPI -------------------------------------------------------
  const eventTimeSec = Math.floor(Date.now() / 1000);
  const metaUrl = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`;

  const metaPayload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTimeSec,
        action_source: 'system_generated',
        event_id: rowId, // dedupe key
        user_data: { ph: [phoneHash] },
        custom_data: { value, currency: 'BRL' },
      },
    ],
  };

  let metaStatus = 0;
  let metaJson: any = null;
  let metaErrText = '';

  try {
    const r = await fetch(metaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayload),
    });
    metaStatus = r.status;
    const text = await r.text();
    try { metaJson = JSON.parse(text); } catch { metaErrText = text; }
  } catch (err) {
    metaErrText = (err as Error).message;
  }

  const ok = metaStatus >= 200 && metaStatus < 300 && metaJson && !metaJson.error;

  // 3) UPDATE final ----------------------------------------------------
  if (ok) {
    const fbTraceId = metaJson?.fbtrace_id || null;
    await admin
      .from('rastreio_conversoes')
      .update({ status: 'enviado', fb_trace_id: fbTraceId, error_log: null })
      .eq('id', rowId);

    return json({ ok: true, id: rowId, fb_trace_id: fbTraceId, meta: metaJson }, 200);
  } else {
    const errorLog = JSON.stringify({
      http_status: metaStatus,
      response: metaJson || metaErrText || 'unknown',
    });
    await admin
      .from('rastreio_conversoes')
      .update({ status: 'erro', error_log: errorLog })
      .eq('id', rowId);

    return json({ ok: false, id: rowId, error: 'Meta CAPI rejected', details: metaJson || metaErrText }, 502);
  }
});
