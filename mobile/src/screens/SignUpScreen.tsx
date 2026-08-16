import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { signUp } from '../utils/auth';

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email) return Alert.alert('Please enter your email');
    if (!password || password.length < 6) return Alert.alert('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert('Account created');
      navigation.replace('MainTabs');
    } catch (err: any) {
      Alert.alert('Sign up failed', err.message || 'Unknown');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        editable={!loading}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        editable={!loading}
      />

      {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : <Button title="Sign up" onPress={handleSignUp} />}

      <View style={{ height: 12 }} />
      <Button title="Back to login" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12 },
});
