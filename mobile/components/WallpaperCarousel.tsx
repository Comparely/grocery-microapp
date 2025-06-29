import React, { useState, useEffect } from 'react';
import { View, useWindowDimensions, Image, StyleSheet, Platform } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const MAX_DESIGN_WIDTH = 768; // ← matches your global CSS rule

const carouselData = [
    { id: '1', image: require('@/assets/images/crousel/i1.png') },
    { id: '2', image: require('@/assets/images/crousel/i2.png') },
    { id: '3', image: require('@/assets/images/crousel/i1.png') },
    { id: '4', image: require('@/assets/images/crousel/i2.png') },
];

const isSafari =
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
        /iPad|iPhone|iPod/.test(navigator.userAgent));

export default function WallpaperCarousel() {
    const { width: windowWidth } = useWindowDimensions();
    const [active, setActive] = useState(0);
    const carouselWidth =
        Platform.OS === 'web'
            ? Math.min(windowWidth, MAX_DESIGN_WIDTH) // never exceed 768
            : windowWidth;
    const carouselHeight = Platform.OS === 'web' ? carouselWidth / 2 : 200;
    useEffect(() => {
        if (isSafari && Platform.OS === 'web') {
            console.log('Safari detected in WallpaperCarousel – using Safari-optimised rendering');
        }
    }, []);

    return (
        <View style={styles.wrapper}>
            <Carousel
                width={carouselWidth}
                height={carouselHeight}
                data={carouselData}
                autoPlay={!isSafari}
                loop
                scrollAnimationDuration={isSafari ? 500 : 1000}
                autoPlayInterval={3000}
                pagingEnabled
                snapEnabled
                onSnapToItem={setActive}
                renderItem={({ item, index }) => (
                    <View style={styles.imageContainer}>
                        <Image
                            source={item.image}
                            style={styles.image}
                            onError={(e) => console.warn('image load error', e)}
                            {...(isSafari && { fadeDuration: 0 })}
                            key={`safari-${index}-${item.id}`}
                        />
                    </View>
                )}
            />

            <View style={styles.dots}>
                {carouselData.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, active === i ? styles.dotActive : styles.dotInactive]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 8,
        width: '100%',
        ...(Platform.OS === 'web' && {
            maxWidth: MAX_DESIGN_WIDTH, // <- exactly the same cap as body
            alignSelf: 'center',
        }),
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 13,
        padding: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        ...(isSafari && {
            willChange: 'transform',
            backfaceVisibility: 'hidden',
        }),
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        ...(Platform.OS === 'web' && { objectFit: 'cover' }),
        ...(Platform.OS === 'ios' && {
            transform: [{ scale: 1 }], // Force hardware acceleration on iOS
        }),
        // Additional Safari optimizations
        ...(isSafari && {
            objectFit: 'cover',
            imageRendering: 'auto',
        }),
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 2,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    dotActive: { backgroundColor: '#333' },
    dotInactive: { backgroundColor: '#bbb' },
});
