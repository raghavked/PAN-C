import React, { useEffect, useState, useRef, useCallback } from 'react';
import { chatApi, type ChatMessage } from '../services/api';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
}

const QUICK_QUESTIONS = [
  'What are my rights if ICE comes to my door?',
  'Do I have to open the door for ICE?',
  'What should I do if I am detained?',
  'Can I record ICE agents?',
  'What is a warrant?',
  'How do I contact a lawyer?',
];

export default function ChatScreen({ onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { messages: msgs } = await chatApi.getHistory(30);
      setMessages(msgs);
    } catch { /* ignore */ }
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { message: aiMsg } = await chatApi.sendMessage(msg);
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: unknown) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: e instanceof Error ? `Error: ${e.message}` : 'Sorry, I could not connect. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all chat history?')) return;
    await chatApi.clearHistory();
    setMessages([]);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={styles.headerCenter}>
          <div style={styles.title}>💬 PAN!C Assistant</div>
          <div style={styles.subtitle}>Powered by Gemini AI</div>
        </div>
        <button style={styles.clearBtn} onClick={handleClear}>Clear</button>
      </div>

      {/* Messages */}
      <div style={styles.messageArea}>
        {loadingHistory && <div style={styles.loadingText}>Loading conversation...</div>}

        {!loadingHistory && messages.length === 0 && (
          <div style={styles.welcomeBox}>
            <div style={styles.welcomeIcon}>🤖</div>
            <div style={styles.welcomeTitle}>I'm PAN!C Assistant</div>
            <div style={styles.welcomeText}>
              I can help you understand your legal rights, what to do in an emergency, and how to stay safe. Ask me anything.
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ ...styles.messageRow, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && <div style={styles.botAvatar}>🤖</div>}
            <div style={{
              ...styles.bubble,
              background: msg.role === 'user' ? colors.alertRed : colors.surface1,
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              maxWidth: msg.role === 'user' ? '75%' : '85%',
            }}>
              <div style={styles.bubbleText}>{msg.content}</div>
              <div style={styles.bubbleTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={styles.botAvatar}>🤖</div>
            <div style={{ ...styles.bubble, background: colors.surface1 }}>
              <div style={styles.typingDots}>
                <span style={styles.dot} />
                <span style={styles.dot} />
                <span style={styles.dot} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 0 && !loadingHistory && (
        <div style={styles.quickSection}>
          <div style={styles.quickTitle}>Common Questions</div>
          <div style={styles.quickGrid}>
            {QUICK_QUESTIONS.map((q, i) => (
              <button key={i} style={styles.quickBtn} onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about your rights..."
          disabled={loading}
        />
        <button style={{ ...styles.sendBtn, opacity: (!input.trim() || loading) ? 0.5 : 1 }}
          onClick={() => sendMessage()} disabled={!input.trim() || loading}>
          ➤
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100vh', background: colors.base, display: 'flex', flexDirection: 'column', fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 },
  backBtn: { background: 'transparent', border: 'none', color: colors.alertRed, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  headerCenter: { textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 700, color: colors.textPrimary },
  subtitle: { fontSize: 11, color: colors.textMuted },
  clearBtn: { background: 'transparent', border: 'none', color: colors.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  messageArea: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 },
  loadingText: { color: colors.textSecondary, textAlign: 'center', padding: 24 },
  welcomeBox: { textAlign: 'center', padding: '32px 16px' },
  welcomeIcon: { fontSize: 48, marginBottom: 12 },
  welcomeTitle: { fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 },
  welcomeText: { fontSize: 14, color: colors.textSecondary, lineHeight: 1.6 },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  botAvatar: { width: 32, height: 32, borderRadius: '50%', background: colors.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  bubble: { padding: '10px 14px', border: `1px solid ${colors.border}` },
  bubbleText: { fontSize: 14, color: colors.textPrimary, lineHeight: 1.5, whiteSpace: 'pre-wrap' as const },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' as const },
  typingDots: { display: 'flex', gap: 4, padding: '4px 0' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: colors.textMuted, animation: 'pulse 1s infinite' },
  quickSection: { padding: '0 16px 8px', flexShrink: 0 },
  quickTitle: { fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  quickGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  quickBtn: { background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.textSecondary, fontSize: 13, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  inputArea: { display: 'flex', gap: 8, padding: '12px 16px', borderTop: `1px solid ${colors.border}`, flexShrink: 0, background: colors.base },
  input: { flex: 1, background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 24, padding: '12px 16px', color: colors.textPrimary, fontSize: 15, outline: 'none', fontFamily: 'inherit' },
  sendBtn: { background: colors.alertRed, border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' },
};
