import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, StyleSheet } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { PanicActiveScreen } from './src/screens/PanicActiveScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { PanicProvider } from './src/context/PanicContext';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Alert: '🚨',
  Contacts: '👥',
  Documents: '📄',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <PanicProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor: colors.surfaceBorder,
                borderTopWidth: 1,
                height: 64,
                paddingBottom: 8,
              },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconWrap, focused && styles.iconActive]}>
                  <Text style={styles.icon}>{TAB_ICONS[route.name]}</Text>
                </View>
              ),
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Alert" component={PanicActiveScreen} />
            <Tab.Screen name="Contacts" component={ContactsScreen} />
            <Tab.Screen name="Documents" component={DocumentsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </PanicProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconActive: {
    backgroundColor: 'rgba(226,75,74,0.15)',
  },
  icon: { fontSize: 20 },
});
