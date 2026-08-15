import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import SalesScreen from './src/screens/SalesScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('auth_token');
      setToken(t);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{flex:1}}>
      {token ? <SalesScreen onLogout={async () => { await AsyncStorage.removeItem('auth_token'); setToken(null); }} token={token} /> : <LoginScreen onLogin={(t) => setToken(t)} />}
    </SafeAreaView>
  );
}
