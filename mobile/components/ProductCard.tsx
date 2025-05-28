import React from 'react';
import { StyleSheet, View, Image, Linking, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { Product, PriceOption } from '../types/Product';
import { Session } from '@/types/Session';
import { Text } from '@/ui/Text';
import ThreeQuarterCircle from './timer';
import { useWebViews } from '@/context/WebViewContext';
import { injectSingleProductScript_zepto } from '@/script/injectionScript_zepto';
import { injectSingleProductScript } from '@/script/injectionScript_blinkit';
import { useCart } from '../context/CartContext';
import QuantitySelector from './QuantitySelector';

const { width } = Dimensions.get('window');

interface ProductCardProps {
    fullWidth: boolean;
    session: Session;
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ fullWidth, session, product }) => {
    const router = useRouter();
    const { cart, addToCart, removeFromCart } = useCart();
    const { blinkitWebViewRef, zeptoWebViewRef } = useWebViews();

    const priorityPlatforms = ['zepto', 'blinkit', 'instamart'];
    const bigbasketVariants = ['bigbasket', 'bbnow', 'bb'];

    const primaryOptions = product.priceOptions.filter((opt) =>
        priorityPlatforms.includes(opt.platform?.toLowerCase() || ''),
    );
    const bigbasketOptions = product.priceOptions.filter((opt) =>
        bigbasketVariants.includes(opt.platform?.toLowerCase() || ''),
    );

    const sortedPriceOptions = [...primaryOptions, ...bigbasketOptions].sort(
        (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    );

    const handleCardPress = () => {
        router.push({
            pathname: '/product',
            params: { product: JSON.stringify(product) },
        });
    };

    const platformLinks: Record<string, string> = {};

    product.priceOptions.forEach((opt) => {
        const platform = opt.platform?.toLowerCase();
        const link = opt.deeplink;
        if (platform && link) {
            platformLinks[platform] = link;
        }
    });

    const quantity = cart.find((item) => item.product.id === product.id)?.quantity || 0;

    const handleChangeQuantity = (newQty: number) => {
        const currentQty = quantity;

        const platformLinks = Object.fromEntries(
            product.priceOptions.map((opt) => [opt.platform?.toLowerCase(), opt.deeplink]),
        );

        if (newQty > currentQty) {
            // Add & inject
            addToCart(product);
            Object.entries(platformLinks).forEach(([platform, url]) => {

                let script = '';
                switch (platform) {
                    case 'blinkit':
                        script = injectSingleProductScript({ url });
                        blinkitWebViewRef.current?.injectScript(script);
                        break;
                    case 'zepto':
                        script = injectSingleProductScript_zepto({ url });
                        zeptoWebViewRef.current?.injectScript(script);
                        break;
                    // Add more platforms here as needed
                    default:
                        console.warn(`Unsupported platform: ${platform}`);
                }
            });
        } else if (newQty < currentQty) {
            // Remove only
            Object.keys(platformLinks).forEach((platform) => {
                removeFromCart(product.id.toString(), platform);
            });
        }
    };

    return (
        <TouchableOpacity
            onPress={handleCardPress}
            activeOpacity={0.9}
            style={fullWidth ? styles.fullWidthContainer : styles.container}>
            <View style={styles.imageContainer}>
                {product.isNewPack && (
                    <View style={styles.newPackBadge}>
                        <Text style={styles.newPackText}>NOW IN NEW PACK</Text>
                    </View>
                )}
                <Image source={{ uri: product.imageUrl }} style={styles.image} />
                <QuantitySelector quantity={quantity} onChange={handleChangeQuantity} />
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.tagsContainer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{product.brand}</Text>
                    </View>
                </View>

                <Text style={styles.mrpText}>MRP ₹{product.mrp}</Text>

                <Text style={styles.nameText} numberOfLines={2}>
                    {product.name}
                </Text>

                <View style={styles.priceOptionsColumn}>
                    {sortedPriceOptions.length === 0 ? (
                        <Text>No price options available</Text>
                    ) : (
                        sortedPriceOptions.map((priceOption) => (
                            <PriceOptionSingle
                                session={session}
                                key={
                                    priceOption.id || `${priceOption.platform}-${priceOption.price}`
                                }
                                priceOption={priceOption}
                                productWeight={product.weight}
                                label=""
                            />
                        ))
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

interface PriceOptionSingleProps {
    session: Session;
    priceOption: PriceOption;
    productWeight?: string;
    label: string;
}

const PriceOptionSingle: React.FC<PriceOptionSingleProps> = ({
    session,
    priceOption,
    productWeight,
}) => {
    const handleDeepLink = (url: string) => {
        (async () => {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                console.log("Don't know how to open URI: " + url);
            }
        })().catch((err) => console.log(err));
    };

    const platform = priceOption.platform?.toLowerCase() ?? '';
    const bigbasketVariants = ['bigbasket', 'bbnow', 'bb'];

    const eta =
        {
            zepto: session.marketplaceAttributes?.zeptoStoreAttributes?.eta || 'N/A',
            blinkit: session.marketplaceAttributes?.blinkitStoreAttributes?.eta || '15 mins',
            instamart: session.marketplaceAttributes?.instamartStoreAttributes?.eta || '10 mins',
            bigbasket: session.marketplaceAttributes?.bigbasketStoreAttributes?.eta || '45 mins',
        }[platform] || 'N/A';

    const displayWeight = priceOption.weight || productWeight || 'N/A';

    const getPlatformIcon = () => {
        switch (platform) {
            case 'zepto':
                return (
                    <Image
                        source={require('@/assets/images/zepto.png')}
                        style={styles.platformImage}
                    />
                );
            case 'blinkit':
                return (
                    <Image
                        source={require('@/assets/images/blinkit.png')}
                        style={styles.platformImageBlinkit}
                    />
                );
            case 'instamart':
                return (
                    <Image
                        source={require('@/assets/images/swiggy_instamart.webp')}
                        style={styles.platformImage}
                    />
                );
            default:
                if (bigbasketVariants.includes(platform)) {
                    return (
                        <Image
                            source={require('@/assets/images/bbnow.webp')}
                            style={styles.platformImage}
                        />
                    );
                }
                return null;
        }
    };

    return (
        <TouchableOpacity
            onPress={() => handleDeepLink(priceOption.deeplink ?? '')}
            style={styles.priceOptionContainer}>
            <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹{priceOption.price}</Text>
                {getPlatformIcon()}
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.tagSmall}>
                    <Text style={styles.tagTextSmall}>{displayWeight}</Text>
                </View>
                <View style={styles.etaContainer}>
                    <ThreeQuarterCircle />
                    <Text style={styles.deliveryText}>{eta}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    priceOptionContainer: {
        marginBottom: 10,
        borderBottomWidth: 0.5,
        borderColor: '#e0e0e0',
        paddingBottom: 6,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        gap: 8,
        alignItems: 'center',
    },
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    priceText: {
        fontSize: width > 768 ? 16 : 14,
        fontWeight: 'bold',
        color: '#181b19',
    },
    platformImage: {
        width: 36,
        height: 18,
        resizeMode: 'contain',
    },
    platformImageBlinkit: {
        width: 36,
        height: 13,
        resizeMode: 'cover',
    },
    tagSmall: {
        backgroundColor: '#fde5b6',
        borderRadius: 50,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    tagTextSmall: {
        color: '#181b19',
        fontSize: 8.5,
        fontWeight: '500',
    },
    deliveryText: {
        fontSize: 11,
        color: '#181b19',
    },
    container: {
        width: '48%',
        marginBottom: 16,
        marginHorizontal: 7,
    },
    fullWidthContainer: {
        width: 234,
        marginRight: 15,
    },
    imageContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 4,
        height: width > 768 ? 180 : 130,
        // marginHorizontal: '40%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    newPackBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'red',
        borderTopLeftRadius: 12,
        borderBottomRightRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    newPackText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
    },
    image: {
        width: '80%',
        height: '80%',
        resizeMode: 'contain',
    },
    detailsContainer: {
        paddingHorizontal: 4,
    },
    tagsContainer: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    tag: {
        backgroundColor: '#fde5b6',
        borderRadius: 50,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
    },
    tagText: {
        color: '#181b19',
        fontSize: 12,
        fontWeight: '500',
    },
    mrpText: {
        color: '#9d9d9d',
        fontSize: 11,
        marginBottom: 3,
    },
    nameText: {
        color: '#181b19',
        fontSize: width > 768 ? 16 : 13,
        fontWeight: 'bold',
        marginBottom: 6,
        lineHeight: 18,
    },
    priceOptionsColumn: {
        flexDirection: 'column',
    },
    addButton: {
        backgroundColor: '#4CAF50', // green color
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3, // Android shadow
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default ProductCard;
