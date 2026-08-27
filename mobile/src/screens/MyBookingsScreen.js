import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const STATUS_COLORS = {
  searching: '#f0a500', matched: '#0077b6', accepted: '#2a9d8f',
  in_progress: '#2a9d8f', completed: '#1a3c34', cancelled: '#999', no_match: '#c0392b',
};

export default function MyBookingsScreen({ navigation }) {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getBookings(token);
      setBookings(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3c34" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BookingStatus', { bookingId: item.id })}
          >
            <View style={[styles.dot, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Booking #{item.id}</Text>
              <Text style={styles.cardMeta}>{item.status.replace('_', ' ')}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a3c34', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f8f7', borderRadius: 12, padding: 16, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a3c34' },
  cardMeta: { fontSize: 13, color: '#666', marginTop: 2, textTransform: 'capitalize' },
});
