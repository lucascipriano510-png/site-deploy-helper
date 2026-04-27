import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  'https://tapgnlrjhrhewqlpahvg.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  'sb_publishable_XaGrDdX2df8qolf2WocwuQ_FsVP1-kW'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[supabase] Credenciais ausentes. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
}

// Storage seguro: usa localStorage quando disponível (web normal),
// com fallback em memória para ambientes sem window (SSR/preview server).
const safeStorage = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Smoke test (modo privado do Safari pode lançar)
      const k = '__fluxo_ls_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return window.localStorage;
    }
  } catch (e) {}
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  };
})();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Sessão persistente entre recarregamentos / fechar e abrir o navegador.
    // O Supabase auto-renova o access token usando o refresh token salvo,
    // então o admin só precisa logar uma vez por dispositivo.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: safeStorage,
    storageKey: 'fluxo-admin-auth',
    flowType: 'pkce',
  },
})
