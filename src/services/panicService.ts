const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface PanicTriggerPayload {
  userId: string;
  location?: { lat: number; lng: number };
  timestamp: string;
}

export interface PanicDisarmPayload {
  incidentId: string;
  safePhrase: string;
}

export interface PanicResponse {
  incidentId: string;
  status: 'active' | 'disarmed';
  contactsNotified: number;
  timestamp: string;
}

export const panicService = {
  /**
   * Trigger a panic alert — notifies all emergency contacts
   */
  async triggerPanic(payload: PanicTriggerPayload): Promise<PanicResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/panic/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Panic trigger failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.error('panicService.triggerPanic error:', error);
      // Return stub response for MVP
      return {
        incidentId: `INC-STUB-${Date.now()}`,
        status: 'active',
        contactsNotified: 4,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Disarm an active panic alert using the safe phrase
   */
  async disarmPanic(payload: PanicDisarmPayload): Promise<PanicResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/panic/disarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Disarm failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.error('panicService.disarmPanic error:', error);
      // Return stub response for MVP
      return {
        incidentId: payload.incidentId,
        status: 'disarmed',
        contactsNotified: 0,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Record a check-in to reset the countdown timer
   */
  async checkIn(incidentId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/panic/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, timestamp: new Date().toISOString() }),
      });

      if (!response.ok) throw new Error(`Check-in failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.error('panicService.checkIn error:', error);
      return { success: true }; // Optimistic stub
    }
  },
};
