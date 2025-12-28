import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running on a native platform (iOS/Android)
 */
export function isNative(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running in web browser
 */
export function isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
}
