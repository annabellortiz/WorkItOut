import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listWorkouts } from '../utils/apiClient';

export default function SavedWorkoutsScreen({ navigation }: any) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res: any = await listWorkouts();
      setWorkouts(res.workouts || []);
    } catch (e: any) {
      console.error('listWorkouts failed', e);
      Alert.alert('Failed to load workouts', e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  function handleCreate() {
    navigation.navigate('WorkoutEditor');
  }

  function handleView(item: any) {
    navigation.navigate('WorkoutDetail', { workout: item });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Workouts</Text>

      <View style={{ marginBottom: 12 }}>
        <Button title="Create workout" onPress={handleCreate} />
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title || '(untitled)'}</Text>
              <Text style={styles.itemSub}>{item.notes || ''}</Text>
            </View>
            <Button title="View" onPress={() => handleView(item)} />
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ color: '#999', fontSize: 16 }}>
              {loading ? 'Loading...' : 'No workouts saved yet'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  sub: { color: '#555' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemTitle: { fontWeight: '600' },
  itemSub: { color: '#666' },
});
