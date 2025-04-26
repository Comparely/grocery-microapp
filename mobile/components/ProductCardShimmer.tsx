'use client';

import type React from 'react';
import { useEffect } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';

export const ProductCardShimmer: React.FC = () => {
    // Animation value for shimmer effect
    const shimmerAnimation = new Animated.Value(0);

    useEffect(() => {
        // Create looping animation for shimmer effect
        const startShimmerAnimation = () => {
            Animated.loop(
                Animated.timing(shimmerAnimation, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
            ).start();
        };

        startShimmerAnimation();

        return () => {
            shimmerAnimation.stopAnimation();
        };
    }, []);

    // Interpolate animation value to create gradient-like effect
    const shimmerTranslate = shimmerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 300],
    });

    // Shimmer gradient
    const shimmerGradient = {
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        position: 'relative',
    };

    // Shimmer overlay
    const shimmerOverlay = {
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        transform: [{ translateX: shimmerTranslate }],
    };

    return (
        <View style={styles.container}>
            {/* Image Placeholder */}
            <View style={[styles.imageContainer, shimmerGradient]}>
                <Animated.View style={shimmerOverlay} />
            </View>

            {/* Tags Placeholder */}
            <View style={styles.tagsContainer}>
                <View style={[styles.tagPlaceholder, shimmerGradient]}>
                    <Animated.View style={shimmerOverlay} />
                </View>
                <View style={[styles.tagPlaceholder, shimmerGradient]}>
                    <Animated.View style={shimmerOverlay} />
                </View>
            </View>

            {/* MRP Placeholder */}
            <View style={[styles.mrpPlaceholder, shimmerGradient]}>
                <Animated.View style={shimmerOverlay} />
            </View>

            {/* Name Placeholder */}
            <View style={[styles.namePlaceholder, shimmerGradient]}>
                <Animated.View style={shimmerOverlay} />
            </View>
            <View style={[styles.namePlaceholder, shimmerGradient, { width: '70%' }]}>
                <Animated.View style={shimmerOverlay} />
            </View>

            {/* Price Options Placeholder */}
            <View style={styles.optionsContainer}>
                <View style={[styles.optionLabelPlaceholder, shimmerGradient]}>
                    <Animated.View style={shimmerOverlay} />
                </View>
                <View style={[styles.optionLabelPlaceholder, shimmerGradient]}>
                    <Animated.View style={shimmerOverlay} />
                </View>
            </View>

            {/* Price Placeholder */}
            <View style={styles.optionsContainer}>
                <View style={[styles.pricePlaceholder, shimmerGradient]}>
                    <Animated.View style={shimmerOverlay} />
                </View>
                <View style={[styles.pricePlaceholder, shimmerGradient]}>
                    <Animated.View style={shimmerOverlay} />
                </View>
            </View>

            {/* Delivery Time Placeholder */}
            <View style={styles.optionsContainer}>
                <View style={[styles.deliveryPlaceholder, shimmerGradient]}>
                    <Animated.View style={shimmerOverlay} />
                </View>
                <View style={[styles.deliveryPlaceholder, shimmerGradient]}>
                    <Animated.View style={shimmerOverlay} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '48%',
        marginBottom: 16,
    },
    imageContainer: {
        borderRadius: 12,
        height: 180,
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    tagPlaceholder: {
        width: 50,
        height: 24,
        borderRadius: 50,
        marginRight: 8,
    },
    mrpPlaceholder: {
        width: 60,
        height: 12,
        borderRadius: 4,
        marginBottom: 8,
    },
    namePlaceholder: {
        width: '100%',
        height: 16,
        borderRadius: 4,
        marginBottom: 6,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    optionLabelPlaceholder: {
        width: 70,
        height: 12,
        borderRadius: 4,
    },
    pricePlaceholder: {
        width: 60,
        height: 16,
        borderRadius: 4,
    },
    deliveryPlaceholder: {
        width: 50,
        height: 12,
        borderRadius: 4,
    },
});
