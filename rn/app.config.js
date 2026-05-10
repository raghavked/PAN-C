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
    extra: {
      elevenLabsApiKey:    process.env.ELEVENLABS_API_KEY    || '',
      elevenLabsVoiceId:   process.env.ELEVENLABS_VOICE_ID   || '21m00Tcm4TlvDq8ikWAM',
      backboardApiKey:     process.env.BACKBOARD_API_KEY     || '',
      backboardAssistantId:process.env.BACKBOARD_ASSISTANT_ID|| '',
      twilioAccountSid:    process.env.TWILIO_ACCOUNT_SID    || '',
      twilioAuthToken:     process.env.TWILIO_AUTH_TOKEN      || '',
      twilioPhoneNumber:   process.env.TWILIO_PHONE_NUMBER    || '',
      geminiApiKey:        process.env.GEMINI_API_KEY         || '',
      geminiModel:         process.env.VITE_GEMINI_MODEL      || 'gemini-2.0-flash',
    },
  },
};
