import React from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { Platform } from 'react-native';

void SplashScreen.preventAutoHideAsync();

function AppContent() {
    const { loading, error, locationDenied, requestLocationPermission } = useSession();

    if (loading) {
        return <LoadingScreen showRetry={locationDenied} onRetry={requestLocationPermission} />;
    }

    // if (error) {
    //     return (
    //         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
    //             <Text style={{ color: 'red' }}>Error: {error}</Text>
    //         </View>
    //     );
    // }
    void SplashScreen.hide();
    // When everything is ready, render your navigator
    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        'SF-Pro': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-Regular': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-Bold': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-Medium': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-Light': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-SemiBold': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-Thin': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-UltraLight': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-Heavy': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
        'SF-Pro-Black': require('@/assets/fonts/SFPRO/SF-Pro.ttf'),
    });

    // Wait for fonts to load or error out
    if (!fontsLoaded && !fontError) {
        console.log('could not load fonts');
    }

    return (
        <SessionProvider>
            <AppContent />
        </SessionProvider>
    );
}
