import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const config = {
  elevenLabsApiKey:     (extra.elevenLabsApiKey     as string) || '',
  elevenLabsVoiceId:    (extra.elevenLabsVoiceId    as string) || '21m00Tcm4TlvDq8ikWAM',
  backboardApiKey:      (extra.backboardApiKey      as string) || '',
  backboardAssistantId: (extra.backboardAssistantId as string) || '',
  twilioAccountSid:     (extra.twilioAccountSid     as string) || '',
  twilioAuthToken:      (extra.twilioAuthToken      as string) || '',
  twilioPhoneNumber:    (extra.twilioPhoneNumber    as string) || '',
  geminiApiKey:         (extra.geminiApiKey         as string) || '',
  geminiModel:          (extra.geminiModel          as string) || 'gemini-2.0-flash',
};
