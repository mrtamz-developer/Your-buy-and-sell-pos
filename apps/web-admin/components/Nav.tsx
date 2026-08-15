import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

export default function Nav() {
  const router = useRouter();

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      router.push('/login');
    }
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/products"><a className="px-3 py-2 rounded-md text-sm font-medium text-gray-700">Products</a></Link>
          </div>
          <div className="flex items-center">
            <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium text-red-600">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
