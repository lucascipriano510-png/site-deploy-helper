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

// ✅ CONEXÃO SUPABASE
import { supabase } from './lib/supabaseClient';

const APP_ID = 'fluxo-dark-ultimate';

export default function App() {
  // --- ESTADOS ---
  const [products, setProducts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [banners, setBanners] = useState([]);
  const [config, setConfig] = useState({
    brandName: 'FLUXO OUTLET',
    whatsapp: '5534984148067',
    marqueePhrases: ['ALTO PADRÃO EM CADA DETALHE', 'ENVIO PRIORITÁRIO', 'COLEÇÃO 2026'],
    logoUrl: '',
    logoZoom: 1.5,
    minOrder: 0
  });

  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(`@${APP_ID}:admin`) === 'true');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const lastTapRef = useRef(0);

  // --- BUSCA AUTOMÁTICA DE DADOS (SUPABASE) ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Busca Produtos
      const { data: pData } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (pData) setProducts(pData);

      // 2. Busca Pedidos (Leads)
      const { data: lData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (lData) setLeads(lData);
    };
    fetchData();
    // Atualiza a cada 10 segundos para não perder nada
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- LÓGICA DE LOGIN ---
  const handleSecretDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) setShowAdminLogin(true);
    lastTapRef.current = now;
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white font-sans pb-24">
        {/* HEADER ADMIN */}
        <div className="p-6 flex justify-between items-center border-b border-white/10 bg-zinc-950 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <LayoutDashboard size={20} className="text-black"/>
            </div>
            <div>
              <h2 className="font-black italic uppercase text-sm leading-none">Master Control</h2>
              <p className="text-[8px] text-emerald-500 font-bold uppercase mt-1">● Operacional</p>
            </div>
          </div>
          <button onClick={() => { sessionStorage.removeItem(`@${APP_ID}:admin`); setIsAdmin(false); }} className="bg-white text-black px-4 py-2 rounded-full font-black text-[10px] uppercase">Sair</button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <main className="max-w-md mx-auto p-6">
          {adminTab === 'dashboard' && (
             <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-900 to-black p-6 rounded-[32px] border border-emerald-500/20 shadow-2xl">
                   <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Receita Total</p>
                   <h3 className="text-4xl font-black italic">R$ {leads.filter(l => l.status === 'CONCLUÍDO').reduce((a, b) => a + b.value, 0).toFixed(2)}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-zinc-900 p-5 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Pedidos</p>
                      <h4 className="text-2xl font-black">{leads.length}</h4>
                   </div>
                   <div className="bg-zinc-900 p-5 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Estoque</p>
                      <h4 className="text-2xl font-black">{products.reduce((a, b) => a + b.stock, 0)} un</h4>
                   </div>
                </div>
             </div>
          )}
          {adminTab === 'setup' && (
            <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/10 space-y-6">
               <h3 className="font-black italic uppercase text-xl">Setup Global</h3>
               <div className="space-y-4">
                  <input placeholder="Nome da Marca" className="w-full p-4 bg-black rounded-2xl outline-none" defaultValue={config.brandName} />
                  <input placeholder="WhatsApp" className="w-full p-4 bg-black rounded-2xl outline-none" defaultValue={config.whatsapp} />
                  <button className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">Aplicar</button>
               </div>
            </div>
          )}
        </main>

        {/* NAV ADMIN */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-zinc-900/90 backdrop-blur-xl p-4 rounded-[32px] flex justify-between border border-white/10 shadow-2xl">
          <button onClick={() => setAdminTab('dashboard')} className={adminTab === 'dashboard' ? 'text-emerald-500' : 'text-zinc-500'}><LayoutDashboard/></button>
          <button onClick={() => setAdminTab('inventory')} className={adminTab === 'inventory' ? 'text-emerald-500' : 'text-zinc-500'}><Box/></button>
          <button onClick={() => setAdminTab('leads')} className={adminTab === 'leads' ? 'text-emerald-500' : 'text-zinc-500'}><User/></button>
          <button onClick={() => setAdminTab('setup')} className={adminTab === 'setup' ? 'text-emerald-500' : 'text-zinc-500'}><Settings/></button>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* MARQUEE */}
      <div className="bg-white text-black py-2 overflow-hidden">
        <div className="flex gap-10 whitespace-nowrap animate-marquee font-black text-[9px] uppercase tracking-widest">
          {config.marqueePhrases.map((p, i) => <span key={i}>✦ {p}</span>)}
          {config.marqueePhrases.map((p, i) => <span key={'d'+i}>✦ {p}</span>)}
        </div>
      </div>

      {/* HEADER */}
      <header className="p-6 flex justify-between items-center h-20 sticky top-0 bg-black/80 backdrop-blur-lg z-40 border-b border-white/5">
        <button className="text-zinc-500"><Search size={22}/></button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">{config.brandName}</h1>
        <button className="relative">
          <ShoppingBag size={24}/>
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
        </button>
      </header>

      {/* PRODUTOS */}
      <main className="p-6 grid grid-cols-2 gap-4">
        {products.length === 0 ? (
          <div className="col-span-2 py-20 text-center opacity-20"><Package size={48} className="mx-auto mb-4"/><p className="text-[10px] font-black uppercase">Sincronizando Estoque...</p></div>
        ) : (
          products.map(p => (
            <div key={p.id} className="bg-zinc-900/50 rounded-[24px] overflow-hidden border border-white/5 relative group">
              <img src={p.image} className="aspect-[3/4] object-cover w-full opacity-90" />
              <div className="p-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 truncate">{p.name}</h3>
                <p className="font-black text-sm text-white mt-1">R$ {p.price?.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </main>

      {/* FOOTER / LOGIN SECRETO */}
      <footer className="p-10 flex flex-col items-center opacity-10">
        <button onClick={handleSecretDoubleTap} className="p-4"><Lock size={12}/></button>
      </footer>

      {/* LOGIN MODAL */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (e.target.user.value === 'Fluxo034' && e.target.pass.value === 'METODOFLUXO') {
              sessionStorage.setItem(`@${APP_ID}:admin`, 'true');
              setIsAdmin(true); setShowAdminLogin(false);
            }
          }} className="bg-zinc-950 p-8 rounded-[40px] border border-white/10 w-full max-w-sm space-y-6 shadow-2xl">
            <h2 className="text-2xl font-black uppercase text-center italic">Acesso Restrito</h2>
            <input name="user" placeholder="Usuário" className="w-full p-4 bg-zinc-900 rounded-2xl outline-none border border-white/5" />
            <input name="pass" type="password" placeholder="Senha" className="w-full p-4 bg-zinc-900 rounded-2xl outline-none border border-white/5" />
            <button className="w-full py-5 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[11px] shadow-[0_10px_20px_rgba(16,185,129,0.2)]">Entrar</button>
            <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full text-zinc-600 font-bold text-[10px] uppercase">Fechar</button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}</style>
    </div>
  );
}
