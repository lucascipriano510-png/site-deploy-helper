import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RefreshCcw, CheckCircle2, AlertTriangle, Clock, Search, Radio } from 'lucide-react';

/**
 * AdminRastreio — Aba "Rastreio CAPI" (somente leitura)
 * Lista os registros de public.rastreio_conversoes para auditoria do
 * envio para a Meta Conversions API.
 *
 * NÃO altera nenhum componente existente. Componente totalmente isolado.
 */
export default function AdminRastreio() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('todos'); // todos | pendente | enviado | erro
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const { data, error } = await supabase
        .from('rastreio_conversoes')
        .select('id, phone, value, event_name, status, fb_trace_id, error_log, source, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      setErr(e.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // auto-refresh discreto a cada 30s
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const enviado = rows.filter((r) => r.status === 'enviado').length;
    const erro = rows.filter((r) => r.status === 'erro').length;
    const pendente = rows.filter((r) => r.status === 'pendente').length;
    return { total, enviado, erro, pendente };
  }, [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (filter !== 'todos') out = out.filter((r) => r.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (r) =>
          (r.phone || '').toLowerCase().includes(q) ||
          (r.fb_trace_id || '').toLowerCase().includes(q) ||
          (r.id || '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, filter, query]);

  const StatusBadge = ({ s }) => {
    if (s === 'enviado')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 size={10} /> Enviado
        </span>
      );
    if (s === 'erro')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
          <AlertTriangle size={10} /> Erro
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Clock size={10} /> Pendente
      </span>
    );
  };

  const fmtMoney = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const fmtPhone = (p) => {
    const s = String(p || '').replace(/\D/g, '');
    if (s.length === 13) return `+${s.slice(0, 2)} (${s.slice(2, 4)}) ${s.slice(4, 9)}-${s.slice(9)}`;
    if (s.length === 11) return `(${s.slice(0, 2)}) ${s.slice(2, 7)}-${s.slice(7)}`;
    return p;
  };

  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="px-4 pb-32 pt-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Radio size={18} className="text-emerald-500" />
            Rastreio CAPI
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Auditoria de envios para a Meta
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl bg-zinc-900 border border-white/5 active:scale-95 transition-transform"
          aria-label="Recarregar"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Stat label="Total" value={stats.total} tone="zinc" />
        <Stat label="Enviado" value={stats.enviado} tone="emerald" />
        <Stat label="Pendente" value={stats.pendente} tone="amber" />
        <Stat label="Erro" value={stats.erro} tone="red" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {['todos', 'enviado', 'pendente', 'erro'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition ${
              filter === f
                ? 'bg-emerald-500 text-zinc-950 border-emerald-500'
                : 'bg-zinc-900 text-zinc-400 border-white/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por telefone, fb_trace_id ou ID"
          className="w-full bg-zinc-900 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Estados */}
      {err && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-3">
          {err}
        </div>
      )}

      {loading && rows.length === 0 && (
        <div className="text-center text-zinc-500 text-xs py-10">Carregando…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center text-zinc-500 text-xs py-10">
          Nenhum registro encontrado.
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="bg-zinc-900 border border-white/5 rounded-2xl p-3 text-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <StatusBadge s={r.status} />
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                  {r.event_name || 'Purchase'} · {r.source || '-'}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">{fmtDate(r.created_at)}</span>
            </div>

            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold">{fmtPhone(r.phone)}</span>
              <span className="text-emerald-400 font-black">{fmtMoney(r.value)}</span>
            </div>

            {r.fb_trace_id && (
              <div className="text-[10px] text-zinc-500 mt-1 truncate">
                <span className="text-zinc-600">fb_trace_id:</span>{' '}
                <span className="text-zinc-300">{r.fb_trace_id}</span>
              </div>
            )}

            {r.status === 'erro' && r.error_log && (
              <details className="mt-2">
                <summary className="text-[10px] text-red-400 cursor-pointer">
                  ver erro
                </summary>
                <pre className="mt-1 text-[9px] text-red-300 bg-black/40 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                  {r.error_log}
                </pre>
              </details>
            )}

            <div className="text-[9px] text-zinc-700 mt-1.5 truncate">id: {r.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const toneMap = {
    zinc:    'text-white',
    emerald: 'text-emerald-400',
    amber:   'text-amber-400',
    red:     'text-red-400',
  };
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-2 text-center">
      <div className={`text-lg font-black ${toneMap[tone] || 'text-white'}`}>{value}</div>
      <div className="text-[8px] uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}
