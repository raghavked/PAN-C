import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const config = {
  // API — leave blank to use Metro proxy (/api → localhost:3001)
  apiUrl:               (extra.apiUrl               as string) || '',

  // ElevenLabs
  elevenLabsApiKey:     (extra.elevenLabsApiKey     as string) || '',
  elevenLabsVoiceId:    (extra.elevenLabsVoiceId    as string) || '21m00Tcm4TlvDq8ikWAM',

  // Backboard
  backboardApiKey:      (extra.backboardApiKey      as string) || '',
  backboardAssistantId: (extra.backboardAssistantId as string) || '',

  // Twilio
  twilioAccountSid:     (extra.twilioAccountSid     as string) || '',
  twilioAuthToken:      (extra.twilioAuthToken      as string) || '',
  twilioPhoneNumber:    (extra.twilioPhoneNumber    as string) || '',

  // Gemini
  geminiApiKey:         (extra.geminiApiKey         as string) || '',
  geminiModel:          (extra.geminiModel          as string) || 'gemini-2.5-flash',

  // Solana
  solanaRpcUrl:         (extra.solanaRpcUrl         as string) || 'https://api.devnet.solana.com',
  solanaNetwork:        (extra.solanaNetwork        as string) || 'devnet',
};
