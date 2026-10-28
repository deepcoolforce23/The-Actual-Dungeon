import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.theactualdungeon.players',
  appName: 'The Actual Dungeon',
  webDir: 'dist',
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false, // We manage the update flow manually via GitHub API
    }
  }
};

export default config;