import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CustomerHomeScreen from './src/screens/CustomerHomeScreen';
import BookServiceScreen from './src/screens/BookServiceScreen';
import BookingStatusScreen from './src/screens/BookingStatusScreen';
import RateWorkerScreen from './src/screens/RateWorkerScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import WorkerHomeScreen from './src/screens/WorkerHomeScreen';
import WalletScreen from './src/screens/WalletScreen';
import DisputesListScreen from './src/screens/DisputesListScreen';
import DisputeDetailScreen from './src/screens/DisputeDetailScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="BookService" component={BookServiceScreen} options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="BookingStatus" component={BookingStatusScreen} options={{ headerShown: true, title: 'Booking' }} />
      <Stack.Screen name="RateWorker" component={RateWorkerScreen} options={{ headerShown: true, title: 'Rate service' }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ headerShown: true, title: '' }} />
    </Stack.Navigator>
  );
}

// Worker gets its own stack now: home (availability + jobs) plus Wallet
// and Disputes/Peer Tribunal screens, reachable via quick-link buttons on
// the home screen.
function WorkerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkerHome" component={WorkerHomeScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: true, title: 'My Wallet' }} />
      <Stack.Screen name="Disputes" component={DisputesListScreen} options={{ headerShown: true, title: 'Disputes' }} />
      <Stack.Screen name="DisputeDetail" component={DisputeDetailScreen} options={{ headerShown: true, title: 'Dispute' }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a3c34" />
      </View>
    );
  }

  if (!user) return <AuthStack />;
  if (user.role === 'worker') return <WorkerStack />;
  // customer, society_admin, federation_admin all land in the customer
  // shopping flow for this prototype — admin dashboard is a separate
  // (web) app, not part of this mobile build.
  return <CustomerStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
