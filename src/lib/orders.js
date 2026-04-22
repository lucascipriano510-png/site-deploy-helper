import { supabase } from './supabaseClient';

// Cria um pedido novo (status pending). NÃO mexe no estoque.
export async function createOrder({ customer, items, total, notes = '', status = 'pending' }) {
  const safeCustomer = {
    name: String(customer?.name || 'Cliente não informado').trim(),
    phone: String(customer?.phone || '').replace(/\D/g, '') || '00000000000',
    orderNumber: String(customer?.orderNumber || ''),
    address: String(customer?.address || ''),
  };
  const safeItems = Array.isArray(items)
    ? items.map((item) => ({
        id: Number(item?.id || 0),
        name: String(item?.name || 'Produto sem nome'),
        sku: String(item?.sku || ''),
        price: Number(item?.price || 0),
        size: String(item?.size || 'U'),
        qty: Number(item?.qty || 1),
        image: String(item?.image || ''),
      }))
    : [];
  const safeTotal = Number(total || 0);
  const safeNotes = String(notes || '');
  const safeStatus = String(status || 'pending');

  const { data, error } = await supabase
    .from('orders')
    .insert([{ customer: safeCustomer, items: safeItems, total: safeTotal, notes: safeNotes, status: safeStatus }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Lista todos os pedidos (mais recentes primeiro)
export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Confirma a venda: muda status para "confirmed" E decrementa estoque
// apenas neste momento (regra do Sistema 3.0).
export async function confirmOrderSale(order, products) {
  // 1) Atualiza estoque de cada item
  for (const item of order.items || []) {
    const product = products.find(p => p.id === item.id);
    if (!product) continue;

    const qty = Number(item.qty || 1);
    const newStock = Math.max(0, Number(product.stock || 0) - qty);
    const newSales = Number(product.sales || 0) + qty;

    // Atualiza stock por tamanho se houver
    let newSizes = product.sizes || [];
    if (item.size && Array.isArray(newSizes)) {
      newSizes = newSizes.map(s =>
        s.size === item.size
          ? { ...s, stock: Math.max(0, Number(s.stock || 0) - qty) }
          : s
      );
    }

    const { error: upErr } = await supabase
      .from('products')
      .update({ stock: newStock, sales: newSales, sizes: newSizes })
      .eq('id', product.id);
    if (upErr) throw upErr;
  }

  // 2) Marca pedido como confirmado
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', order.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Cancela pedido (não devolve estoque porque a confirmação é que tira)
export async function cancelOrder(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOrder(orderId) {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw error;
}
