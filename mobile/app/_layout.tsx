import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

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

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
