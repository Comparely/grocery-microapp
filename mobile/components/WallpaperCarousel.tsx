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

const carouselHeight = 140;
const isDesktopWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth > 768;

const WallpaperCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  

    // Safari compatibility logging
  useEffect(() => {
        if (isSafari && Platform.OS === 'web') {
            console.log('Safari detected in WallpaperCarousel - using Safari-optimized rendering');
    }
  }, []);

  return (
    <View style={styles.container}>
      <Carousel
        width={width}
        height={carouselHeight}
        data={carouselData}
        autoPlay={!isSafari}
        loop
        scrollAnimationDuration={isSafari ? 500 : 1000}
        autoPlayInterval={3000}
        pagingEnabled
        snapEnabled
        onSnapToItem={setActiveIndex}
        renderItem={({ item, index }) => (
          <View
            key={'carousel-${index}'}
            style={[styles.imageContainer]}
          >
            <Image
              source={item.image}
              style={styles.image}
              resizeMode={isDesktopWeb ? 'contain' : 'cover'}

                            onError={(error) => {
                                console.warn('Safari carousel image load error:', error);
                            }}
                            onLoad={() => {
                                console.log('Safari: Carousel image ${index} loaded successfully');
                            }}
                            // Safari-specific props
                            {...(isSafari && {
                                fadeDuration: 0,
                            })}
                            // Unique key for Safari to prevent caching issues
                            key={'safari-carousel-${index}-${item.id}'}
            />
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
  },
  imageContainer: {
    width: width,
    height: carouselHeight,
    paddingHorizontal: 10,
    justifyContent: 'center',
     alignItems: 'center',
    backgroundColor: '#f0f0f0',
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
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
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