import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.auction.app',
    appName: 'Auction Manager',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        // For development, uncomment the following line and set your local IP
        // url: 'http://192.168.1.100:5173',
        // cleartext: true,
    },
    plugins: {
        Network: {
            // Network plugin for offline detection
        },
        Preferences: {
            // Local storage for offline caching
        },
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystoreAlias: undefined,
        },
    },
};

export default config;
