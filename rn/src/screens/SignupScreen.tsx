import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme';

interface Props {
  onGoLogin: () => void;
}

type Step = 1 | 2 | 3 | 4;

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

const RELATIONSHIPS = ['Family', 'Spouse/Partner', 'Parent', 'Sibling', 'Friend', 'Lawyer', 'Legal Aid', 'Other'];

export const SignupScreen: React.FC<Props> = ({ onGoLogin }) => {
  const { signup } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRel, setContactRel] = useState('Family');

  const [safePhrase, setSafePhrase] = useState('');
  const [showPhrase, setShowPhrase] = useState(false);

  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!email.trim() || !password.trim() || !fullName.trim() || !phone.trim()) {
        setError('All fields are required.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!contactName.trim() || !contactPhone.trim()) {
        setError('Contact name and phone are required.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleCreate = async () => {
    if (!safePhrase.trim() || safePhrase.trim().length < 3) {
      setError('Safe phrase must be at least 3 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        contact: contactName.trim()
          ? { name: contactName.trim(), phone: contactPhone.trim(), relationship: contactRel }
          : undefined,
        safePhrase: safePhrase.trim(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Signup failed. Try again.');
      setLoading(false);
    }
  };

  const STEPS: { num: Step; label: string; icon: MIName }[] = [
    { num: 1, label: 'ACCOUNT', icon: 'person' },
    { num: 2, label: 'CONTACT', icon: 'group' },
    { num: 3, label: 'DOCUMENT', icon: 'folder' },
    { num: 4, label: 'SAFE PHRASE', icon: 'shield' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.topRow}>
            <Pressable onPress={step === 1 ? onGoLogin : () => { setStep((s) => (s - 1) as Step); setError(null); }} style={s.backBtn}>
              <MaterialIcons name="arrow-back" size={20} color={colors.textSecondary} />
            </Pressable>
            <Text style={s.logo}>PAN!C</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={s.stepRow}>
            {STEPS.map((st, i) => (
              <React.Fragment key={st.num}>
                <View style={s.stepItem}>
                  <View style={[s.stepCircle, step >= st.num && s.stepCircleActive, step > st.num && s.stepCircleDone]}>
                    {step > st.num
                      ? <MaterialIcons name="check" size={14} color={colors.onPrimary} />
                      : <MaterialIcons name={st.icon} size={14} color={step >= st.num ? colors.onPrimary : colors.textMuted} />}
                  </View>
                  <Text style={[s.stepLabel, step >= st.num && s.stepLabelActive]}>{st.label}</Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[s.stepLine, step > st.num && s.stepLineActive]} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={s.card}>
            {step === 1 && (
              <>
                <Text style={s.cardTitle}>CREATE ACCOUNT</Text>
                <Text style={s.cardSub}>Your information stays encrypted and private.</Text>

                <View style={s.field}>
                  <Text style={s.label}>FULL NAME</Text>
                  <View style={s.inputWrap}>
                    <MaterialIcons name="person" size={16} color={colors.textMuted} style={s.icon} />
                    <TextInput style={s.input} placeholder="Alex Chen" placeholderTextColor={colors.textMuted}
                      value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>EMAIL</Text>
                  <View style={s.inputWrap}>
                    <MaterialIcons name="email" size={16} color={colors.textMuted} style={s.icon} />
                    <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted}
                      value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>PHONE</Text>
                  <View style={s.inputWrap}>
                    <MaterialIcons name="phone" size={16} color={colors.textMuted} style={s.icon} />
                    <TextInput style={s.input} placeholder="+1 555 000 0000" placeholderTextColor={colors.textMuted}
                      value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>PASSWORD</Text>
                  <View style={s.inputWrap}>
                    <MaterialIcons name="lock" size={16} color={colors.textMuted} style={s.icon} />
                    <TextInput style={s.input} placeholder="Min 6 characters" placeholderTextColor={colors.textMuted}
                      value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                    <Pressable onPress={() => setShowPass((p) => !p)} style={s.eyeBtn}>
                      <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={s.cardTitle}>EMERGENCY CONTACT</Text>
                <Text style={s.cardSub}>Who should PAN!C notify first in an emergency?</Text>

                <View style={s.field}>
                  <Text style={s.label}>CONTACT NAME</Text>
                  <View style={s.inputWrap}>
                    <MaterialIcons name="person" size={16} color={colors.textMuted} style={s.icon} />
                    <TextInput style={s.input} placeholder="Maria Garcia" placeholderTextColor={colors.textMuted}
                      value={contactName} onChangeText={setContactName} autoCapitalize="words" />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>PHONE NUMBER</Text>
                  <View style={s.inputWrap}>
                    <MaterialIcons name="phone" size={16} color={colors.textMuted} style={s.icon} />
                    <TextInput style={s.input} placeholder="+1 555 000 0000" placeholderTextColor={colors.textMuted}
                      value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>RELATIONSHIP</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
                      {RELATIONSHIPS.map((rel) => (
                        <Pressable
                          key={rel}
                          style={[s.relChip, contactRel === rel && s.relChipActive]}
                          onPress={() => setContactRel(rel)}
                        >
                          <Text style={[s.relChipText, contactRel === rel && s.relChipTextActive]}>{rel}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={s.cardTitle}>DOCUMENT VAULT</Text>
                <Text style={s.cardSub}>Upload encrypted copies of your ID, visa, or legal documents.</Text>

                <View style={s.uploadPlaceholder}>
                  <MaterialIcons name="upload-file" size={36} color={colors.textMuted} />
                  <Text style={s.uploadTitle}>Add Documents Later</Text>
                  <Text style={s.uploadDesc}>
                    You can upload passport, visa, power of attorney, and other documents securely from the Vault tab after signing in.
                  </Text>
                </View>

                <Pressable style={({ pressed }) => [s.skipBtn, pressed && { opacity: 0.7 }]} onPress={() => setStep(4)}>
                  <Text style={s.skipBtnText}>SKIP FOR NOW</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.textSecondary} />
                </Pressable>
              </>
            )}

            {step === 4 && (
              <>
                <Text style={s.cardTitle}>SAFE PHRASE</Text>
                <Text style={s.cardSub}>
                  This phrase disarms the panic alert when you're safe. Keep it secret.
                </Text>

                <View style={s.phraseInfoBox}>
                  <MaterialIcons name="info-outline" size={16} color={colors.textSecondary} />
                  <Text style={s.phraseInfoText}>
                    When the panic button is active, entering this phrase will stop all alerts and mark you as safe.
                  </Text>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>YOUR SAFE PHRASE</Text>
                  <View style={s.inputWrap}>
                    <MaterialIcons name="shield" size={16} color={colors.textMuted} style={s.icon} />
                    <TextInput style={s.input} placeholder="e.g. coffee sunrise 42"
                      placeholderTextColor={colors.textMuted}
                      value={safePhrase} onChangeText={setSafePhrase}
                      secureTextEntry={!showPhrase} autoCapitalize="none" />
                    <Pressable onPress={() => setShowPhrase((p) => !p)} style={s.eyeBtn}>
                      <MaterialIcons name={showPhrase ? 'visibility-off' : 'visibility'} size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            {error ? (
              <View style={s.errorBox}>
                <MaterialIcons name="error-outline" size={14} color={colors.primary} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {step < 4 ? (
              <Pressable style={({ pressed }) => [s.btn, pressed && s.btnPressed]} onPress={goNext}>
                <Text style={s.btnText}>NEXT</Text>
                <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [s.btn, s.btnGreen, pressed && s.btnPressed, loading && s.btnDisabled]}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={colors.onPrimary} size="small" />
                  : <>
                    <MaterialIcons name="check-circle" size={18} color={colors.onPrimary} />
                    <Text style={s.btnText}>CREATE ACCOUNT</Text>
                  </>}
              </Pressable>
            )}
          </View>

          <Pressable onPress={onGoLogin} style={s.signInLink}>
            <Text style={s.signInText}>Already have an account? </Text>
            <Text style={[s.signInText, { color: colors.primary, fontWeight: '700' }]}>Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 24, fontWeight: '900', color: colors.primary, letterSpacing: 3 },

  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepCircleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepLabel: { fontSize: 8, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  stepLabelActive: { color: colors.primary },
  stepLine: { flex: 0, width: 20, height: 1, backgroundColor: colors.surfaceBorder, marginBottom: 16 },
  stepLineActive: { backgroundColor: colors.primary },

  card: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: 2 },
  cardSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: -6 },

  field: { gap: 6 },
  label: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, paddingHorizontal: 12, height: 48,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  eyeBtn: { padding: 4 },

  relChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceElevated,
  },
  relChipActive: { backgroundColor: 'rgba(248,91,88,0.15)', borderColor: colors.primary },
  relChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  relChipTextActive: { color: colors.primary, fontWeight: '700' },

  uploadPlaceholder: {
    alignItems: 'center', gap: 12, padding: spacing.xl,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
  },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  uploadDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  skipBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.md,
    padding: 14,
  },
  skipBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },

  phraseInfoBox: {
    flexDirection: 'row', gap: 10, padding: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  phraseInfoText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(248,91,88,0.12)',
    borderRadius: radius.sm, padding: 10,
    borderWidth: 1, borderColor: 'rgba(248,91,88,0.3)',
  },
  errorText: { color: colors.primary, fontSize: 13, flex: 1 },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnGreen: { backgroundColor: '#2a9d5c' },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 14, fontWeight: '800', color: colors.onPrimary, letterSpacing: 2, textTransform: 'uppercase' },

  signInLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  signInText: { fontSize: 13, color: colors.textMuted },
});
