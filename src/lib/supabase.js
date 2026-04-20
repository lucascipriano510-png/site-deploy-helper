import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tapgnlrjhrhewqlpahvg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XaGrDdX2df8qolf2WocwuQ_FsVP1-kW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: {
    fetch: (url, options = {}) =>
      fetch(url, { ...options, cache: 'no-store' }),
  },
});

// ---- API de Produtos ----
// Tabela `products` (colunas: id bigint PK, sku text, name text, price numeric,
// category text, image text, stock int, sales int, sizes jsonb, featured bool, updated_at timestamptz)

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalize);
}

export async function upsertProduct(product) {
  const row = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price,
    category: product.category,
    image: product.image,
    stock: product.stock ?? 0,
    sales: product.sales ?? 0,
    sizes: product.sizes ?? [],
    featured: !!product.featured,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('products')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return normalize(data);
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

function normalize(row) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    image: row.image,
    stock: row.stock ?? 0,
    sales: row.sales ?? 0,
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    featured: !!row.featured,
  };
}
