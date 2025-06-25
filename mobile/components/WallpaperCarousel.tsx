import React, { useState, useEffect } from 'react';
import { View, Dimensions, Image, StyleSheet, Platform } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
const { width } = Dimensions.get('window');

// Safari detection for web compatibility
const isSafari = Platform.OS === 'web' && 
    (typeof navigator !== 'undefined' && 
     (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
      /iPad|iPhone|iPod/.test(navigator.userAgent)));

const carouselData = [
    { id: '1', image: require('@/assets/images/crousel/i1.png') },
    { id: '2', image: require('@/assets/images/crousel/i2.png') },
    { id: '3', image: require('@/assets/images/crousel/i1.png') },
    { id: '4', image: require('@/assets/images/crousel/i2.png') },
];

const WallpaperCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [imageLoadError, setImageLoadError] = useState<Set<string>>(new Set());

    // Pre-load images for Safari compatibility
    useEffect(() => {
        if (isSafari && Platform.OS === 'web') {
            console.log('Safari detected in WallpaperCarousel, pre-loading images...');
            carouselData.forEach((item, index) => {
                const img = document.createElement('img');
                const resolved = Image.resolveAssetSource(item.image);
                if (resolved && resolved.uri) {
                    img.src = resolved.uri;
                    img.onload = () => console.log(`Safari: Carousel image ${index} preloaded`);
                    img.onerror = (e) => {
                        console.warn(`Safari: Carousel image ${index} failed to preload`, e);
                        setImageLoadError(prev => new Set(prev).add(item.id));
                    };
                }
            });
        }
    }, []);

    return (
        <View style={styles.container}>
            <Carousel
                width={width}
                height={200}
                data={carouselData}
                autoPlay={!isSafari} // Disable autoplay in Safari to prevent rendering issues
                loop
                scrollAnimationDuration={isSafari ? 500 : 1000} // Faster animation for Safari
                autoPlayInterval={3000}
                pagingEnabled={true}
                snapEnabled={true}
                onSnapToItem={(index) => setActiveIndex(index)}
                renderItem={({ item, index }) => (
                    <View style={styles.imageContainer}>
                        {!imageLoadError.has(item.id) ? (
                            <Image 
                                source={item.image} 
                                style={styles.image} 
                                resizeMode="cover"
                                onError={(error) => {
                                    console.warn('Safari carousel image load error:', error);
                                    setImageLoadError(prev => new Set(prev).add(item.id));
                                }}
                                onLoad={() => {
                                    console.log(`Safari: Carousel image ${index} loaded successfully`);
                                    // Remove from error set if it loads successfully
                                    setImageLoadError(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(item.id);
                                        return newSet;
                                    });
                                }}
                                // Safari-specific props
                                {...(isSafari && {
                                    fadeDuration: 0,
                                })}
                                // Unique key for Safari to prevent caching issues
                                key={`safari-carousel-${index}-${item.id}`}
                            />
                        ) : (
                            // Fallback view for failed images
                            <View style={[styles.image, styles.fallbackContainer]}>
                                <View style={styles.fallbackPlaceholder} />
                            </View>
                        )}
                    </View>
                )}
            />

            <View style={styles.dotsContainer}>
                {carouselData.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            activeIndex === index ? styles.activeDot : styles.inactiveDot,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        paddingHorizontal: 10,
    },
    imageContainer: {
        width: width - 20,
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        // Safari-specific optimizations
        ...(isSafari && {
            willChange: 'transform',
            backfaceVisibility: 'hidden',
        }),
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        ...(Platform.OS === 'ios' && {
            transform: [{ scale: 1 }], // Force hardware acceleration on iOS
        }),
        // Additional Safari optimizations
        ...(isSafari && {
            objectFit: 'cover',
            imageRendering: 'auto',
        }),
    },
    fallbackContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
    },
    fallbackPlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: '#c0c0c0',
        borderRadius: 8,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#333',
    },
    inactiveDot: {
        backgroundColor: '#bbb',
    },
});

export default WallpaperCarousel;
