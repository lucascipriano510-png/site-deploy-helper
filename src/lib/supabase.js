import { supabase } from './supabaseClient';

// Re-export do client (caso algum lugar precise)
export { supabase };

// ===== PRODUTOS =====

// Busca todos os produtos (sem cache travado).
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Insere ou atualiza (upsert) um produto pelo id.
export async function upsertProduct(product) {
  const payload = {
    id: product.id,
    sku: product.sku || '',
    name: product.name || '',
    price: Number(product.price || 0),
    category: product.category || 'GERAL',
    image: product.image || '',
    stock: Number(product.stock || 0),
    sales: Number(product.sales || 0),
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    featured: !!product.featured,
    collection_name: product.collection_name || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('products')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Remove um produto pelo id.
export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ===== BANNERS =====

// Busca todos os banners.
export async function fetchBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Insere ou atualiza (upsert) um banner.
export async function upsertBanner(banner) {
  const payload = {
    id: banner.id,
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    button_text: banner.buttonText || banner.button_text || 'VER PEÇAS',
    collection_name: banner.collection_name || null,
    image: banner.image || '',
    active: !!banner.active,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('banners')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Remove um banner pelo id.
export async function deleteBanner(id) {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
}
