import * as WebBrowser from 'expo-web-browser';

/**
 * Open a URL in the device's in-app browser.
 * Falls back to external browser if needed.
 */
export const openInAppBrowser = async (url: string) => {
    if (!url) return;

    try {
        const result = await WebBrowser.openBrowserAsync(url);
        console.log('Browser result:', result);
    } catch (err) {
        console.warn('Failed to open in-app browser:', err);
    }
};
