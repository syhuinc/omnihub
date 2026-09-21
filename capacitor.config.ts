import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.syhuinc.omnihub',
  appName: 'Omni Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
