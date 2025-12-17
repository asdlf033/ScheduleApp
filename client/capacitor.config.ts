import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scheduleweb.app',
  appName: 'Schedule Web',
  webDir: 'build',
  server: {
    androidScheme: 'http'
  }
};

export default config;

