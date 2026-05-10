import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { PanicActiveScreen } from './src/screens/PanicActiveScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { PanicProvider } from './src/context/PanicContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { usePanic } from './src/hooks/usePanic';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

function PanicTab() {
  const { isActive } = usePanic();
  return isActive ? <PanicActiveScreen /> : <HomeScreen />;
}

type TabIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TAB_ICONS: Record<string, TabIconName> = {
  Home: 'emergency',
  Timer: 'timer',
  Contacts: 'group',
  Rights: 'gavel',
  Documents: 'description',
};

function MainApp() {
  return (
    <PanicProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.surfaceBorder,
              borderTopWidth: 1,
              height: Platform.OS === 'web' ? 72 : 76,
              paddingBottom: Platform.OS === 'web' ? 12 : 16,
              paddingTop: 8,
            },
            tabBarItemStyle: {
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginTop: 2,
            },
            tabBarIcon: ({ focused, color }) => {
              const name = TAB_ICONS[route.name] ?? 'circle';
              if (route.name === 'Home') {
                return (
                  <View style={{
                    width: 32, height: 28, borderRadius: 6,
                    backgroundColor: focused ? colors.primary : colors.surfaceElevated,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MaterialIcons name={name} size={16} color={focused ? colors.onPrimary : colors.textMuted} />
                  </View>
                );
              }
              return <MaterialIcons name={name} size={22} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={PanicTab} options={{ tabBarLabel: 'PANIC' }} />
          <Tab.Screen name="Timer" component={TimerScreen} options={{ tabBarLabel: 'TIMER' }} />
          <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarLabel: 'CONTACTS' }} />
          <Tab.Screen name="Rights" component={ChatScreen} options={{ tabBarLabel: 'RIGHTS' }} />
          <Tab.Screen
            name="Documents"
            component={DocumentsScreen}
            options={{ tabBarButton: () => null, tabBarLabel: 'DOCS' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PanicProvider>
  );
}

function AuthFlow() {
  const [showSignup, setShowSignup] = useState(false);
  if (showSignup) return <SignupScreen onGoLogin={() => setShowSignup(false)} />;
  return <LoginScreen onGoSignup={() => setShowSignup(true)} />;
}

function AppRoot() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 36, fontWeight: '900', color: colors.primary, letterSpacing: 4 }}>PAN!C</Text>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (!user) return <AuthFlow />;
  return <MainApp />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.background} />
        <AuthProvider>
          <AppRoot />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
