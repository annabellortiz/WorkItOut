import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, Alert } from 'react-native';
import { listWorkouts, deleteWorkout } from '../utils/apiClient';

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

  useEffect(() => { load(); }, []);

  function handleCreate() {
    navigation.navigate('WorkoutEditor');
  }

  function handleEdit(item: any) {
    navigation.navigate('WorkoutEditor', { workout: item });
  }

  async function handleDelete(id: string) {
    try {
      await deleteWorkout(id);
      setWorkouts((s) => s.filter((w) => w.id !== id));
    } catch (e: any) {
      console.error('deleteWorkout failed', e);
      Alert.alert('Delete failed', e?.message || String(e));
    }
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
            <View style={{ marginLeft: 12 }}>
              <Button title="Edit" onPress={() => handleEdit(item)} />
              <View style={{ height: 8 }} />
              <Button title="Delete" color="#d33" onPress={() => handleDelete(item.id)} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => <Text style={{ color: '#666' }}>{loading ? 'Loading...' : 'No saved workouts'}</Text>}
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
