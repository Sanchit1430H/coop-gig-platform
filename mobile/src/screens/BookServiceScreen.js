import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

// Default demo location: Cuttack, Odisha — matches the seeded worker data.
// Swap for expo-location's getCurrentPositionAsync() when testing on a real
// device with GPS; kept manual here so the flow isn't blocked by permissions
// during development.
const DEFAULT_LOCATION = { lat: 20.4625, lng: 85.883 };

export default function BookServiceScreen({ route, navigation }) {
  const { category } = route.params;
  const { token } = useAuth();
  const [isEmergency, setIsEmergency] = useState(true);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(String(DEFAULT_LOCATION.lat));
  const [lng, setLng] = useState(String(DEFAULT_LOCATION.lng));
  const [loading, setLoading] = useState(false);

  async function handleBook() {
    setLoading(true);
    try {
      const result = await api.createBooking(token, {
        category_id: category.id,
        is_emergency: isEmergency,
        scheduled_at: isEmergency ? null : new Date(Date.now() + 3600 * 1000).toISOString(),
        customer_lat: parseFloat(lat),
        customer_lng: parseFloat(lng),
        address_text: address || 'Not specified',
      });

      if (result.booking.status === 'no_match') {
        Alert.alert(
          'No workers available',
          `No verified ${category.name.replace('_', ' ')} found nearby right now. Try again shortly or widen your search area.`
        );
        return;
      }

      navigation.replace('BookingStatus', { bookingId: result.booking.id });
    } catch (err) {
      Alert.alert('Booking failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
      <Text style={styles.title}>Book a {category.name.replace('_', ' ')}</Text>
      <Text style={styles.rate}>Reference rate: ₹{category.base_rate}</Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleOption, isEmergency && styles.toggleSelected]}
          onPress={() => setIsEmergency(true)}
        >
          <Text style={[styles.toggleText, isEmergency && styles.toggleTextSelected]}>⚡ Emergency (now)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, !isEmergency && styles.toggleSelected]}
          onPress={() => setIsEmergency(false)}
        >
          <Text style={[styles.toggleText, !isEmergency && styles.toggleTextSelected]}>📅 Schedule later</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Address / notes</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Near Cuttack station, 2nd floor"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Location (demo — defaults to Cuttack)</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} value={lat} onChangeText={setLat} keyboardType="numeric" placeholder="Latitude" />
        <TextInput style={[styles.input, styles.half]} value={lng} onChangeText={setLng} keyboardType="numeric" placeholder="Longitude" />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleBook} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Find a {category.name.replace('_', ' ')}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a3c34', textTransform: 'capitalize' },
  rate: { fontSize: 14, color: '#888', marginBottom: 24, marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toggleOption: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, alignItems: 'center' },
  toggleSelected: { backgroundColor: '#1a3c34', borderColor: '#1a3c34' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#444' },
  toggleTextSelected: { color: '#fff' },
  label: { fontSize: 13, color: '#444', marginBottom: 8, marginTop: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  button: { backgroundColor: '#1a3c34', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
});
