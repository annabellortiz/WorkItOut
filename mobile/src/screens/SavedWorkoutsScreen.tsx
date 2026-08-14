import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SavedWorkoutsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Workouts</Text>
      <Text style={styles.sub}>List of workouts you saved will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  sub: { color: '#555' },
});