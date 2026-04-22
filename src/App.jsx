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
  { id: 2, sku: 'CAL-PRE-002', name: 'Calça Preta Slim', price: 159.90, category: 'VESTUÁRIO', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800', stock: 18, sales: 8, sizes: [{size: '38', stock: 3}, {size: '40', stock: 8}, {size: '42', stock: 7}], featured: false },
  { id: 3, sku: 'TEN-BRA-003', name: 'Tênis Branco Runner', price: 299.90, category: 'CALÇADOS', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', stock: 12, sales: 15, sizes: [{size: '38', stock: 2}, {size: '39', stock: 3}, {size: '40', stock: 4}, {size: '41', stock: 3}], featured: true },
  { id: 4, name: 'Óculos Escuros Aviador', price: 129.90, category: 'ACESSÓRIOS', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', stock: 30, sales: 20, sizes: [], featured: false },
  { id: 5, name: 'Bolsa Couro Caramelo', price: 249.90, category: 'ACESSÓRIOS', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', stock: 8, sales: 5, sizes: [], featured: true },
];
const CATEGORIES = ['VESTUÁRIO','CALÇADOS','ACESSÓRIOS','ELETRÔNICOS','CASA','BELEZA','ESPORTE','OUTROS'];
const STATUS_LABELS = { pendente:'PENDENTE', confirmado:'CONFIRMADO', em_separacao:'EM SEPARAÇÃO', saiu_entrega:'SAIU P/ ENTREGA', concluido:'CONCLUÍDO', cancelado:'CANCELADO' };
const STATUS_COLORS = { pendente:'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', confirmado:'bg-blue-500/20 text-blue-300 border-blue-500/30', em_separacao:'bg-purple-500/20 text-purple-300 border-purple-500/30', saiu_entrega:'bg-orange-500/20 text-orange-300 border-orange-500/30', concluido:'bg-green-500/20 text-green-300 border-green-500/30', cancelado:'bg-red-500/20 text-red-300 border-red-500/30' };

// ==========================================
// 2. UTILITÁRIOS
// ==========================================
const fmt = (v) => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmtN = (v) => Number(v||0).toLocaleString('pt-BR');

// ==========================================
// 3. COMPONENTES AUXILIARES
// ==========================================

function LoadingScreen(){
  return(
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, size='md' }){
  useEffect(()=>{ if(open) document.body.style.overflow='hidden'; else document.body.style.overflow=''; return()=>{ document.body.style.overflow=''; }; },[open]);
  if(!open) return null;
  const sizes = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-lg', xl:'max-w-xl', '2xl':'max-w-2xl', full:'max-w-full' };
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative bg-gray-900 border border-gray-700/50 rounded-t-2xl sm:rounded-2xl w-full ${sizes[size]||sizes.md} shadow-2xl max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
          <h2 className="font-bold text-white text-lg">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}

function Confirm({ open, onClose, onConfirm, title, message, confirmText='Confirmar', danger=false }){
  if(!open) return null;
  return(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium">Cancelar</button>
          <button onClick={()=>{onConfirm();onClose();}} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${danger?'bg-red-600 hover:bg-red-500':'bg-violet-600 hover:bg-violet-500'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toasts }){
  return(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t=>(
        <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white backdrop-blur-sm border pointer-events-auto
          ${t.type==='success'?'bg-green-600/90 border-green-500/50':t.type==='error'?'bg-red-600/90 border-red-500/50':'bg-violet-600/90 border-violet-500/50'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast(){
  const [toasts,setToasts]=useState([]);
  const show=(message,type='info')=>{
    const id=Date.now();
    setToasts(p=>[...p,{id,message,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  };
  return{toasts,show};
}

// ==========================================
// 4. TELA DE LOGIN
// ==========================================
function LoginScreen({ onLogin, config }){
  const [phone,setPhone]=useState('');
  const [name,setName]=useState('');
  const [step,setStep]=useState('phone');
  const [loading,setLoading]=useState(false);
  const bg = config?.store_background_color||'#0f172a';
  const accent = config?.store_accent_color||'#7c3aed';

  const handlePhone=()=>{
    const digits=phone.replace(/\D/g,'');
    if(digits.length<10){ alert('Telefone inválido'); return; }
    setStep('name');
  };
  const handleName=async()=>{
    if(!name.trim()){ alert('Informe seu nome'); return; }
    setLoading(true);
    const lead={name:name.trim(),phone:phone.replace(/\D/g,''),createdAt:new Date().toISOString()};
    try{ await supabase.from('leads').upsert([{phone:lead.phone,name:lead.name,created_at:lead.createdAt}],{onConflict:'phone'}); }catch(e){}
    localStorage.setItem(LEAD_STORAGE_KEY,JSON.stringify(lead));
    setLoading(false);
    onLogin(lead);
  };
  const fmtPhone=v=>{ const d=v.replace(/\D/g,''); if(d.length<=2) return d; if(d.length<=7) return `(${d.slice(0,2)}) ${d.slice(2)}`; return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`; };

  return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:bg}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {config?.store_logo_url
            ? <img src={config.store_logo_url} alt="logo" className="h-20 mx-auto mb-4 object-contain"/>
            : <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:accent}}><ShoppingBag size={36} className="text-white"/></div>
          }
          <h1 className="text-2xl font-bold text-white">{config?.store_name||'Minha Loja'}</h1>
          <p className="text-gray-400 text-sm mt-1">{config?.store_tagline||'Bem-vindo!'}</p>
        </div>
        <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
          {step==='phone'?(
            <>
              <h2 className="text-white font-semibold mb-1">Seu telefone</h2>
              <p className="text-gray-400 text-sm mb-4">Para acompanhar seus pedidos</p>
              <input value={phone} onChange={e=>setPhone(fmtPhone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 mb-4 text-lg" type="tel"/>
              <button onClick={handlePhone} className="w-full py-3 rounded-xl text-white font-semibold text-base transition-colors" style={{background:accent}}>Continuar</button>
            </>
          ):(
            <>
              <h2 className="text-white font-semibold mb-1">Seu nome</h2>
              <p className="text-gray-400 text-sm mb-4">Como devemos te chamar?</p>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 mb-4" autoFocus/>
              <button onClick={handleName} disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold text-base transition-colors disabled:opacity-60" style={{background:accent}}>
                {loading?'Entrando...':'Entrar na loja'}
              </button>
              <button onClick={()=>setStep('phone')} className="w-full mt-2 py-2 text-gray-400 text-sm hover:text-white transition-colors">Voltar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. BANNER CAROUSEL (com swipe)
// ==========================================
function BannerCarousel({ banners, accent }){
  const [idx,setIdx]=useState(0);
  const touchStartX = useRef(null);
  const touchEndX   = useRef(null);
  const active = banners.filter(b=>b.active!==false);

  useEffect(()=>{
    if(active.length<=1) return;
    const t=setInterval(()=>setIdx(i=>(i+1)%active.length),4000);
    return()=>clearInterval(t);
  },[active.length]);

  if(!active.length) return null;

  /* ── swipe handlers ── */
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => { touchEndX.current   = e.touches[0].clientX; };
  const onTouchEnd   = () => {
    if(touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if(Math.abs(diff) > 40){
      if(diff > 0) setIdx(i=>(i+1)%active.length);   // swipe left → next
      else         setIdx(i=>(i-1+active.length)%active.length); // swipe right → prev
    }
    touchStartX.current = null;
    touchEndX.current   = null;
  };

  return(
    <div
      className="relative w-full rounded-2xl overflow-hidden mb-4 select-none"
      style={{aspectRatio:'16/7'}}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {active.map((b,i)=>(
        <div key={b.id||i} className={`absolute inset-0 transition-opacity duration-700 ${i===idx?'opacity-100':'opacity-0'}`}>
          <img src={b.imageUrl} alt={b.title||''} className="w-full h-full object-cover"/>
          {(b.title||b.subtitle)&&(
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
              {b.title&&<p className="text-white font-bold text-lg leading-tight drop-shadow">{b.title}</p>}
              {b.subtitle&&<p className="text-white/80 text-sm drop-shadow">{b.subtitle}</p>}
            </div>
          )}
        </div>
      ))}
      {active.length>1&&(
        <>
          <button onClick={()=>setIdx(i=>(i-1+active.length)%active.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors z-10">
            <ChevronLeft size={18}/>
          </button>
          <button onClick={()=>setIdx(i=>(i+1)%active.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors z-10">
            <ChevronRight size={18}/>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {active.map((_,i)=>(
              <button key={i} onClick={()=>setIdx(i)}
                className="rounded-full transition-all"
                style={{width:i===idx?'16px':'6px',height:'6px',background:i===idx?(accent||'#7c3aed'):'rgba(255,255,255,0.5)'}}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// 6. TELA DA LOJA (cliente)
// ==========================================
function StoreScreen({ products, onAddToCart, cart, config, banners, onViewProduct }){
  const [search,setSearch]=useState('');
  const [cat,setCat]=useState('TODOS');
  const accent = config?.store_accent_color||'#7c3aed';
  const bg     = config?.store_background_color||'#0f172a';

  const usedCats = useMemo(()=>{
    const s=new Set(products.map(p=>p.category).filter(Boolean));
    return ['TODOS',...Array.from(s)];
  },[products]);

  const filtered = useMemo(()=>{
    return products.filter(p=>{
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat    = cat==='TODOS' || p.category===cat;
      return matchSearch && matchCat && p.stock>0;
    });
  },[products,search,cat]);

  return(
    <div className="flex flex-col min-h-screen" style={{background:bg}}>
      <div className="sticky top-0 z-30" style={{background:bg}}>
        <div className="px-4 pt-4 pb-2">
          {config?.store_logo_url
            ? <img src={config.store_logo_url} alt="logo" className="h-10 mb-3 object-contain"/>
            : <h1 className="text-xl font-bold text-white mb-3">{config?.store_name||'Loja'}</h1>
          }
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produtos..."
              className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"/>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {usedCats.map(c=>(
              <button key={c} onClick={()=>setCat(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${cat===c?'text-white border-transparent':'bg-gray-800/60 text-gray-400 border-gray-700/40 hover:bg-gray-700/60'}`}
                style={cat===c?{background:accent,borderColor:accent}:{}}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="h-px bg-gray-800/60 mx-4"/>
      </div>

      <div className="flex-1 px-4 pt-4 pb-24">
        <BannerCarousel banners={banners} accent={accent}/>
        {filtered.length===0
          ? <div className="text-center py-16"><ShoppingBag size={48} className="mx-auto text-gray-700 mb-3"/><p className="text-gray-500">Nenhum produto encontrado</p></div>
          : <div className="grid grid-cols-2 gap-3">
              {filtered.map(p=>(
                <ProductCard key={p.id} product={p} onAdd={onAddToCart} cartQty={cart.find(c=>c.id===p.id)?.qty||0} accent={accent} onView={onViewProduct}/>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

function ProductCard({ product:p, onAdd, cartQty, accent, onView }){
  const hasSize = p.sizes&&p.sizes.length>0;
  return(
    <div className="bg-gray-900/80 border border-gray-700/40 rounded-2xl overflow-hidden flex flex-col card-enter">
      <div className="relative aspect-square bg-gray-800 cursor-pointer" onClick={()=>onView(p)}>
        {p.image
          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-600"/></div>
        }
        {p.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white/90 shadow"
            style={{ background: accent || '#7c3aed' }}>
            {p.category}
          </span>
        )}
        {p.featured&&<div className="absolute top-2 right-2 bg-yellow-500/90 rounded-full p-1"><Star size={10} className="text-white fill-white"/></div>}
        {cartQty>0&&<div className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow" style={{background:accent}}>{cartQty}</div>}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-white text-sm font-semibold leading-snug line-clamp-2 flex-1">{p.name}</p>
        <p className="text-lg font-bold mt-1 mb-2" style={{color:accent}}>{fmt(p.price)}</p>
        <button onClick={()=>onAdd(p)} className="w-full py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95" style={{background:accent}}>
          {hasSize?'Escolher Tamanho':'Adicionar'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 7. DETALHE DO PRODUTO
// ==========================================
function ProductDetailScreen({ product:p, onBack, onAddToCart, accent }){
  const [selSize,setSelSize]=useState(null);
  const [qty,setQty]=useState(1);
  const hasSize=p.sizes&&p.sizes.length>0;
  const maxStock=hasSize?(selSize?p.sizes.find(s=>s.size===selSize)?.stock||0:0):p.stock;

  const handleAdd=()=>{
    if(hasSize&&!selSize){ alert('Selecione um tamanho'); return; }
    onAddToCart(p,qty,selSize);
    onBack();
  };

  return(
    <div className="flex flex-col min-h-screen bg-gray-950">
      <div className="relative">
        <div className="aspect-square bg-gray-800">
          {p.image?<img src={p.image} alt={p.name} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center"><Package size={64} className="text-gray-600"/></div>}
        </div>
        <button onClick={onBack} className="absolute top-4 left-4 bg-black/50 backdrop-blur rounded-full p-2 text-white"><ArrowLeft size={20}/></button>
        {p.featured&&<div className="absolute top-4 right-4 bg-yellow-500/90 rounded-full px-3 py-1 flex items-center gap-1"><Star size={12} className="fill-white text-white"/><span className="text-white text-xs font-bold">Destaque</span></div>}
      </div>
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <p className="text-white text-xl font-bold leading-snug">{p.name}</p>
            {p.sku&&<p className="text-gray-500 text-xs mt-1">SKU: {p.sku}</p>}
          </div>
          <p className="text-2xl font-bold" style={{color:accent||'#7c3aed'}}>{fmt(p.price)}</p>
        </div>
        {p.description&&<p className="text-gray-400 text-sm mb-4 leading-relaxed">{p.description}</p>}
        {hasSize&&(
          <div className="mb-5">
            <p className="text-gray-300 text-sm font-semibold mb-2">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {p.sizes.map(s=>(
                <button key={s.size} onClick={()=>setSelSize(s.size)} disabled={s.stock===0}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${selSize===s.size?'text-white border-transparent':'bg-gray-800 text-gray-300 border-gray-700'} ${s.stock===0?'opacity-30 cursor-not-allowed':''}`}
                  style={selSize===s.size?{background:accent||'#7c3aed',borderColor:accent||'#7c3aed'}:{}}>
                  {s.size}
                  {s.stock<=3&&s.stock>0&&<span className="ml-1 text-orange-400 text-xs">({s.stock})</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {(!hasSize||selSize)&&(
          <div className="flex items-center gap-4 mb-6">
            <p className="text-gray-400 text-sm">Quantidade</p>
            <div className="flex items-center gap-3">
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700"><Minus size={16}/></button>
              <span className="text-white font-bold w-8 text-center text-lg">{qty}</span>
              <button onClick={()=>setQty(q=>Math.min(maxStock,q+1))} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700"><Plus size={16}/></button>
            </div>
            <p className="text-gray-500 text-xs">{maxStock} em estoque</p>
          </div>
        )}
        <button onClick={handleAdd} className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-98" style={{background:accent||'#7c3aed'}}>
          Adicionar ao Carrinho • {fmt(p.price*qty)}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 8. CARRINHO
// ==========================================
function CartScreen({ cart, onUpdateQty, onRemove, onCheckout, config }){
  const accent = config?.store_accent_color||'#7c3aed';
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);

  if(cart.length===0) return(
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-8">
      <ShoppingBag size={64} className="text-gray-700 mb-4"/>
      <p className="text-gray-400 text-lg font-medium">Carrinho vazio</p>
      <p className="text-gray-600 text-sm mt-1">Adicione produtos para continuar</p>
    </div>
  );

  return(
    <div className="flex flex-col min-h-screen bg-gray-950">
      <div className="sticky top-0 z-10 bg-gray-950 px-4 pt-4 pb-3 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Carrinho</h1>
        <p className="text-gray-400 text-sm">{cart.length} {cart.length===1?'item':'itens'}</p>
      </div>
      <div className="flex-1 px-4 py-4 space-y-3 pb-40">
        {cart.map(item=>(
          <div key={`${item.id}-${item.selectedSize||''}`} className="bg-gray-900/80 border border-gray-700/40 rounded-2xl p-3 flex gap-3">
            <div className="w-20 h-20 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0">
              {item.image?<img src={item.image} alt={item.name} className="w-full h-full object-cover"/>:<Package size={24} className="text-gray-600 m-auto mt-6"/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{item.name}</p>
              {item.selectedSize&&<p className="text-gray-500 text-xs mt-0.5">Tamanho: {item.selectedSize}</p>}
              <p className="font-bold mt-1" style={{color:accent}}>{fmt(item.price)}</p>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={()=>onUpdateQty(item,item.qty-1)} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700"><Minus size={12}/></button>
                <span className="text-white font-bold w-6 text-center text-sm">{item.qty}</span>
                <button onClick={()=>onUpdateQty(item,item.qty+1)} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700"><Plus size={12}/></button>
                <button onClick={()=>onRemove(item)} className="ml-auto text-red-400 hover:text-red-300 p-1"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-16 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-300">Total</span>
          <span className="text-white text-xl font-bold">{fmt(total)}</span>
        </div>
        <button onClick={onCheckout} className="w-full py-4 rounded-2xl text-white font-bold text-lg" style={{background:accent}}>
          Finalizar Pedido
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 9. CHECKOUT
// ==========================================
function CheckoutScreen({ cart, onBack, onConfirm, config }){
  const accent = config?.store_accent_color||'#7c3aed';
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [address,setAddress]=useState('');
  const [notes,setNotes]=useState('');
  const [loading,setLoading]=useState(false);
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);

  useEffect(()=>{
    const lead=JSON.parse(localStorage.getItem(LEAD_STORAGE_KEY)||'{}');
    if(lead.name) setName(lead.name);
    if(lead.phone){ const d=lead.phone; setPhone(d.length===11?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`); }
  },[]);

  const handleSubmit=async()=>{
    if(!name.trim()||!phone.trim()){ alert('Preencha nome e telefone'); return; }
    setLoading(true);
    try{
      const order=await createOrder({ customer_name:name.trim(), customer_phone:phone.replace(/\D/g,''), customer_address:address.trim()||null, notes:notes.trim()||null,
        items:cart.map(i=>({product_id:i.id,product_name:i.name,product_sku:i.sku||null,quantity:i.qty,unit_price:i.price,selected_size:i.selectedSize||null})),
        total_amount:total, status:'pendente' });
      onConfirm(order);
    }catch(e){ alert('Erro ao realizar pedido. Tente novamente.'); }
    finally{ setLoading(false); }
  };

  return(
    <div className="flex flex-col min-h-screen bg-gray-950">
      <div className="sticky top-0 z-10 bg-gray-950 px-4 pt-4 pb-3 border-b border-gray-800 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400"><ArrowLeft size={20}/></button>
        <h1 className="text-xl font-bold text-white">Finalizar Pedido</h1>
      </div>
      <div className="flex-1 p-4 space-y-4 pb-32">
        <div className="bg-gray-900/80 border border-gray-700/40 rounded-2xl p-4">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><User size={16}/>Seus dados</h2>
          <div className="space-y-3">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome completo *" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"/>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Telefone *" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"/>
            <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Endereço de entrega (opcional)" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"/>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observações (opcional)" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 resize-none"/>
          </div>
        </div>
        <div className="bg-gray-900/80 border border-gray-700/40 rounded-2xl p-4">
          <h2 className="text-white font-semibold mb-3">Resumo do pedido</h2>
          <div className="space-y-2">
            {cart.map(item=>(
              <div key={`${item.id}-${item.selectedSize||''}`} className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-gray-300 text-sm leading-tight">{item.name}</p>
                  {item.selectedSize&&<p className="text-gray-500 text-xs">Tam: {item.selectedSize}</p>}
                  <p className="text-gray-500 text-xs">x{item.qty}</p>
                </div>
                <p className="text-white text-sm font-semibold flex-shrink-0">{fmt(item.price*item.qty)}</p>
              </div>
            ))}
            <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
              <span className="text-white font-bold">Total</span>
              <span className="text-xl font-bold" style={{color:accent}}>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 p-4 pb-safe">
        <button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-2xl text-white font-bold text-lg disabled:opacity-60" style={{background:accent}}>
          {loading?'Processando...':'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 10. PEDIDOS DO CLIENTE
// ==========================================
function ClientOrdersScreen({ lead, config }){
  const accent = config?.store_accent_color||'#7c3aed';
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [expanded,setExpanded]=useState(null);

  useEffect(()=>{
    if(!lead?.phone) return;
    fetchOrders({customer_phone:lead.phone.replace(/\D/g,'')}).then(o=>{ setOrders(o); setLoading(false); }).catch(()=>setLoading(false));
  },[lead]);

  if(loading) return <div className="flex items-center justify-center min-h-screen bg-gray-950"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>;

  return(
    <div className="flex flex-col min-h-screen bg-gray-950">
      <div className="sticky top-0 z-10 bg-gray-950 px-4 pt-4 pb-3 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Meus Pedidos</h1>
        <p className="text-gray-400 text-sm">{orders.length} pedido{orders.length!==1?'s':''}</p>
      </div>
      <div className="flex-1 p-4 space-y-3 pb-24">
        {orders.length===0
          ? <div className="text-center py-16"><ClipboardList size={48} className="mx-auto text-gray-700 mb-3"/><p className="text-gray-500">Nenhum pedido ainda</p></div>
          : orders.map(order=>(
            <div key={order.id} className="bg-gray-900/80 border border-gray-700/40 rounded-2xl overflow-hidden">
              <button className="w-full p-4 flex items-start justify-between gap-3 text-left" onClick={()=>setExpanded(e=>e===order.id?null:order.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">#{String(order.id).slice(-6).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[order.status]||STATUS_COLORS.pendente}`}>{STATUS_LABELS[order.status]||order.status}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                  <p className="text-white font-bold mt-1" style={{color:accent}}>{fmt(order.total_amount)}</p>
                </div>
                <ChevronRight size={16} className={`text-gray-500 mt-1 transition-transform ${expanded===order.id?'rotate-90':''}`}/>
              </button>
              {expanded===order.id&&(
                <div className="border-t border-gray-700/50 p-4 space-y-2">
                  {(order.items||[]).map((item,i)=>(
                    <div key={i} className="flex justify-between items-start gap-2">
                      <div><p className="text-gray-300 text-sm">{item.product_name}</p>{item.selected_size&&<p className="text-gray-500 text-xs">Tam: {item.selected_size}</p>}<p className="text-gray-500 text-xs">x{item.quantity}</p></div>
                      <p className="text-white text-sm font-semibold">{fmt(item.unit_price*item.quantity)}</p>
                    </div>
                  ))}
                  {order.customer_address&&<p className="text-gray-400 text-xs pt-2 border-t border-gray-700/50 flex items-center gap-1"><MapPin size={12}/>{order.customer_address}</p>}
                  {order.notes&&<p className="text-gray-400 text-xs flex items-start gap-1"><Info size={12} className="mt-0.5 flex-shrink-0"/>{order.notes}</p>}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ==========================================
// 11. ADMIN — DASHBOARD
// ==========================================
function DashboardScreen({ products, orders, config }){
  const accent = config?.store_accent_color||'#7c3aed';

  const stats = useMemo(()=>{
    const sold = orders.filter(o=>o.status==='concluido');
    const revenue   = sold.reduce((s,o)=>s+Number(o.total_amount||0),0);
    const avgTicket = sold.length ? revenue/sold.length : 0;
    const pending   = orders.filter(o=>o.status==='pendente').length;
    const lowStock  = products.filter(p=>p.stock>0&&p.stock<=5).length;
    return { revenue, avgTicket, pending, lowStock, totalOrders:orders.length, completedOrders:sold.length };
  },[orders,products]);

  const recentOrders = useMemo(()=>[...orders].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5),[orders]);

  const chartData = useMemo(()=>{
    const days={};
    const now=new Date();
    for(let i=6;i>=0;i--){
      const d=new Date(now); d.setDate(d.getDate()-i);
      const k=d.toLocaleDateString('pt-BR',{weekday:'short'});
      days[k]=0;
    }
    orders.filter(o=>o.status==='concluido').forEach(o=>{
      const d=new Date(o.created_at);
      const k=d.toLocaleDateString('pt-BR',{weekday:'short'});
      if(days[k]!==undefined) days[k]+=Number(o.total_amount||0);
    });
    return Object.entries(days).map(([name,value])=>({name,value}));
  },[orders]);

  const topProducts = useMemo(()=>{
    const map={};
    orders.filter(o=>o.status==='concluido').forEach(o=>{
      (o.items||[]).forEach(item=>{
        if(!map[item.product_name]) map[item.product_name]={name:item.product_name,qty:0,revenue:0};
        map[item.product_name].qty+=item.quantity;
        map[item.product_name].revenue+=item.unit_price*item.quantity;
      });
    });
    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,5);
  },[orders]);

  return(
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Dashboard</h2>
          <p className="text-gray-400 text-sm">Visão geral do negócio</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:accent+'33'}}><BarChart3 size={20} style={{color:accent}}/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          {label:'Receita Total',value:fmt(stats.revenue),icon:DollarSign,color:'green'},
          {label:'Pedidos Concluídos',value:fmtN(stats.completedOrders),icon:CheckCircle2,color:'blue'},
          {label:'Ticket Médio',value:fmt(stats.avgTicket),icon:TrendingUp,color:'purple'},
          {label:'Pedidos Pendentes',value:fmtN(stats.pending),icon:Clock,color:'yellow'},
          {label:'Total de Pedidos',value:fmtN(stats.totalOrders),icon:ClipboardList,color:'indigo'},
          {label:'Estoque Baixo',value:fmtN(stats.lowStock),icon:AlertTriangle,color:'red'},
        ].map(({label,value,icon:Icon,color})=>(
          <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-2xl p-3`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-${color}-400 text-xs font-medium`}>{label}</p>
              <Icon size={16} className={`text-${color}-400`}/>
            </div>
            <p className={`text-${color}-300 text-lg font-bold`}>{value}</p>
          </div>
        ))}
      </div>
      {chartData.some(d=>d.value>0)&&(
        <div className="bg-gray-900/80 border border-gray-700/40 rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Receita (últimos 7 dias)</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{top:0,right:0,left:0,bottom:0}}>
              <XAxis dataKey="name" tick={{fill:'#6b7280',fontSize:10}} axisLine={false} tickLine={false}/>
              <ReTooltip formatter={v=>fmt(v)} contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'12px',color:'#fff',fontSize:'12px'}} cursor={{fill:'rgba(255,255,255,0.05)'}}/>
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {chartData.map((_,i)=><Cell key={i} fill={accent}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {topProducts.length>0&&(
        <div className="bg-gray-900/80 border border-gray-700/40 rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Top Produtos (por receita)</h3>
          <div className="space-y-2">
            {topProducts.map((p,i)=>(
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-4">{i+1}.</span>
                <div className="flex-1 min-w-0"><p className="text-gray-300 text-sm truncate">{p.name}</p><p className="text-gray-500 text-xs">{fmtN(p.qty)} vendidos</p></div>
                <p className="text-white text-sm font-bold flex-shrink-0">{fmt(p.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {recentOrders.length>0&&(
        <div className="bg-gray-900/80 border border-gray-700/40 rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Pedidos Recentes</h3>
          <div className="space-y-2">
            {recentOrders.map(o=>(
              <div key={o.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-700/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm font-medium truncate">{o.customer_name}</p>
                  <p className="text-gray-500 text-xs">#{String(o.id).slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white text-sm font-bold">{fmt(o.total_amount)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[o.status]||STATUS_COLORS.pendente}`}>{STATUS_LABELS[o.status]||o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 12. ADMIN — PEDIDOS
// ==========================================
function AdminOrdersScreen({ orders, onUpdateStatus, onConfirmSale, onCancel, onDelete, config }){
  const accent = config?.store_accent_color||'#7c3aed';
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState('todos');
  const [expanded,setExpanded]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);

  const filtered = useMemo(()=>{
    return orders.filter(o=>{
      const matchSearch=!search||(o.customer_name||'').toLowerCase().includes(search.toLowerCase())||String(o.id).includes(search);
      const matchFilter=filter==='todos'||o.status===filter;
      return matchSearch&&matchFilter;
    }).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  },[orders,search,filter]);

  const statusKeys=['todos','pendente','confirmado','em_separacao','saiu_entrega','concluido','cancelado'];

  return(
    <div className="flex flex-col min-h-screen bg-gray-950">
      <div className="sticky top-0 z-10 bg-gray-950 px-4 pt-4 pb-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">Pedidos</h1>
          <span className="text-gray-400 text-sm">{filtered.length} pedido{filtered.length!==1?'s':''}</span>
        </div>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pedido..." className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"/>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusKeys.map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filter===s?'text-white border-transparent':'bg-gray-800/60 text-gray-400 border-gray-700/40'}`}
              style={filter===s?{background:accent,borderColor:accent}:{}}>
              {s==='todos'?'Todos':STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3 pb-24">
        {filtered.length===0
          ? <div className="text-center py-16"><ClipboardList size={48} className="mx-auto text-gray-700 mb-3"/><p className="text-gray-500">Nenhum pedido encontrado</p></div>
          : filtered.map(order=>(
            <div key={order.id} className="bg-gray-900/80 border border-gray-700/40 rounded-2xl overflow-hidden">
              <button className="w-full p-4 text-left" onClick={()=>setExpanded(e=>e===order.id?null:order.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-sm">#{String(order.id).slice(-6).toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[order.status]||STATUS_COLORS.pendente}`}>{STATUS_LABELS[order.status]||order.status}</span>
                    </div>
                    <p className="text-gray-300 text-sm font-medium mt-1">{order.customer_name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{order.customer_phone} • {new Date(order.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold">{fmt(order.total_amount)}</p>
                    <ChevronRight size={14} className={`text-gray-500 ml-auto mt-1 transition-transform ${expanded===order.id?'rotate-90':''}`}/>
                  </div>
                </div>
              </button>
              {expanded===order.id&&(
                <div className="border-t border-gray-700/50 p-4 space-y-3">
                  <div className="space-y-1.5">
                    {(order.items||[]).map((item,i)=>(
                      <div key={i} className="flex justify-between items-start gap-2">
                        <div><p className="text-gray-300 text-sm">{item.product_name}</p>{item.selected_size&&<p className="text-gray-500 text-xs">Tam: {item.selected_size}</p>}<p className="text-gray-500 text-xs">x{item.quantity} • {fmt(item.unit_price)} cada</p></div>
                        <p className="text-white text-sm font-semibold">{fmt(item.unit_price*item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  {order.customer_address&&<p className="text-gray-400 text-xs flex items-center gap-1 pt-1 border-t border-gray-700/30"><MapPin size={12}/>{order.customer_address}</p>}
                  {order.notes&&<p className="text-gray-400 text-xs flex items-start gap-1"><Info size={12} className="mt-0.5 flex-shrink-0"/>{order.notes}</p>}
                  <div className="pt-2 border-t border-gray-700/30">
                    <p className="text-gray-500 text-xs mb-2">Atualizar status:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['pendente','confirmado','em_separacao','saiu_entrega','concluido','cancelado'].map(s=>(
                        <button key={s} onClick={()=>onUpdateStatus(order.id,s)} disabled={order.status===s}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${order.status===s?'opacity-100 cursor-default':'opacity-60 hover:opacity-100 bg-gray-800 border-gray-600'} ${STATUS_COLORS[s]}`}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {order.status==='pendente'&&<button onClick={()=>onConfirmSale(order.id)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-500 transition-colors">Confirmar Venda</button>}
                    {order.status!=='cancelado'&&order.status!=='concluido'&&<button onClick={()=>onCancel(order.id)} className="flex-1 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-900/40 hover:bg-red-900/70 transition-colors border border-red-500/30">Cancelar</button>}
                    <button onClick={()=>setConfirmDel(order.id)} className="py-2 px-3 rounded-xl text-xs font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
              )}
            </div>
          ))
        }
      </div>
      <Confirm open={!!confirmDel} onClose={()=>setConfirmDel(null)} onConfirm={()=>onDelete(confirmDel)} title="Excluir pedido?" message="Esta ação não pode ser desfeita." confirmText="Excluir" danger/>
    </div>
  );
}

// ==========================================
// 13. ADMIN — PRODUTOS
// ==========================================
function AdminProductsScreen({ products, onSave, onDelete, config }){
  const accent = config?.store_accent_color||'#7c3aed';
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [search,setSearch]=useState('');
  const [confirmDel,setConfirmDel]=useState(null);

  const filtered = useMemo(()=>products.filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())),[products,search]);

  const openNew=()=>{ setEditing({name:'',price:'',category:'VESTUÁRIO',stock:'',image:'',sku:'',description:'',sizes:[],featured:false}); setModal(true); };
  const openEdit=p=>{ setEditing({...p}); setModal(true); };

  const handleSave=async(data)=>{
    const product={...data,price:parseFloat(data.price)||0,stock:parseInt(data.stock)||0};
    await onSave(product);
    setModal(false);
  };

  return(
    <div className="flex flex-col min-h-screen bg-gray-950">
      <div className="sticky top-0 z-10 bg-gray-950 px-4 pt-4 pb-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">Produtos</h1>
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-semibold" style={{background:accent}}><Plus size={16}/>Novo</button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"/>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3 pb-24">
        {filtered.length===0
          ? <div className="text-center py-16"><Package size={48} className="mx-auto text-gray-700 mb-3"/><p className="text-gray-500">Nenhum produto</p></div>
          : filtered.map(p=>(
            <div key={p.id} className="bg-gray-900/80 border border-gray-700/40 rounded-2xl flex gap-3 p-3">
              <div className="w-20 h-20 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0 cursor-pointer" onClick={()=>openEdit(p)}>
                {p.image?<img src={p.image} alt={p.name} className="w-full h-full object-cover"/>:<Package size={24} className="text-gray-600 m-auto mt-7"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">{p.name}</p>
                {p.sku&&<p className="text-gray-500 text-xs mt-0.5">{p.sku}</p>}
                <p className="font-bold mt-1 text-sm" style={{color:accent}}>{fmt(p.price)}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock>5?'bg-green-500/20 text-green-400':'p.stock>0'?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400'}`}>
                    {p.stock>0?`${p.stock} un`:'Sem estoque'}
                  </span>
                  {p.category&&<span className="text-xs text-gray-500">{p.category}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={()=>openEdit(p)} className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><Edit3 size={14}/></button>
                <button onClick={()=>setConfirmDel(p.id)} className="p-2 rounded-xl bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
              </div>
            </div>
          ))
        }
      </div>
      {modal&&editing&&<ProductFormModal product={editing} onSave={handleSave} onClose={()=>setModal(false)} accent={accent}/>}
      <Confirm open={!!confirmDel} onClose={()=>setConfirmDel(null)} onConfirm={()=>onDelete(confirmDel)} title="Excluir produto?" message="Esta ação não pode ser desfeita." confirmText="Excluir" danger/>
    </div>
  );
}

function ProductFormModal({ product:initial, onSave, onClose, accent }){
  const [form,setForm]=useState({...initial});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const addSize=()=>setForm(f=>({...f,sizes:[...(f.sizes||[]),{size:'',stock:0}]}));
  const updSize=(i,k,v)=>setForm(f=>({...f,sizes:f.sizes.map((s,idx)=>idx===i?{...s,[k]:v}:s)}));
  const remSize=i=>setForm(f=>({...f,sizes:f.sizes.filter((_,idx)=>idx!==i)}));

  const handleSubmit=async()=>{
    if(!form.name.trim()){ alert('Nome é obrigatório'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return(
    <Modal open onClose={onClose} title={form.id?'Editar Produto':'Novo Produto'} size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1 block">Nome *</label>
          <input value={form.name} onChange={e=>set('name',e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Preço *</label>
            <input value={form.price} onChange={e=>set('price',e.target.value)} type="number" step="0.01" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"/>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Estoque</label>
            <input value={form.stock} onChange={e=>set('stock',e.target.value)} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">SKU</label>
            <input value={form.sku||''} onChange={e=>set('sku',e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"/>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Categoria</label>
            <select value={form.category||'VESTUÁRIO'} onChange={e=>set('category',e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500">
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1 block">URL da Imagem</label>
          <input value={form.image||''} onChange={e=>set('image',e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500" placeholder="https://..."/>
          {form.image&&<img src={form.image} alt="preview" className="mt-2 h-24 rounded-xl object-cover"/>}
        </div>
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1 block">Descrição</label>
          <textarea value={form.description||''} onChange={e=>set('description',e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"/>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-xs font-medium">Tamanhos</label>
            <button onClick={addSize} className="text-violet-400 text-xs flex items-center gap-1 hover:text-violet-300"><Plus size={12}/>Adicionar</button>
          </div>
          <div className="space-y-2">
            {(form.sizes||[]).map((s,i)=>(
              <div key={i} className="flex gap-2 items-center">
                <input value={s.size} onChange={e=>updSize(i,'size',e.target.value)} placeholder="P/M/G" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"/>
                <input value={s.stock} onChange={e=>updSize(i,'stock',parseInt(e.target.value)||0)} type="number" placeholder="Qtd" className="w-20 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"/>
                <button onClick={()=>remSize(i)} className="text-red-400 hover:text-red-300 p-1"><X size={14}/></button>
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`w-10 h-6 rounded-full transition-colors ${form.featured?'bg-violet-600':'bg-gray-700'} relative`} onClick={()=>set('featured',!form.featured)}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.featured?'left-5':'left-1'}`}/>
          </div>
          <span className="text-gray-300 text-sm">Produto em destaque</span>
        </label>
        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{background:accent}}>
          {saving?'Salvando...':'Salvar Produto'}
        </button>
      </div>
    </Modal>
  );
}

// ==========================================
// 14. ADMIN — CONFIGURAÇÕES
// ==========================================
function AdminSettingsScreen({ config, onSave, show }){
  const [form,setForm]=useState({...SITE_DEFAULT_CONFIG,...(config||{})});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  useEffect(()=>{ if(config) setForm({...SITE_DEFAULT_CONFIG,...config}); },[config]);

  const handleSave=async()=>{
    setSaving(true);
    await onSave(form);
    setSaving(false);
    show('Configurações salvas!','success');
  };

  return(
    <div className="flex flex-col min-h-screen bg-gray-950">
      <div className="sticky top-0 z-10 bg-gray-950 px-4 pt-4 pb-3 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Configurações</h1>
      </div>
      <div className="flex-1 p-4 space-y-5 pb-32">
        <Section title="Identidade da Loja">
          <Field label="Nome da Loja"><input value={form.store_name||''} onChange={e=>set('store_name',e.target.value)} className={inputCls}/></Field>
          <Field label="Slogan"><input value={form.store_tagline||''} onChange={e=>set('store_tagline',e.target.value)} className={inputCls} placeholder="Ex: Os melhores preços"/></Field>
          <Field label="Logo URL"><input value={form.store_logo_url||''} onChange={e=>set('store_logo_url',e.target.value)} className={inputCls} placeholder="https://..."/></Field>
          {form.store_logo_url&&<img src={form.store_logo_url} alt="logo preview" className="h-16 rounded-xl object-contain"/>}
        </Section>
        <Section title="Cores">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cor de Fundo"><div className="flex gap-2 items-center"><input type="color" value={form.store_background_color||'#0f172a'} onChange={e=>set('store_background_color',e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"/><input value={form.store_background_color||'#0f172a'} onChange={e=>set('store_background_color',e.target.value)} className={`${inputCls} flex-1`}/></div></Field>
            <Field label="Cor de Destaque"><div className="flex gap-2 items-center"><input type="color" value={form.store_accent_color||'#7c3aed'} onChange={e=>set('store_accent_color',e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"/><input value={form.store_accent_color||'#7c3aed'} onChange={e=>set('store_accent_color',e.target.value)} className={`${inputCls} flex-1`}/></div></Field>
          </div>
        </Section>
        <Section title="Contato & Redes">
          <Field label="WhatsApp"><input value={form.whatsapp_number||''} onChange={e=>set('whatsapp_number',e.target.value)} className={inputCls} placeholder="5511999999999"/></Field>
          <Field label="Instagram"><input value={form.instagram_handle||''} onChange={e=>set('instagram_handle',e.target.value)} className={inputCls} placeholder="@suaconta"/></Field>
          <Field label="Endereço"><input value={form.store_address||''} onChange={e=>set('store_address',e.target.value)} className={inputCls} placeholder="Rua..."/></Field>
        </Section>
        <Section title="Configurações de Pedidos">
          <Field label="Mensagem de boas-vindas">
            <textarea value={form.welcome_message||''} onChange={e=>set('welcome_message',e.target.value)} rows={3} className={`${inputCls} resize-none`}/>
          </Field>
          <Field label="Mensagem de confirmação">
            <textarea value={form.order_confirmation_message||''} onChange={e=>set('order_confirmation_message',e.target.value)} rows={3} className={`${inputCls} resize-none`}/>
          </Field>
        </Section>
        <button onClick={handleSave} disabled={saving} className="w-full py-3.5 rounded-2xl text-white font-bold text-base disabled:opacity-60 bg-violet-600 hover:bg-violet-500 transition-colors">
          {saving?'Salvando...':'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
const inputCls="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500";
function Section({title,children}){ return <div className="bg-gray-900/80 border border-gray-700/40 rounded-2xl p-4 space-y-3"><h3 className="text-white font-semibold text-sm">{title}</h3>{children}</div>; }
function Field({label,children}){ return <div><label className="text-gray-400 text-xs font-medium mb-1 block">{label}</label>{children}</div>; }

// ==========================================
// 15. ADMIN — BANNERS
// ==========================================
function AdminBannersScreen({ banners, onSave, show }){
  const [list,setList]=useState(banners||[]);
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);
  const accent='#7c3aed';

  useEffect(()=>setList(banners||[]),[banners]);

  const openNew=()=>{ setEditing({id:Date.now(),imageUrl:'',title:'',subtitle:'',active:true}); setModal(true); };
  const openEdit=b=>{ setEditing({...b}); setModal(true); };

  const handleSave=async(banner)=>{
    setSaving(true);
    const newList = banner.id&&list.find(b=>b.id===banner.id) ? list.map(b=>b.id===banner.id?banner:b) : [...list,{...banner,id:Date.now()}];
    setList(newList);
    await onSave(newList);
    setSaving(false);
    setModal(false);
    show('Banner salvo!','success');
  };

  const handleDelete=async(id)=>{
    const newList=list.filter(b=>b.id!==id);
    setList(newList);
    await onSave(newList);
    show('Banner removido','info');
  };

  const toggleActive=async(id)=>{
    const newList=list.map(b=>b.id===id?{...b,active:!b.active}:b);
    setList(newList);
    await onSave(newList);
  };

  return(
    <div className="flex flex-col min-h-screen bg-gray-950">
      <div className="sticky top-0 z-10 bg-gray-950 px-4 pt-4 pb-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Banners</h1>
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-semibold" style={{background:accent}}><Plus size={16}/>Novo</button>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3 pb-24">
        {list.length===0
          ? <div className="text-center py-16"><ImagePlus size={48} className="mx-auto text-gray-700 mb-3"/><p className="text-gray-500">Nenhum banner ainda</p></div>
          : list.map(b=>(
            <div key={b.id} className="bg-gray-900/80 border border-gray-700/40 rounded-2xl overflow-hidden">
              {b.imageUrl&&<div className="aspect-video bg-gray-800"><img src={b.imageUrl} alt={b.title||''} className="w-full h-full object-cover"/></div>}
              <div className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {b.title&&<p className="text-white font-semibold text-sm truncate">{b.title}</p>}
                  {b.subtitle&&<p className="text-gray-400 text-xs truncate">{b.subtitle}</p>}
                  <div className={`mt-1 text-xs font-semibold ${b.active!==false?'text-green-400':'text-gray-500'}`}>{b.active!==false?'Ativo':'Inativo'}</div>
                </div>
                <button onClick={()=>toggleActive(b.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${b.active!==false?'bg-green-500/10 text-green-400 border-green-500/30':'bg-gray-800 text-gray-400 border-gray-700'}`}>{b.active!==false?'Desativar':'Ativar'}</button>
                <button onClick={()=>openEdit(b)} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white"><Edit3 size={14}/></button>
                <button onClick={()=>handleDelete(b.id)} className="p-2 rounded-xl bg-gray-800 text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
              </div>
            </div>
          ))
        }
      </div>
      {modal&&editing&&(
        <Modal open onClose={()=>setModal(false)} title={editing.id&&list.find(b=>b.id===editing.id)?'Editar Banner':'Novo Banner'}>
          <div className="space-y-4">
            <Field label="URL da Imagem *"><input value={editing.imageUrl||''} onChange={e=>setEditing(v=>({...v,imageUrl:e.target.value}))} className={inputCls} placeholder="https://..."/></Field>
            {editing.imageUrl&&<div className="aspect-video bg-gray-800 rounded-xl overflow-hidden"><img src={editing.imageUrl} alt="preview" className="w-full h-full object-cover"/></div>}
            <Field label="Título"><input value={editing.title||''} onChange={e=>setEditing(v=>({...v,title:e.target.value}))} className={inputCls}/></Field>
            <Field label="Subtítulo"><input value={editing.subtitle||''} onChange={e=>setEditing(v=>({...v,subtitle:e.target.value}))} className={inputCls}/></Field>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-colors ${editing.active!==false?'bg-violet-600':'bg-gray-700'} relative`} onClick={()=>setEditing(v=>({...v,active:!v.active}))}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editing.active!==false?'left-5':'left-1'}`}/>
              </div>
              <span className="text-gray-300 text-sm">Banner ativo</span>
            </label>
            <button onClick={()=>handleSave(editing)} disabled={saving||!editing.imageUrl} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 bg-violet-600 hover:bg-violet-500">
              {saving?'Salvando...':'Salvar Banner'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==========================================
// 16. APP PRINCIPAL
// ==========================================
export default function App(){
  // ── STATE ──
  const [screen,setScreen]=useState('store');
  const [adminTab,setAdminTab]=useState('dashboard');
  const [cart,setCart]=useState([]);
  const [products,setProducts]=useState([]);
  const [orders,setOrders]=useState([]);
  const [config,setConfig]=useState(null);
  const [banners,setBanners]=useState([]);
  const [lead,setLead]=useState(null);
  const [viewProduct,setViewProduct]=useState(null);
  const [checkoutDone,setCheckoutDone]=useState(null);
  const [loading,setLoading]=useState(true);
  const [isAdmin,setIsAdmin]=useState(false);
  const [adminPw,setAdminPw]=useState('');
  const [adminPwModal,setAdminPwModal]=useState(false);
  const {toasts,show}=useToast();
  const scrollRef = useRef(null);

  // ── BOOT ──
  useEffect(()=>{
    const init=async()=>{
      try{
        const [prods,cfg]=await Promise.all([fetchProducts(),fetchSiteConfig()]);
        setProducts(prods.length?prods:DEFAULT_PRODUCTS);
        setConfig(cfg);
        const savedBanners=localStorage.getItem(BANNERS_STORAGE_KEY);
        if(savedBanners) try{ setBanners(JSON.parse(savedBanners)); }catch(e){}
        const savedLead=localStorage.getItem(LEAD_STORAGE_KEY);
        if(savedLead) try{ setLead(JSON.parse(savedLead)); }catch(e){}
      }catch(e){
        setProducts(DEFAULT_PRODUCTS);
      }finally{ setLoading(false); }
    };
    init();
  },[]);

  useEffect(()=>{
    if(!isAdmin) return;
    fetchOrders().then(setOrders).catch(()=>{});
  },[isAdmin]);

  // ── SCROLL-TO-TOP on tab change ──
  useEffect(()=>{
    if(scrollRef.current) scrollRef.current.scrollTop = 0;
    else window.scrollTo({top:0,behavior:'instant'});
  },[screen, adminTab]);

  // ── CART ──
  const addToCart=(product,qty=1,size=null)=>{
    if(product.sizes&&product.sizes.length>0&&!size){ setViewProduct(product); setScreen('product'); return; }
    setCart(c=>{
      const key=`${product.id}-${size||''}`;
      const existing=c.find(i=>`${i.id}-${i.selectedSize||''}`===key);
      if(existing) return c.map(i=>`${i.id}-${i.selectedSize||''}`===key?{...i,qty:i.qty+qty}:i);
      return [...c,{...product,qty,selectedSize:size}];
    });
    show(`${product.name} adicionado!`,'success');
  };

  const updateQty=(item,qty)=>{
    if(qty<=0){ setCart(c=>c.filter(i=>!(i.id===item.id&&i.selectedSize===item.selectedSize))); return; }
    setCart(c=>c.map(i=>i.id===item.id&&i.selectedSize===item.selectedSize?{...i,qty}:i));
  };

  const removeItem=(item)=>setCart(c=>c.filter(i=>!(i.id===item.id&&i.selectedSize===item.selectedSize)));

  // ── CHECKOUT ──
  const handleCheckoutConfirm=async(order)=>{
    setCart([]);
    setCheckoutDone(order);
    setScreen('orderDone');
  };

  // ── ADMIN ACTIONS ──
  const handleSaveProduct=async(product)=>{
    const saved=await upsertProduct(product);
    setProducts(p=>p.find(x=>x.id===saved.id)?p.map(x=>x.id===saved.id?saved:x):[...p,saved]);
    show('Produto salvo!','success');
  };

  const handleDeleteProduct=async(id)=>{
    await deleteProductRemote(id);
    setProducts(p=>p.filter(x=>x.id!==id));
    show('Produto removido','info');
  };

  const handleUpdateOrderStatus=async(id,status)=>{
    await updateOrderStatus(id,status);
    setOrders(o=>o.map(x=>x.id===id?{...x,status}:x));
    show('Status atualizado','success');
  };

  const handleConfirmSale=async(id)=>{
    await confirmOrderSale(id);
    setOrders(o=>o.map(x=>x.id===id?{...x,status:'confirmado'}:x));
    show('Venda confirmada!','success');
  };

  const handleCancelOrder=async(id)=>{
    await cancelOrderRemote(id);
    setOrders(o=>o.map(x=>x.id===id?{...x,status:'cancelado'}:x));
    show('Pedido cancelado','info');
  };

  const handleDeleteOrder=async(id)=>{
    await deleteOrderRemote(id);
    setOrders(o=>o.filter(x=>x.id!==id));
    show('Pedido excluído','info');
  };

  const handleSaveConfig=async(cfg)=>{
    await upsertSiteConfig(cfg);
    setConfig(cfg);
  };

  const handleSaveBanners=async(list)=>{
    setBanners(list);
    localStorage.setItem(BANNERS_STORAGE_KEY,JSON.stringify(list));
  };

  // ── ADMIN LOGIN ──
  const tryAdminLogin=()=>{
    if(adminPw==='admin123'||adminPw==='1234'){ setIsAdmin(true); setAdminPwModal(false); setScreen('admin'); setAdminTab('dashboard'); show('Modo admin ativo','success'); }
    else{ show('Senha incorreta','error'); }
    setAdminPw('');
  };

  // ── RENDER HELPERS ──
  const accent=config?.store_accent_color||'#7c3aed';
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);

  if(loading) return <LoadingScreen/>;
  if(!lead&&screen!=='admin') return <LoginScreen onLogin={l=>{ setLead(l); setScreen('store'); }} config={config}/>;

  // ── PRODUCT DETAIL ──
  if(screen==='product'&&viewProduct) return(
    <>
      <ProductDetailScreen product={viewProduct} onBack={()=>{ setViewProduct(null); setScreen('store'); }} onAddToCart={addToCart} accent={accent}/>
      <Toast toasts={toasts}/>
    </>
  );

  // ── ORDER DONE ──
  if(screen==='orderDone'&&checkoutDone) return(
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6"><CheckCircle2 size={40} className="text-green-400"/></div>
      <h1 className="text-2xl font-bold text-white mb-2">Pedido Realizado!</h1>
      <p className="text-gray-400 text-center mb-1">#{String(checkoutDone.id).slice(-6).toUpperCase()}</p>
      <p className="text-gray-400 text-center mb-6 text-sm">Em breve entraremos em contato para confirmar seu pedido.</p>
      <button onClick={()=>{ setCheckoutDone(null); setScreen('store'); }} className="px-8 py-3 rounded-2xl text-white font-bold" style={{background:accent}}>Continuar Comprando</button>
      <Toast toasts={toasts}/>
    </div>
  );

  // ── CHECKOUT ──
  if(screen==='checkout') return(
    <>
      <CheckoutScreen cart={cart} onBack={()=>setScreen('cart')} onConfirm={handleCheckoutConfirm} config={config}/>
      <Toast toasts={toasts}/>
    </>
  );

  // ── ADMIN ──
  if(screen==='admin'&&isAdmin){
    const ADMIN_TABS=[
      {id:'dashboard',label:'Dashboard',icon:LayoutDashboard},
      {id:'orders',label:'Pedidos',icon:ClipboardList},
      {id:'products',label:'Produtos',icon:Package},
      {id:'banners',label:'Banners',icon:ImagePlus},
      {id:'settings',label:'Config',icon:Settings},
    ];
    return(
      <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          {adminTab==='dashboard'&&<DashboardScreen products={products} orders={orders} config={config}/>}
          {adminTab==='orders'&&<AdminOrdersScreen orders={orders} onUpdateStatus={handleUpdateOrderStatus} onConfirmSale={handleConfirmSale} onCancel={handleCancelOrder} onDelete={handleDeleteOrder} config={config}/>}
          {adminTab==='products'&&<AdminProductsScreen products={products} onSave={handleSaveProduct} onDelete={handleDeleteProduct} config={config}/>}
          {adminTab==='banners'&&<AdminBannersScreen banners={banners} onSave={handleSaveBanners} show={show}/>}
          {adminTab==='settings'&&<AdminSettingsScreen config={config} onSave={handleSaveConfig} show={show}/>}
        </div>
        <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur border-t border-gray-800">
          <div className="flex">
            {ADMIN_TABS.map(({id,label,icon:Icon})=>(
              <button key={id} onClick={()=>setAdminTab(id)} className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${adminTab===id?'text-violet-400':'text-gray-500 hover:text-gray-300'}`}>
                <Icon size={20}/>
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <Toast toasts={toasts}/>
      </div>
    );
  }

  // ── MAIN CLIENT APP ──
  const TABS=[
    {id:'store',label:'Loja',icon:Home},
    {id:'cart',label:'Carrinho',icon:ShoppingBag,badge:cartCount},
    {id:'orders',label:'Pedidos',icon:ClipboardList},
  ];

  return(
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {screen==='store'&&<StoreScreen products={products} onAddToCart={addToCart} cart={cart} config={config} banners={banners} onViewProduct={p=>{ setViewProduct(p); setScreen('product'); }}/>}
        {screen==='cart'&&<CartScreen cart={cart} onUpdateQty={updateQty} onRemove={removeItem} onCheckout={()=>setScreen('checkout')} config={config}/>}
        {screen==='orders'&&<ClientOrdersScreen lead={lead} config={config}/>}
      </div>
      <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur border-t border-gray-800">
        <div className="flex relative">
          {TABS.map(({id,label,icon:Icon,badge})=>(
            <button key={id} onClick={()=>setScreen(id)} className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors relative ${screen===id?'':'text-gray-500 hover:text-gray-300'}`} style={screen===id?{color:accent}:{}}>
              <div className="relative">
                <Icon size={22}/>
                {badge>0&&<span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5" style={{background:accent}}>{badge}</span>}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
          <button onClick={()=>{ if(isAdmin){ setScreen('admin'); }else{ setAdminPwModal(true); } }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-gray-400">
            <Settings size={16}/>
          </button>
        </div>
      </div>
      <Modal open={adminPwModal} onClose={()=>{ setAdminPwModal(false); setAdminPw(''); }} title="Acesso Admin" size="sm">
        <div className="space-y-4">
          <input type="password" value={adminPw} onChange={e=>setAdminPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&tryAdminLogin()} placeholder="Senha de administrador" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500" autoFocus/>
          <button onClick={tryAdminLogin} className="w-full py-3 rounded-xl text-white font-bold text-sm bg-violet-600 hover:bg-violet-500">Entrar</button>
        </div>
      </Modal>
      <Toast toasts={toasts}/>

      <style>{`
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
        .card-enter { animation: cardEnter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
}
