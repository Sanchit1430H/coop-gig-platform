import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

// Demo location — see BookServiceScreen for the same note on real GPS.
const DEFAULT_LOCATION = { lat: 20.4625, lng: 85.883 };

export default function WorkerHomeScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const workers = await api.getWorkers(token);
      const mine = workers.find((w) => w.user_id === user.id);
      setWorker(mine || null);
      if (mine) setAvailable(!!mine.is_available);

      const bookings = await api.getBookings(token);
      setJobs(bookings.filter((b) => ['matched', 'accepted', 'in_progress'].includes(b.status)));
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  async function toggleAvailability(value) {
    if (!worker) return;
    setAvailable(value);
    try {
      await api.setAvailability(token, worker.id, {
        is_available: value,
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng,
      });
    } catch (err) {
      Alert.alert('Could not update availability', err.message);
      setAvailable(!value);
    }
  }

  async function respond(bookingId, action) {
    try {
      await api.respondToBooking(token, bookingId, action);
      load();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function startJob(bookingId) {
    try {
      await api.updateBookingStatus(token, bookingId, 'in_progress');
      load();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function completeJob(bookingId) {
    try {
      await api.updateBookingStatus(token, bookingId, 'completed');
      load();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3c34" />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.center}>
        <Text style={styles.noProfile}>
          No worker profile found for your account yet. A society/federation admin needs to
          create and verify your profile before you can accept jobs.
        </Text>
        <TouchableOpacity onPress={logout}><Text style={styles.link}>Log out</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.sub}>{worker.category_name} · {worker.verification_status}</Text>
        </View>
        <TouchableOpacity onPress={logout}><Text style={styles.logout}>Log out</Text></TouchableOpacity>
      </View>

      {worker.verification_status !== 'verified' && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingText}>Your profile is awaiting cooperative verification.</Text>
        </View>
      )}

      {worker.account_status === 'show_cause' && (
        <TouchableOpacity
          style={styles.showCauseBanner}
          onPress={() => navigation.navigate('Disputes')}
        >
          <Text style={styles.showCauseText}>
            ⚠️ A dispute has been raised against your account. Tap here to submit your evidence to the peer tribunal.
          </Text>
        </TouchableOpacity>
      )}

      {worker.account_status === 'deactivated' && (
        <View style={styles.deactivatedBanner}>
          <Text style={styles.deactivatedText}>
            Your account was deactivated following a peer tribunal review.
          </Text>
        </View>
      )}

      <View style={styles.quickLinksRow}>
        <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate('Wallet', { workerId: worker.id })}>
          <Text style={styles.quickLinkIcon}>💰</Text>
          <Text style={styles.quickLinkText}>Wallet · ₹{worker.wallet_balance?.toFixed(0) || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate('Disputes')}>
          <Text style={styles.quickLinkIcon}>⚖️</Text>
          <Text style={styles.quickLinkText}>Disputes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.availabilityRow}>
        <Text style={styles.availabilityLabel}>Available for jobs</Text>
        <Switch value={available} onValueChange={toggleAvailability} disabled={worker.verification_status !== 'verified'} />
      </View>

      <Text style={styles.sectionTitle}>Active jobs</Text>
      {jobs.length === 0 && <Text style={styles.empty}>No active jobs right now.</Text>}
      {jobs.map((job) => (
        <View key={job.id} style={styles.jobCard}>
          <Text style={styles.jobTitle}>Booking #{job.id} · {job.status.replace('_', ' ')}</Text>
          <Text style={styles.jobMeta}>{job.address_text}</Text>
          <Text style={styles.jobMeta}>{job.is_emergency ? '⚡ Emergency' : '📅 Scheduled'}</Text>

          {job.status === 'matched' && (
            <View style={styles.jobActions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => respond(job.id, 'accept')}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn} onPress={() => respond(job.id, 'decline')}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
          {job.status === 'accepted' && (
            <View style={styles.jobActions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => startJob(job.id)}>
                <Text style={styles.acceptText}>Start job</Text>
              </TouchableOpacity>
            </View>
          )}
          {job.status === 'in_progress' && (
            <View style={styles.jobActions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => completeJob(job.id)}>
                <Text style={styles.acceptText}>Complete job</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1a3c34' },
  sub: { fontSize: 13, color: '#666', marginTop: 2, textTransform: 'capitalize' },
  logout: { color: '#999', fontSize: 13 },
  noProfile: { textAlign: 'center', color: '#666', fontSize: 15, marginBottom: 20, lineHeight: 22 },
  link: { color: '#1a3c34', fontSize: 14 },
  pendingBanner: { backgroundColor: '#fff3cd', borderRadius: 10, padding: 12, marginBottom: 16 },
  pendingText: { color: '#856404', fontSize: 13, textAlign: 'center' },
  showCauseBanner: { backgroundColor: '#fdecea', borderRadius: 10, padding: 14, marginBottom: 16 },
  showCauseText: { color: '#c0392b', fontSize: 13, textAlign: 'center', fontWeight: '600', lineHeight: 18 },
  deactivatedBanner: { backgroundColor: '#eee', borderRadius: 10, padding: 14, marginBottom: 16 },
  deactivatedText: { color: '#555', fontSize: 13, textAlign: 'center' },
  quickLinksRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickLink: { flex: 1, backgroundColor: '#f7f8f7', borderRadius: 12, padding: 14, alignItems: 'center' },
  quickLinkIcon: { fontSize: 20, marginBottom: 4 },
  quickLinkText: { fontSize: 12, fontWeight: '600', color: '#1a3c34' },
  availabilityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f7f8f7', borderRadius: 12, padding: 16, marginBottom: 24,
  },
  availabilityLabel: { fontSize: 15, fontWeight: '600', color: '#1a3c34' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a3c34', marginBottom: 10 },
  empty: { color: '#999', fontSize: 14 },
  jobCard: { backgroundColor: '#f7f8f7', borderRadius: 12, padding: 16, marginBottom: 12 },
  jobTitle: { fontSize: 15, fontWeight: '600', color: '#1a3c34', textTransform: 'capitalize' },
  jobMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  jobActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptBtn: { flex: 1, backgroundColor: '#1a3c34', borderRadius: 8, padding: 12, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '600' },
  declineBtn: { flex: 1, backgroundColor: '#eee', borderRadius: 8, padding: 12, alignItems: 'center' },
  declineText: { color: '#c0392b', fontWeight: '600' },
});