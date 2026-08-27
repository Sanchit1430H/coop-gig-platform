import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const STATUS_LABELS = {
  searching: { label: 'Finding a worker near you…', color: '#f0a500' },
  matched: { label: 'Worker found — waiting for confirmation', color: '#0077b6' },
  accepted: { label: 'Worker is on the way', color: '#2a9d8f' },
  in_progress: { label: 'Service in progress', color: '#2a9d8f' },
  completed: { label: 'Completed', color: '#1a3c34' },
  cancelled: { label: 'Cancelled', color: '#999' },
  no_match: { label: 'No worker available', color: '#c0392b' },
};

export default function BookingStatusScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const { token } = useAuth();
  const [booking, setBooking] = useState(null);
  const [worker, setWorker] = useState(null);
  const [category, setCategory] = useState(null);
  const [payment, setPayment] = useState(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    const bookings = await api.getBookings(token);
    const current = bookings.find((b) => b.id === bookingId);
    setBooking(current);

    if (current?.worker_id) {
      const workers = await api.getWorkers(token);
      setWorker(workers.find((w) => w.id === current.worker_id));
    }
    if (current?.category_id && !category) {
      const categories = await api.getCategories(token);
      setCategory(categories.find((c) => c.id === current.category_id));
    }
  }, [token, bookingId, category]);

  useEffect(() => {
    load();
    // Poll every 3s to reflect worker accept/decline and status changes —
    // fine for a prototype; a real build would use websockets/push instead.
    pollRef.current = setInterval(load, 3000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  async function handlePay() {
    try {
      // labor_cost is the worker's fixed, protected rate — never reduced by
      // platform fees. Falls back to the category's reference rate.
      const labor_cost = category?.base_rate || 400;
      const result = await api.pay(token, { booking_id: booking.id, labor_cost });
      setPayment(result);
    } catch (err) {
      Alert.alert('Payment failed', err.message);
    }
  }

  async function markCompleted() {
    // Demo convenience: in production the WORKER marks in_progress/completed
    // from their app. Exposed here so the customer flow can be demoed solo.
    try {
      await api.updateBookingStatus(token, booking.id, 'in_progress');
      await api.updateBookingStatus(token, booking.id, 'completed');
      load();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3c34" />
      </View>
    );
  }

  const status = STATUS_LABELS[booking.status] || STATUS_LABELS.searching;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
      <View style={[styles.statusBanner, { backgroundColor: status.color }]}>
        <Text style={styles.statusText}>{status.label}</Text>
      </View>

      {worker && (
        <View style={styles.workerCard}>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerMeta}>{worker.category_name} · {worker.experience_years} yrs experience</Text>
          <Text style={styles.workerMeta}>⭐ {worker.avg_rating?.toFixed(1) || 'New'} ({worker.rating_count} ratings)</Text>
          {worker.distance_km != null && (
            <Text style={styles.workerMeta}>📍 {worker.distance_km.toFixed(1)} km away</Text>
          )}
          {worker.insurance_enrolled ? <Text style={styles.badge}>✓ Insured through cooperative</Text> : null}
        </View>
      )}

      <View style={styles.detailCard}>
        <Text style={styles.detailRow}>Booking #{booking.id}</Text>
        <Text style={styles.detailRow}>{booking.is_emergency ? 'Emergency booking' : 'Scheduled booking'}</Text>
        <Text style={styles.detailRow}>{booking.address_text}</Text>
      </View>

      {booking.status === 'accepted' && (
        <TouchableOpacity style={styles.button} onPress={markCompleted}>
          <Text style={styles.buttonText}>Mark service as completed</Text>
        </TouchableOpacity>
      )}

      {booking.status === 'completed' && !payment && !booking.price_quoted && (
        <TouchableOpacity style={styles.button} onPress={handlePay}>
          <Text style={styles.buttonText}>Pay & see the breakdown</Text>
        </TouchableOpacity>
      )}

      {payment && (
        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>Zero-Middleman pricing</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Worker gets (in full)</Text>
            <Text style={styles.priceValueWorker}>₹{payment.breakdown.labor_cost}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Social security wallet</Text>
            <Text style={styles.priceValue}>+₹{payment.breakdown.wallet_contribution}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Cooperative fee (5%)</Text>
            <Text style={styles.priceValue}>+₹{payment.breakdown.platform_fee}</Text>
          </View>
          <View style={[styles.priceRow, styles.priceRowTotal]}>
            <Text style={styles.priceLabelTotal}>You pay</Text>
            <Text style={styles.priceValueTotal}>₹{payment.breakdown.customer_total}</Text>
          </View>

          <View style={styles.savingsBanner}>
            <Text style={styles.savingsText}>
              A typical app would charge ~₹{payment.competitor_estimate} for this job.{'\n'}
              You saved ₹{payment.savings_vs_competitor} — and the worker still got paid more.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.replace('RateWorker', { bookingId: booking.id, workerId: booking.worker_id })}
          >
            <Text style={styles.buttonText}>Continue to rate the service</Text>
          </TouchableOpacity>
        </View>
      )}

      {booking.status === 'no_match' && (
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: { borderRadius: 12, padding: 16, marginBottom: 20 },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  workerCard: { backgroundColor: '#f7f8f7', borderRadius: 14, padding: 18, marginBottom: 16 },
  workerName: { fontSize: 18, fontWeight: '700', color: '#1a3c34' },
  workerMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  badge: { fontSize: 12, color: '#2a9d8f', marginTop: 8, fontWeight: '600' },
  detailCard: { marginBottom: 20 },
  detailRow: { fontSize: 14, color: '#555', marginBottom: 4 },
  button: { backgroundColor: '#1a3c34', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  priceCard: { backgroundColor: '#f7f8f7', borderRadius: 14, padding: 18, marginTop: 8 },
  priceCardTitle: { fontSize: 16, fontWeight: '700', color: '#1a3c34', marginBottom: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceRowTotal: { borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 10, marginTop: 4 },
  priceLabel: { fontSize: 14, color: '#555' },
  priceLabelTotal: { fontSize: 15, color: '#1a3c34', fontWeight: '700' },
  priceValue: { fontSize: 14, color: '#555' },
  priceValueWorker: { fontSize: 14, color: '#2a9d8f', fontWeight: '700' },
  priceValueTotal: { fontSize: 16, color: '#1a3c34', fontWeight: '700' },
  savingsBanner: { backgroundColor: '#eef5f2', borderRadius: 10, padding: 12, marginTop: 14, marginBottom: 8 },
  savingsText: { fontSize: 13, color: '#1a3c34', lineHeight: 19, textAlign: 'center' },
});
