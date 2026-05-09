import { CSSProperties } from 'react';

type TypographyStyle = Pick<CSSProperties, 'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'>;

export const typography: Record<string, TypographyStyle> = {
  displayLarge: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '3rem',
    fontWeight: '800',
    lineHeight: '3.5rem',
    letterSpacing: '-0.02em',
  },
  headlineLarge: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '2rem',
    fontWeight: '700',
    lineHeight: '2.5rem',
  },
  headlineMedium: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '1.5rem',
    fontWeight: '700',
    lineHeight: '2rem',
  },
  headlineSmall: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '1.25rem',
    fontWeight: '700',
    lineHeight: '1.75rem',
  },
  bodyLarge: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '1.125rem',
    fontWeight: '400',
    lineHeight: '1.75rem',
  },
  bodyMedium: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '1rem',
    fontWeight: '400',
    lineHeight: '1.5rem',
  },
  bodySmall: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '0.875rem',
    fontWeight: '400',
    lineHeight: '1.25rem',
  },
  labelLarge: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '0.875rem',
    fontWeight: '700',
    lineHeight: '1.25rem',
    letterSpacing: '0.05em',
  },
  labelMedium: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '0.75rem',
    fontWeight: '600',
    lineHeight: '1rem',
  },
  labelSmall: {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '0.6875rem',
    fontWeight: '600',
    lineHeight: '1rem',
  },
};
