import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const STATUS_INFO = {
  awaiting_evidence: { label: 'Awaiting evidence', color: '#f0a500' },
  voting: { label: 'Peer tribunal is voting', color: '#0077b6' },
  upheld: { label: 'Upheld — deactivated', color: '#c0392b' },
  dismissed: { label: 'Dismissed — cleared', color: '#2a9d8f' },
};

export default function DisputeDetailScreen({ route }) {
  const { disputeId } = route.params;
  const { token, user } = useAuth();
  const [dispute, setDispute] = useState(null);
  const [myWorkerId, setMyWorkerId] = useState(null);
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getDispute(token, disputeId);
      setDispute(data);

      // Figure out "my" worker id so we know: am I the accused, or a juror?
      const workers = await api.getWorkers(token);
      const mine = workers.find((w) => w.user_id === user.id);
      if (mine) setMyWorkerId(mine.id);
    } finally {
      setLoading(false);
    }
  }, [token, disputeId, user]);

  useEffect(() => { load(); }, [load]);

  async function submitEvidence() {
    if (!evidence.trim()) return Alert.alert('Add your explanation', 'Evidence text is required');
    try {
      await api.submitDisputeEvidence(token, disputeId, evidence);
      load();
    } catch (err) {
      Alert.alert('Could not submit', err.message);
    }
  }

  async function vote(choice) {
    try {
      const result = await api.voteOnDispute(token, disputeId, choice);
      if (result.resolution) {
        Alert.alert('Tribunal resolved', `Result: ${result.resolution} (${result.uphold_votes} uphold, ${result.dismiss_votes} dismiss)`);
      } else {
        Alert.alert('Vote recorded', 'Waiting for the remaining juror(s).');
      }
      load();
    } catch (err) {
      Alert.alert('Could not vote', err.message);
    }
  }

  if (loading || !dispute) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3c34" />
      </View>
    );
  }

  const info = STATUS_INFO[dispute.status] || STATUS_INFO.awaiting_evidence;
  const isAccused = myWorkerId === dispute.worker_id;
  const jurors = dispute.jurors_assigned ? JSON.parse(dispute.jurors_assigned) : [];
  const isJuror = jurors.includes(myWorkerId);
  const myVote = dispute.votes?.find((v) => v.juror_worker_id === myWorkerId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={[styles.statusBanner, { backgroundColor: info.color }]}>
        <Text style={styles.statusText}>{info.label}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Trigger</Text>
        <Text style={styles.value}>{dispute.trigger_reason.replace(/_/g, ' ')}</Text>
      </View>

      {dispute.worker_evidence && (
        <View style={styles.card}>
          <Text style={styles.label}>Worker's evidence</Text>
          <Text style={styles.value}>{dispute.worker_evidence}</Text>
        </View>
      )}

      {isAccused && dispute.status === 'awaiting_evidence' && (
        <View style={styles.card}>
          <Text style={styles.label}>Explain what happened</Text>
          <Text style={styles.hint}>
            Your explanation goes to 3 randomly selected, verified peer workers who will vote
            to dismiss or uphold this dispute. Be specific and factual.
          </Text>
          <TextInput
            style={styles.textarea}
            multiline
            placeholder="e.g. The customer gave the wrong address, so I couldn't complete the job on time..."
            value={evidence}
            onChangeText={setEvidence}
          />
          <TouchableOpacity style={styles.button} onPress={submitEvidence}>
            <Text style={styles.buttonText}>Submit to peer tribunal</Text>
          </TouchableOpacity>
        </View>
      )}

      {isJuror && dispute.status === 'voting' && !myVote && (
        <View style={styles.card}>
          <Text style={styles.label}>You are a juror on this case</Text>
          <Text style={styles.hint}>Review the evidence above, then cast your vote. This cannot be changed once submitted.</Text>
          <View style={styles.voteRow}>
            <TouchableOpacity style={styles.dismissBtn} onPress={() => vote('dismiss')}>
              <Text style={styles.dismissBtnText}>Dismiss (clear worker)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.upholdBtn} onPress={() => vote('uphold')}>
              <Text style={styles.upholdBtnText}>Uphold (confirm penalty)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isJuror && myVote && (
        <View style={styles.card}>
          <Text style={styles.label}>Your vote</Text>
          <Text style={styles.value}>{myVote.vote === 'uphold' ? 'Upheld the penalty' : 'Dismissed — cleared the worker'}</Text>
        </View>
      )}

      {dispute.resolution_note && (
        <View style={styles.card}>
          <Text style={styles.label}>Resolution</Text>
          <Text style={styles.value}>{dispute.resolution_note}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: { borderRadius: 12, padding: 16, marginBottom: 16 },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  card: { backgroundColor: '#f7f8f7', borderRadius: 14, padding: 18, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 6 },
  value: { fontSize: 14, color: '#1a3c34', lineHeight: 20 },
  hint: { fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 17 },
  textarea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, minHeight: 100, textAlignVertical: 'top', fontSize: 14, marginBottom: 12, backgroundColor: '#fff' },
  button: { backgroundColor: '#1a3c34', borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  voteRow: { flexDirection: 'row', gap: 10 },
  dismissBtn: { flex: 1, backgroundColor: '#2a9d8f', borderRadius: 10, padding: 14, alignItems: 'center' },
  dismissBtnText: { color: '#fff', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  upholdBtn: { flex: 1, backgroundColor: '#c0392b', borderRadius: 10, padding: 14, alignItems: 'center' },
  upholdBtnText: { color: '#fff', fontWeight: '600', fontSize: 12, textAlign: 'center' },
});
