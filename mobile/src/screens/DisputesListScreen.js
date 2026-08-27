import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const STATUS_INFO = {
  awaiting_evidence: { label: 'Awaiting your evidence', color: '#f0a500' },
  voting: { label: 'Peer tribunal voting', color: '#0077b6' },
  upheld: { label: 'Upheld — account deactivated', color: '#c0392b' },
  dismissed: { label: 'Dismissed — cleared', color: '#2a9d8f' },
};

export default function DisputesListScreen({ navigation }) {
  const { token } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getDisputes(token);
      setDisputes(data);
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
      <Text style={styles.intro}>
        Disputes involving you — either as the worker under review, or as a peer juror
        assigned to vote.
      </Text>
      <FlatList
        data={disputes}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No disputes right now — good sign.</Text>}
        renderItem={({ item }) => {
          const info = STATUS_INFO[item.status] || STATUS_INFO.awaiting_evidence;
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DisputeDetail', { disputeId: item.id })}>
              <View style={[styles.dot, { backgroundColor: info.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Dispute #{item.id}</Text>
                <Text style={styles.cardMeta}>{info.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  intro: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 19 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f8f7', borderRadius: 12, padding: 16, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a3c34' },
  cardMeta: { fontSize: 13, color: '#666', marginTop: 2 },
});
