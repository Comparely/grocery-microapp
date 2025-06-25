import React, { useState } from 'react';
import { View, Dimensions, Image, StyleSheet, Platform } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
const { width } = Dimensions.get('window');

const carouselData = [
    { id: '1', image: require('@/assets/images/crousel/i1.png') },
    { id: '2', image: require('@/assets/images/crousel/i2.png') },
    { id: '3', image: require('@/assets/images/crousel/i1.png') },
    { id: '4', image: require('@/assets/images/crousel/i2.png') },
];

const WallpaperCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <View style={styles.container}>
            <Carousel
                width={width}
                height={200}
                data={carouselData}
                autoPlay
                loop
                scrollAnimationDuration={1000}
                autoPlayInterval={3000}
                pagingEnabled={true}
                snapEnabled={true}
                onSnapToItem={(index) => setActiveIndex(index)}
                renderItem={({ item }) => (
                    <View style={styles.imageContainer}>
                        <Image 
                            source={item.image} 
                            style={styles.image} 
                            resizeMode="cover"
                            fadeDuration={Platform.OS === 'ios' ? 0 : 300}
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
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        ...(Platform.OS === 'ios' && {
            transform: [{ scale: 1 }], // Force hardware acceleration on iOS
        }),
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
