import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { PanicActiveScreen } from './src/screens/PanicActiveScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { PanicProvider } from './src/context/PanicContext';
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
                  backgroundColor: colors.surface,
                  borderTopColor: colors.surfaceBorder,
                  borderTopWidth: 1,
                  height: Platform.OS === 'web' ? 60 : 72,
                  paddingBottom: Platform.OS === 'web' ? 8 : 14,
                  paddingTop: 6,
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
                        <MaterialIcons
                          name={name}
                          size={16}
                          color={focused ? colors.onPrimary : colors.textMuted}
                        />
                      </View>
                    );
                  }
                  return <MaterialIcons name={name} size={22} color={color} />;
                },
              })}
            >
              <Tab.Screen
                name="Home"
                component={PanicTab}
                options={{ tabBarLabel: 'PANIC' }}
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
              <Tab.Screen
                name="Documents"
                component={DocumentsScreen}
                options={{ tabBarButton: () => null, tabBarLabel: 'DOCS' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </PanicProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
