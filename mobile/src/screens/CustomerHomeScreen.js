import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const CATEGORY_ICONS = {
  electrician: '⚡', plumber: '🔧', carpenter: '🪚', painter: '🎨',
  domestic_help: '🏠', caregiver: '🩺', driver: '🚗', gardener: '🌱',
  cleaner: '🧹', technician: '🛠️',
};

export default function CustomerHomeScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getCategories(token);
      setCategories(data);
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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.sub}>What do you need today?</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.bookingsLink} onPress={() => navigation.navigate('MyBookings')}>
        <Text style={styles.bookingsLinkText}>📋 View my bookings</Text>
      </TouchableOpacity>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BookService', { category: item })}
          >
            <Text style={styles.icon}>{CATEGORY_ICONS[item.name] || '🔧'}</Text>
            <Text style={styles.cardTitle}>{item.name.replace('_', ' ')}</Text>
            <Text style={styles.cardRate}>from ₹{item.base_rate}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1a3c34' },
  sub: { fontSize: 14, color: '#666', marginTop: 2 },
  logout: { color: '#999', fontSize: 13 },
  bookingsLink: { backgroundColor: '#eef5f2', borderRadius: 10, padding: 12, marginBottom: 16 },
  bookingsLinkText: { color: '#1a3c34', fontWeight: '600', textAlign: 'center' },
  card: {
    flex: 1, margin: 6, backgroundColor: '#f7f8f7', borderRadius: 14, padding: 18,
    alignItems: 'center', minHeight: 110, justifyContent: 'center',
  },
  icon: { fontSize: 28, marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1a3c34', textTransform: 'capitalize', textAlign: 'center' },
  cardRate: { fontSize: 12, color: '#888', marginTop: 4 },
});
