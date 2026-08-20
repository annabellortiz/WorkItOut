import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert } from 'react-native';
import { createWorkout, updateWorkout } from '../utils/apiClient';

export default function WorkoutEditorScreen({ navigation, route }: any) {
  const editing = !!route.params?.workout;
  const initial = route.params?.workout || { title: '', notes: '', exercises: [] };

  const [title, setTitle] = useState(initial.title || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [exercises, setExercises] = useState<any[]>(initial.exercises || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit Workout' : 'Create Workout' });
  }, [editing]);

  function addExercise() {
    setExercises((s) => [...s, { id: Date.now().toString(), name: '', sets_data: [] }]);
  }

  function updateExercise(idx: number, field: string, value: string) {
    setExercises((s) => s.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  }

  function removeExercise(idx: number) {
    setExercises((s) => s.filter((_, i) => i !== idx));
  }

  function addSet(exerciseIdx: number) {
    setExercises((s) =>
      s.map((e, i) =>
        i === exerciseIdx
          ? { ...e, sets_data: [...(e.sets_data || []), { id: Date.now().toString(), sets: '', reps: '', weight: '' }] }
          : e
      )
    );
  }

  function updateSet(exerciseIdx: number, setIdx: number, field: string, value: string) {
    setExercises((s) =>
      s.map((e, i) =>
        i === exerciseIdx
          ? {
              ...e,
              sets_data: (e.sets_data || []).map((sd: any, j: number) =>
                j === setIdx ? { ...sd, [field]: value } : sd
              ),
            }
          : e
      )
    );
  }

  function removeSet(exerciseIdx: number, setIdx: number) {
    setExercises((s) =>
      s.map((e, i) =>
        i === exerciseIdx
          ? { ...e, sets_data: (e.sets_data || []).filter((_: any, j: number) => j !== setIdx) }
          : e
      )
    );
  }

  async function handleSave() {
    if (!title.trim()) return Alert.alert('Please enter a title');
    setSaving(true);
    const payload = { title: title.trim(), notes: notes.trim(), exercises };
    try {
      if (editing && initial.id) {
        await updateWorkout(initial.id, payload);
        Alert.alert('Saved', 'Workout updated');
      } else {
        await createWorkout(payload);
        Alert.alert('Saved', 'Workout created');
      }
      navigation.goBack();
    } catch (e: any) {
      console.error('save failed', e);
      Alert.alert('Save failed', e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />

      <Text style={styles.label}>Notes</Text>
      <TextInput value={notes} onChangeText={setNotes} style={styles.input} multiline />

      <Text style={[styles.label, { marginTop: 12 }]}>Exercises</Text>
      <FlatList
        data={exercises}
        keyExtractor={(it) => it.id}
        renderItem={({ item, index }) => (
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <TextInput 
                placeholder="Exercise name" 
                value={item.name} 
                onChangeText={(v) => updateExercise(index, 'name', v)} 
                style={[styles.input, { flex: 1 }]} 
              />
              <Button title="Remove" onPress={() => removeExercise(index)} color="#d33" />
            </View>

            {(item.sets_data || []).map((setItem: any, setIdx: number) => (
              <View key={setItem.id} style={styles.setRow}>
                <Button title="Remove" onPress={() => removeSet(index, setIdx)} color="#d33" />
                <TextInput 
                  placeholder="Sets" 
                  value={setItem.sets} 
                  onChangeText={(v) => updateSet(index, setIdx, 'sets', v)} 
                  style={styles.smallInput} 
                  keyboardType="numeric" 
                />
                <TextInput 
                  placeholder="Reps" 
                  value={setItem.reps} 
                  onChangeText={(v) => updateSet(index, setIdx, 'reps', v)} 
                  style={styles.smallInput} 
                  keyboardType="numeric" 
                />
                <TextInput 
                  placeholder="Weight" 
                  value={setItem.weight} 
                  onChangeText={(v) => updateSet(index, setIdx, 'weight', v)} 
                  style={styles.smallInput} 
                  keyboardType="decimal-pad" 
                />
              </View>
            ))}

            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <Button title="Add set" onPress={() => addSet(index)} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => <Text style={{ color: '#666' }}>No exercises yet</Text>}
      />

      <View style={{ marginTop: 12 }}>
        <Button title="Add exercise" onPress={addExercise} />
      </View>

      <View style={{ marginTop: 16 }}>
        <Button title={saving ? 'Saving...' : 'Save workout'} onPress={handleSave} disabled={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, backgroundColor: '#fff', marginBottom: 8 },
  exerciseCard: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f9f9f9' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  smallInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6 },
});
