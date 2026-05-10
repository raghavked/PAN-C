module.exports = {
  expo: {
    name: 'PAN!C',
    slug: 'pan-c',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#131313',
    splash: {
      backgroundColor: '#131313',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.panc.icepanic',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#131313',
      },
      package: 'com.panc.icepanic',
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'PAN!C needs your location to share with emergency contacts when the panic button is pressed.',
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: false,
        },
      ],

    ],
    web: {
      bundler: 'metro',
    },
    newArchEnabled: false,
    owner: process.env.EXPO_OWNER || undefined,
    extra: {
      eas: {
        projectId: process.env.EXPO_PROJECT_ID || '',
      },
      // Expo project ID (also stored in eas.projectId above for getExpoPushTokenAsync)
      expoProjectId: process.env.EXPO_PROJECT_ID || '',

      // API base URL — leave blank to use Metro proxy (/api → localhost:3001)
      apiUrl: process.env.EXPO_PUBLIC_API_URL || '',

      // ElevenLabs
      elevenLabsApiKey:     process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY    || process.env.ELEVENLABS_API_KEY    || '',
      elevenLabsVoiceId:    process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID   || process.env.ELEVENLABS_VOICE_ID   || '21m00Tcm4TlvDq8ikWAM',

      // Backboard
      backboardApiKey:      process.env.EXPO_PUBLIC_BACKBOARD_API_KEY     || process.env.BACKBOARD_API_KEY     || '',
      backboardAssistantId: process.env.EXPO_PUBLIC_BACKBOARD_ASSISTANT_ID|| process.env.BACKBOARD_ASSISTANT_ID|| '',

      // Twilio
      twilioAccountSid:     process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID    || process.env.TWILIO_ACCOUNT_SID    || '',
      twilioAuthToken:      process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN     || process.env.TWILIO_AUTH_TOKEN     || '',
      twilioPhoneNumber:    process.env.EXPO_PUBLIC_TWILIO_PHONE_NUMBER   || process.env.TWILIO_PHONE_NUMBER   || '',

      // Gemini
      geminiApiKey:         process.env.EXPO_PUBLIC_GEMINI_API_KEY        || process.env.GEMINI_API_KEY        || '',
      geminiModel:          process.env.EXPO_PUBLIC_GEMINI_MODEL          || process.env.GEMINI_MODEL          || 'gemini-2.5-flash',

      // Solana
      solanaRpcUrl:         process.env.EXPO_PUBLIC_SOLANA_RPC_URL        || 'https://api.devnet.solana.com',
      solanaNetwork:        process.env.EXPO_PUBLIC_SOLANA_NETWORK        || 'devnet',
    },
  },
};
