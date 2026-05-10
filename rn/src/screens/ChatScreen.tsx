import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
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
  text: "I'm your rights assistant. I can help you understand your constitutional rights during an ICE encounter. Ask me anything — I'll keep it brief and clear.\n\n🔑 Key rights:\n• You have the right to remain silent\n• You do not have to open the door without a warrant\n• You have the right to speak with a lawyer",
  timestamp: new Date(),
};

export const ChatScreen: React.FC = () => {
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
      const modelMsg: Message = { id: mkId(), role: 'model', text: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, modelMsg]);
    } catch {
      const errMsg: Message = {
        id: mkId(), role: 'model',
        text: 'You have the right to remain silent. Do not open the door without a warrant. Ask to speak to a lawyer immediately.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <Text style={s.appName}>PAN!C</Text>
      </View>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.aiAvatar}><Text style={s.aiAvatarText}>⚖️</Text></View>
          <View>
            <Text style={s.headerTitle}>RIGHTS ASSISTANT</Text>
            <Text style={s.headerSub}>Powered by Gemini AI · Emergency Legal Guidance</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [s.clearBtn, pressed && s.clearBtnPressed]}
          onPress={() => setMessages([WELCOME])}
        >
          <Text style={s.clearBtnText}>CLEAR</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.messageList}
          contentContainerStyle={s.messageContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleModel]}
            >
              {msg.role === 'model' && (
                <View style={s.bubbleModelHeader}>
                  <Text style={s.bubbleModelLabel}>RIGHTS ASSISTANT</Text>
                  <Text style={s.bubbleTime}>{formatTime(msg.timestamp)}</Text>
                </View>
              )}
              <Text style={[s.bubbleText, msg.role === 'user' ? s.bubbleTextUser : s.bubbleTextModel]}>
                {msg.text}
              </Text>
              {msg.role === 'user' && (
                <Text style={[s.bubbleTime, s.bubbleTimeUser]}>{formatTime(msg.timestamp)}</Text>
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

        {/* Quick Questions */}
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

        {/* Input */}
        <View style={s.inputRow}>
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
            <Text style={s.sendBtnText}>SEND</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 56, justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  appName: { fontSize: 22, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainer, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(248,91,88,0.15)', borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  aiAvatarText: { fontSize: 20 },
  headerTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  clearBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm,
  },
  clearBtnPressed: { borderColor: colors.outline },
  clearBtnText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  messageList: { flex: 1 },
  messageContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.sm },
  bubble: {
    maxWidth: '85%', padding: spacing.md,
    borderRadius: radius.md, gap: 4,
  },
  bubbleUser: {
    alignSelf: 'flex-end', backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleModel: {
    alignSelf: 'flex-start', backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleModelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bubbleModelLabel: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  bubbleTextUser: { color: colors.onPrimary },
  bubbleTextModel: { color: colors.textPrimary },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  bubbleTimeUser: { color: 'rgba(92,0,9,0.6)', textAlign: 'right' },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    alignSelf: 'flex-start', backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  typingText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  quickScroll: { maxHeight: 44, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  quickContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.xs },
  quickChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  quickChipPressed: { borderColor: colors.primary, backgroundColor: 'rgba(248,91,88,0.1)' },
  quickChipText: { fontSize: 12, color: colors.textSecondary, whiteSpace: 'nowrap' as any },
  inputRow: {
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceContainer,
  },
  input: {
    flex: 1, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.textPrimary, fontSize: 14,
  },
  sendBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center',
    minWidth: 64,
  },
  sendBtnPressed: { opacity: 0.85 },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 12, fontWeight: '800', color: colors.onPrimary, textTransform: 'uppercase' },
});
