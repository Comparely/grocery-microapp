import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/ui/Text';
import ThreeQuarterCircle from './timer';
import QuantitySelector from './QuantitySelector';
import { useWebViews } from '@/context/WebViewContext';
import { injectSingleProductScript_zepto } from '@/script/injectionScript_zepto';
import { getNavigationScript, injectSingleProductScript } from '@/script/injectionScript_blinkit';
import { useCart } from '../context/CartContext';
import ClockIcon from './timer';
import { PriceOption, Product } from '@/types/Product';
import { Session } from '@/types/Session';

const { width } = Dimensions.get('window');

interface ProductCardProps {
    fullWidth: boolean;
    session: Session;
    product: Product;
    isHomeScreenView?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    fullWidth,
    session,
    product,
    isHomeScreenView,
}) => {
    const router = useRouter();
    const { cart, addToCart, removeFromCart } = useCart();
    const { blinkitWebViewRef, zeptoWebViewRef, instamartWebViewRef } = useWebViews();

    const priorityPlatforms = ['zepto', 'blinkit', 'instamart', 'amazonfresh'];
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

    const quantity = cart.find((item) => item.product.id === product.id)?.quantity || 0;

    const handleChangeQuantity = (newQty: number) => {
        const currentQty = quantity;

        const platformLinks = Object.fromEntries(
            product.priceOptions.map((opt) => [opt.platform?.toLowerCase(), opt.deeplink]),
        );

        if (newQty > currentQty) {
            addToCart(product);
            Object.entries(platformLinks).forEach(([platform, url]) => {
                let navScript = '';
                switch (platform) {
                    case 'blinkit':
                        navScript = getNavigationScript(url);
                        blinkitWebViewRef.current?.injectScript(navScript);
                        // Delay injection of product script
                        setTimeout(() => {
                            const actionScript = injectSingleProductScript({ url });
                            blinkitWebViewRef.current?.injectScript(actionScript);
                        }, 3000); // 3 second delay, tweak if needed
                        break;
                    case 'zepto':
                        navScript = getNavigationScript(url);
                        zeptoWebViewRef.current?.injectScript(navScript);
                        // Delay injection of product script
                        setTimeout(() => {
                            const actionScript = injectSingleProductScript_zepto({ url });
                            zeptoWebViewRef.current?.injectScript(actionScript);
                        }, 3000); // 3 second delay, tweak if needed
                        break;
                    case 'instamart':
                        navScript = getNavigationScript(url);
                        instamartWebViewRef.current?.injectScript(navScript);
                        // Delay injection of product script
                        setTimeout(() => {
                            const actionScript = injectSingleProductScript({ url });
                            instamartWebViewRef.current?.injectScript(actionScript);
                        }, 3000); // 3 second delay, tweak if needed
                    default:
                        console.warn(`Unsupported platform: ${platform}`);
                }
            });
        } else if (newQty < currentQty) {
            Object.keys(platformLinks).forEach((platform) => {
                removeFromCart(product.id.toString(), platform);
            });
        }
    };

    return (
        <TouchableOpacity
            onPress={handleCardPress}
            activeOpacity={0.9}
            style={
                fullWidth
                    ? styles.fullWidthContainer
                    : isHomeScreenView
                      ? styles.homeCard
                      : styles.container
            }>
            <View style={styles.cardWrapper}>
                <Image source={{ uri: product.imageUrl }} style={styles.image} />
                <Text style={styles.brandText}>{product.brand}</Text>
                <QuantitySelector quantity={quantity} onChange={handleChangeQuantity} />
            </View>

            <View style={styles.priceOptionsColumn}>
                <Text style={styles.mrpText}>
                    {'MRP ₹'}
                    {product.mrp}
                </Text>
                <Text style={styles.nameText} numberOfLines={2}>
                    {product.name}
                </Text>

                <View style={styles.priceOptionsColumn}>
                    {sortedPriceOptions.length === 0 ? (
                        <Text>{'No price options available'}</Text>
                    ) : (
                        sortedPriceOptions.map((priceOption) => (
                            <PriceOptionSingle
                                key={
                                    priceOption.id || `${priceOption.platform}-${priceOption.price}`
                                }
                                session={session}
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

    const displayWeight = priceOption.weight || 'N/A';

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
                        style={styles.platformImage}
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
        <>
            <TouchableOpacity
                onPress={() => handleDeepLink(priceOption.deeplink ?? '')}
                style={styles.priceOptionContainer}>
                <View style={styles.platformRow}>
                    <Text style={styles.priceText}>
                        {'₹'}
                        {priceOption.price}
                    </Text>
                    {getPlatformIcon()}
                </View>

                <View style={styles.detailsRow}>
                    <Text style={styles.weightText}>{displayWeight}</Text>
                    <View style={styles.mrpEtaColumn}>
                        {priceOption.originalPrice ? (
                            <Text style={styles.priceText}>
                                {'₹'}
                                {priceOption.originalPrice}
                            </Text>
                        ) : null}
                        <View style={styles.etaRow}>
                            <ClockIcon />
                            <Text style={styles.etaText}>{eta}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '48%',
        backgroundColor: '#fff9f1',
        borderRadius: 6,
        marginBottom: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    fullWidthContainer: {
        width: 210,
        marginRight: 15,
        backgroundColor: '#fff9f1',
        borderRadius: 16,
        marginBottom: 20,
        padding: 12,
        shadowColor: '#000',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    homeCard: {
        width: '48%',
        backgroundColor: '#fffefb',
        borderRadius: 16,
        marginBottom: 20,
        padding: 14,
        shadowColor: '#000',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardWrapper: {
        flexDirection: 'column',
    },
    image: {
        width: '100%',
        height: 100,
        resizeMode: 'contain',
        marginBottom: 2,
    },
    brandText: {
        fontSize: 12,
        color: '#8c8c8c',
        marginBottom: 2,
    },
    nameText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#181b19',
        marginBottom: 10,
    },
    priceOptionsColumn: {
        flexDirection: 'column',
        gap: 8,
    },
    priceOptionContainer: {
        borderTopWidth: 1,
        borderColor: '#f0f0f0',
        paddingTop: 8,
    },
    platformRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
        justifyContent: 'space-between',
    },
    priceText: {
        fontSize: 13,
        color: '#8c8c8c',
        textDecorationLine: 'line-through',
        textAlign: 'right',
    },
    finalPrice: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#181b19',
        textDecorationLine: 'none',
    },
    platformImage: {
        width: 45,
        height: 28,
        resizeMode: 'contain',
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    weightText: {
        fontSize: 12,
        color: 'gray',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        fontWeight: '500',
    },
    mrpEtaColumn: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    etaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    etaText: {
        fontSize: 12,
        fontWeight: '500',
    },
    mrpText: {
        color: '#9d9d9d',
        fontSize: 11,
        marginBottom: 3,
    },
});

export default ProductCard;
