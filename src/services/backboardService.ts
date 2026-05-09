/**
 * backboardService.ts
 * Backboard.io — Persistent Long-Term Memory API (app.backboard.io)
 *
 * Used in PAN-C to give the AI assistant (Gemini) persistent memory across
 * sessions, so it can remember:
 *   - User preferences (language, safe phrase, notification settings)
 *   - Past incidents and their outcomes
 *   - Emergency contact details and relationships
 *   - Legal notes and case context from prior encounters
 *
 * Architecture:
 *   - One Backboard Assistant per user (identified by assistantId)
 *   - Memories are stored at the assistant level and shared across all threads
 *   - Pass assistantId + memory="Auto" on every Gemini/AI call to recall context
 *
 * Auth: X-API-Key header
 * Docs: https://docs.backboard.io
 *
 * Required secrets (Replit → Secrets):
 *   VITE_BACKBOARD_API_KEY        — from app.backboard.io → Settings → API Keys
 *   VITE_BACKBOARD_ASSISTANT_ID   — your PAN-C assistant ID (created once, reused)
 */

const API_KEY      = import.meta.env.VITE_BACKBOARD_API_KEY || '';
const ASSISTANT_ID = import.meta.env.VITE_BACKBOARD_ASSISTANT_ID || '';
const BASE_URL     = 'https://app.backboard.io/api';

const headers = () => ({
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
});

function isConfigured(): boolean {
  if (!API_KEY || !ASSISTANT_ID) {
    console.warn('[backboardService] Missing VITE_BACKBOARD_API_KEY or VITE_BACKBOARD_ASSISTANT_ID — running in stub mode');
    return false;
  }
  return true;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BackboardMemory {
  id: string;
  content: string;
  metadata?: Record<string, string>;
  created_at?: string;
}

export interface BackboardMessage {
  content: string;
  thread_id?: string;
  memory?: 'Auto' | 'Readonly' | 'off';
  memory_pro?: 'Auto' | 'Readonly';
}

// ── Memory Management ─────────────────────────────────────────────────────────

export const backboardService = {
  /**
   * Send a message to the persistent assistant.
   * Pass thread_id to continue a conversation; omit to start a new thread.
   * Memory mode "Auto" — automatically saves and retrieves relevant memories.
   */
  async sendMessage(payload: BackboardMessage): Promise<{ content: string; thread_id: string }> {
    if (!isConfigured()) {
      return { content: '[Backboard stub] Memory not available.', thread_id: 'stub-thread' };
    }

    const res = await fetch(`${BASE_URL}/threads/messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        content: payload.content,
        assistant_id: ASSISTANT_ID,
        thread_id: payload.thread_id,
        memory: payload.memory ?? 'Auto',
      }),
    });

    if (!res.ok) throw new Error(`Backboard sendMessage failed: ${res.status}`);
    return res.json();
  },

  /**
   * Manually add a memory to the assistant's long-term store.
   * Use this to explicitly save critical facts (e.g. user's safe phrase, language preference).
   */
  async addMemory(content: string, metadata?: Record<string, string>): Promise<BackboardMemory> {
    if (!isConfigured()) return { id: 'stub', content };

    const res = await fetch(`${BASE_URL}/assistants/${ASSISTANT_ID}/memories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content, metadata }),
    });

    if (!res.ok) throw new Error(`Backboard addMemory failed: ${res.status}`);
    return res.json();
  },

  /**
   * Semantic search across all stored memories.
   * Use this to retrieve relevant context before an AI call.
   */
  async searchMemories(query: string, limit = 5): Promise<BackboardMemory[]> {
    if (!isConfigured()) return [];

    const res = await fetch(`${BASE_URL}/assistants/${ASSISTANT_ID}/memories/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ query, limit }),
    });

    if (!res.ok) throw new Error(`Backboard searchMemories failed: ${res.status}`);
    const data = await res.json();
    return data.memories ?? [];
  },

  /**
   * List all stored memories (paginated).
   */
  async listMemories(page = 1, pageSize = 25): Promise<{ memories: BackboardMemory[]; total_count: number }> {
    if (!isConfigured()) return { memories: [], total_count: 0 };

    const res = await fetch(
      `${BASE_URL}/assistants/${ASSISTANT_ID}/memories?page=${page}&page_size=${pageSize}`,
      { headers: headers() }
    );

    if (!res.ok) throw new Error(`Backboard listMemories failed: ${res.status}`);
    return res.json();
  },

  /**
   * Update an existing memory by ID.
   */
  async updateMemory(memoryId: string, content: string): Promise<BackboardMemory> {
    if (!isConfigured()) return { id: memoryId, content };

    const res = await fetch(`${BASE_URL}/assistants/${ASSISTANT_ID}/memories/${memoryId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ content }),
    });

    if (!res.ok) throw new Error(`Backboard updateMemory failed: ${res.status}`);
    return res.json();
  },

  /**
   * Delete a specific memory by ID.
   */
  async deleteMemory(memoryId: string): Promise<void> {
    if (!isConfigured()) return;

    const res = await fetch(`${BASE_URL}/assistants/${ASSISTANT_ID}/memories/${memoryId}`, {
      method: 'DELETE',
      headers: headers(),
    });

    if (!res.ok) throw new Error(`Backboard deleteMemory failed: ${res.status}`);
  },

  // ── PAN-C Specific Helpers ─────────────────────────────────────────────────

  /**
   * Save user preferences to long-term memory.
   * Called on first setup and whenever preferences change.
   */
  async saveUserPreferences(prefs: {
    language?: string;
    safePhrase?: string;
    notificationMethod?: string;
    userName?: string;
  }): Promise<void> {
    const entries = Object.entries(prefs).filter(([, v]) => v);
    await Promise.allSettled(
      entries.map(([key, value]) =>
        backboardService.addMemory(`User ${key}: ${value}`, { source: 'preferences', key })
      )
    );
  },

  /**
   * Save incident outcome to long-term memory for future AI context.
   */
  async saveIncidentMemory(incident: {
    incidentId: string;
    outcome: string;
    notes?: string;
    date: string;
  }): Promise<void> {
    await backboardService.addMemory(
      `Incident ${incident.incidentId} on ${incident.date}: ${incident.outcome}. ${incident.notes ?? ''}`.trim(),
      { source: 'incident', incidentId: incident.incidentId }
    );
  },

  /**
   * Ask the memory-aware assistant a question with full context recall.
   * Used on the PanicActiveScreen to answer "what are my rights?" with
   * personalized context (language, past incidents, etc.)
   */
  async askWithMemory(question: string, threadId?: string): Promise<{ answer: string; threadId: string }> {
    const result = await backboardService.sendMessage({
      content: question,
      thread_id: threadId,
      memory: 'Auto',
    });
    return { answer: result.content, threadId: result.thread_id };
  },
};
