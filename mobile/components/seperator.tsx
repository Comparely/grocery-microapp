import React from 'react';
import { View, StyleSheet } from 'react-native';

const SeparatorLine = () => {
    return <View style={styles.separator} />;
};

export default SeparatorLine;

const styles = StyleSheet.create({
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0', // Light gray
        // marginVertical: 16,
        // marginHorizontal: 20,
    },
});
