import { config } from '../config';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const SYSTEM_CONTEXT = `You are a calm, clear legal rights assistant for PAN-C, 
an emergency app for immigrant communities facing ICE enforcement. 
Your role is to:
1. Remind users of their constitutional rights (right to remain silent, right to an attorney, right not to open the door without a warrant)
2. Provide step-by-step guidance during an ICE encounter
3. Help users communicate with emergency contacts
4. Translate key phrases into Spanish, Portuguese, or other languages as needed
Keep all responses brief, clear, and actionable. This is an emergency context.`;

export const geminiService = {
  async chat(userMessage: string, history: GeminiMessage[] = []): Promise<string> {
    if (!config.geminiApiKey) {
      console.warn('[geminiService] Missing GEMINI_API_KEY — returning stub response');
      return 'You have the right to remain silent. Do not open the door without a warrant. Ask to speak to a lawyer immediately.';
    }

    const model = config.geminiModel;
    const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const contents: GeminiMessage[] = [
      { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
      { role: 'model', parts: [{ text: 'Understood. I am ready to assist.' }] },
      ...history,
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    const res = await fetch(`${BASE_URL}?key=${config.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from Gemini.';
  },

  async getRightsReminder(language = 'English'): Promise<string> {
    return geminiService.chat(
      `Give me a 3-bullet emergency rights reminder for someone being approached by ICE. Language: ${language}. Be very brief.`
    );
  },

  async generateIncidentSummary(incident: {
    incidentId: string;
    location?: string;
    timestamp: string;
    userName: string;
  }): Promise<string> {
    return geminiService.chat(
      `Generate a brief, clear emergency alert message for the contacts of ${incident.userName}. 
      Incident ID: ${incident.incidentId}. 
      Time: ${incident.timestamp}. 
      Location: ${incident.location ?? 'unknown'}. 
      The message should tell contacts what happened and what to do next.`
    );
  },

  async translate(text: string, targetLanguage: string): Promise<string> {
    return geminiService.chat(`Translate the following to ${targetLanguage}: "${text}"`);
  },
};
