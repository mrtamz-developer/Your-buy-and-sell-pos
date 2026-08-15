import Nav from '../components/Nav';
import { useEffect, useState } from 'react';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any|null>(null);
  const [adjust, setAdjust] = useState(0);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000') + '/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) { console.error(e); }
  }

  async function loadCustomer(id: string) {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000') + '/api/customers/' + id);
      const data = await res.json();
      setSelected(data);
    } catch (e) { console.error(e); }
  }

  async function adjustPoints() {
    if (!selected) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000') + `/api/customers/${selected.customer.id}/points/adjust`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ change: Number(adjust), reason: 'Admin adjustment' })
      });
      const data = await res.json();
      alert('Adjusted, new balance: ' + data.balance);
      loadCustomer(selected.customer.id);
      fetchCustomers();
    } catch (e) { console.error(e); alert('Error'); }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Customers</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h2 className="font-semibold">All customers</h2>
            {customers.map(c => (
              <div key={c.id} className="bg-white p-3 rounded shadow mb-2 cursor-pointer" onClick={() => loadCustomer(c.id)}>
                <div>{c.name || c.email}</div>
                <div className="text-sm text-gray-500">Points: {c.pointsBalance}</div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2">
            {selected ? (
              <div className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold">{selected.customer.name || selected.customer.email}</h2>
                <div>Points balance: {selected.customer.pointsBalance}</div>
                <h3 className="mt-4">Ledger</h3>
                <div className="space-y-2">
                  {selected.ledger.map((l:any) => (
                    <div key={l.id} className="p-2 border rounded">
                      <div>{l.reason} — change: {l.change} — balanceAfter: {l.balanceAfter}</div>
                      <div className="text-sm text-gray-500">{new Date(l.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <input type="number" value={adjust} onChange={e => setAdjust(Number(e.target.value))} className="border p-2 mr-2" />
                  <button onClick={adjustPoints} className="bg-blue-600 text-white p-2 rounded">Adjust points</button>
                </div>
              </div>
            ) : <div className="bg-white p-4 rounded shadow">Select a customer to view details</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
