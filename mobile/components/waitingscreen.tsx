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
} from 'react-native';
import WallpaperCarousel from './WallpaperCarousel';

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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const imageSources = [
        require('../assets/images/bblogo.png'),
        require('../assets/images/instamartlogo.jpeg'),
        require('../assets/images/zeptoicon.webp'),
        require('../assets/images/blinkitlogo.png'),
    ];

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

    const [carouselImages, setCarouselImages] = useState(imageSources);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scannerAnim, {
                    toValue: 1,
                    duration: 1500, // Increased duration for slower animation
                    useNativeDriver: true,
                    easing: Easing.linear,
                }),
                Animated.timing(scannerAnim, {
                    toValue: 0,
                    duration: 1500, // Increased duration for slower animation
                    useNativeDriver: true,
                    easing: Easing.linear,
                }),
            ]),
        ).start();

        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 8000, // Slightly increased overall duration
            useNativeDriver: false,
        }).start(() => {
            setLoadingComplete(true);
            Animated.timing(fadeOutAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            });
        });

        let currentImages = [...carouselImages];

        const animateCarousel = () => {
            const slideAnimations = positions.map((pos, index) =>
                Animated.timing(pos, {
                    toValue: (index - 1) * IMAGE_SPACING,
                    duration: 2000, // Increased duration for slower slide
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            );

            const scaleDownLeft = Animated.timing(scales[0], {
                toValue: 1,
                duration: 1200, // Adjusted duration
                useNativeDriver: true,
            });
            const scaleUpCenter = Animated.timing(scales[1], {
                toValue: 1.3,
                duration: 1200, // Adjusted duration
                useNativeDriver: true,
            });

            const scaleDownRight = Animated.timing(scales[2], {
                toValue: 1,
                duration: 1200, // Adjusted duration
                useNativeDriver: true,
            });

            const fadeOutLeft = Animated.timing(opacities[0], {
                toValue: 0.7,
                duration: 1200, // Adjusted duration
                useNativeDriver: true,
            });

            const fadeInCenter = Animated.sequence([
                Animated.timing(opacities[1], {
                    toValue: 0.9,
                    duration: 800, // Adjusted duration
                    useNativeDriver: true,
                }),
                Animated.timing(opacities[1], {
                    toValue: 1,
                    duration: 800, // Adjusted duration
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ]);

            const fadeOutRight = Animated.timing(opacities[2], {
                toValue: 0.7,
                duration: 1200, // Adjusted duration
                useNativeDriver: true,
            });

            Animated.parallel([
                ...slideAnimations,
                scaleDownLeft,
                scaleUpCenter,
                scaleDownRight,
                fadeOutLeft,
                fadeInCenter,
                fadeOutRight,
            ]).start(() => {
                currentImages = [...currentImages.slice(1), currentImages[0]];
                setCarouselImages(currentImages);

                setTimeout(() => {
                    positions.forEach((pos, index) => {
                        pos.setValue((index - 1) * IMAGE_SPACING);
                    });
                    scales[0].setValue(1);
                    scales[1].setValue(1.3);
                    scales[2].setValue(1);
                    opacities[0].setValue(0.7);
                    opacities[1].setValue(1);
                    opacities[2].setValue(0.7);

                    animateCarousel();
                }, 1500); // Increased delay before next animation
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
                {/* <Text style={styles.title}>{'Comparely'}</Text> */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
                    <ActivityIndicator size="small" color="white" />
                    <Text
                        style={[
                            styles.subtitle,
                            { marginBottom: 0, marginLeft: 8, textAlign: 'left' },
                        ]}>
                        We are finding you the best deals...
                    </Text>
                </View>
                <View style={styles.carouselContainer}>
                    {[0, 1, 2].map((i) => (
                        <Animated.Image
                            key={i}
                            source={carouselImages[i]}
                            style={[
                                styles.animatedImage,
                                {
                                    transform: [{ translateX: positions[i] }, { scale: scales[i] }],
                                    zIndex: i === 1 ? 2 : 1,
                                    opacity: opacities[i],
                                },
                            ]}
                        />
                    ))}
                    <View style={styles.scannerFrameOverlay}>
                        <Animated.View
                            style={[
                                styles.scannerLine,
                                { transform: [{ translateY: scanTranslateY }] },
                            ]}
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
                    <Text style={styles.cancelText}>{'Cancel'}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.wallpaperCarouselContainer}>
                <WallpaperCarousel />
            </View>
        </Animated.View>
    );
};

export default ComparingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004738',
        // paddingTop: 10,
        justifyContent: 'space-between',
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 46,
        fontFamily: 'Sora',
        color: '#CBD402',
        marginBottom: 10,
        marginTop: 30,
        textAlign: 'center',
    },
    subtitle: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
    },
    carouselContainer: {
        width: '100%',
        height: 170,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    animatedImage: {
        width: 150,
        height: 90,
        resizeMode: 'contain',
        position: 'absolute',
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
        // marginTop: 30,
        // marginBottom: 10,
        width: '80%',
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EBE6DD',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#D3E82B',
        borderRadius: 3,
    },
    bottomPanel: {
        width: '100%',
        backgroundColor: '#FFFAF0',
        marginTop: 15,
        padding: 60,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
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
    },
    cancelText: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#004738',
    },
    wallpaperCarouselContainer: {
        display: 'flex',
        backgroundColor: '#FFFAF0',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginRight: -20,
    },
});
