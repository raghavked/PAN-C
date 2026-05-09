import React, { useState, CSSProperties } from 'react';
import { colors, spacingNum } from '../../theme';

interface TextInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  editable?: boolean;
  style?: CSSProperties;
  maxLength?: number;
  label?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  editable = true,
  style,
  maxLength,
  label,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacingNum.xs,
    width: '100%',
  };

  const inputStyle: CSSProperties = {
    border: `${isFocused ? 2 : 1}px solid ${isFocused ? colors.primary : colors.border}`,
    borderRadius: 8,
    paddingLeft: spacingNum.lg,
    paddingRight: spacingNum.lg,
    paddingTop: spacingNum.md,
    paddingBottom: spacingNum.md,
    backgroundColor: isFocused ? colors.surfaceLevel2 : colors.surfaceLevel1,
    color: colors.onSurface,
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '1rem',
    lineHeight: '1.5rem',
    minHeight: 44,
    outline: 'none',
    opacity: editable ? 1 : 0.5,
    cursor: editable ? 'text' : 'not-allowed',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
    width: '100%',
    ...style,
  };

  const labelStyle: CSSProperties = {
    color: colors.onSurfaceVariant,
    fontSize: '0.875rem',
    fontWeight: '600',
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        type={secureTextEntry ? 'password' : 'text'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        disabled={!editable}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={inputStyle}
      />
    </div>
  );
};
