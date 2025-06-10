import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing, Image } from 'react-native';

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
    const carouselAnim = useRef(new Animated.Value(0)).current;

    const [loadingComplete, setLoadingComplete] = useState(false);

    const imageSources = [
        require('../assets/images/instamartlogo.jpeg'),
        require('../assets/images/zeptoicon.webp'),
        require('../assets/images/bblogo.png'),
    ];

    const IMAGE_WIDTH = 180;
    const ITEM_SPACING = -20;
    const ITEM_WIDTH_WITH_SPACING = IMAGE_WIDTH + ITEM_SPACING * 2;
    const TOTAL_WIDTH = ITEM_WIDTH_WITH_SPACING * imageSources.length;

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
            ]),
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
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            });
        });

        const animateCarousel = () => {
            const segmentDuration = 1000;
            const pauseDuration = 1000;
            const segmentAnimations = imageSources.map((_, index) => {
                const segmentStart = index / imageSources.length;
                const segmentEnd = (index + 1) / imageSources.length;
                return Animated.sequence([
                    Animated.timing(carouselAnim, {
                        toValue: segmentEnd,
                        duration: segmentDuration,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.delay(pauseDuration),
                ]);
            });
            Animated.loop(Animated.sequence(segmentAnimations)).start();
        };

        animateCarousel();

        return () => {
            scannerAnim.stopAnimation();
            progressAnim.stopAnimation();
            fadeOutAnim.stopAnimation();
            carouselAnim.stopAnimation();
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

    const carouselTranslateX = carouselAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -TOTAL_WIDTH],
    });

    return (
        <Animated.View style={[styles.container, { opacity: loadingComplete ? fadeOutAnim : 1 }]}>
            <View style={styles.content}>
                <Text style={styles.title}>{'Comparely'}</Text>
                <Text style={styles.subtitle}>{'We are finding you the best deals...'}</Text>

                <View style={styles.carouselContainer}>
                    <Animated.View
                        style={[
                            styles.carouselTrack,
                            { transform: [{ translateX: carouselTranslateX }] },
                        ]}>
                        {imageSources.map((image, index) => (
                            <Image
                                key={`first-${index}`}
                                source={image}
                                style={[styles.animatedImage, { marginHorizontal: ITEM_SPACING }]}
                            />
                        ))}
                        {imageSources.map((image, index) => (
                            <Image
                                key={`second-${index}`}
                                source={image}
                                style={[styles.animatedImage, { marginHorizontal: ITEM_SPACING }]}
                            />
                        ))}
                    </Animated.View>
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
        </Animated.View>
    );
};

export default ComparingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004738',
        paddingTop: 60,
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
    carouselTrack: {
        flexDirection: 'row',
        position: 'absolute',
        left: 0,
    },
    animatedImage: {
        width: 180,
        height: 100,
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
        marginTop: 30,
        marginBottom: 10,
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
        marginTop: 50,
        padding: 60,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        bottom: 0,
    },
    itemName: {
        fontSize: 23,
        fontWeight: '900',
        color: '#004738',
        marginBottom: 20,
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
});
