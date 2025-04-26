import { View, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Text } from '@/ui/Text';
import Header from '@/components/Header';
import { router } from 'expo-router';
import Head from 'expo-router/head';

export default function SupportScreen() {
    const handleBackToHome = () => {
        router.push('/');
    };

    const handleEmail = () => {
        void Linking.openURL('mailto:support@comparely.co.in');
    };

    const handleWhatsappRedirect = () => {
        const message = encodeURIComponent('Hi, I need help with Comparely');

        const webUrl = `https://api.whatsapp.com/send?phone=${process.env.EXPO_PUBLIC_SUPPORT_WA_NUMBER}&text=${message}`;

        if (Platform.OS === 'web') {
            try {
                window.open(webUrl, '_blank');
            } catch (error) {
                console.error('Error opening WhatsApp in web browser:', error);
                Alert.alert('Error', 'Could not open WhatsApp. Please try again later.');
            }
        } else {
            Linking.openURL(webUrl).catch((error) => {
                console.error('Error opening WhatsApp:', error);
                Alert.alert(
                    'Cannot Open WhatsApp',
                    'Please make sure WhatsApp is installed or try again later.',
                );
            });
        }
    };

    return (
        <>
            <Head>
                <title>Support - Comparely</title>
            </Head>
            <View style={styles.container}>
                <Header session={undefined} />
                <View style={styles.mainContainer}>
                    <Text style={styles.title}>Support</Text>

                    <Text style={styles.body}>Need help? We're here for you!</Text>

                    <TouchableOpacity style={styles.button} onPress={handleEmail}>
                        <Text style={styles.buttonText}>Email Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={handleWhatsappRedirect}>
                        <Text style={styles.buttonText}>WhatsApp Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={handleBackToHome}>
                        <Text style={styles.buttonText}>Back to home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#fffaf0',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
    },
    title: {
        fontSize: 28,
        marginBottom: 16,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    button: {
        backgroundColor: '#004738',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        color: '#ffffff',
    },
});
