import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'expo-router';

// const { width } = Dimensions.get('window');

const CartScreen = () => {
    const { cart } = useCart();
    const router = useRouter();

    const total = cart.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);

    return (
        <View>
            {cart.length > 0 && (
                // <TouchableOpacity
                //     style={styles.stickyBar}
                //     // onPress={() => router.push('checkout')}
                //     activeOpacity={0.8}>
                //     <Image source={{ uri: cart[0]?.product.imageUrl }} style={styles.stickyImage} />

                //     <View style={styles.textContainer}>
                //         <Text style={styles.viewCart}>View cart</Text>
                //         <Text style={styles.itemCount}>
                //             {cart.length} ITEM{cart.length > 1 ? 'S' : ''}
                //         </Text>
                //     </View>

                //     <Text style={styles.arrow}>›</Text>
                // </TouchableOpacity>
                <TouchableOpacity
                    style={styles.cartContainer}
                    onPress={() => router.push('/Cart/ComparelyCart')}
                    activeOpacity={0.8}>
                    <View style={styles.cartImages}>
                        <Image
                            source={{ uri: cart[0]?.product.imageUrl }}
                            style={styles.cartImage}
                        />
                    </View>
                    <Text style={styles.cartText}>
                        {'View Cart'}
                        {'\n'}
                        <Text style={styles.cartItems}>
                            {cart.length} item{cart.length > 1 ? 's' : ''}
                        </Text>
                    </Text>
                    <View style={styles.arrowButton}>
                        <Text style={styles.arrowText}>{'>'}</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cartContainer: {
        position: 'absolute',
        bottom: 20,
        left: 15,
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

export default CartScreen;
