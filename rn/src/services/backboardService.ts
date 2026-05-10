import { config } from '../config';

const BASE_URL = 'https://app.backboard.io/api';

const headers = () => ({
  'X-API-Key': config.backboardApiKey,
  'Content-Type': 'application/json',
});

function isConfigured(): boolean {
  if (!config.backboardApiKey || !config.backboardAssistantId) {
    console.warn('[backboardService] Missing BACKBOARD_API_KEY or BACKBOARD_ASSISTANT_ID — running in stub mode');
    return false;
  }
  return true;
}

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
}

export const backboardService = {
  async sendMessage(payload: BackboardMessage): Promise<{ content: string; thread_id: string }> {
    if (!isConfigured()) {
      return { content: '[Backboard stub] Memory not available.', thread_id: 'stub-thread' };
    }

    const res = await fetch(`${BASE_URL}/threads/messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        content: payload.content,
        assistant_id: config.backboardAssistantId,
        thread_id: payload.thread_id,
        memory: payload.memory ?? 'Auto',
      }),
    });

    if (!res.ok) throw new Error(`Backboard sendMessage failed: ${res.status}`);
    return res.json();
  },

  async addMemory(content: string, metadata?: Record<string, string>): Promise<BackboardMemory> {
    if (!isConfigured()) return { id: 'stub', content };

    const res = await fetch(`${BASE_URL}/assistants/${config.backboardAssistantId}/memories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content, metadata }),
    });

    if (!res.ok) throw new Error(`Backboard addMemory failed: ${res.status}`);
    return res.json();
  },

  async searchMemories(query: string, limit = 5): Promise<BackboardMemory[]> {
    if (!isConfigured()) return [];

    const res = await fetch(`${BASE_URL}/assistants/${config.backboardAssistantId}/memories/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ query, limit }),
    });

    if (!res.ok) throw new Error(`Backboard searchMemories failed: ${res.status}`);
    const data = await res.json();
    return data.memories ?? [];
  },

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

  async askWithMemory(question: string, threadId?: string): Promise<{ answer: string; threadId: string }> {
    const result = await backboardService.sendMessage({
      content: question,
      thread_id: threadId,
      memory: 'Auto',
    });
    return { answer: result.content, threadId: result.thread_id };
  },
};
