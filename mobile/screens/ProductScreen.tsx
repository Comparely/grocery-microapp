import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
import type { Product } from '@/types/Product';
import { Dimensions } from 'react-native';
import ThreeQuarterCircle from '@/components/timer';
import Navbar from '@/components/Navbar';
// import QuantitySelector from '@/components/QuantitySelector';
import { openInAppBrowser } from '@/utils/openInAppBrowser';
const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const router = useRouter();
    const { product } = useLocalSearchParams();
    const productData: Product = JSON.parse(product as string);

    const handleDeepLink = async (url: string) => {
        if (await Linking.canOpenURL(url)) {
            // Linking.openURL(url);
            void openInAppBrowser(url);
        }
    };

    const getBadge = (platform?: string) => {
        const cheapest = productData.priceOptions.reduce((min, curr) =>
            (curr.price ?? 0) < (min.price ?? 0) ? curr : min,
        );
        const fastest = productData.priceOptions.reduce((min, curr) =>
            (curr.deliveryTime ?? 0) < (min.deliveryTime ?? 0) ? curr : min,
        );

        if (platform === cheapest.platform) return 'Cheapest';
        if (platform === fastest.platform) return 'Fastest';
        return '';
    };

    const getBrandImage = (platform?: string) => {
        switch ((platform ?? '').toLowerCase()) {
            case 'zepto':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/zepto.png');
            case 'blinkit':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/blinkit.png');
            case 'swiggy':
            case 'instamart':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/instamart1.png');
            case 'bigbasket':
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return require('@/assets/images/bbnow.webp');
            default:
                return null;
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Navbar />

            <View style={styles.imageWrapper}>
                <Image source={{ uri: productData.imageUrl }} style={styles.image} />
            </View>

            <View style={styles.info}>
                <View style={styles.tagRow}>
                    <Text style={styles.tag}>{productData.weight}</Text>
                    <Text style={styles.tag}>{productData.brand}</Text>
                </View>
                <Text style={styles.mrp}>
                    {'MRP ₹'}
                    {productData.mrp}
                </Text>
                <Text style={styles.name}>{productData.name}</Text>

                <View style={styles.cardGrid}>
                    {productData.priceOptions.map((option) => {
                        const brandImage = getBrandImage(option.platform);
                        const badge = getBadge(option.platform); // Get badge value

                        return (
                            <TouchableOpacity
                                key={option.platform}
                                style={styles.card}
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onPress={() => handleDeepLink(option.deeplink || '')}>
                                <View>
                                    <View>
                                        {brandImage && (
                                            <Image source={brandImage} style={styles.logo} />
                                        )}
                                    </View>
                                    <View style={{ margin: 5 }}>
                                        <Text style={styles.price}>
                                            {'₹'}
                                            {option.price}
                                        </Text>
                                        <View style={styles.timerRow}>
                                            <ThreeQuarterCircle />
                                            <Text style={styles.timeText}>{'10 mins'}</Text>
                                        </View>
                                        {/* <QuantitySelector /> */}
                                    </View>
                                </View>
                                {badge && <Text style={styles.badge}>{badge}</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fefce8',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#064e3b',
    },

    imageWrapper: {
        backgroundColor: '#fefce8',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 16,
    },

    image: {
        width: width * 0.9,
        height: width * 0.9,
        marginTop: 20,
        marginBottom: 20,
        marginHorizontal: 10,
        borderRadius: 20,
        resizeMode: 'contain',
        alignSelf: 'center',
    },

    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },

    card: {
        backgroundColor: '#FFF1D6',
        borderRadius: 13,
        paddingTop: 12,
        marginBottom: 14,
        borderWidth: 2,
        borderColor: '#CBD402',
        width: '48%',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },

    info: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },

    tagRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
        flexWrap: 'wrap',
    },

    tag: {
        backgroundColor: '#FDE5B6',
        color: 'black',
        paddingHorizontal: 15,
        paddingVertical: 7,
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 'bold',
    },

    mrp: {
        fontSize: 14,
        color: 'rgba(157, 157, 157, 1)',
        fontWeight: 'bold',
        marginBottom: 2,
    },

    name: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#1f2937',
        marginBottom: 16,
    },

    left: {
        flexDirection: 'column',
        gap: 10,
        flexShrink: 1,
    },

    logo: {
        width: 60,
        marginLeft: 5,
        height: 35,
        resizeMode: 'contain',
    },

    price: {
        fontSize: 16,
        fontWeight: '700',
    },

    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingBottom: 4,
    },

    timeText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: 'bold',
    },

    badge: {
        backgroundColor: '#CBD402',
        paddingHorizontal: 10,
        fontSize: 14,
        borderRadius: 6,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        fontWeight: 'bold',
        color: '#004738',
        textTransform: 'capitalize',
        textAlign: 'center',
        alignSelf: 'stretch',
    },
});
