import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import ThreeQuarterCircle from '../../components/timer';
import QuantitySelector from '../../components/QuantitySelector';
import { useCart } from '@/context/CartContext';
import { useWebViews } from '@/context/WebViewContext';
import {
    getNavigationScript,
    injectAddOrSubScript,
    injectCartSummaryScript,
} from '@/script/injectionScript_blinkit';
import {
    injectAddOrSubScript_zepto,
    injectCartSummaryScript_zepto,
} from '@/script/injectionScript_zepto';
import {
    injectAddOrSubScript_instamart,
    injectCartSummaryScript_instamart,
} from '@/script/injectionScript_instamart';

const platformLogos: Record<string, any> = {
    blinkit: require('@/assets/images/blinkit.png'),
    zepto: require('@/assets/images/zepto.png'),
    instamart: require('@/assets/images/instamart1.png'),
    bb: require('@/assets/images/instamart1.png'),
};

// const platformCartURLs: Record<string, string> = {
//     blinkit: 'https://blinkit.com/cart',
//     zepto: 'https://www.zeptonow.com/?cart=open',
//     instamart: 'https://www.swiggy.com/instamart/cart',
//     bb: 'https://www.bigbasket.com/basket/',
// };

// const platformExtraCharges: Record<string, number> = {
//     blinkit: 18,
//     zepto: 19,
//     instamart: 26,
//     'bb now': 90,
// };

const platformDeliveryTimes: Record<string, string> = {
    blinkit: '8',
    zepto: '13',
    instamart: '8',
    bb: '8',
};

const platformAddOrSubScript: Record<string, (action: 'add' | 'sub', index: number) => string> = {
    blinkit: injectAddOrSubScript,
    zepto: injectAddOrSubScript_zepto,
    instamart: injectAddOrSubScript_instamart,
};

const billScriptMap: Record<string, () => string> = {
    blinkit: injectCartSummaryScript,
    zepto: injectCartSummaryScript_zepto,
    instamart: injectCartSummaryScript_instamart,
};

const ComparelyCart = () => {
    const router = useRouter();
    const { cart, addToCartV2, grouped, removeFromCart } = useCart();
    const {
        blinkitWebViewRef,
        zeptoWebViewRef,
        instamartWebViewRef,
        billSummaries,
        visibleWebViews,
        setVisibleWebViews,
    } = useWebViews();
    const [expandedIndex, setExpandedIndex] = useState<{
        [key: string]: boolean;
    }>({});
    const [loadingPlatforms, setLoadingPlatforms] = useState<Record<string, boolean>>({
        blinkit: true,
        zepto: true,
        instamart: true,
    });

    const cartUrls = {
        blinkit: 'https://blinkit.com/cart',
        zepto: 'https://www.zeptonow.com/?cart=open',
        instamart: 'https://www.swiggy.com/instamart/cart',
        // bb: 'https://www.bb.in/gp/cart/view.html', // examplen
    } as const;
    const platformRefs = {
        blinkit: blinkitWebViewRef,
        zepto: zeptoWebViewRef,
        instamart: instamartWebViewRef,
        // add amazonWebViewRef if defined
    };

    useEffect(() => {
        Object.entries(cartUrls).forEach(([platform, url]) => {
            const navScript = getNavigationScript(url);
            platformRefs[platform].current?.injectScript(navScript);
        });
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const uniquePlatforms = Array.from(new Set(cart.map((item) => item.platform)));
            uniquePlatforms.forEach((platform) => {
                const ref = platformRefs[platform as keyof typeof platformRefs];
                const scriptGenerator = billScriptMap[platform];
                if (ref?.current && scriptGenerator) {
                    const script = scriptGenerator();
                    ref.current.injectScript(script);
                }

                // Update loading when bill summary is populated
                const summary = billSummaries[platform]?.['Bill details'];
                if (summary && summary.grandTotal > 0 && loadingPlatforms[platform]) {
                    setLoadingPlatforms((prev) => ({ ...prev, [platform]: false }));
                }
            });
        }, 100);

        return () => clearInterval(interval);
    }, [cart, billSummaries]);

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

    const openWebView = (platform: string) => {
        const ref = platformRefs[platform as keyof typeof platformRefs];
        ref.current?.injectScript(getNavigationScript(cartUrls[platform]));
        setVisibleWebViews((prev) => ({
            ...prev,
            [platform]: true,
        }));
        console.log(visibleWebViews);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerText}>{'Your Comparely Cart'}</Text>
            </View>

            <View style={styles.content}>
                {Object.keys(grouped).length === 0 && (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#555' }}>
                        {'Your cart is empty'}
                    </Text>
                )}

                {Object.entries(grouped).map(([platform, items]) => {
                    const totalPrice = getPlatformTotal(items);
                    const grandTotal =
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        billSummaries[platform]?.['Bill details']?.['grandTotal'] || 0;
                    const extraCharges = Math.max(grandTotal - totalPrice, 0);

                    const deliveryTime =
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        billSummaries[platform]?.['Bill details']?.['time'] ||
                        platformDeliveryTimes[platform] ||
                        '';
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
                                            {'Items'}
                                        </Text>
                                        {loadingPlatforms[platform] ? (
                                            <ActivityIndicator size="small" color="#004B2F" />
                                        ) : (
                                            <Text style={styles.price}>
                                                {'₹'}
                                                {grandTotal}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.vendorMeta}>
                                    <View style={styles.row}>
                                        <Text style={styles.extraCharges}>
                                            {'Extra Charges ₹'}
                                            {extraCharges}
                                        </Text>
                                    </View>
                                    <View style={styles.row}>
                                        <ThreeQuarterCircle />
                                        <Text style={styles.deliveryTime}>
                                            {deliveryTime + ' mins'}
                                        </Text>
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
                                    {items.map(({ product, quantity }, index) => {
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
                                                        {'₹'}
                                                        {price}
                                                    </Text>
                                                </View>
                                                {/* <QuantitySelector
                                                    quantity={quantity}
                                                    onChange={(newQty) => {
                                                        if (newQty > quantity) addToCart(product);
                                                        else {
                                                            removeFromCart(
                                                                product.id.toString(),
                                                                platform,
                                                            );
                                                        }
                                                    }}
                                                /> */}
                                                <QuantitySelector
                                                    quantity={quantity}
                                                    onChange={(newQty) => {
                                                        const action =
                                                            newQty > quantity ? 'add' : 'sub';

                                                        switch (platform) {
                                                            case 'blinkit':
                                                                blinkitWebViewRef.current?.injectScript(
                                                                    platformAddOrSubScript[
                                                                        platform
                                                                    ](action, index),
                                                                );
                                                                break;
                                                            case 'zepto':
                                                                zeptoWebViewRef.current?.injectScript(
                                                                    platformAddOrSubScript[
                                                                        platform
                                                                    ](action, index),
                                                                );
                                                                break;
                                                            case 'instamart':
                                                                instamartWebViewRef.current?.injectScript(
                                                                    platformAddOrSubScript[
                                                                        platform
                                                                    ](action, index),
                                                                );
                                                                break;
                                                        }
                                                        // Call addToCart or removeFromCart based on action
                                                        if (action === 'add') {
                                                            addToCartV2(product, platform);
                                                        } else {
                                                            removeFromCart(
                                                                product.id.toString(),
                                                                platform,
                                                            );
                                                        }
                                                    }}
                                                />
                                            </View>
                                        );
                                    })}

                                    <TouchableOpacity
                                        style={styles.openAppBtn}
                                        onPress={() => openWebView(platform)}>
                                        <Text style={styles.openAppText}>
                                            {'Open in '}
                                            {platform}
                                        </Text>
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
