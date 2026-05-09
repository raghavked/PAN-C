import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

export interface TabItem {
  key: string;
  label: string;
  icon: string;
}

interface Props {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export const TabBar: React.FC<Props> = ({ tabs, activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || spacing.sm }]}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.icon, active && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
            {active && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  icon: { fontSize: 22, marginBottom: 2 },
  activeIcon: {},
  label: { ...typography.caption, color: colors.textMuted },
  activeLabel: { color: colors.primary, fontWeight: '600' },
  indicator: {
    position: 'absolute',
    top: -spacing.sm,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
