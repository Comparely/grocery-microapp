import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Text } from '@/ui/Text';

export const LoadingProgress = () => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const widthInterpolated = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading Comparely</Text>
            <View style={styles.progressBarBackground}>
                <Animated.View style={[styles.progressBarFill, { width: widthInterpolated }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#004738',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 16,
    },
    progressBarBackground: {
        width: '80%',
        height: 6,
        borderRadius: 3,
        backgroundColor: '#255C4A',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: '#cbd402',
    },
});
