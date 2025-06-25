import React, { useState } from 'react';
import { View, Dimensions, Image, StyleSheet } from 'react-native';
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
                onSnapToItem={(index) => setActiveIndex(index)}
                renderItem={({ item }) => (
                    <Image source={item.image} style={styles.image} resizeMode="contain" />
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
    image: {
        width: width - 20,
        height: 200,
        borderRadius: 12,
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
