import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, StyleSheet, Platform } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { PanicActiveScreen } from './src/screens/PanicActiveScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { PanicProvider } from './src/context/PanicContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { default: string; active: string }> = {
  Home:     { default: '🚨', active: '🚨' },
  Alert:    { default: '⚡', active: '⚡' },
  Timer:    { default: '⏱', active: '⏱' },
  Contacts: { default: '👥', active: '👥' },
  Rights:   { default: '⚖️', active: '⚖️' },
};

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.background} />
        <PanicProvider>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: colors.surfaceContainer,
                  borderTopColor: colors.outlineVariant,
                  borderTopWidth: 2,
                  height: Platform.OS === 'web' ? 64 : 72,
                  paddingBottom: Platform.OS === 'web' ? 8 : 12,
                  paddingTop: 4,
                },
                tabBarActiveTintColor: colors.onPrimary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  marginTop: 2,
                },
                tabBarItemStyle: {
                  paddingVertical: 2,
                },
                tabBarIcon: ({ focused }) => (
                  <View style={[styles.iconWrap, focused && styles.iconActive]}>
                    <Text style={styles.icon}>{TAB_ICONS[route.name]?.default ?? '●'}</Text>
                  </View>
                ),
                tabBarActiveBackgroundColor: 'transparent',
              })}
              tabBarOptions={{
                activeTintColor: colors.primary,
                inactiveTintColor: colors.textSecondary,
              } as any}
            >
              <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarLabel: 'PANIC' }}
              />
              <Tab.Screen
                name="Alert"
                component={PanicActiveScreen}
                options={{ tabBarLabel: 'ALERT' }}
              />
              <Tab.Screen
                name="Timer"
                component={TimerScreen}
                options={{ tabBarLabel: 'TIMER' }}
              />
              <Tab.Screen
                name="Contacts"
                component={ContactsScreen}
                options={{ tabBarLabel: 'CONTACTS' }}
              />
              <Tab.Screen
                name="Rights"
                component={ChatScreen}
                options={{ tabBarLabel: 'RIGHTS' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </PanicProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36, height: 28,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  iconActive: {
    backgroundColor: colors.primary,
  },
  icon: { fontSize: 16 },
});
