import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

import Image1 from '../assets/images/blink.png';
import Image2 from '../assets/images/zept.png';
import Image3 from '../assets/images/instam.png';
import Image4 from '../assets/images/bbmin.png';

const { width: screenWidth } = Dimensions.get('window');

const IMAGE_WIDTH = 120;
const IMAGE_SPACING = 25; // increased spacing
const VISIBLE_IMAGES = 3;

const images = [Image1, Image2, Image3, Image4];

const DeliveryImagesScroller = () => {
    const scrollX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const totalWidth = (IMAGE_WIDTH + IMAGE_SPACING) * images.length;

        Animated.loop(
            Animated.timing(scrollX, {
                toValue: totalWidth,
                duration: 6000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [scrollX]);

    const scrollImages = [...images, ...images];

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.scrollContainer,
                    {
                        transform: [
                            {
                                translateX: scrollX.interpolate({
                                    inputRange: [0, (IMAGE_WIDTH + IMAGE_SPACING) * images.length],
                                    outputRange: [0, -((IMAGE_WIDTH + IMAGE_SPACING) * images.length)],
                                }),
                            },
                        ],
                    },
                ]}
            >
                {scrollImages.map((img, idx) => (
                    <View
                        key={idx}
                        style={{
                            marginRight: idx === scrollImages.length - 1 ? 0 : IMAGE_SPACING,
                        }}
                    >
                        <Image source={img} style={styles.image} />
                    </View>
                ))}
            </Animated.View>
        </View>
    );
};

export default DeliveryImagesScroller;

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 0,
        marginTop: 0,
        overflow: 'hidden',
        width: IMAGE_WIDTH * VISIBLE_IMAGES + IMAGE_SPACING * (VISIBLE_IMAGES - 1),
    },
    scrollContainer: {
        flexDirection: 'row',
    },
    image: {
        width: IMAGE_WIDTH,
        height: IMAGE_WIDTH,
        resizeMode: 'contain',
    },
});
