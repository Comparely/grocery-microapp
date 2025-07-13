import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Easing,
    Image,
    ActivityIndicator,
    Platform,
} from 'react-native';
import WallpaperCarousel from './WallpaperCarousel';

// Safari-compatible image sources
const isSafari = Platform.OS === 'web' &&
    (typeof navigator !== 'undefined' &&
        (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
            /iPad|iPhone|iPod/.test(navigator.userAgent)));

const bblogo = require('../assets/images/bblogo.png');
const instamartLogo = require('../assets/images/instamartlogo.jpeg');
// Use PNG fallback for WebP in Safari
const zeptoLogo = isSafari ? require('../assets/images/zepto.png') : require('../assets/images/zeptoicon.webp');
const blinkitLogo = require('../assets/images/blinkitlogo.png');

// Banner images
const banner1 = require('../assets/images/crousel/i1.png');
const banner2 = require('../assets/images/crousel/i2.png');

type ComparingScreenProps = {
    itemName?: string;
    onAnimationComplete?: () => void;
};

const ComparingScreen = ({
    itemName = 'Item Loading...',
    onAnimationComplete,
}: ComparingScreenProps) => {
    const scannerAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeOutAnim = useRef(new Animated.Value(1)).current;

    const [loadingComplete, setLoadingComplete] = useState(false);
    const [carouselImages, setCarouselImages] = useState([bblogo, instamartLogo, zeptoLogo, blinkitLogo]);

    // Safari compatibility logging
    useEffect(() => {
        if (isSafari && Platform.OS === 'web') {
            console.log('Safari detected in waiting screen - using Safari-optimized rendering');
        }
    }, []);

    const IMAGE_WIDTH = 140;
    const ITEM_SPACING = 10;
    const IMAGE_SPACING = IMAGE_WIDTH + ITEM_SPACING * 2;

    const positions = [
        useRef(new Animated.Value(-IMAGE_SPACING)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(IMAGE_SPACING)).current,
    ];
    const scales = [
        useRef(new Animated.Value(1)).current,
        useRef(new Animated.Value(1.3)).current,
        useRef(new Animated.Value(1)).current,
    ];
    const opacities = [
        useRef(new Animated.Value(0.7)).current,
        useRef(new Animated.Value(1)).current,
        useRef(new Animated.Value(0.7)).current,
    ];

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scannerAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.linear,
                }),
                Animated.timing(scannerAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.linear,
                }),
            ])
        ).start();

        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: false,
        }).start(() => {
            setLoadingComplete(true);
            Animated.timing(fadeOutAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                if (onAnimationComplete) onAnimationComplete();
            });
        });

        let currentImages = [...carouselImages];

        const animateCarousel = () => {
            const slideAnimations = positions.map((pos, index) =>
                Animated.timing(pos, {
                    toValue: (index - 1) * IMAGE_SPACING,
                    duration: 2000,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                })
            );

            Animated.parallel([
                ...slideAnimations,
                Animated.timing(scales[0], { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(scales[1], { toValue: 1.3, duration: 1200, useNativeDriver: true }),
                Animated.timing(scales[2], { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(opacities[0], { toValue: 0.7, duration: 1200, useNativeDriver: true }),
                Animated.sequence([
                    Animated.timing(opacities[1], { toValue: 0.9, duration: 800, useNativeDriver: true }),
                    Animated.timing(opacities[1], {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(opacities[2], { toValue: 0.7, duration: 1200, useNativeDriver: true }),
            ]).start(() => {
                currentImages = [...currentImages.slice(1), currentImages[0]];
                setCarouselImages(currentImages);

                setTimeout(() => {
                    positions.forEach((pos, index) => pos.setValue((index - 1) * IMAGE_SPACING));
                    scales[0].setValue(1);
                    scales[1].setValue(1.3);
                    scales[2].setValue(1);
                    opacities[0].setValue(0.7);
                    opacities[1].setValue(1);
                    opacities[2].setValue(0.7);
                    animateCarousel();
                }, 1500);
            });
        };

        animateCarousel();

        return () => {
            scannerAnim.stopAnimation();
            progressAnim.stopAnimation();
            fadeOutAnim.stopAnimation();
        };
    }, [onAnimationComplete]);

    const scanTranslateY = scannerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 170],
    });

    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Animated.View style={[styles.container, { opacity: loadingComplete ? fadeOutAnim : 1 }]}>
            <View style={styles.content}>
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.subtitle}>
                        We are finding you the best deals...
                    </Text>
                </View>

                <View style={styles.carouselContainer}>
                    {[0, 1, 2].map((i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.animatedImageContainer,
                                {
                                    transform: [{ translateX: positions[i] }, { scale: scales[i] }],
                                    zIndex: i === 1 ? 2 : 1,
                                    opacity: opacities[i],
                                },
                            ]}
                        >
                            <Image
                                source={carouselImages[i]}
                                style={styles.animatedImage}
                                resizeMode="contain"
                                onError={(error) => {
                                    console.warn('Safari image load error:', error);
                                    // Force re-render on error for Safari
                                    if (isSafari) {
                                        setTimeout(() => {
                                            setCarouselImages([...carouselImages]);
                                        }, 100);
                                    }
                                }}
                                onLoad={() => {
                                    console.log(`Safari: Image ${i} loaded successfully`);
                                }}
                                // Safari-specific props
                                {...(isSafari && {
                                    fadeDuration: 0,
                                })}
                            />
                        </Animated.View>
                    ))}
                    <View style={styles.scannerFrameOverlay}>
                        <Animated.View
                            style={[styles.scannerLine, { transform: [{ translateY: scanTranslateY }] }]}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.bottomPanel}>
                <View style={styles.progressBarBackground}>
                    <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
                </View>
                <Text style={styles.itemName}>{itemName}</Text>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {}}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <View style={styles.bannerContainer}>
                    <Image source={banner1} style={styles.largeBanner} resizeMode="cover" />
                    <View style={styles.smallBannerRow}>
                        <Image source={banner2} style={styles.smallBanner} resizeMode="cover" />
                        <Image source={banner2} style={styles.smallBanner} resizeMode="cover" />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

export default ComparingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004738',
    },
    content: {
        alignItems: 'center',
        paddingTop: 10, // extended green background
        paddingBottom: 24, // spacing before white panel
    },
    loadingRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    subtitle: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 8,
    },
    carouselContainer: {
        width: '100%',
        height: 170,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    animatedImageContainer: {
        width: 150,
        height: 90,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    animatedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    scannerFrameOverlay: {
        position: 'absolute',
        width: 170,
        height: 170,
        borderColor: '#CBD402',
        borderWidth: 5,
        borderRadius: 4,
        zIndex: 3,
        left: '50%',
        top: 0,
        marginLeft: -85,
    },
    scannerLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 4,
        width: '100%',
        backgroundColor: '#CBD402',
        zIndex: 4,
    },
    progressBarBackground: {
        width: '80%',
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EBE6DD',
        overflow: 'hidden',
        marginBottom: 14,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#D3E82B',
        borderRadius: 3,
    },
    bottomPanel: {
        width: '100%',
        backgroundColor: '#FFFAF0',
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 30,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
    },
    itemName: {
        fontSize: 23,
        fontWeight: '900',
        color: '#004738',
        marginBottom: 10,
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: '#D3E82B',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 12,
        marginTop: 10,
    },
    cancelText: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#004738',
    },
    bannerContainer: {
        width: '100%',
        marginTop: 28,
        paddingHorizontal: 20,
    },
    largeBanner: {
        width: '100%',
        height: 350,
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
    },
    smallBannerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    smallBanner: {
        width: '48%',
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
    },
});