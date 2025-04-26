import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui/Text';

const Navbar: React.FC = () => {
    const router = useRouter();

    return (
        <View style={styles.navbar}>
            <TouchableOpacity onPress={() => router.push('/')}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Comparely</Text>
            <View style={styles.placeholder} /> {/* Balances the layout */}
        </View>
    );
};

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#004738',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 24, // Matches the icon size for symmetry
    },
});

export default Navbar;
