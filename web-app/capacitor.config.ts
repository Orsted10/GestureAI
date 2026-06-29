import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gestureai.app',
  appName: 'GestureAI',
  webDir: 'out',    // Next.js static export directory
  plugins: {},
  server: {
    // Required for Android WebView to handle local assets correctly
    androidScheme: 'https',
    // Allow all origins in the APK WebView
    allowNavigation: [],
  },
  android: {
    // Allow mixed content (needed for local WASM loading in WebView)
    allowMixedContent: true,
    // Use hardware acceleration for canvas/WebGL performance
    backgroundColor: '#080C14',
  },
};

export default config;
