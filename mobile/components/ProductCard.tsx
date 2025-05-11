import React from 'react';
import { StyleSheet, View, Image, Linking, TouchableOpacity, Dimensions } from 'react-native';
import type { Product, PriceOption } from '../types/Product';
import { Session } from '@/types/Session';
import { Text } from '@/ui/Text';
import ThreeQuarterCircle from './timer';

const { width } = Dimensions.get('window');

interface ProductCardProps {
    fullWidth: boolean;
    session: Session;
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ fullWidth, session, product }) => {
    const zeptoAndBlinkitOptions = product.priceOptions.filter(
        (option) => option.platform === 'zepto' || option.platform === 'blinkit'
    );
    const instamartOptions = product.priceOptions.filter(
        (option) => option.platform === 'instamart'
    );

    const sortedPriceOptions = [...zeptoAndBlinkitOptions, ...instamartOptions].sort(
        (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)
    );

    return (
        <View style={fullWidth ? styles.fullWidthContainer : styles.container}>
            <View style={styles.imageContainer}>
                {product.isNewPack && (
                    <View style={styles.newPackBadge}>
                        <Text style={styles.newPackText}>NOW IN NEW PACK</Text>
                    </View>
                )}
                <Image source={{ uri: product.imageUrl }} style={styles.image} />
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
                    {sortedPriceOptions.map((priceOption) => (
                        <PriceOptionSingle
                            session={session}
                            key={priceOption.id || `${priceOption.platform}-${priceOption.price}`}
                            priceOption={priceOption}
                            productWeight={product.weight}
                            label=""
                        />
                    ))}
                </View>
            </View>
        </View>
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

    const eta =
        {
            zepto: session.marketplaceAttributes?.zeptoStoreAttributes?.eta || 'N/A',
            blinkit: session.marketplaceAttributes?.blinkitStoreAttributes?.eta || '15 mins',
            instamart: session.marketplaceAttributes?.instamartStoreAttributes?.eta || '10 mins',
        }[priceOption.platform ?? ''] || 'N/A';

    const displayWeight = priceOption.weight || productWeight || 'N/A';

    return (
        <TouchableOpacity
            onPress={() => handleDeepLink(priceOption.deeplink ?? '')}
            style={styles.priceOptionContainer}
        >
            <View style={styles.rowBetween}>
                <View style={styles.leftRow}>
                    <Text style={styles.priceText}>₹{priceOption.price}</Text>

                    {priceOption.platform === 'zepto' && (
                        <Image
                            source={require('@/assets/images/zepto.svg')}
                            style={styles.platformImage}
                        />
                    )}
                    {priceOption.platform === 'blinkit' && (
                        <Image
                            source={require('@/assets/images/blinkit.png')}
                            style={styles.platformImageBlinkit}
                        />
                    )}
                    {priceOption.platform === 'instamart' && (
                        <Image
                            source={require('@/assets/images/swiggy_instamart.webp')}
                            style={styles.platformImage}
                        />
                    )}

                    <View style={styles.tagSmall}>
                        <Text style={styles.tagTextSmall}>{displayWeight}</Text>
                    </View>
                </View>

                <View style={styles.rightRow}>
                    <ThreeQuarterCircle />
                    <Text style={styles.deliveryText}>{eta}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    priceOptionContainer: {
        marginBottom: 7,
    },

    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    rightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
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
        padding: 12,
        height: width > 768 ? 180 : 130,
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
});

export default ProductCard;
