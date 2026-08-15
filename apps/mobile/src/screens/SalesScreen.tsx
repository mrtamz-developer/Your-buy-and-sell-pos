import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, Alert, Picker } from 'react-native';
import { fetchProducts, createSale, fetchCustomers } from '../api';

export default function SalesScreen({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [pointsToUse, setPointsToUse] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchProducts();
        setProducts(p);
        const cs = await fetchCustomers();
        setCustomers(cs);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  function addToCart(product: any) {
    const found = cart.find(c => c.productId === product.id);
    if (found) {
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { productId: product.id, quantity: 1, unitPrice: product.price, name: product.name }]);
    }
  }

  async function checkoutCash() {
    if (cart.length === 0) return Alert.alert('Cart is empty');
    setLoading(true);
    const total = cart.reduce((s, c) => s + (c.unitPrice || 0) * c.quantity, 0);
    const sale = { storeId: products[0]?.storeId || null, customerId: selectedCustomer, lineItems: cart, payments: [{ amount: total, method: 'CASH' }], pointsToUse };
    try {
      const res = await createSale(token, sale);
      Alert.alert('Sale created', `id: ${res.id}`);
      setCart([]);
      setPointsToUse(0);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Sale error', e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20 }}>Sales</Text>
        <Button title="Logout" onPress={onLogout} />
      </View>

      <Text style={{ marginTop: 8, fontSize: 16 }}>Select Customer (optional)</Text>
      {/* simple picker using native Picker; you can replace with a better UI */}
      <View style={{ borderWidth: 1, marginVertical: 8 }}>
        <Picker selectedValue={selectedCustomer} onValueChange={(v) => setSelectedCustomer(String(v))}>
          <Picker.Item label="-- no customer --" value={null} />
          {customers.map(c => <Picker.Item key={c.id} label={`${c.name || c.email} (pts:${c.pointsBalance||0})`} value={c.id} />)}
        </Picker>
      </View>

      <Text style={{ marginTop: 8, fontSize: 16 }}>Products</Text>
      <FlatList data={products} keyExtractor={p => p.id} renderItem={({ item }) => (
        <View style={{ padding: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontSize: 16 }}>{item.name} - {(item.price/100).toFixed(2)}</Text>
          <TouchableOpacity onPress={() => addToCart(item)} style={{ marginTop: 8 }}>
            <View style={{ backgroundColor: '#007bff', padding: 8, borderRadius: 4 }}>
              <Text style={{ color: 'white' }}>Add</Text>
            </View>
          </TouchableOpacity>
        </View>
      )} />

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 16 }}>Cart</Text>
        {cart.map(c => (
          <View key={c.productId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text>{c.name} x {c.quantity}</Text>
            <Text>{((c.unitPrice || 0) * c.quantity / 100).toFixed(2)}</Text>
          </View>
        ))}

        <View style={{ marginTop: 8 }}>
          <Text>Points to use (integer):</Text>
          <TextInputKeyboardAware onChangeText={(t) => setPointsToUse(Number(t || 0))} value={String(pointsToUse)} />
        </View>

        <Button title={loading ? 'Processing...' : 'Checkout (Cash)'} onPress={checkoutCash} disabled={loading} />
      </View>
    </View>
  );
}
