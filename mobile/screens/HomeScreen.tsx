import React, { useEffect, useState, useRef } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
    TouchableOpacity,
    Platform,
    Linking,
    TextInput,
    Alert,
    Animated,
    ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import PriceSection from '../components/PriceSection';
import { fetchHomePageData, fetchHomePageDatav2 } from '@/api/common';
import { Product } from '@/types/Product';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui/Text';
import { Category } from '@/types/Category';
import { useSession } from '@/context/SessionContext';
import VideoSection from '@/components/videoads';
import SeparatorLine from '@/components/seperator';
import DeliveryTags from '@/components/Deliverytags';
import Footer from '@/components/Footer';
import { useRouter } from 'expo-router';
import WallpaperCarousel from '@/components/WallpaperCarousel';
import FeaturedProductsSection from '@/components/FeatureProducts';
import DeliveryBadges from '@/components/DeliveryBadges';

const isWeb = Platform.OS === 'web';
const isIos = Platform.OS === 'ios';

const HomeScreen = () => {
    const { session, location, locationDenied, requestLocationPermission } = useSession();
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [featuredProductsv2, setFeaturedProductsv2] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [email, setEmail] = useState<string>('');

    const wiggleAnim = useRef(new Animated.Value(0)).current;
    const router = useRouter();

    useEffect(() => {
        console.log(session);
        fetchHomePageDatav2(
            session?.lat !== undefined ? Number(session.lat) : undefined,
            session?.lng !== undefined ? Number(session.lng) : undefined,
        )
            .then((products) => {
                setFeaturedProductsv2(products);
            })
            .catch((error) => {
                console.error('Failed to load homepage products:', error);
            })
            .finally(() => {
                setLoadingProducts(false); // Stop loading regardless of success/failure
            });
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(wiggleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(wiggleAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
                Animated.timing(wiggleAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]),
        ).start();

        const { featuredProducts, featuredCategories } = fetchHomePageData();
        setFeaturedProducts(featuredProducts);
        setCategories(featuredCategories);
    }, [wiggleAnim]);

    const handleWhatsappRedirect = () => {
        const message = encodeURIComponent("Hi, I'm interested in Comparely!");
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

    const handleWaitlistSubmit = () => {
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        Alert.alert('Thank you!', "You've been added to our waitlist.");
        setEmail('');
    };

    const handleSocialMediaRedirect = (
        platform: 'instagram' | 'twitter' | 'linkedin' | 'youtube',
    ) => {
        const socialMediaUrls: Record<string, string> = {
            instagram: 'https://www.instagram.com/comparelyy',
            twitter: 'https://twitter.com',
            linkedin: 'https://www.linkedin.com',
            youtube: 'https://www.youtube.com/@comparely', // ✅ Replace with actual
        };

        if (!socialMediaUrls[platform]) {
            console.error(`Invalid platform: ${platform}`);
            Alert.alert('Error', `Invalid platform selected: ${platform}.`);
            return;
        }

        const url = socialMediaUrls[platform];

        if (Platform.OS === 'web') {
            try {
                window.open(url, '_blank');
            } catch (error) {
                console.error(`Error opening ${platform}:`, error);
                Alert.alert('Error', `Could not open ${platform}. Please try again later.`);
            }
        } else {
            Linking.openURL(url).catch((error) => {
                console.error(`Error opening ${platform}:`, error);
                Alert.alert(
                    'Cannot Open Link',
                    `Please try opening ${platform} manually or try again later.`,
                );
            });
        }
    };

    const navigateToLocationPicker = () => {
        router.push('/location-picker');
    };

    const rotate = wiggleAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-10deg', '10deg'],
    });

    if (locationDenied && !isIos) {
        return (
            <View style={styles.deniedContainer}>
                <Ionicons name="location-outline" size={50} color="#fff" />
                <Text style={styles.deniedText}>
                    {'Comparely needs access to your location to work properly.'}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={requestLocationPermission}>
                    <Text style={styles.retryButtonText}>{'Grant Permission'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.retryButton, styles.secondaryButton]}
                    onPress={navigateToLocationPicker}>
                    <Text style={styles.secondaryButtonText}>{'Select Location Manually'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header session={session} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                {session && featuredProducts.length > 0 ? (
                    <>
                        <WallpaperCarousel />
                        <PriceSection session={session} products={featuredProducts} />
                    </>
                ) : (
                    <View style={styles.emptySection}>
                        <Text style={styles.emptyText}>{'No featured products available.'}</Text>
                    </View>
                )}
                {isWeb && false && (
                    <View style={styles.appComingSoonContainer}>
                        <Text style={styles.appComingSoonHeader}>{'App Coming Soon'}</Text>

                        <View style={styles.appComingSoonContent}>
                            <Text style={styles.appComingSoonDescription}>
                                {
                                    "We're working hard to bring you the complete Comparely experience on mobile. Stay tuned for our app launch!"
                                }
                            </Text>

                            <Text style={styles.followSocialsText}>
                                {'Till then, follow our socials:'}
                            </Text>

                            <View style={styles.socialsContainer}>
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => handleSocialMediaRedirect('instagram')}>
                                    <Ionicons name="logo-instagram" size={30} color="#004738" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => handleSocialMediaRedirect('twitter')}>
                                    <Ionicons name="logo-twitter" size={30} color="#004738" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => handleSocialMediaRedirect('linkedin')}>
                                    <Ionicons name="logo-linkedin" size={30} color="#004738" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => handleSocialMediaRedirect('youtube')}>
                                    <Ionicons name="logo-youtube" size={30} color="#004738" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                <SeparatorLine />
                {/* <VideoSection /> */}
                <SeparatorLine />
                {/* <DeliveryTags /> */}
                <DeliveryBadges />
                <View style={styles.textCt}>
                    <Text style={styles.waitText}>{`Maybe you’ll like this....`}</Text>
                </View>
                {loadingProducts ? (
                    <View style={{ paddingVertical: 20 }}>
                        <ActivityIndicator size="large" color="green" />
                    </View>
                ) : (
                    featuredProductsv2.length > 0 && (
                        <FeaturedProductsSection featuredProducts={featuredProductsv2} />
                    )
                )}

                {isWeb && <Footer />}
            </ScrollView>

            <Animated.View style={[styles.floatingWhatsapp]}>
                <TouchableOpacity onPress={handleWhatsappRedirect}>
                    <Ionicons name="logo-whatsapp" size={40} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 0, // ✅ Removed extra padding at the bottom
    },
    appComingSoonContainer: {
        marginHorizontal: 20,
        marginBottom: 30,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    appComingSoonHeader: {
        backgroundColor: '#004738',
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingVertical: 12,
    },
    appComingSoonContent: {
        padding: 20,
        alignItems: 'center',
    },
    appComingSoonDescription: {
        fontSize: 16,
        color: '#444',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    followSocialsText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#004738',
        marginBottom: 15,
        textAlign: 'center',
    },
    socialsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    container: {
        flex: 1,
        backgroundColor: '#004738',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    deniedContainer: {
        flex: 1,
        backgroundColor: '#004738',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deniedText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 24,
    },
    retryButton: {
        backgroundColor: '#cbd402',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        marginBottom: 15,
    },
    retryButtonText: {
        color: '#181b19',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#cbd402',
    },
    secondaryButtonText: {
        color: '#cbd402',
        fontSize: 16,
        fontWeight: '600',
    },
    emptySection: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9d9d9d',
        fontSize: 16,
        textAlign: 'center',
    },
    waitlistContainer: {
        marginHorizontal: 20,
        marginBottom: 30,
        marginTop: 10,
        padding: 20,
        backgroundColor: '#fffaf0',
        borderRadius: 10,
        alignItems: 'center',
    },
    waitlistHeader: {
        fontSize: 24,
        color: '#004738',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    waitlistSubText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
    },
    waitlistSubmitButton: {
        backgroundColor: '#cbd402',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    waitlistSubmitButtonText: {
        color: '#181b19',
        fontSize: 18,
        fontWeight: '600',
    },
    appComingSoonText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 15,
    },
    storeIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storeIconWrapper: {
        marginHorizontal: 10,
        opacity: 0.5,
    },
    textCt: {
        marginBottom: 5,
    },
    waitText: {
        fontSize: 20,
        color: 'rgba(0, 71, 56, 1)',
        fontWeight: 'bold',
        paddingHorizontal: 20,
        marginVertical: 5,
        lineHeight: 32,
    },
    floatingWhatsapp: {
        position: 'absolute',
        right: 20,
        bottom: 40,
        backgroundColor: '#25D366',
        borderRadius: 35,
        padding: 6,
    },
});

export default HomeScreen;
