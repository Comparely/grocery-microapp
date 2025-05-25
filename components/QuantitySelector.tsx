import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface QuantitySelectorProps {
    initialQuantity?: number;
    onChange?: (quantity: number) => void;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ initialQuantity = 0, onChange }) => {
    const [quantity, setQuantity] = React.useState(initialQuantity);

    const increaseQuantity = () => {
        const newQty = quantity + 1;
        setQuantity(newQty);
        onChange?.(newQty);
    };

    const decreaseQuantity = () => {
        const newQty = quantity > 0 ? quantity - 1 : 0;
        setQuantity(newQty);
        onChange?.(newQty);
    };

    return (
        <View style={styles.quantityContainer}>
            {quantity > 0 ? (
                <>
                    <TouchableOpacity onPress={decreaseQuantity} style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>{'−'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{quantity}</Text>
                    <TouchableOpacity onPress={increaseQuantity} style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>{'+'}</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <TouchableOpacity onPress={increaseQuantity} style={styles.qtyAddButton}>
                    <Text style={styles.qtyAddText}>{'+'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    quantityContainer: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: '#004d40',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    qtyButton: {
        paddingHorizontal: 6,
    },
    qtyButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
    qtyText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginHorizontal: 1,
    },
    qtyAddButton: {
        backgroundColor: '#004d40',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    qtyAddText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default QuantitySelector;
