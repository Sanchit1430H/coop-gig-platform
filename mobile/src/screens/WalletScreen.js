import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function WalletScreen({ route }) {
  const { workerId } = route.params;
  const { token } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.getWallet(token, workerId);
      setWallet(data);
    } finally {
      setLoading(false);
    }
  }, [token, workerId]);

  useEffect(() => { load(); }, [load]);

  async function handleWithdraw() {
    const value = parseFloat(amount);
    if (!value || value <= 0) return Alert.alert('Invalid amount', 'Enter a positive amount');
    try {
      await api.withdrawFromWallet(token, workerId, { amount: value, note: 'Emergency withdrawal via app' });
      setShowWithdraw(false);
      setAmount('');
      load();
    } catch (err) {
      Alert.alert('Withdrawal failed', err.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3c34" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Micro-Benefits Wallet</Text>
        <Text style={styles.balanceValue}>₹{wallet.balance.toFixed(2)}</Text>
        <Text style={styles.balanceSub}>Emergency & sick-leave fund, built from every job you complete</Text>
        <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdraw(true)}>
          <Text style={styles.withdrawBtnText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>History</Text>
      <FlatList
        data={wallet.transactions}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txNote}>{item.note || item.type}</Text>
              <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.txAmount, item.amount < 0 ? styles.txNegative : styles.txPositive]}>
              {item.amount > 0 ? '+' : ''}₹{item.amount.toFixed(2)}
            </Text>
          </View>
        )}
      />

      <Modal visible={showWithdraw} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Withdraw from wallet</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (₹)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWithdraw(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleWithdraw}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { backgroundColor: '#1a3c34', borderRadius: 16, padding: 22, marginBottom: 20, alignItems: 'center' },
  balanceLabel: { color: '#cde3dd', fontSize: 13, fontWeight: '600' },
  balanceValue: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 6 },
  balanceSub: { color: '#cde3dd', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 17 },
  withdrawBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginTop: 16 },
  withdrawBtnText: { color: '#1a3c34', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a3c34', marginBottom: 10 },
  empty: { color: '#999', fontSize: 14 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f7f8f7', borderRadius: 10, padding: 14, marginBottom: 8 },
  txNote: { fontSize: 13, color: '#1a3c34', fontWeight: '600' },
  txDate: { fontSize: 11, color: '#999', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txPositive: { color: '#2a9d8f' },
  txNegative: { color: '#c0392b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a3c34', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#eee', borderRadius: 10 },
  modalCancelText: { color: '#555', fontWeight: '600' },
  modalConfirm: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#1a3c34', borderRadius: 10 },
  modalConfirmText: { color: '#fff', fontWeight: '600' },
});
