import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:4000';

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
  return res.data;
}

export async function fetchProducts() {
  const res = await axios.get(`${API_BASE}/api/products`);
  return res.data.products;
}

export async function createSale(token: string, sale: any) {
  const res = await axios.post(`${API_BASE}/api/sales`, sale, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.sale;
}
