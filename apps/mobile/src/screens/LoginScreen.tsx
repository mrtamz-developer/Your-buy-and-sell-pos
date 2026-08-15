import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { login } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const data = await login(email, password);
      const token = data.token;
      if (!token) return Alert.alert('Login failed');
      await AsyncStorage.setItem('auth_token', token);
      onLogin(token);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Login error', e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 8 }}>Login</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
      <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
    </View>
  );
}
