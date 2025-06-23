import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const ProductGrid = ({ data }: { data: any[] }) => {
    const renderItem = ({ item }: { item: any }) => {
        const base = item.variations?.[0] || {};
        const name = item.display_name;
        const quantity = base.sku_quantity_with_combo || base.quantity || '';
        const price = base.price?.offer_price || base.price?.mrp || '';
        const options = item.variations?.length || 0;
        const image = base.images?.[0]
            ? `https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_252,h_272/${base.images[0]}`
            : '';

        return (
            <View style={styles.card}>
                <Image source={{ uri: image }} style={styles.image} />
                <Text style={styles.title}>{name}</Text>
                <Text style={styles.sub}>{quantity}</Text>
                <Text style={styles.price}>₹{price}</Text>
                {options > 1 && (
                    <View style={styles.optionsBox}>
                        <Text style={styles.optionsText}>{options} options</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <FlatList
            data={data}
            keyExtractor={(item) => item.product_id}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={{ padding: 10 }}
        />
    );
};

const styles = StyleSheet.create({
    card: {
        width: screenWidth / 2 - 20,
        margin: 5,
        borderRadius: 12,
        padding: 10,
        backgroundColor: '#fff',
        elevation: 2,
    },
    image: {
        width: '100%',
        height: 100,
        resizeMode: 'contain',
        marginBottom: 5,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    sub: {
        fontSize: 12,
        color: '#555',
    },
    price: {
        fontWeight: '600',
        marginTop: 2,
    },
    optionsBox: {
        marginTop: 5,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        alignItems: 'center',
    },
    optionsText: {
        fontSize: 12,
        color: '#1BA672',
        fontWeight: '600',
    },
});

export default ProductGrid;
