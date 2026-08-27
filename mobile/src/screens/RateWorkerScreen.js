import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function RateWorkerScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const { token } = useAuth();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await api.rate(token, { booking_id: bookingId, stars, comment });
      Alert.alert('Thank you!', 'Your rating helps other households and keeps the cooperative accountable.', [
        { text: 'Done', onPress: () => navigation.popToTop() },
      ]);
    } catch (err) {
      Alert.alert('Could not submit rating', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was the service?</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setStars(n)}>
            <Text style={[styles.star, n <= stars && styles.starFilled]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Optional comment"
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit rating</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a3c34', marginBottom: 24 },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  star: { fontSize: 40, color: '#ddd' },
  starFilled: { color: '#f0a500' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15,
    width: '100%', minHeight: 80, textAlignVertical: 'top', marginBottom: 20,
  },
  button: { backgroundColor: '#1a3c34', borderRadius: 10, padding: 16, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
