import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/client';

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

  // AI Diagnostic States
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const load = useCallback(async () => {
    try {
      // According to your backend documentation, categories are fetched from /admin/categories
      const data = await request('/admin/categories', { 
        method: 'GET',
        token: token 
      });
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Multimodal AI Diagnostic Function using Direct REST API (Bypasses SDK errors)
  const diagnoseProblem = async () => {
    if (!aiQuery.trim()) return;
    setIsDiagnosing(true);
    setAiResponse('');
    
    try {
     const API_KEY = "HIDDEN_FOR_GITHUB";
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a gig work diagnostic AI. A customer says: "${aiQuery}". Which of these specific service categories is most likely needed: electrician, plumber, carpenter, painter, domestic_help, caregiver, driver, gardener, cleaner, technician? Keep your answer to exactly two short sentences: The first sentence identifying the category, and the second sentence briefly explaining the likely repair/tools needed.`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      
      // Catch invalid API keys or missing .env variables
      if (data.error) {
         setAiResponse(`API Error: ${data.error.message}`);
         return;
      }

      // Extract and set the successful response
      setAiResponse(data.candidates[0].content.parts[0].text);
      
    } catch (error) {
      console.error("Fetch Error:", error);
      setAiResponse("Network error. Please try again.");
    } finally {
      setIsDiagnosing(false);
    }
  };

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

      {/* New AI Diagnostic Interface */}
      <View style={styles.aiContainer}>
        <Text style={styles.aiTitle}>✨ Not sure who to hire? Ask AI:</Text>
        <TextInput
          style={styles.aiInput}
          placeholder="e.g., The light switch is sparking..."
          value={aiQuery}
          onChangeText={setAiQuery}
          multiline
        />
        <TouchableOpacity style={styles.aiButton} onPress={diagnoseProblem} disabled={isDiagnosing}>
          {isDiagnosing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.aiButtonText}>Diagnose Issue</Text>
          )}
        </TouchableOpacity>
        {aiResponse ? (
          <View style={styles.aiResponseBox}>
            <Text style={styles.aiResponseText}>{aiResponse}</Text>
          </View>
        ) : null}
      </View>

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
  
  // AI Feature Styles
  aiContainer: { backgroundColor: '#f0f4ff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#d0ddff' },
  aiTitle: { fontSize: 14, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  aiInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e1e1e1', marginBottom: 10 },
  aiButton: { backgroundColor: '#4285F4', padding: 12, borderRadius: 8, alignItems: 'center' },
  aiButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  aiResponseBox: { marginTop: 12, padding: 12, backgroundColor: '#e6f4ea', borderRadius: 8, borderWidth: 1, borderColor: '#ceead6' },
  aiResponseText: { color: '#137333', fontSize: 13, lineHeight: 18 },

  card: {
    flex: 1, margin: 6, backgroundColor: '#f7f8f7', borderRadius: 14, padding: 18,
    alignItems: 'center', minHeight: 110, justifyContent: 'center',
  },
  icon: { fontSize: 28, marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1a3c34', textTransform: 'capitalize', textAlign: 'center' },
  cardRate: { fontSize: 12, color: '#888', marginTop: 4 },
});