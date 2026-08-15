import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000') + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (typeof window !== 'undefined') localStorage.setItem('auth_token', data.token);
      router.push('/products');
    } catch (e: any) {
      alert('Login error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 shadow rounded">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <label className="block mb-2">Email</label>
        <input className="w-full border p-2 mb-4" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="block mb-2">Password</label>
        <input type="password" className="w-full border p-2 mb-4" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-2 rounded">{loading ? 'Logging in...' : 'Login'}</button>
      </div>
    </div>
  );
}
