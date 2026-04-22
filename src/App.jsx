import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Minus, Trash2, X, Search, LayoutDashboard, 
  ShoppingBag, Home, Power, Package, 
  TrendingUp, Box, MessageCircle,
  Zap, Share2, Info, Star, ChevronRight, ChevronLeft,
  RefreshCcw, Layers, Settings, Tag, 
  AlertCircle, DollarSign, MapPin, Edit3, User, Phone, 
  CheckCircle2, Camera, Save, ArrowLeft, BarChart3,
  LogOut, ClipboardList, Database, Filter, Eye,
  Barcode, QrCode, AlertTriangle, Upload, Image as ImageIcon,
  Maximize2, ZoomIn, Bell, Clock, Truck, Check, XCircle,
  Flame, ShieldCheck, Award, CreditCard, Lock, Megaphone, ImagePlus,
  GripVertical, Instagram, ShieldQuestion, Globe, HelpCircle, ScanLine, Scan
} from 'lucide-react';
import { fetchProducts, upsertProduct, deleteProduct as deleteProductRemote } from './lib/supabase';
import { createOrder, fetchOrders, confirmOrderSale, cancelOrder as cancelOrderRemote, deleteOrder as deleteOrderRemote, updateOrderStatus } from './lib/orders';
import { supabase } from './lib/supabaseClient';
import { fetchSiteConfig, upsertSiteConfig, DEFAULT_CONFIG as SITE_DEFAULT_CONFIG } from './lib/siteConfig';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip as ReTooltip, Cell } from 'recharts';

// ==========================================
// 1. CONFIGURAÇÃO E DADOS INICIAIS
// ==========================================
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'fluxo-dark-ultimate';
const LEAD_STORAGE_KEY = '@fluxo-outlet:lead-data-v3';
const BANNERS_STORAGE_KEY = `@${APP_ID}:banners`;

const DEFAULT_PRODUCTS = [
  { id: 1, sku: 'CAM-BRA-001', name: 'Camiseta Branca Basic', price: 89.90, category: 'VESTUÁRIO', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', stock: 25, sales: 12, sizes: [{size: 'P', stock: 5}, {size: 'M', stock: 10}, {size: 'G', stock: 10}], featured: true },
  { id: 2, sku: 'CAL-JOG-001', name: 'Calça Jogger Tech', price: 169.90, category: 'VESTUÁRIO', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800', stock: 15, sales: 8, sizes: [{size: '38', stock: 5}, {size: '40', stock: 5}, {size: '42', stock: 5}], featured: false },
  { id: 3, sku: 'TEN-RUN-002', name: 'Tênis Running Fluxo', price: 299.90, category: 'CALÇADOS', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', stock: 2, sales: 45, sizes: [{size: '39', stock: 1}, {size: '41', stock: 1}], featured: true },
  { id: 4, sku: 'BON-PRE-003', name: 'Boné Archer Black', price: 79.90, category: 'ACESSÓRIOS', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800', stock: 0, sales: 120, sizes: [{size: 'U', stock: 0}], featured: false }, 
  { id: 5, sku: '9059', name: 'Calça Super Skinny Malibu Rasgada', price: 189.90, category: 'VESTUÁRIO', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800', stock: 10, sales: 5, sizes: [{size: '38', stock: 5}, {size: '40', stock: 5}], featured: true }
];

const DEFAULT_BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1000&q=80',
    title: 'NOVA COLEÇÃO',
    subtitle: 'STREETWEAR PREMIUM 2026',
    buttonText: 'VER PEÇAS',
    active: true
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000&q=80',
    title: 'FRETE GRÁTIS',
    subtitle: 'ENVIOS EXPRESSOS',
    buttonText: 'APROVEITAR',
    active: true
  }
];

const DEFAULT_CONFIG = {
  brandName: 'FLUXO OUTLET EXCLUSIVE',
  whatsapp: '5534984148067', 
  location: 'UBERABA, MG',
  minOrder: 0.00, 
  pixelId: 'PIXEL_FLUXO_001',
  logoUrl: '', 
  logoZoom: 1.5,
  marqueePhrases: [
    'ALTO PADRÃO EM CADA DETALHE',
    'ENVIO PRIORITÁRIO',
    'COLEÇÕES LIMITADAS',
    'DESIGN AUTÊNTICO E EXCLUSIVO'
  ]
};

// ==========================================
// 2. FUNÇÕES DE TRACKING E UTILITÁRIOS
// ==========================================
const trackPixel = (eventName, payload) => {
  console.log(`[PIXEL TRACKING] 🟢 ${eventName}`, payload);
};

// ==========================================
// 3. COMPONENTES ADMIN DESACOPLADOS
// ==========================================

const AdminHeader = ({ handleLogout }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><Zap size={16} className="text-zinc-950"/></div>
      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Painel Admin</span>
    </div>
    <button onClick={handleLogout} className="text-zinc-500 hover:text-red-500 transition-colors touch-manipulation"><LogOut size={18}/></button>
  </div>
);

const AdminDashboard = ({ leads, products }) => {
  const validLeads = (leads || []).filter(l => l.status !== 'CANCELADO');
  const concludedLeads = (leads || []).filter(l => l.status === 'CONCLUÍDO');
  const totalRevenue = concludedLeads.reduce((a, b) => a + (b.value || 0), 0);
  const avgTicket = concludedLeads.length > 0 ? (totalRevenue / concludedLeads.length) : 0;
  const totalItemsSold = concludedLeads.reduce((acc, lead) => acc + (lead.items || []).reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0), 0);

  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','').toUpperCase().slice(0,3);
      days.push({ key, label, valor: 0, pedidos: 0 });
    }
    concludedLeads.forEach(l => {
      const raw = l._raw?.created_at;
      if (!raw) return;
      const k = new Date(raw).toISOString().slice(0,10);
      const d = days.find(x => x.key === k);
      if (d) { d.valor += Number(l.value || 0); d.pedidos += 1; }
    });
    return days;
  }, [concludedLeads]);

  const lowStockProducts = (products || []).filter(p => p.stock > 0 && p.stock <= 3);
  const outOfStockProducts = (products || []).filter(p => p.stock === 0);

  const statusColors = { 'NOVO': 'text-blue-500 bg-blue-500/10', 'EM ATENDIMENTO': 'text-amber-500 bg-amber-500/10', 'CONCLUÍDO': 'text-emerald-500 bg-emerald-500/10', 'CANCELADO': 'text-red-500 bg-red-500/10' };

  return (
    <div className="p-6 space-y-6 animate-in pb-24">
      <div className="bg-gradient-to-br from-emerald-900 to-zinc-950 p-6 rounded-[32px] border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10"><DollarSign size={180}/></div>
        <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-1 relative z-10 flex items-center gap-2"><TrendingUp size={12}/> Receita Concluída</p>
        <h3 className="text-4xl font-black text-white italic relative z-10 tracking-tighter shadow-black drop-shadow-md">R$ {totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        <div className="h-24 mt-6 relative z-10 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{top: 5, right: 6, bottom: 0, left: 6}}>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#71717a', fontWeight: 900 }} axisLine={false} tickLine={false} />
              <ReTooltip
                cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 11, fontWeight: 900 }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(v, n) => n === 'valor' ? [`R$ ${Number(v).toFixed(2)}`, 'Vendas'] : [v, 'Pedidos']}
              />
              <Bar dataKey="valor" radius={[6,6,0,0]}>
                {chartData.map((e, i) => (<Cell key={i} fill={e.valor > 0 ? '#10b981' : '#27272a'} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-5 rounded-[24px] border border-white/5 shadow-xl flex flex-col justify-between">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShoppingBag size={12}/> Pedidos</p>
          <h3 className="text-2xl font-black text-white">{validLeads.length}</h3>
        </div>
        <div className="bg-zinc-900 p-5 rounded-[24px] border border-white/5 shadow-xl flex flex-col justify-between">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Package size={12}/> Peças Vendidas</p>
          <h3 className="text-2xl font-black text-white">{totalItemsSold}</h3>
        </div>
        <div className="col-span-2 bg-zinc-900 p-5 rounded-[24px] border border-white/5 shadow-xl flex flex-col justify-between">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BarChart3 size={12}/> Ticket Médio (TM)</p>
          <h3 className="text-2xl font-black text-emerald-500 tracking-tighter">R$ {avgTicket.toFixed(2)}</h3>
        </div>
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5 space-y-4">
         <h4 className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-2"><Clock size={14} className="text-zinc-400"/> Pedidos Recentes</h4>
         {(leads || []).slice(0, 4).length === 0 ? (
             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Nenhuma atividade ainda.</p>
         ) : (
             <div className="space-y-3">
                 {(leads || []).slice(0, 4).map((l, i) => (
                     <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                         <div className="flex flex-col">
                             <span className="text-[11px] font-black uppercase text-white truncate w-32">{(l.name || 'Desconhecido').split(' ')[0]}</span>
                             <span className="text-[9px] font-bold text-zinc-500">#{l.orderNumber || '0000'}</span>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                             <span className="text-[11px] font-black text-emerald-500">R$ {(l.value || 0).toFixed(2)}</span>
                             <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${statusColors[l.status || 'NOVO']}`}>{l.status || 'NOVO'}</span>
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>

      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-red-500/10 space-y-4">
           <h4 className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/> Alertas de Estoque</h4>
           <div className="space-y-3">
              {outOfStockProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-red-500/10 px-4 py-3 rounded-2xl border border-red-500/20">
                  <span className="text-[10px] font-bold text-white uppercase truncate pr-4">{p.name}</span>
                  <span className="text-[9px] font-black bg-red-500 text-white px-2 py-1 rounded-full shrink-0">ESGOTADO</span>
                </div>
              ))}
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-amber-500/10 px-4 py-3 rounded-2xl border border-amber-500/20">
                  <span className="text-[10px] font-bold text-white uppercase truncate pr-4">{p.name}</span>
                  <span className="text-[9px] font-black text-amber-500 shrink-0">Resta(m) {p.stock}</span>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
