import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, SafeAreaView, ScrollView,
} from 'react-native';
import { TextInput } from '../components/inputs/TextInput';
import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { SecondaryButton } from '../components/buttons/SecondaryButton';
import { Card } from '../components/cards/Card';
import { colors, spacing, typography } from '../theme';
import { usePanic } from '../hooks/usePanic';

const SAFE_PHRASE = 'I AM SAFE';

export const PanicActiveScreen: React.FC = () => {
  const { isActive, incidentId, contactsNotified, timer, checkIn, disarmPanic, rightsReminder } = usePanic();
  const [phrase, setPhrase] = useState('');
  const [disarmError, setDisarmError] = useState('');
  const [disarming, setDisarming] = useState(false);

  const flashAnim = useRef(new Animated.Value(1)).current;

  // Flashing header animation
  useEffect(() => {
    if (!isActive) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isActive]);

  const handleDisarm = async () => {
    if (phrase.toUpperCase().trim() !== SAFE_PHRASE) {
      setDisarmError(`Incorrect phrase. Type "${SAFE_PHRASE}" to disarm.`);
      return;
    }
    setDisarming(true);
    await disarmPanic(phrase);
    setDisarming(false);
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!isActive) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.inactiveContainer}>
          <Text style={styles.inactiveIcon}>✅</Text>
          <Text style={styles.inactiveTitle}>No Active Alert</Text>
          <Text style={styles.inactiveSub}>Press the panic button on the Home screen to trigger an alert.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Flashing danger header */}
      <Animated.View style={[styles.dangerHeader, { opacity: flashAnim }]}>
        <Text style={styles.dangerHeaderText}>🚨 EMERGENCY ALERT ACTIVE 🚨</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Incident info */}
        <Card style={styles.incidentCard}>
          <Text style={styles.incidentId}>Incident #{incidentId}</Text>
          <Text style={styles.incidentDetail}>📱 {contactsNotified} contacts notified via SMS</Text>
          <Text style={styles.incidentDetail}>⏱ Check-in timer: {formatTimer(timer)}</Text>
        </Card>

        {/* Rights reminder */}
        <Card style={styles.rightsCard}>
          <Text style={styles.rightsTitle}>⚖️ Your Rights (AI-Generated)</Text>
          <Text style={styles.rightsText}>
            {rightsReminder || 'You have the right to remain silent. You do not have to answer questions about your immigration status. You have the right to speak with a lawyer. Do not sign any documents without legal counsel.'}
          </Text>
        </Card>

        {/* Check-in */}
        <SecondaryButton
          label={`✅ I'm Safe — Reset Timer (${formatTimer(timer)})`}
          onPress={checkIn}
          fullWidth
        />

        {/* Disarm */}
        <Card style={styles.disarmCard}>
          <Text style={styles.disarmTitle}>Disarm Alert</Text>
          <Text style={styles.disarmSub}>Type your safe phrase to cancel the alert and notify contacts.</Text>
          <TextInput
            label={`Safe Phrase (type "${SAFE_PHRASE}")`}
            placeholder="Enter safe phrase..."
            value={phrase}
            onChangeText={(t) => { setPhrase(t); setDisarmError(''); }}
            error={disarmError}
            autoCapitalize="characters"
          />
          <PrimaryButton
            label="Disarm Alert"
            onPress={handleDisarm}
            loading={disarming}
            fullWidth
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  inactiveContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  inactiveIcon: { fontSize: 64, marginBottom: spacing.md },
  inactiveTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  inactiveSub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  dangerHeader: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerHeaderText: { ...typography.label, color: colors.white, letterSpacing: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  incidentCard: { gap: spacing.xs },
  incidentId: { ...typography.h4, color: colors.primary },
  incidentDetail: { ...typography.body, color: colors.textSecondary },
  rightsCard: {},
  rightsTitle: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.sm },
  rightsText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  disarmCard: { gap: spacing.sm },
  disarmTitle: { ...typography.h4, color: colors.textPrimary },
  disarmSub: { ...typography.body, color: colors.textSecondary },
});
