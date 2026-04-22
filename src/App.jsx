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

// ✅ IMPORTAÇÃO SEGURA DO SUPABASE
import { supabase } from './lib/supabaseClient';

const APP_ID = 'fluxo-dark-ultimate';

export default function App() {
  // --- 1. ESTADOS COM RECUPERAÇÃO DE MEMÓRIA (EMERGÊNCIA) ---
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(`@${APP_ID}:products`);
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(`@${APP_ID}:config`);
    return saved ? JSON.parse(saved) : {
      brandName: 'FLUXO OUTLET',
      whatsapp: '5534984148067',
      marqueePhrases: ['ALTO PADRÃO EM CADA DETALHE', 'ENVIO PRIORITÁRIO', 'COLEÇÃO 2026'],
      logoUrl: '',
      logoZoom: 1.5
    };
  });

  const [leads, setLeads] = useState([]);
  const [cart, setCart] = useState([]);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(`@${APP_ID}:admin`) === 'true');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const lastTapRef = useRef(0);

  // --- 2. SINCRONIZAÇÃO EM TEMPO REAL (SUPABASE) ---
  useEffect(() => {
    const syncData = async () => {
      // Puxa pedidos do Supabase
      const { data: lData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (lData) setLeads(lData);

      // Puxa produtos do Supabase (Se houver)
      const { data: pData } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (pData && pData.length > 0) {
        setProducts(pData);
        localStorage.setItem(`@${APP_ID}:products`, JSON.stringify(pData));
      }
    };
    syncData();
    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Salva Configurações localmente para não sumir o visual
  useEffect(() => {
    localStorage.setItem(`@${APP_ID}:config`, JSON.stringify(config));
  }, [config]);

  // --- 3. LÓGICA DE INTERFACE ---
  const handleSecretDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) setShowAdminLogin(true);
    lastTapRef.current = now;
  };

  // RENDER ADMIN
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white font-sans pb-24">
        <header className="p-6 border-b border-white/10 bg-zinc-950 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg"><LayoutDashboard/></div>
             <h2 className="font-black italic uppercase text-xs">Master Control</h2>
          </div>
          <button onClick={() => {sessionStorage.removeItem(`@${APP_ID}:admin`); setIsAdmin(false);}} className="text-[10px] font-black uppercase bg-white text-black px-4 py-2 rounded-full">Sair</button>
        </header>

        <main className="max-w-md mx-auto p-6 space-y-6">
           {adminTab === 'dashboard' && (
             <div className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 animate-in">
                <p className="text-[10px] font-black text-zinc-500 uppercase">Status do Sistema</p>
                <h3 className="text-2xl font-black text-emerald-500 mt-2">CONECTADO AO SUPABASE</h3>
                <div className="grid grid-cols-2 gap-4 mt-6">
                   <div className="bg-black p-4 rounded-2xl border border-white/5"><p className="text-[8px] font-black text-zinc-500">PEDIDOS</p><p className="text-xl font-black">{leads.length}</p></div>
                   <div className="bg-black p-4 rounded-2xl border border-white/5"><p className="text-[8px] font-black text-zinc-500">ITENS</p><p className="text-xl font-black">{products.length}</p></div>
                </div>
             </div>
           )}
           
           {adminTab === 'setup' && (
             <div className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 space-y-4">
                <h3 className="font-black uppercase italic">Configurações Visuais</h3>
                <input placeholder="Nome da Marca" className="w-full p-4 bg-black rounded-xl border border-white/10" value={config.brandName} onChange={e => setConfig({...config, brandName: e.target.value})} />
                <input placeholder="WhatsApp" className="w-full p-4 bg-black rounded-xl border border-white/10" value={config.whatsapp} onChange={e => setConfig({...config, whatsapp: e.target.value})} />
                <button onClick={() => alert('Configurações Salvas!')} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-[10px]">Salvar Mudanças</button>
             </div>
           )}
        </main>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-zinc-900 p-4 rounded-full flex justify-between border border-white/10 shadow-2xl z-50">
           <button onClick={() => setAdminTab('dashboard')} className={adminTab === 'dashboard' ? 'text-emerald-500' : 'text-zinc-500'}><LayoutDashboard/></button>
           <button onClick={() => setAdminTab('inventory')} className={adminTab === 'inventory' ? 'text-emerald-500' : 'text-zinc-500'}><Box/></button>
           <button onClick={() => setAdminTab('leads')} className={adminTab === 'leads' ? 'text-emerald-500' : 'text-zinc-500'}><User/></button>
           <button onClick={() => setAdminTab('setup')} className={adminTab === 'setup' ? 'text-emerald-500' : 'text-zinc-500'}><Settings/></button>
        </nav>
      </div>
    );
  }

  // RENDER LOJA
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* MARQUEE */}
      <div className="bg-white text-black py-2 overflow-hidden">
        <div className="flex gap-10 whitespace-nowrap animate-marquee font-black text-[9px] uppercase tracking-widest">
          {config.marqueePhrases.map((p, i) => <span key={i}>✦ {p}</span>)}
          {config.marqueePhrases.map((p, i) => <span key={'d'+i}>✦ {p}</span>)}
        </div>
      </div>

      <header className="p-6 flex justify-between items-center h-20 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-40">
        <button className="text-zinc-500"><Search size={22}/></button>
        <h1 className="text-xl font-black italic uppercase">{config.brandName}</h1>
        <button className="relative">
          <ShoppingBag size={24}/>
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
        </button>
      </header>

      <main className="p-6 grid grid-cols-2 gap-4">
        {products.length === 0 ? (
          <div className="col-span-2 py-32 text-center opacity-20"><Package size={48} className="mx-auto mb-4"/><p className="text-[10px] font-black uppercase">O Estoque está vazio.</p></div>
        ) : (
          products.map(p => (
            <div key={p.id} className="bg-zinc-900 rounded-[24px] overflow-hidden border border-white/5">
              <img src={p.image} className="aspect-[3/4] object-cover w-full opacity-90" />
              <div className="p-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 truncate">{p.name}</h3>
                <p className="font-black text-sm text-white mt-1">R$ {p.price?.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </main>

      <footer className="p-10 flex flex-col items-center opacity-10">
        <button onClick={handleSecretDoubleTap} className="p-4"><Lock size={12}/></button>
      </footer>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (e.target.user.value === 'Fluxo034' && e.target.pass.value === 'METODOFLUXO') {
              sessionStorage.setItem(`@${APP_ID}:admin`, 'true');
              setIsAdmin(true); setShowAdminLogin(false);
            }
          }} className="bg-zinc-950 p-8 rounded-[40px] border border-white/10 w-full max-w-sm space-y-6">
            <h2 className="text-2xl font-black uppercase text-center italic">Acesso Restrito</h2>
            <input name="user" placeholder="Usuário" className="w-full p-4 bg-zinc-900 rounded-2xl outline-none" />
            <input name="pass" type="password" placeholder="Senha" className="w-full p-4 bg-zinc-900 rounded-2xl outline-none" />
            <button className="w-full py-5 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[11px]">Entrar</button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        .animate-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
