import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

// Import your local images
import Image1 from '../assets/images/blinkitmins.png';
import Image2 from '../assets/images/zeptomins.png';
import Image3 from '../assets/images/swiggymins.png';
import Image4 from '../assets/images/bbmins.png';

const { width: screenWidth } = Dimensions.get('window');

const IMAGE_WIDTH = 120; // width of each image
const SPACING = 20;      // space between images
const VISIBLE_IMAGES = 3; // how many images visible in the row

const images = [Image1, Image2, Image3, Image4];

const DeliveryImagesScroller = () => {
    const scrollX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const totalWidth = (IMAGE_WIDTH + SPACING) * images.length;

        Animated.loop(
            Animated.timing(scrollX, {
                toValue: totalWidth,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [scrollX]);

    const scrollImages = [...images, ...images]; // duplicate for seamless looping

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.scrollContainer,
                    {
                        transform: [{
                            translateX: scrollX.interpolate({
                                inputRange: [0, (IMAGE_WIDTH + SPACING) * images.length],
                                outputRange: [0, -(IMAGE_WIDTH + SPACING) * images.length],
                            }),
                        }],
                    }
                ]}
            >
                {scrollImages.map((img, idx) => (
                    <Image key={idx} source={img} style={styles.image} />
                ))}
            </Animated.View>
        </View>
    );
};

export default DeliveryImagesScroller;

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginTop: 20,
        overflow: 'hidden',
        width: (IMAGE_WIDTH + SPACING) * VISIBLE_IMAGES - SPACING,
    },
    scrollContainer: {
        flexDirection: 'row',
    },
    image: {
        width: IMAGE_WIDTH,
        height: 80,
        marginRight: SPACING,
        resizeMode: 'contain',
    },
});
