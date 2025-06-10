import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/ui/Text';
import { Ionicons } from '@expo/vector-icons';

const VideoSection = () => {
    return (
        <View style={styles.featureSection}>
            <Text style={styles.featureTitle}>{'Worth Your Attention'}</Text>
            <View style={styles.videoContainer}>
                {/* Placeholder for video or image */}
                <Ionicons
                    name="volume-high-outline"
                    size={24}
                    color="#fff"
                    style={styles.soundIcon}
                />
            </View>
        </View>
    );
};

export default VideoSection;

const styles = StyleSheet.create({
    featureSection: {
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 10,
    },
    featureTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#004738',
        marginBottom: 10,
    },
    videoContainer: {
        height: 200,
        borderRadius: 12,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    soundIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'black',
        borderRadius: 20,
        padding: 6,
    },
});
