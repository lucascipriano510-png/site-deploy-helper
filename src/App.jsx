import React, { useState, useEffect, useRef } from 'react';
import {
  Search, LayoutDashboard, ShoppingBag, Package, Box, Settings,
  User, Lock, Check, XCircle, Trash2, Plus, Minus, X
} from 'lucide-react';

import { supabase } from './lib/supabaseClient';
import { createOrder, confirmOrderSale, cancelOrder, deleteOrder } from './lib/orders';

const APP_ID = 'fluxo-dark-ultimate';

export default function App() {
  // ---------- ESTADOS ----------
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

  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]); // [{id, name, price, image, qty}]
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(`@${APP_ID}:admin`) === 'true');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const lastTapRef = useRef(0);

  // ---------- SYNC SUPABASE (5s) ----------
  useEffect(() => {
    const syncData = async () => {
      const { data: oData } = await supabase
        .from('orders').select('*').order('created_at', { ascending: false });
      if (oData) setOrders(oData);

      const { data: pData } = await supabase
        .from('products').select('*').order('id', { ascending: false });
      if (pData && pData.length > 0) {
        setProducts(pData);
        localStorage.setItem(`@${APP_ID}:products`, JSON.stringify(pData));
      }
    };
    syncData();
    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(`@${APP_ID}:config`, JSON.stringify(config));
  }, [config]);

  // ---------- CARRINHO ----------
  const addToCart = (p) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === p.id);
      if (exists) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: Number(p.price || 0), image: p.image, qty: 1 }];
    });
    setShowCart(true);
  };
  const changeQty = (id, delta) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
      .filter(i => i.qty > 0));
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleSecretDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) setShowAdminLogin(true);
    lastTapRef.current = now;
  };

  // ---------- ADMIN: AÇÕES DE PEDIDO ----------
  const handleConfirm = async (order) => {
    try {
      await confirmOrderSale(order, products);
      // refetch imediato
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data);
      const { data: pData } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (pData) setProducts(pData);
    } catch (e) { alert('Erro ao confirmar venda: ' + e.message); }
  };
  const handleCancel = async (id) => {
    try { await cancelOrder(id); setOrders(o => o.map(x => x.id === id ? { ...x, status: 'cancelled' } : x)); }
    catch (e) { alert('Erro: ' + e.message); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Apagar este pedido?')) return;
    try { await deleteOrder(id); setOrders(o => o.filter(x => x.id !== id)); }
    catch (e) { alert('Erro: ' + e.message); }
  };

  // ============================================================
  // RENDER ADMIN
  // ============================================================
  if (isAdmin) {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    return (
      <div className="min-h-screen bg-black text-white font-sans pb-32">
        <header className="p-6 border-b border-white/10 bg-zinc-950 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg"><LayoutDashboard/></div>
            <h2 className="font-black italic uppercase text-xs">Master Control</h2>
          </div>
          <button onClick={() => { sessionStorage.removeItem(`@${APP_ID}:admin`); setIsAdmin(false); }} className="text-[10px] font-black uppercase bg-white text-black px-4 py-2 rounded-full">Sair</button>
        </header>

        <main className="max-w-md mx-auto p-6 space-y-6">
          {adminTab === 'dashboard' && (
            <div className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 animate-in">
              <p className="text-[10px] font-black text-zinc-500 uppercase">Status do Sistema</p>
              <h3 className="text-2xl font-black text-emerald-500 mt-2">CONECTADO AO SUPABASE</h3>
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-black p-4 rounded-2xl border border-white/5"><p className="text-[8px] font-black text-zinc-500">PEDIDOS</p><p className="text-xl font-black">{orders.length}</p></div>
                <div className="bg-black p-4 rounded-2xl border border-white/5"><p className="text-[8px] font-black text-zinc-500">PENDENTES</p><p className="text-xl font-black text-amber-400">{pendingCount}</p></div>
                <div className="bg-black p-4 rounded-2xl border border-white/5"><p className="text-[8px] font-black text-zinc-500">ITENS</p><p className="text-xl font-black">{products.length}</p></div>
              </div>
            </div>
          )}

          {adminTab === 'leads' && (
            <div className="space-y-4 animate-in">
              <h3 className="font-black uppercase italic text-sm">Pedidos (CRM)</h3>
              {orders.length === 0 && (
                <div className="bg-zinc-900 p-8 rounded-[24px] text-center text-zinc-500 text-[10px] font-black uppercase">Nenhum pedido ainda</div>
              )}
              {orders.map(o => (
                <div key={o.id} className="bg-zinc-900 p-5 rounded-[24px] border border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-black uppercase text-zinc-500">{new Date(o.created_at).toLocaleString('pt-BR')}</p>
                      <p className="font-black mt-1">{o.customer?.name || 'Sem nome'}</p>
                      <p className="text-[10px] text-zinc-400">{o.customer?.phone}</p>
                      {o.customer?.address && <p className="text-[10px] text-zinc-500 mt-1">{o.customer.address}</p>}
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                      o.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      o.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{o.status === 'pending' ? 'Pendente' : o.status === 'confirmed' ? 'Concluído' : 'Cancelado'}</span>
                  </div>

                  <div className="mt-3 border-t border-white/5 pt-3 space-y-1">
                    {(o.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-zinc-300">{it.qty}x {it.name}{it.size ? ` (${it.size})` : ''}</span>
                        <span className="font-black">R$ {(Number(it.price) * Number(it.qty)).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-[11px] pt-2 border-t border-white/5 mt-2">
                      <span className="font-black uppercase text-zinc-500">Total</span>
                      <span className="font-black text-emerald-400">R$ {Number(o.total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {o.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button onClick={() => handleConfirm(o)} className="py-3 bg-emerald-500 text-black rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><Check size={14}/> Confirmar Venda</button>
                      <button onClick={() => handleCancel(o.id)} className="py-3 bg-zinc-800 text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><XCircle size={14}/> Cancelar</button>
                    </div>
                  )}
                  {o.status !== 'pending' && (
                    <button onClick={() => handleDelete(o.id)} className="mt-4 w-full py-2 text-[9px] font-black uppercase text-zinc-500 flex items-center justify-center gap-2"><Trash2 size={12}/> Apagar</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {adminTab === 'inventory' && (
            <div className="space-y-3 animate-in">
              <h3 className="font-black uppercase italic text-sm">Estoque</h3>
              {products.map(p => (
                <div key={p.id} className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                  <img src={p.image} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[11px] truncate">{p.name}</p>
                    <p className="text-[9px] text-zinc-500 uppercase">SKU {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-zinc-500 uppercase">Estoque</p>
                    <p className="font-black">{p.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminTab === 'setup' && (
            <div className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 space-y-4">
              <h3 className="font-black uppercase italic">Configurações Visuais</h3>
              <input placeholder="Nome da Marca" className="w-full p-4 bg-black rounded-xl border border-white/10" value={config.brandName} onChange={e => setConfig({ ...config, brandName: e.target.value })} />
              <input placeholder="WhatsApp" className="w-full p-4 bg-black rounded-xl border border-white/10" value={config.whatsapp} onChange={e => setConfig({ ...config, whatsapp: e.target.value })} />
              <button onClick={() => alert('Configurações Salvas!')} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-[10px]">Salvar Mudanças</button>
            </div>
          )}
        </main>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-zinc-900 p-4 rounded-full flex justify-between border border-white/10 shadow-2xl z-50">
          <button onClick={() => setAdminTab('dashboard')} className={adminTab === 'dashboard' ? 'text-emerald-500' : 'text-zinc-500'}><LayoutDashboard/></button>
          <button onClick={() => setAdminTab('inventory')} className={adminTab === 'inventory' ? 'text-emerald-500' : 'text-zinc-500'}><Box/></button>
          <button onClick={() => setAdminTab('leads')} className={`relative ${adminTab === 'leads' ? 'text-emerald-500' : 'text-zinc-500'}`}>
            <User/>
            {pendingCount > 0 && <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{pendingCount}</span>}
          </button>
          <button onClick={() => setAdminTab('setup')} className={adminTab === 'setup' ? 'text-emerald-500' : 'text-zinc-500'}><Settings/></button>
        </nav>
      </div>
    );
  }

  // ============================================================
  // RENDER LOJA (CLIENTE)
  // ============================================================
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="bg-white text-black py-2 overflow-hidden">
        <div className="flex gap-10 whitespace-nowrap animate-marquee font-black text-[9px] uppercase tracking-widest">
          {config.marqueePhrases.map((p, i) => <span key={i}>✦ {p}</span>)}
          {config.marqueePhrases.map((p, i) => <span key={'d' + i}>✦ {p}</span>)}
        </div>
      </div>

      <header className="p-6 flex justify-between items-center h-20 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-40">
        <button className="text-zinc-500"><Search size={22} /></button>
        <h1 className="text-xl font-black italic uppercase">{config.brandName}</h1>
        <button onClick={() => setShowCart(true)} className="relative">
          <ShoppingBag size={24} />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
        </button>
      </header>

      <main className="p-6 grid grid-cols-2 gap-4">
        {products.length === 0 ? (
          <div className="col-span-2 py-32 text-center opacity-20"><Package size={48} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase">O Estoque está vazio.</p></div>
        ) : (
          products.map(p => (
            <div key={p.id} className="bg-zinc-900 rounded-[24px] overflow-hidden border border-white/5">
              <img src={p.image} className="aspect-[3/4] object-cover w-full opacity-90" />
              <div className="p-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 truncate">{p.name}</h3>
                <p className="font-black text-sm text-white mt-1">R$ {Number(p.price || 0).toFixed(2)}</p>
                <button onClick={() => addToCart(p)} className="mt-3 w-full py-2 bg-emerald-500 text-black rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-1">
                  <Plus size={12} /> Adicionar
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      <footer className="p-10 flex flex-col items-center opacity-10">
        <button onClick={handleSecretDoubleTap} className="p-4"><Lock size={12} /></button>
      </footer>

      {/* CARRINHO */}
      {showCart && (
        <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl flex flex-col">
          <div className="p-6 flex justify-between items-center border-b border-white/10">
            <h2 className="font-black uppercase italic">Seu Carrinho</h2>
            <button onClick={() => setShowCart(false)}><X /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-zinc-500 text-[10px] font-black uppercase mt-20">Carrinho vazio</p>
            ) : cart.map(i => (
              <div key={i.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-3">
                <img src={i.image} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[11px] truncate">{i.name}</p>
                  <p className="text-emerald-400 font-black text-[12px] mt-1">R$ {(i.price * i.qty).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(i.id, -1)} className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center"><Minus size={12} /></button>
                  <span className="font-black text-[12px] w-5 text-center">{i.qty}</span>
                  <button onClick={() => changeQty(i.id, 1)} className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center"><Plus size={12} /></button>
                </div>
                <button onClick={() => removeFromCart(i.id)} className="text-zinc-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 space-y-3">
              <div className="flex justify-between"><span className="text-[10px] font-black uppercase text-zinc-500">Total</span><span className="font-black text-emerald-400">R$ {cartTotal.toFixed(2)}</span></div>
              <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[11px]">Finalizar Pedido</button>
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT */}
      {showCheckout && (
        <div className="fixed inset-0 z-[95] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const customer = {
              name: fd.get('name'),
              phone: fd.get('phone'),
              address: fd.get('address'),
            };
            try {
              await createOrder({ customer, items: cart, total: cartTotal });
              alert('Pedido enviado! Em breve entraremos em contato.');
              setCart([]);
              setShowCheckout(false);
            } catch (err) {
              alert('Erro ao enviar pedido: ' + err.message);
            }
          }} className="bg-zinc-950 p-8 rounded-[40px] border border-white/10 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black uppercase italic">Seus Dados</h2>
              <button type="button" onClick={() => setShowCheckout(false)}><X size={18} /></button>
            </div>
            <input name="name" required placeholder="Nome completo" className="w-full p-4 bg-zinc-900 rounded-2xl outline-none text-[12px]" />
            <input name="phone" required placeholder="WhatsApp (com DDD)" className="w-full p-4 bg-zinc-900 rounded-2xl outline-none text-[12px]" />
            <textarea name="address" required placeholder="Endereço de entrega" rows="3" className="w-full p-4 bg-zinc-900 rounded-2xl outline-none text-[12px] resize-none" />
            <div className="flex justify-between text-[11px] pt-2"><span className="font-black uppercase text-zinc-500">Total</span><span className="font-black text-emerald-400">R$ {cartTotal.toFixed(2)}</span></div>
            <button className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[11px]">Enviar Pedido</button>
          </form>
        </div>
      )}

      {/* ADMIN LOGIN */}
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
