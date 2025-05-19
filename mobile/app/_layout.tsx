import React from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { LoadingScreen } from '@/screens/LoadingScreen';

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
        Sora: require('@/assets/fonts/Sora/Sora.ttf'),
        'Sora-Regular': require('@/assets/fonts/Sora/static/Sora-Regular.ttf'),
        'Sora-Bold': require('@/assets/fonts/Sora/static/Sora-Bold.ttf'),
        'Sora-Thin': require('@/assets/fonts/Sora/static/Sora-Thin.ttf'),
        'Sora-ExtraBold': require('@/assets/fonts/Sora/static/Sora-ExtraBold.ttf'),
        'Sora-ExtraLight': require('@/assets/fonts/Sora/static/Sora-ExtraLight.ttf'),
        'Sora-Medium': require('@/assets/fonts/Sora/static/Sora-Medium.ttf'),
        'Sora-SemiBold': require('@/assets/fonts/Sora/static/Sora-SemiBold.ttf'),
        'Sora-Light': require('@/assets/fonts/Sora/static/Sora-Light.ttf'),
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
