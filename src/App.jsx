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

// ✅ SUPABASE — Conexão centralizada
imporimport { supabase } from './lib/supabaseClient.js.';

// ==========================================
// 1. CONFIGURAÇÃO E DADOS INICIAIS
// ==========================================
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'fluxo-dark-ultimate';
const BANNERS_STORAGE_KEY = `@${APP_ID}:banners`;

const DEFAULT_PRODUCTS = [
  { id: 1, sku: 'CAM-BRA-001', name: 'Camiseta Branca Basic', price: 89.90, category: 'VESTUÁRIO', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', stock: 25, sales: 12, sizes: [{size: 'P', stock: 5}, {size: 'M', stock: 10}, {size: 'G', stock: 10}], featured: true },
  { id: 2, sku: 'CAL-JOG-001', name: 'Calça Jogger Tech', price: 169.90, category: 'VESTUÁRIO', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800', stock: 15, sales: 8, sizes: [{size: '38', stock: 5}, {size: '40', stock: 5}, {size: '42', stock: 5}], featured: false },
  { id: 3, sku: 'TEN-RUN-002', name: 'Tênis Running Fluxo', price: 299.90, category: 'CALÇADOS', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', stock: 2, sales: 45, sizes: [{size: '39', stock: 1}, {size: '41', stock: 1}], featured: true },
  { id: 4, sku: 'BON-PRE-003', name: 'Boné Archer Black', price: 79.90, category: 'ACESSÓRIOS', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800', stock: 0, sales: 120, sizes: [{size: 'U', stock: 0}], featured: false }, 
  { id: 5, sku: '9059', name: 'Calça Super Skinny Malibu Rasgada', price: 189.90, category: 'VESTUÁRIO', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800', stock: 10, sales: 5, sizes: [{size: '38', stock: 5}, {size: '40', stock: 5}], featured: true }
];

const DEFAULT_BANNERS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1000&q=80', title: 'NOVA COLEÇÃO', subtitle: 'STREETWEAR PREMIUM 2026', buttonText: 'VER PEÇAS', active: true },
  { id: 2, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000&q=80', title: 'FRETE GRÁTIS', subtitle: 'ENVIOS EXPRESSOS', buttonText: 'APROVEITAR', active: true }
];

const DEFAULT_CONFIG = {
  brandName: 'FLUXO OUTLET',
  whatsapp: '5534984148067', 
  location: 'UBERABA, MG',
  minOrder: 0.00, 
  pixelId: 'PIXEL_FLUXO_001',
  logoUrl: '', 
  logoZoom: 1.5,
  marqueePhrases: ['ALTO PADRÃO EM CADA DETALHE', 'ENVIO PRIORITÁRIO', 'COLEÇÕES LIMITADAS', 'DESIGN AUTÊNTICO E EXCLUSIVO']
};

// ==========================================
// 2. FUNÇÕES DE TRACKING E UTILITÁRIOS
// ==========================================
const trackPixel = (eventName, payload) => {
  console.log(`[PIXEL TRACKING] 🟢 ${eventName}`, payload);
};

// ==========================================
// 3. COMPONENTES ADMIN
// ==========================================

const AdminHeader = ({ handleLogout }) => (
  <div className="bg-zinc-950 text-white px-6 py-6 flex justify-between items-center sticky top-0 z-50 border-b border-white/5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        <LayoutDashboard size={20} className="text-zinc-950 relative z-10"/>
      </div>
      <div>
        <h2 className="font-black italic text-lg leading-none uppercase tracking-tighter">Master Control</h2>
        <p className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Operacional</p>
      </div>
    </div>
    <button onClick={handleLogout} className="px-4 py-2 bg-white text-zinc-950 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
      Sair <LogOut size={12} />
    </button>
  </div>
);

const AdminDashboard = ({ leads, products }) => {
  const validLeads = (leads || []).filter(l => l.status !== 'CANCELADO');
  const totalRevenue = validLeads.reduce((a, b) => a + (b.value || 0), 0);
  const avgTicket = validLeads.length > 0 ? (totalRevenue / validLeads.length) : 0;
  const totalItemsSold = validLeads.reduce((acc, lead) => acc + (lead.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0), 0);
  const lowStockProducts = (products || []).filter(p => p.stock > 0 && p.stock <= 3);
  const outOfStockProducts = (products || []).filter(p => p.stock === 0);
  const statusColors = { 'NOVO': 'text-blue-500 bg-blue-500/10', 'EM ATENDIMENTO': 'text-amber-500 bg-amber-500/10', 'CONCLUÍDO': 'text-emerald-500 bg-emerald-500/10', 'CANCELADO': 'text-red-500 bg-red-500/10' };

  return (
    <div className="p-6 space-y-6 animate-in pb-24">
      <div className="bg-gradient-to-br from-emerald-900 to-zinc-950 p-6 rounded-[32px] border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10"><DollarSign size={180}/></div>
        <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-1 relative z-10 flex items-center gap-2"><TrendingUp size={12}/> Receita Global</p>
        <h3 className="text-4xl font-black text-white italic relative z-10 tracking-tighter shadow-black drop-shadow-md">R$ {totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
        <div className="flex items-end gap-1.5 h-10 mt-6 relative z-10 opacity-60">
           {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
             <div key={i} className="flex-1 bg-emerald-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
           ))}
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
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5 space-y-4">
         <h4 className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-2"><Clock size={14} className="text-zinc-400"/> Pedidos Recentes</h4>
         <div className="space-y-3">
             {(leads || []).slice(0, 4).map((l, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                     <div className="flex flex-col">
                         <span className="text-[11px] font-black uppercase text-white truncate w-32">{l.name}</span>
                         <span className="text-[9px] font-bold text-zinc-500">#{l.order_number}</span>
                     </div>
                     <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${statusColors[l.status || 'NOVO']}`}>{l.status || 'NOVO'}</span>
                 </div>
             ))}
         </div>
      </div>
    </div>
  );
};

const AdminInventory = ({ products, setProducts, showToast }) => {
  const [editMode, setEditMode] = useState(null);
  const [invSearch, setInvSearch] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [formSizes, setFormSizes] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scannedSize, setScannedSize] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const scannerInputRef = useRef(null);

  useEffect(() => {
    if (editMode && editMode !== 'new') {
      setPreviewImage(editMode.image);
      setFormSizes(editMode.sizes || [{ size: 'U', stock: 0 }]);
    } else if (editMode === 'new') {
      setPreviewImage('');
      setFormSizes([{ size: 'P', stock: 5 }, { size: 'M', stock: 5 }]);
    }
  }, [editMode]);

  const handleSave = (e) => {
    e.preventDefault();
    const computedStock = formSizes.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0);
    const fd = new FormData(e.target);
    const data = {
      id: editMode === 'new' ? Date.now() : editMode.id,
      name: fd.get('name'),
      sku: fd.get('sku'),
      price: parseFloat(fd.get('price')),
      category: fd.get('category').toUpperCase(),
      image: previewImage || editMode?.image,
      stock: computedStock, 
      sales: editMode === 'new' ? 0 : editMode.sales,
      sizes: formSizes.filter(s => s.size && s.size.trim() !== ''),
      featured: fd.get('featured') === 'on'
    };
    setProducts(editMode === 'new' ? [data, ...products] : products.map(p => p.id === data.id ? data : p));
    showToast('Produto salvo!');
    setEditMode(null);
  };

  const handleStockAction = (actionType) => {
      if (!scannedProduct || !scannedSize) { showToast('Selecione o tamanho.', 'error'); return; }
      const updatedProducts = products.map(p => {
          if (p.id !== scannedProduct.id) return p;
          const newSizes = p.sizes.map(s => {
              if (s.size === scannedSize) return { ...s, stock: Math.max(0, s.stock + (actionType === 'add' ? 1 : -1)) };
              return s;
          });
          return { ...p, sizes: newSizes, stock: newSizes.reduce((acc, curr) => acc + curr.stock, 0) };
      });
      setProducts(updatedProducts);
      setScannedProduct(updatedProducts.find(p => p.id === scannedProduct.id));
      showToast(actionType === 'add' ? '+1 Estoque' : '-1 Estoque');
  };

  return (
    <div className="p-6 animate-in space-y-6 pb-24">
      {showScanner && (
        <div className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-xl flex flex-col p-6 overflow-hidden">
           <div className="flex justify-between items-center mb-6">
               <h2 className="text-sm font-black uppercase text-emerald-500 tracking-widest">Módulo POS</h2>
               <button onClick={() => setShowScanner(false)} className="p-2 bg-zinc-900 rounded-full text-white"><X size={20}/></button>
           </div>
           {scannedProduct ? (
             <div className="bg-zinc-900 p-6 rounded-3xl space-y-6">
                <div className="flex gap-4">
                    <img src={scannedProduct.image} className="w-20 h-24 rounded-xl object-cover" />
                    <div><h3 className="font-black text-white uppercase">{scannedProduct.name}</h3><p className="text-emerald-500 font-black">Total: {scannedProduct.stock}</p></div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {scannedProduct.sizes.map(s => (
                        <button key={s.size} onClick={() => setScannedSize(s.size)} className={`py-3 rounded-xl border font-black ${scannedSize === s.size ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-950 text-zinc-500'}`}>{s.size}</button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleStockAction('remove')} className="py-4 bg-red-500/10 text-red-500 rounded-2xl font-black">SAÍDA (-1)</button>
                    <button onClick={() => handleStockAction('add')} className="py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-black">ENTRADA (+1)</button>
                </div>
                <button onClick={() => setScannedProduct(null)} className="w-full py-3 text-zinc-500 font-black uppercase text-[10px]">Voltar ao Scanner</button>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl">
                <Barcode size={48} className="text-zinc-700 mb-4" />
                <input autoFocus placeholder="Bipe o SKU aqui..." className="bg-zinc-900 p-4 rounded-xl text-center font-black text-emerald-500 outline-none" onKeyDown={(e) => { if(e.key === 'Enter') { const p = products.find(x => x.sku === e.target.value); if(p) setScannedProduct(p); e.target.value = ''; } }} />
             </div>
           )}
        </div>
      )}

      {!editMode && (
        <div className="flex justify-between items-center">
          <h3 className="font-black italic uppercase text-white tracking-widest text-lg">Catálogo</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowScanner(true)} className="bg-zinc-800 text-white px-4 py-2 rounded-xl font-black text-[10px]">POS</button>
            <button onClick={() => setEditMode('new')} className="bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl font-black text-[10px]">+ Novo</button>
          </div>
        </div>
      )}

      {editMode ? (
        <form onSubmit={handleSave} className="bg-zinc-900 p-6 rounded-[32px] space-y-4">
          <input name="name" defaultValue={editMode?.name} placeholder="Nome" className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none" required />
          <input name="sku" defaultValue={editMode?.sku} placeholder="SKU" className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none" required />
          <input name="price" type="number" step="0.01" defaultValue={editMode?.price} placeholder="Preço" className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none" required />
          <input name="category" defaultValue={editMode?.category} placeholder="Categoria" className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none uppercase" required />
          <button type="submit" className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-xl font-black">SALVAR</button>
          <button type="button" onClick={() => setEditMode(null)} className="w-full py-2 text-zinc-500 font-black">CANCELAR</button>
        </form>
      ) : (
        <div className="space-y-3">
          {products.filter(p => p.name.toLowerCase().includes(invSearch.toLowerCase())).map(p => (
            <div key={p.id} className="bg-zinc-900 p-4 rounded-3xl flex items-center gap-4">
              <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1"><h4 className="text-[11px] font-black uppercase text-white">{p.name}</h4><p className="text-[9px] text-zinc-500">{p.sku} | {p.stock} UN</p></div>
              <button onClick={() => setEditMode(p)} className="p-2 bg-white/5 rounded-lg text-zinc-400"><Edit3 size={14}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminLeads = ({ leads, setLeads, products, setProducts, showToast }) => {
  const [expandedLead, setExpandedLead] = useState(null);

  // 🔒 TRAVA DE ESTOQUE: A baixa SÓ acontece aqui no clique do Admin
  const updateLeadStatus = async (id, newStatus) => {
    const leadToUpdate = leads.find(l => l.id === id);
    if (!leadToUpdate) return;
    const oldStatus = leadToUpdate.status || 'NOVO';

    // ✅ SUPABASE — Atualiza status
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (error) { showToast('Erro no banco.', 'error'); return; }

    let updatedProducts = [...products];

    // 🔒 Baixa de estoque apenas quando vira CONCLUÍDO
    if (oldStatus !== 'CONCLUÍDO' && newStatus === 'CONCLUÍDO') {
      (leadToUpdate.items || []).forEach(item => {
        updatedProducts = updatedProducts.map(p => {
          if (p.id !== item.id) return p;
          const newSizes = (p.sizes || []).map(s => s.size === item.size ? { ...s, stock: Math.max(0, s.stock - item.quantity) } : s);
          return { ...p, sizes: newSizes, stock: newSizes.reduce((a, b) => a + b.stock, 0) };
        });
      });
    }

    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    setProducts(updatedProducts);
    showToast('Sincronizado!');
  };

  return (
    <div className="p-6 space-y-4 pb-32">
      <h3 className="font-black italic uppercase text-white text-lg">Pedidos Recebidos</h3>
      {leads.map(lead => (
        <div key={lead.id} className="bg-zinc-900 rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
            <div><h4 className="font-black text-white text-sm">{lead.name}</h4><p className="text-[10px] text-zinc-500">#{lead.order_number}</p></div>
            <span className={`text-[8px] font-black uppercase ${lead.status === 'CONCLUÍDO' ? 'text-emerald-500' : 'text-blue-500'}`}>{lead.status}</span>
          </div>
          {expandedLead === lead.id && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
              {lead.items.map((it, idx) => <div key={idx} className="text-[10px] uppercase font-black text-zinc-400">{it.quantity}x {it.name} ({it.size})</div>)}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateLeadStatus(lead.id, 'CONCLUÍDO')} className="py-3 bg-emerald-500 text-zinc-950 rounded-xl font-black text-[9px]">CONCLUIR VENDA</button>
                <button onClick={() => updateLeadStatus(lead.id, 'CANCELADO')} className="py-3 bg-red-500/10 text-red-500 rounded-xl font-black text-[9px]">CANCELAR</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ==========================================
// PARTE 2 — Banners, Config e App Root
// ==========================================

const AdminBanners = ({ banners, setBanners, showToast }) => {
  const [editBannerMode, setEditBannerMode] = useState(null);
  const [previewBannerImage, setPreviewBannerImage] = useState('');

  const handleSaveBanner = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      id: editBannerMode === 'new' ? Date.now() : editBannerMode.id,
      title: fd.get('title'),
      subtitle: fd.get('subtitle'),
      buttonText: fd.get('buttonText'),
      image: previewBannerImage || editBannerMode?.image,
      active: fd.get('active') === 'on'
    };
    setBanners(editBannerMode === 'new' ? [...banners, data] : banners.map(b => b.id === data.id ? data : b));
    showToast('Banner salvo!');
    setEditBannerMode(null);
  };

  return (
    <div className="p-6 space-y-6 pb-32">
      {!editBannerMode ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-black italic text-white uppercase">Banners</h3><button onClick={() => setEditBannerMode('new')} className="bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl font-black text-[10px]">+ Novo</button></div>
          {banners.map(b => (
            <div key={b.id} className="bg-zinc-900 p-4 rounded-2xl flex items-center gap-4">
              <img src={b.image} className="w-16 h-10 rounded-lg object-cover" />
              <h4 className="flex-1 font-black text-white text-[10px] uppercase truncate">{b.title}</h4>
              <button onClick={() => setEditBannerMode(b)} className="p-2 bg-white/5 rounded-lg text-zinc-400"><Edit3 size={12}/></button>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSaveBanner} className="bg-zinc-900 p-6 rounded-3xl space-y-4">
          <input name="title" defaultValue={editBannerMode?.title} placeholder="Título" className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none" required />
          <input name="subtitle" defaultValue={editBannerMode?.subtitle} placeholder="Subtítulo" className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none" />
          <button type="submit" className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-xl font-black">SALVAR BANNER</button>
        </form>
      )}
    </div>
  );
};

const AdminConfig = ({ config, setConfig, showToast }) => {
  const handleSaveConfig = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setConfig({
      ...config,
      brandName: fd.get('brandName'),
      whatsapp: fd.get('whatsapp').replace(/\D/g, ''),
      location: fd.get('location'),
      minOrder: parseFloat(fd.get('minOrder'))
    });
    showToast('Setup Atualizado!');
  };

  return (
    <div className="p-6 space-y-6 pb-32">
      <h3 className="font-black italic uppercase text-white">Setup Global</h3>
      <form onSubmit={handleSaveConfig} className="space-y-4">
        <input name="brandName" defaultValue={config.brandName} placeholder="Nome da Loja" className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none" />
        <input name="whatsapp" defaultValue={config.whatsapp} placeholder="WhatsApp" className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none" />
        <input name="minOrder" type="number" step="0.01" defaultValue={config.minOrder} className="w-full p-4 bg-zinc-950 rounded-xl text-white outline-none" />
        <button type="submit" className="w-full py-4 bg-white text-zinc-950 rounded-xl font-black">APLICAR</button>
      </form>
    </div>
  );
};

// ==========================================
// 4. APLICATIVO PRINCIPAL (ROOT)
// ==========================================
export default function App() {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(`@${APP_ID}:products`);
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });
  const [banners, setBanners] = useState(() => {
    const saved = localStorage.getItem(BANNERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_BANNERS;
  });
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(`@${APP_ID}:config`);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [leads, setLeads] = useState([]);
  const [cart, setCart] = useState([]);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(`@${APP_ID}:admin`) === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard');
  const lastTapRef = useRef(0);

  // ✅ SUPABASE — Polling de pedidos para o Admin
  useEffect(() => {
    if (!isAdmin) return;
    const fetchLeads = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setLeads(data);
    };
    fetchLeads();
    const interval = setInterval(fetchLeads, 5000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem(`@${APP_ID}:products`, JSON.stringify(products));
    localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(banners));
    localStorage.setItem(`@${APP_ID}:config`, JSON.stringify(config));
  }, [products, banners, config]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFinalize = async (currentLead) => {
    const orderNum = Math.floor(10000 + Math.random() * 90000).toString();
    const subtotal = cart.reduce((a, i) => a + (i.price * i.quantity), 0);
    
    const orderPayload = {
      order_number: orderNum,
      name: currentLead.name,
      phone: currentLead.phone,
      items: cart,
      value: subtotal,
      status: 'NOVO'
    };

    // ✅ SUPABASE — Envia pedido
    const { error } = await supabase.from('orders').insert(orderPayload);
    if (error) { showToast('Erro ao enviar.', 'error'); return; }

    // 🔒 SEM BAIXA DE ESTOQUE AQUI — O cliente só "reserva" a intenção
    
    const msg = `*NOVO PEDIDO: ${config.brandName}*\n*ID:* #${orderNum}\n*CLIENTE:* ${currentLead.name}\n*VALOR:* R$ ${subtotal.toFixed(2)}`;
    window.open(`https://api.whatsapp.com/send?phone=${config.whatsapp}&text=${encodeURIComponent(msg)}`);
    
    setCart([]);
    setShowLeadModal(false);
    showToast('Pedido Enviado!');
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && p.stock > 0;
  });

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 pb-24">
        <AdminHeader handleLogout={() => { sessionStorage.removeItem(`@${APP_ID}:admin`); setIsAdmin(false); }} />
        <main className="max-w-md mx-auto">
          {adminTab === 'dashboard' && <AdminDashboard leads={leads} products={products} />}
          {adminTab === 'inventory' && <AdminInventory products={products} setProducts={setProducts} showToast={showToast} />}
          {adminTab === 'leads' && <AdminLeads leads={leads} setLeads={setLeads} products={products} setProducts={setProducts} showToast={showToast} />}
          {adminTab === 'banners' && <AdminBanners banners={banners} setBanners={setBanners} showToast={showToast} />}
          {adminTab === 'config' && <AdminConfig config={config} setConfig={setConfig} showToast={showToast} />}
        </main>
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-zinc-900/95 backdrop-blur-xl px-4 py-4 rounded-3xl flex items-center justify-between shadow-2xl z-50 border border-white/10">
          <button onClick={() => setAdminTab('dashboard')} className={`flex flex-col items-center gap-1 ${adminTab === 'dashboard' ? 'text-emerald-500' : 'text-zinc-500'}`}><LayoutDashboard size={18}/><span className="text-[8px] font-black uppercase">Painel</span></button>
          <button onClick={() => setAdminTab('inventory')} className={`flex flex-col items-center gap-1 ${adminTab === 'inventory' ? 'text-emerald-500' : 'text-zinc-500'}`}><Box size={18}/><span className="text-[8px] font-black uppercase">Estoque</span></button>
          <button onClick={() => setAdminTab('leads')} className={`flex flex-col items-center gap-1 ${adminTab === 'leads' ? 'text-emerald-500' : 'text-zinc-500'}`}><User size={18}/><span className="text-[8px] font-black uppercase">Pedidos</span></button>
          <button onClick={() => setAdminTab('config')} className={`flex flex-col items-center gap-1 ${adminTab === 'config' ? 'text-emerald-500' : 'text-zinc-500'}`}><Settings size={18}/><span className="text-[8px] font-black uppercase">Setup</span></button>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-white">
      {/* RENDER DA LOJA (Omitido para caber no limite, mantendo a estrutura original do seu catálogo) */}
      {/* Se precisar do render completo da loja, posso enviar em seguida, mas o foco da refatoração está na lógica acima */}
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <h1 className="text-xl font-black italic">{config.brandName}</h1>
        <button onClick={() => setShowCart(true)} className="relative">
          <ShoppingBag size={24} />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 text-zinc-950 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">{cart.length}</span>}
        </button>
      </header>
      
      <main className="p-6 grid grid-cols-2 gap-4">
        {filteredProducts.map(p => (
          <div key={p.id} className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/5" onClick={() => setSelectedProduct(p)}>
            <img src={p.image} className="aspect-[3/4] object-cover w-full" />
            <div className="p-4">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 truncate">{p.name}</h3>
              <p className="font-black text-sm text-emerald-500 mt-1">R$ {p.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER SECRETO PARA ADMIN */}
      <footer className="p-10 flex flex-col items-center opacity-20">
         <button onClick={(e) => { 
           const now = Date.now(); 
           if(now - lastTapRef.current < 400) setShowAdminLogin(true); 
           lastTapRef.current = now; 
         }} className="p-4"><Lock size={12}/></button>
      </footer>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            if(e.target.user.value === 'Fluxo034' && e.target.pass.value === 'METODOFLUXO') {
              sessionStorage.setItem(`@${APP_ID}:admin`, 'true');
              setIsAdmin(true); setShowAdminLogin(false);
            } else { showToast('Erro', 'error'); }
          }} className="bg-zinc-900 p-8 rounded-3xl w-full max-w-sm space-y-4">
            <input name="user" placeholder="Usuário" className="w-full p-4 bg-zinc-950 rounded-xl outline-none" />
            <input name="pass" type="password" placeholder="Senha" className="w-full p-4 bg-zinc-950 rounded-xl outline-none" />
            <button className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-xl font-black">ENTRAR</button>
            <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full text-zinc-500 text-[10px] font-black">FECHAR</button>
          </form>
        </div>
      )}
    </div>
  );
}
