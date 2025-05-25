import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import ThreeQuarterCircle from '../../components/timer';
import QuantitySelector from '../../components/QuantitySelector';

const ComparelyCart = () => {
    const router = useRouter();
    const [expandedIndex, setExpandedIndex] = useState<{ [key: number]: boolean }>({});

    const platforms = [
        {
            name: 'zepto',
            items: 2,
            price: 188,
            charges: 19,
            time: '12 mins',
            logo: require('@/assets/images/zepto.png'),
        },
        {
            name: 'swiggy instamart',
            items: 0,
            price: '54',
            charges: '26',
            time: '8 mins',
            logo: require('@/assets/images/instamart1.png'),
        },
        {
            name: 'bb now',
            items: 0,
            price: '43',
            charges: '90',
            time: '8 mins',
            logo: require('@/assets/images/bblogo.png'),
        },
    ];

    const toggleExpand = (index: number) => {
        setExpandedIndex((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
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
                {/* Blinkit Section */}
                <View style={styles.vendorBox}>
                    <View style={styles.vendorHeader}>
                        <View style={styles.vendorInfo}>
                            <Image
                                source={require('@/assets/images/blinkit.png')}
                                style={styles.vendorLogo}
                                resizeMode="contain"
                            />
                            <View style={styles.priceInfoContainer}>
                                <Text style={styles.itemCount}>{'0 Items'}</Text>
                                <Text style={styles.price}>{'₹28'}</Text>
                            </View>
                        </View>
                        <View style={styles.vendorMeta}>
                            <View style={styles.row}>
                                <Text style={styles.extraCharges}>{'Extra Charges ₹18'}</Text>
                            </View>
                            <View style={styles.row}>
                                <ThreeQuarterCircle />
                                <Text style={styles.deliveryTime}>{'8 mins'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => toggleExpand(0)}>
                            <Text style={styles.deliveryExpand}>
                                {expandedIndex[0] ? '˅' : '>'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {expandedIndex[0] && (
                        <>
                            <View style={styles.productCard}>
                                <Image
                                    source={require('@/assets/images/blinkit.png')}
                                    style={styles.productImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>
                                        {'Whole Farm Premium Parmal Rice'}
                                    </Text>
                                    <View style={styles.tagsRow}>
                                        <Text style={styles.tag}>{'1 kg'}</Text>
                                        <Text style={styles.tag}>{'Whole Farm'}</Text>
                                    </View>
                                    <Text style={styles.productPrice}>{'₹100'}</Text>
                                </View>
                                <QuantitySelector />
                            </View>

                            <View style={styles.productCard}>
                                <Image
                                    source={require('@/assets/images/blinkit.png')}
                                    style={styles.productImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>
                                        {'Daawat Basmati Rice - Rozana Super'}
                                    </Text>
                                    <View style={styles.tagsRow}>
                                        <Text style={styles.tag}>{'1 kg'}</Text>
                                        <Text style={styles.tag}>{'Daawat'}</Text>
                                    </View>
                                    <Text style={styles.productPrice}>{'₹100'}</Text>
                                </View>
                                <QuantitySelector />
                            </View>

                            <TouchableOpacity style={styles.openAppBtn}>
                                <Text style={styles.openAppText}>{'Open in Blinkit'}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Other  */}
                {platforms.map((p, idx) => {
                    const actualIndex = idx + 1;
                    return (
                        <View key={actualIndex} style={styles.vendorBox}>
                            <View style={styles.vendorHeader}>
                                <View style={styles.vendorInfo}>
                                    <Image
                                        source={p.logo}
                                        style={styles.vendorLogo}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.priceInfoContainer}>
                                        <Text style={styles.itemCount}>
                                            {p.items} {'Items'}
                                        </Text>
                                        <Text style={styles.price}>
                                            {'₹'}
                                            {p.price}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.vendorMeta}>
                                    <View style={styles.row}>
                                        <Text style={styles.extraCharges}>
                                            {'Extra Charges'}
                                            {'₹'}
                                            {p.charges}
                                        </Text>
                                    </View>
                                    <View style={styles.row}>
                                        <ThreeQuarterCircle />
                                        <Text style={styles.deliveryTime}>{p.time}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => toggleExpand(actualIndex)}>
                                    <Text style={styles.deliveryExpand2}>
                                        {expandedIndex[actualIndex] ? '˅' : '>'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {expandedIndex[actualIndex] && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={{ fontStyle: 'italic', color: '#555' }}>
                                        {'No products found'}
                                    </Text>
                                </View>
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
    deliveryExpand2: {
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
    qtyControl: {
        flexDirection: 'row',
        backgroundColor: '#004B2F',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        alignItems: 'center',
    },
    qtyBtn: {
        color: '#fff',
        fontSize: 16,
        marginHorizontal: 4,
    },
    qtyText: {
        color: '#fff',
        fontSize: 14,
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
