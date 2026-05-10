import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius } from '../theme';
import { geminiService, GeminiMessage } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'What are my rights if ICE comes to my door?',
  'Do I have to open the door?',
  'Can I remain silent?',
  'What is a warrant?',
  'How do I contact a lawyer?',
];

const mkId = () => Math.random().toString(36).slice(2);

const WELCOME: Message = {
  id: 'welcome',
  role: 'model',
  text: "I'm your rights assistant. I can help you understand your constitutional rights during an ICE encounter. Ask me anything.\n\nKey rights:\n- You have the right to remain silent\n- You do not have to open the door without a judicial warrant\n- You have the right to speak with a lawyer",
  timestamp: new Date(),
};

export const ChatScreen: React.FC = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg: Message = { id: mkId(), role: 'user', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history: GeminiMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, parts: [{ text: m.text }] }));

      const reply = await geminiService.chat(trimmed, history);
      setMessages((prev) => [...prev, { id: mkId(), role: 'model', text: reply, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: mkId(), role: 'model',
        text: 'You have the right to remain silent. Do not open the door without a warrant. Ask to speak to a lawyer immediately.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.appName}>PAN!C</Text>
      </View>

      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.aiAvatar}>
            <MaterialIcons name="gavel" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={s.headerTitle}>RIGHTS ASSISTANT</Text>
            <Text style={s.headerSub}>Powered by Gemini AI</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [s.clearBtn, pressed && s.clearBtnPressed]}
          onPress={() => setMessages([WELCOME])}
        >
          <MaterialIcons name="delete-outline" size={16} color={colors.textMuted} />
          <Text style={s.clearBtnText}>CLEAR</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={s.messageList}
          contentContainerStyle={s.messageContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleModel]}>
              {msg.role === 'model' && (
                <View style={s.bubbleModelHeader}>
                  <Text style={s.bubbleModelLabel}>RIGHTS ASSISTANT</Text>
                  <Text style={s.bubbleTime}>{fmt(msg.timestamp)}</Text>
                </View>
              )}
              <Text style={[s.bubbleText, msg.role === 'user' ? s.textUser : s.textModel]}>
                {msg.text}
              </Text>
              {msg.role === 'user' && (
                <Text style={[s.bubbleTime, s.bubbleTimeUser]}>{fmt(msg.timestamp)}</Text>
              )}
            </View>
          ))}

          {loading && (
            <View style={s.typingBubble}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={s.typingText}>Thinking…</Text>
            </View>
          )}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.quickScroll}
          contentContainerStyle={s.quickContent}
        >
          {QUICK_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              style={({ pressed }) => [s.quickChip, pressed && s.quickChipPressed]}
              onPress={() => send(q)}
            >
              <Text style={s.quickChipText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[s.inputRow, { paddingBottom: tabBarHeight > 0 ? tabBarHeight - 8 : 8 }]}>
          <TextInput
            style={s.input}
            placeholder="Ask about your rights…"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline={false}
            editable={!loading}
          />
          <Pressable
            style={({ pressed }) => [s.sendBtn, pressed && s.sendBtnPressed, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            <MaterialIcons name="send" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 52, justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  appName: { fontSize: 20, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: colors.surfaceContainer, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(248,91,88,0.12)', borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 12, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm,
  },
  clearBtnPressed: { borderColor: colors.outline },
  clearBtnText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },

  messageList: { flex: 1 },
  messageContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.sm },

  bubble: { maxWidth: '85%', padding: spacing.md, borderRadius: radius.md, gap: 4 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleModel: {
    alignSelf: 'flex-start', backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.surfaceBorder, borderBottomLeftRadius: 4,
  },
  bubbleModelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bubbleModelLabel: { fontSize: 9, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  textUser: { color: colors.onPrimary },
  textModel: { color: colors.textPrimary },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  bubbleTimeUser: { color: 'rgba(92,0,9,0.5)', textAlign: 'right' },

  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    alignSelf: 'flex-start', backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  typingText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },

  quickScroll: { maxHeight: 44, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  quickContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center', paddingVertical: 8 },
  quickChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  quickChipPressed: { borderColor: colors.primary, backgroundColor: 'rgba(248,91,88,0.08)' },
  quickChipText: { fontSize: 12, color: colors.textSecondary },

  inputRow: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'center',
    padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceContainer,
  },
  input: {
    flex: 1, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    color: colors.textPrimary, fontSize: 14,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnPressed: { opacity: 0.85 },
  sendBtnDisabled: { opacity: 0.35 },
});
