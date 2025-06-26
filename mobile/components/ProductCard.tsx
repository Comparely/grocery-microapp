import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/ui/Text';
import { Product } from '@/types/Product';
import { Session } from '@/types/Session';
import { Ionicons } from '@expo/vector-icons';

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
    // console.log(product);
    const router = useRouter();

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
    const sortedOptions = [...product.priceOptions].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    const firstOption = sortedOptions[0];
    const platform = firstOption?.platform?.toLowerCase() ?? '';

    const handleCardPress = () => {
        router.push({
            pathname: '/product',
            params: { product: JSON.stringify(product) },
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

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'zepto':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/zeptov2.png');
            case 'blinkit':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/blinkitv2.png');
            case 'instamart':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/instamartv2.png');
            default:
                if (bigbasketVariants.includes(platform)) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return require('@/assets/images/bbnow.webp');
                }
                return null;
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
            <TouchableOpacity style={styles.heartIcon}>
                {/* <Ionicons name="heart-outline" size={20} color="#333" /> */}
            </TouchableOpacity>
            <View style={styles.cardWrapper}>
                <Image source={{ uri: product.imageUrl }} style={styles.image} />
                {/* <Text style={styles.brandText}>{product.brand}</Text> */}
                {/* <QuantitySelector quantity={quantity} onChange={handleChangeQuantity} /> */}
            </View>

            <View style={styles.priceOptionsColumn}>
                {/* <Text style={styles.mrpText}>
                    {'MRP ₹'}
                    {product.mrp}
                </Text> */}
                <Text style={styles.nameText} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={styles.weightText}>{product.weight}</Text>
                <View style={styles.priceOptionsColumn}>
                    {sortedPriceOptions.length === 0 ? (
                        <Text>{'No price options available'}</Text>
                    ) : (
                        // <PriceOptionSingle
                        //     key={
                        //         priceOption.id || `${priceOption.platform}-${priceOption.price}`
                        //     }
                        //     session={session}
                        //     priceOption={priceOption}
                        //     productWeight={product.weight}
                        //     label=""
                        // />
                        <>
                            <TouchableOpacity
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onPress={() => handleDeepLink(firstOption.deeplink ?? '')}
                                style={styles2.priceOptionCard}>
                                <View style={styles2.priceCardRow}>
                                    <View style={styles2.platformRow}>
                                        <Image
                                            source={getPlatformIcon(platform)}
                                            style={styles2.platformImage}
                                        />
                                        <Text style={styles2.finalPrice}>
                                            {'₹'}
                                            {firstOption.price}
                                        </Text>
                                    </View>
                                    {/* <QuantitySelector
                                        quantity={quantity}
                                        onChange={handleChangeQuantity}
                                    /> */}
                                </View>
                            </TouchableOpacity>
                            <View style={styles2.line}></View>

                            <View style={styles2.comparisonRow}>
                                {sortedOptions.slice(1).map((option) => (
                                    <TouchableOpacity
                                        key={option.platform}
                                        // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                        onPress={() => handleDeepLink(option.deeplink ?? '')}
                                        style={styles2.comparisonItem}>
                                        <Image
                                            source={getPlatformIcon(
                                                option.platform?.toLowerCase() ?? '',
                                            )}
                                            style={styles2.comparisonLogo}
                                        />
                                        <Text style={styles2.comparisonPrice}>
                                            {'₹'}
                                            {option.price}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    heartIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    container: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        // marginBottom: 20,
        padding: 5,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    fullWidthContainer: {
        width: 210,
        marginRight: 15,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginBottom: 20,
        padding: 12,
        shadowColor: '#000',
        borderWidth: 1,
        borderColor: '#D2D2D2',
    },
    homeCard: {
        width: '50%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginBottom: 20,
        padding: 14,
        shadowColor: '#000',
        borderWidth: 1,
        borderColor: '#d2d2d2',
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
        display: 'flex',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'SFPro',
        color: '#181b19',
        lineHeight: 18,
        minHeight: 45, // 3 lines * 18px line height
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
        color: 'black',
        borderRadius: 12,
        paddingTop: -2,
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

const styles2 = StyleSheet.create({
    priceOptionCard: {
        backgroundColor: '#FFFAF0',
        padding: 6,
        borderRadius: 10,
        marginBottom: 8,
        borderColor: '#f0f0f0',
        borderWidth: 1,
    },
    priceCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    platformRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    finalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#181b19',
    },
    addBtn: {
        backgroundColor: '#007e3a',
        width: 25,
        height: 27,
        borderRadius: 8,
        alignItems: 'center',
    },
    addBtnText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -2,
    },
    line: {
        height: 1,
        backgroundColor: '#e0e0e0',
        alignSelf: 'stretch',
        marginHorizontal: -14, // counter card padding
        opacity: 0.9,
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 16,
        paddingHorizontal: 4,
    },
    comparisonItem: {
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
    },
    comparisonLogo: {
        width: 30,
        height: 24,
        resizeMode: 'contain',
    },
    comparisonPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d2d2d',
    },
    platformImage: {
        width: 50,
        height: 32,
        marginLeft: -9,
        resizeMode: 'contain',
    },
});

export default ProductCard;
