import React, { CSSProperties } from 'react';
import { colors, spacingNum } from '../../theme';

interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  const tabBarStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: colors.surfaceLevel1,
    borderTop: `1px solid ${colors.border}`,
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
  };

  const tabStyle = (isActive: boolean): CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacingNum.md,
    paddingBottom: spacingNum.md,
    borderBottom: `3px solid ${isActive ? colors.primary : 'transparent'}`,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottomWidth: 3,
    borderBottomStyle: 'solid',
    borderBottomColor: isActive ? colors.primary : 'transparent',
    gap: spacingNum.xs,
    transition: 'border-color 0.15s ease',
  });

  const iconStyle: CSSProperties = {
    fontSize: 24,
    lineHeight: 1,
  };

  const labelStyle = (isActive: boolean): CSSProperties => ({
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '0.75rem',
    fontWeight: isActive ? '700' : '400',
    color: isActive ? colors.primary : colors.onSurfaceVariant,
    transition: 'color 0.15s ease',
  });

  return (
    <nav style={tabBarStyle} aria-label="Main navigation">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            style={tabStyle(isActive)}
            onClick={() => onTabChange(tab.key)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
          >
            <span style={iconStyle}>{tab.icon}</span>
            <span style={labelStyle(isActive)}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
