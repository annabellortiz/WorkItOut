import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert } from 'react-native';
import { deleteWorkout } from '../utils/apiClient';

export default function WorkoutDetailScreen({ navigation, route }: any) {
  const workout = route.params?.workout;

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text>Workout not found</Text>
      </View>
    );
  }

  function handleEdit() {
    navigation.navigate('WorkoutEditor', { workout });
  }

  async function handleDelete() {
    Alert.alert('Delete Workout', 'Are you sure you want to delete this workout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            console.log('Deleting workout with id:', workout.id);
            await deleteWorkout(workout.id);
            console.log('Workout deleted successfully');
            navigation.goBack();
          } catch (e: any) {
            console.error('deleteWorkout failed:', e);
            Alert.alert('Delete failed', e?.message || String(e));
          }
        },
        style: 'destructive',
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{workout.title || '(untitled)'}</Text>

      {workout.notes && (
        <>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.notes}>{workout.notes}</Text>
        </>
      )}

      {workout.exercises && workout.exercises.length > 0 && (
        <>
          <Text style={styles.label}>Exercises</Text>
          {workout.exercises.map((exercise: any, idx: number) => (
            <View key={idx} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.name || '(untitled)'}</Text>
              {(exercise.sets_data || []).map((set: any, setIdx: number) => (
                <View key={setIdx} style={styles.setRow}>
                  <Text style={styles.setText}>
                    {set.sets && `${set.sets} sets`}
                    {set.sets && set.reps && ' • '}
                    {set.reps && `${set.reps} reps`}
                    {(set.sets || set.reps) && set.weight && ' • '}
                    {set.weight && `${set.weight} lbs`}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </>
      )}

      <View style={{ marginTop: 24, marginBottom: 12 }}>
        <Button title="Edit" onPress={handleEdit} />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Button title="Delete" color="#d33" onPress={handleDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  notes: { fontSize: 14, color: '#555', marginBottom: 12 },
  exerciseCard: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#f9f9f9' },
  exerciseName: { fontWeight: '600', fontSize: 16, marginBottom: 8 },
  setRow: { paddingVertical: 4 },
  setText: { fontSize: 14, color: '#666' },
});
