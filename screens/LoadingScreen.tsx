import { LoadingProgress } from '@/components/Loaders';
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LoadingScreenProps {
    /** Show a retry button when set */
    showRetry?: boolean;
    /** Callback to invoke when retry is pressed */
    onRetry?: () => void;
}

export function LoadingScreen({ showRetry = false, onRetry }: LoadingScreenProps) {
    return (
        <View style={styles.loadingContainer}>
            <LoadingProgress />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#004738',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
