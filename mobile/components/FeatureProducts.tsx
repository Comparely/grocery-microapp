import React, { useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuantitySelector from './QuantitySelector';
import { useCart } from '@/context/CartContext';
import { useWebViews } from '@/context/WebViewContext';
import { injectSingleProductScript_zepto } from '@/script/injectionScript_zepto';
import { getNavigationScript, injectSingleProductScript } from '@/script/injectionScript_blinkit';
import { useRouter } from 'expo-router';

interface PriceOption {
    id?: number;
    platform?: string;
    price?: number;
    originalPrice?: number;
    deliveryTime?: number;
    deeplink?: string;
    weight?: string;
}

interface Product {
    id: number;
    name: string;
    brand: string;
    weight: string;
    mrp: number;
    imageUrl: string;
    isNewPack?: boolean;
    priceOptions: PriceOption[];
}

interface FeaturedProductsSectionProps {
    featuredProducts: Product[];
}

export default function FeaturedProductsSection({
    featuredProducts,
}: FeaturedProductsSectionProps) {
    // const [featuredProducts, setFeaturedProducts] = useState<Product[]>([
    //     {
    //         id: 1,
    //         name: 'The Health Factory Zero Multigrain Bread',
    //         brand: 'The Health Factory',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=120,h=120/app/assets/products/sliding_images/jpeg/34a57eca-4bda-47c3-838b-5fe0d348db35.jpg?ts=1724241358',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    //     {
    //         id: 2,
    //         name: 'Potato (Aloo)',
    //         brand: 'Local',
    //         weight: '375 g',
    //         mrp: 85,
    //         imageUrl:
    //             'https://cdn.zeptonow.com/production/ik-seo/tr:w-1200,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/654e3c68-865e-42b0-ae12-8467c583cfaf/Amul-Taaza-Homogenised-Toned-Milk-Tetra-Pack-.jpeg',
    //         priceOptions: [
    //             { platform: 'blinkit', price: 65, originalPrice: 85 },
    //             { platform: 'zepto', price: 68, originalPrice: 85 },
    //         ],
    //     },
    // ]);

    const getPlatformLogo = (platform?: string) => {
        switch (platform) {
            case 'blinkit':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/blinkitv2.png');
            case 'zepto':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/zeptov2.png');
            case 'instamart':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/instamartv2.png');
            default:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/bblogo.png');
        }
    };

    const router = useRouter();

    const renderProductCard = ({ item }: { item: Product }) => {
        const sortedOptions = [...item.priceOptions].sort(
            (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
        );
        const [bestOption, ...otherOptions] = sortedOptions;

        const handleCardPress = () => {
            router.push({
                pathname: '/product',
                params: { product: JSON.stringify(item) },
            });
        };

        const handleDeepLink = async (url: string) => {
            try {
                const supported = await Linking.canOpenURL(url);
                if (supported) await Linking.openURL(url);
                else console.log("Can't open URL: " + url);
            } catch (err) {
                console.log(err);
            }
        };

        return (
            <TouchableOpacity onPress={handleCardPress} style={styles.card}>
                {/* <TouchableOpacity style={styles.heartIcon}>
                    <Ionicons name="heart-outline" size={20} color="#333" />
                </TouchableOpacity> */}

                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.weight}>{item.weight}</Text>
                {bestOption && (
                    <TouchableOpacity
                        // eslint-disable-next-line @typescript-eslint/no-misused-promises
                        onPress={() => handleDeepLink(bestOption.deeplink ?? '')}
                        style={styles.bestPriceBox}>
                        <View style={styles.bestPriceLeft}>
                            <Image
                                source={getPlatformLogo(bestOption.platform)}
                                style={styles.platformIcon}
                            />
                            <Text style={styles.price}>
                                {'₹'}
                                {bestOption.price}
                            </Text>
                        </View>
                        {/* <QuantitySelector quantity={quantity} onChange={handleChangeQuantity} /> */}
                    </TouchableOpacity>
                )}
                <View style={styles.divider} />
                {/* Other platform prices below */}
                {otherOptions.length > 0 && (
                    <View style={styles.otherPriceContainer}>
                        {otherOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.otherPriceRow}
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onPress={() => handleDeepLink(option.deeplink ?? '')}>
                                <View style={styles.platformPill}>
                                    <Image
                                        source={getPlatformLogo(option.platform)}
                                        style={styles.platformIconSmall}
                                    />
                                </View>
                                <Text style={styles.price}>₹{option.price}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ marginVertical: 16, paddingHorizontal: 12 }}>
            <FlatList
                data={featuredProducts}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                renderItem={renderProductCard}
                contentContainerStyle={{ gap: 12 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '48%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#fff',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 100,
        resizeMode: 'contain',
    },
    otherPriceContainer: {
        flexDirection: 'row',
        // flexWrap: 'wrap', // if needed, otherwise use `noWrap` for scroll
        gap: 10,
        marginTop: 8,
    },

    otherPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },

    platformPill: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    platformIconSmall: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },

    name: {
        fontWeight: '510',
        marginTop: 3,
        fontSize: 14,
        lineHeight: 27,
        height: 54, // Enforce 2 lines space (2 * lineHeight)
    },

    weight: {
        marginTop: 5,
        fontWeight: '400',
        color: '#555',
        fontSize: 13,
    },
    divider: {
        height: 1,
        backgroundColor: '#e6e6e6',
        marginVertical: 8,
        marginHorizontal: -10, // cancel out the card's horizontal padding
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    platformIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    price: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#000',
    },
    originalPrice: {
        textDecorationLine: 'line-through',
        color: '#888',
        fontSize: 12,
    },
    bestPriceBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fef8ef',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginTop: 6,
    },

    bestPriceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    addButtonCompact: {
        backgroundColor: 'green',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: '#0a0',
        borderRadius: 15,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    heartIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
});
