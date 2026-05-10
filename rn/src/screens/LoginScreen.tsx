import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

interface Props {
  onGoSignup: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onGoSignup }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Text style={s.logo}>PAN!C</Text>
            <Text style={s.tagline}>Personal Alert Network · Community</Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>SIGN IN</Text>
            <Text style={s.cardSub}>Access your emergency network</Text>

            <View style={s.field}>
              <Text style={s.label}>EMAIL</Text>
              <View style={s.inputWrap}>
                <MaterialIcons name="email" size={16} color={colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>PASSWORD</Text>
              <View style={s.inputWrap}>
                <MaterialIcons name="lock" size={16} color={colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoComplete="current-password"
                />
                <Pressable onPress={() => setShowPass((p) => !p)} style={s.eyeBtn}>
                  <MaterialIcons
                    name={showPass ? 'visibility-off' : 'visibility'}
                    size={16}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={s.errorBox}>
                <MaterialIcons name="error-outline" size={14} color={colors.primary} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [s.btn, pressed && s.btnPressed, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={s.btnText}>LOG IN</Text>
              )}
            </Pressable>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>OR</Text>
              <View style={s.dividerLine} />
            </View>

            <Pressable style={({ pressed }) => [s.ghostBtn, pressed && s.ghostBtnPressed]} onPress={onGoSignup}>
              <Text style={s.ghostBtnText}>CREATE ACCOUNT</Text>
            </Pressable>
          </View>

          <Text style={s.footer}>
            Emergency protections for immigrant communities
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },

  header: { alignItems: 'center', gap: 6 },
  logo: { fontSize: 48, fontWeight: '900', color: colors.primary, letterSpacing: 4 },
  tagline: { fontSize: 12, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },

  card: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: 2 },
  cardSub: { fontSize: 13, color: colors.textSecondary, marginTop: -6 },

  field: { gap: 6 },
  label: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, paddingHorizontal: 12, height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  eyeBtn: { padding: 4 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(248,91,88,0.12)',
    borderRadius: radius.sm, padding: 10,
    borderWidth: 1, borderColor: 'rgba(248,91,88,0.3)',
  },
  errorText: { color: colors.primary, fontSize: 13, flex: 1 },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 14, fontWeight: '800', color: colors.onPrimary, letterSpacing: 2, textTransform: 'uppercase' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.surfaceBorder },
  dividerText: { fontSize: 11, color: colors.textMuted, letterSpacing: 1 },

  ghostBtn: {
    borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.md,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  ghostBtnPressed: { borderColor: colors.outline, backgroundColor: colors.surfaceElevated },
  ghostBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, textTransform: 'uppercase' },

  footer: { textAlign: 'center', fontSize: 11, color: colors.textMuted, letterSpacing: 0.5 },
});
