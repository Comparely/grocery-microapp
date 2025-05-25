import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

const CartBar = () => {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.cartContainer}
            onPress={() => router.push('/Cart/ComparelyCart')}>
            <View style={styles.cartImages}>
                <Image source={require('../assets/images/1.png')} style={styles.cartImage} />
                <Image source={require('../assets/images/1.png')} style={styles.cartImage} />
            </View>
            <Text style={styles.cartText}>
                {'View Cart'}
                {'\n'}
                <Text style={styles.cartItems}>{'0 items'}</Text>
            </Text>
            <View style={styles.arrowButton}>
                <Text style={styles.arrowText}>{'>'}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cartContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#004738',
        borderRadius: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        elevation: 10,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        marginHorizontal: 60,
    },
    cartImages: {
        flexDirection: 'row',
        marginRight: 12,
    },
    cartImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: -13,
        borderWidth: 2,
        borderColor: '#fff',
    },
    cartText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    cartItems: {
        fontSize: 14,
        fontWeight: '400',
    },
    arrowButton: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CartBar;
