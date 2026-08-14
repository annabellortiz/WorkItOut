import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { signIn, getValidIdToken, clearTokens as clearStoredTokens } from '../utils/auth';

type Props = {
  navigation: any;
};

const TOKEN_KEY = 'userToken';
const REFRESH_KEY = 'refreshToken';

async function signInWithFirebaseREST(email: string, password: string) {
  const url = FIREBASE_REST_SIGNIN(FIREBASE_API_KEY);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || 'Authentication failed';
    throw new Error(msg);
  }
  // data contains idToken, refreshToken, expiresIn, localId, email
  return data;
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getValidIdToken();
        if (token) {
          navigation.replace('MainTabs');
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email) return Alert.alert('Please enter your email');
    if (!password) return Alert.alert('Please enter your password');

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigation.replace('MainTabs');
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClear = async () => {
    await clearStoredTokens();
    Alert.alert('Cleared saved session');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome — Log in</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        editable={!loading}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        editable={!loading}
      />

      <View style={styles.row}>
        <Text>Remember me</Text>
        <Switch value={remember} onValueChange={setRemember} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : (
        <Button title="Log in" onPress={handleLogin} />
      )}

      <View style={{ height: 12 }} />
      <Button title="Forgot password" onPress={() => Alert.alert('Reset', 'Password reset flow placeholder')} />
      <View style={{ height: 8 }} />
      <Button title="Sign up" onPress={() => Alert.alert('Sign up', 'Sign up flow placeholder')} />

      <View style={{ height: 16 }} />
      <Button title="Clear saved session" onPress={handleLogoutClear} color="#888" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
});