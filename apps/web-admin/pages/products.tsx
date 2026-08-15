import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { useRouter } from 'next/router';

type Product = { id: string; name: string; price: number; sku?: string; description?: string; storeId?: string };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) router.replace('/login');
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000') + '/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return router.push('/login');
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000') + '/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, price: (price || 0) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      setName(''); setPrice('');
      fetchProducts();
    } catch (e: any) {
      alert('Create error: ' + e.message);
    }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Products</h1>

        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="font-semibold mb-2">Create product</h2>
          <div className="grid grid-cols-3 gap-2">
            <input className="border p-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input className="border p-2" placeholder="Price (cents)" value={price === '' ? '' : String(price)} onChange={e => setPrice(Number(e.target.value))} />
            <button className="bg-green-600 text-white p-2 rounded" onClick={createProduct}>Create</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? <div>Loading...</div> : products.map(p => (
            <div key={p.id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-gray-500">SKU: {p.sku || '—'}</p>
              <p className="mt-2">{(p.price/100).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
