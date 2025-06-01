import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import ThreeQuarterCircle from '../../components/timer';
import QuantitySelector from '../../components/QuantitySelector';
import { useCart } from '@/context/CartContext';

const platformLogos: Record<string, any> = {
    blinkit: require('@/assets/images/blinkit.png'),
    zepto: require('@/assets/images/zepto.png'),
    instamart: require('@/assets/images/instamart1.png'),
    bb: require('@/assets/images/instamart1.png'),
};

const platformExtraCharges: Record<string, number> = {
    blinkit: 18,
    zepto: 19,
    instamart: 26,
    'bb now': 90,
};

const platformDeliveryTimes: Record<string, string> = {
    blinkit: '8 mins',
    zepto: '12 mins',
    instamart: '8 mins',
    'bb now': '8 mins',
};

const ComparelyCart = () => {
    const router = useRouter();
    const { cart, addToCart, grouped, removeFromCart } = useCart();
    const [expandedIndex, setExpandedIndex] = useState<{
        [key: string]: boolean;
    }>({});

    // console.log(groupedByPlatform);

    // Toggle expand per platform
    const toggleExpand = (platform: string) => {
        setExpandedIndex((prev) => ({
            ...prev,
            [platform]: !prev[platform],
        }));
    };

    // Calculate total price per platform (sum of product price * quantity)
    const getPlatformTotal = (items: typeof cart) =>
        items.reduce((total, item) => {
            const priceOption = item.product.priceOptions.find(
                (po) => po.platform === item.platform,
            );
            const price = priceOption?.price ?? item.product.mrp;
            return total + price * item.quantity;
        }, 0);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Your Comparely Cart</Text>
            </View>

            <View style={styles.content}>
                {Object.keys(grouped).length === 0 && (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#555' }}>
                        Your cart is empty
                    </Text>
                )}

                {Object.entries(grouped).map(([platform, items]) => {
                    console.log(platform, items);
                    const totalPrice = getPlatformTotal(items);
                    const extraCharges = platformExtraCharges[platform] || 0;
                    const deliveryTime = platformDeliveryTimes[platform] || '';
                    const logo = platformLogos[platform] || null;

                    return (
                        <View key={platform} style={styles.vendorBox}>
                            <View style={styles.vendorHeader}>
                                <View style={styles.vendorInfo}>
                                    {logo && (
                                        <Image
                                            source={logo}
                                            style={styles.vendorLogo}
                                            resizeMode="contain"
                                        />
                                    )}
                                    <View style={styles.priceInfoContainer}>
                                        <Text style={styles.itemCount}>
                                            {items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                                            Items
                                        </Text>
                                        <Text style={styles.price}>₹{totalPrice}</Text>
                                    </View>
                                </View>

                                <View style={styles.vendorMeta}>
                                    <View style={styles.row}>
                                        <Text style={styles.extraCharges}>
                                            Extra Charges ₹{extraCharges}
                                        </Text>
                                    </View>
                                    <View style={styles.row}>
                                        <ThreeQuarterCircle />
                                        <Text style={styles.deliveryTime}>{deliveryTime}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity onPress={() => toggleExpand(platform)}>
                                    <Text style={styles.deliveryExpand}>
                                        {expandedIndex[platform] ? '˅' : '>'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {expandedIndex[platform] && (
                                <>
                                    {items.map(({ product, quantity }) => {
                                        const priceOption = product.priceOptions.find(
                                            (po) => po.platform === platform,
                                        );
                                        const price = priceOption ? priceOption.price : product.mrp;

                                        return (
                                            <View
                                                key={`${platform}-${product.id}`}
                                                style={styles.productCard}>
                                                <Image
                                                    source={{ uri: product.imageUrl }}
                                                    style={styles.productImage}
                                                    resizeMode="contain"
                                                />
                                                <View style={styles.productInfo}>
                                                    <Text style={styles.productName}>
                                                        {product.name}
                                                    </Text>
                                                    <View style={styles.tagsRow}>
                                                        <Text style={styles.tag}>
                                                            {product.weight || 'N/A'}
                                                        </Text>
                                                        <Text style={styles.tag}>
                                                            {product.brand}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.productPrice}>
                                                        ₹{price}
                                                    </Text>
                                                </View>
                                                <QuantitySelector
                                                    quantity={quantity}
                                                    onChange={(newQty) => {
                                                        if (newQty > quantity)
                                                            addToCart(product, platform);
                                                        else if (newQty < quantity)
                                                            removeFromCart(
                                                                product.id.toString(),
                                                                platform,
                                                            );
                                                    }}
                                                />
                                            </View>
                                        );
                                    })}

                                    <TouchableOpacity
                                        style={styles.openAppBtn}
                                        onPress={() => {
                                            const deeplinkObj =
                                                items[0]?.product?.priceOptions.find(
                                                    (po) => po.platform === platform,
                                                );
                                            if (deeplinkObj) {
                                                Linking.openURL(deeplinkObj.deeplink);
                                            }
                                        }}>
                                        <Text style={styles.openAppText}>Open in {platform}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9EC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#004B2F',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    headerText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    content: {
        padding: 16,
    },
    vendorBox: {
        backgroundColor: '#FFF3C4',
        borderColor: '#CBD402',
        borderWidth: 3,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    vendorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vendorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vendorLogo: {
        height: 44,
        width: 64,
    },
    priceInfoContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        marginLeft: 8,
    },
    itemCount: {
        fontSize: 12,
        color: '#777',
        marginBottom: 2,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        alignSelf: 'flex-start',
    },
    vendorMeta: {
        backgroundColor: '#FFF3C4',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginVertical: 4,
    },
    extraCharges: {
        fontSize: 14,
        color: 'black',
        fontWeight: '600',
    },
    deliveryTime: {
        marginLeft: 8,
        fontSize: 14,
        color: '#000',
    },
    deliveryExpand: {
        marginLeft: 8,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#004738',
        backgroundColor: 'white',
        borderRadius: 12,
    },
    productImage: {
        height: 48,
        width: 48,
        marginRight: 10,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontWeight: '600',
        fontSize: 14,
    },
    tagsRow: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 6,
    },
    tag: {
        backgroundColor: '#FBE7BA',
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 10,
        borderRadius: 4,
    },
    productPrice: {
        marginTop: 4,
        fontWeight: '700',
    },
    openAppBtn: {
        backgroundColor: '#CBD402',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        marginHorizontal: 5,
        alignSelf: 'flex-end',
        paddingHorizontal: 20,
    },
    openAppText: {
        fontWeight: '600',
        color: '#000',
    },
});

export default ComparelyCart;
