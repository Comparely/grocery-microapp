import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useCart } from '@/context/CartContext';

const CheckoutScreen = () => {
    const { cart, removeFromCart, clearCart } = useCart();

    const total = cart.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);

    const handlePlaceOrder = () => {
        Alert.alert('Order Placed', 'Thank you for your purchase!');
        clearCart();
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={cart}
                keyExtractor={(item) => item.product.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.product.name}</Text>
                            <Text style={styles.price}>₹{item.product.mrp * item.quantity}</Text>
                            <Text style={styles.qty}>Qty: {item.quantity}</Text>
                            <TouchableOpacity
                                onPress={() => removeFromCart(item.product.id.toString())}>
                                <Text style={styles.remove}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Your cart is empty</Text>}
            />
            {cart.length > 0 && (
                <View style={styles.footer}>
                    <Text style={styles.totalText}>Total: ₹{total}</Text>
                    <TouchableOpacity style={styles.button} onPress={handlePlaceOrder}>
                        <Text style={styles.buttonText}>Place Order</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: '#f6fff4' },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginVertical: 8,
        padding: 10,
        elevation: 2,
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 8,
        resizeMode: 'contain',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    name: { fontSize: 15, fontWeight: '600' },
    price: { fontSize: 16, color: '#1f8f27', fontWeight: 'bold' },
    qty: { fontSize: 13, color: '#666' },
    remove: { color: '#e74c3c', fontSize: 13, marginTop: 4 },
    empty: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#555' },
    footer: {
        padding: 12,
        backgroundColor: '#fff',
        borderTopColor: '#ccc',
        borderTopWidth: 1,
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    button: {
        backgroundColor: '#1f8f27',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
