import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchBar } from './SearchBar';
import { Session } from '@/types/Session';
import { Text } from '@/ui/Text';

interface HeaderProps {
    session: Session | undefined;
}

const Header: React.FC<HeaderProps> = ({ session }) => {
    const router = useRouter();
    const [storedLocation, setStoredLocation] = useState<string | null>(null);

    // Reload location every time screen is focused
    useFocusEffect(
        useCallback(() => {
            const loadLocation = async () => {
                try {
                    const saved = await AsyncStorage.getItem('selected_location');
                    if (saved) {
                        setStoredLocation(saved);
                    }
                } catch (e) {
                    console.error('Failed to load location', e);
                }
            };
            void loadLocation();
        }, []),
    );

    const findLeastTimeStore = () => {
        const blinkitETA = parseFloat(
            session?.marketplaceAttributes.blinkitStoreAttributes.eta ?? '',
        );
        const zeptoETA = parseFloat(session?.marketplaceAttributes.zeptoStoreAttributes.eta ?? '');
        const instamartETA = parseFloat(
            session?.marketplaceAttributes.instamartStoreAttributes.eta ?? '',
        );

        const validNumbers = [blinkitETA, zeptoETA, instamartETA].filter(
            (num) => !Number.isNaN(num),
        );
        const least = validNumbers.length ? Math.min(...validNumbers) : NaN;
        let leastStoreName = '';
        if (least === blinkitETA) leastStoreName = 'blinkit';
        if (least === zeptoETA) leastStoreName = 'zepto';
        if (least === instamartETA) leastStoreName = 'instamart';
        return [least, leastStoreName];
    };

    function trimIfNeeded(str: string) {
        const maxLength = 28;
        if (str.length > maxLength) {
            return str.substring(0, maxLength) + '...';
        }
        if (str.length < 1) return undefined;
        return str;
    }

    const findBgColor = (storeName: string): string => {
        if (storeName === 'instamart') return '#fff';
        if (storeName === 'blinkit') return '#cbd402';
        if (storeName === 'zepto') return '#cbd402';
        return '#cbd402';
    };

    const handleSearchPress = () => {
        router.push('/search');
    };

    const handleLocationPress = () => {
        //router.push('/location-picker');
    };

    return (
        <View style={styles.container}>
            <View style={styles.container2}>
                <TouchableOpacity style={styles.locationButton} onPress={handleLocationPress}>
                    <Ionicons name="location" size={24} color="#cbd402" />
                    <View style={styles.locationInfo}>
                        <View style={styles.row}>
                            <Text style={styles.locationText}>{'Deliver to'}</Text>
                            <Ionicons
                                name="chevron-down"
                                size={20}
                                color="white"
                                style={{ marginLeft: 4 }}
                            />
                        </View>

                        <Text style={styles.addressText}>
                            {trimIfNeeded(
                                storedLocation ?? session?.address ?? 'Tap to set location',
                            )}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* <Image
                    source={require('../assets/images/comparely-yellow.png')}
                    style={styles.brandImage}
                    resizeMode="contain"
                /> */}
            </View>

            {/* {session && (
                <View style={styles.rightContainer}>
                    <View
                        style={[
                            styles.timeContainer,
                            { backgroundColor: findBgColor(String(findLeastTimeStore()[1])) },
                        ]}>
                        <Ionicons name="flash" size={18} color="#000000" />
                        <Text style={styles.timeText}>{findLeastTimeStore()[0] + ' mins'}</Text>
                        <View style={styles.blinkitBadge}>
                            {findLeastTimeStore()[1] === 'blinkit' && (
                                <Image
                                    style={{ width: 28, height: 28 }}
                                    source={require('@/assets/images/blinkit.png')}
                                />
                            )}
                            {findLeastTimeStore()[1] === 'zepto' && (
                                <Image
                                    style={{ height: 28, width: 42 }}
                                    source={require('@/assets/images/zepto.png')}
                                />
                            )}
                            {findLeastTimeStore()[1] === 'instamart' && (
                                <Image
                                    style={{ width: 72, height: 28 }}
                                    source={require('@/assets/images/swiggy_instamart.webp')}
                                />
                            )}
                        </View>
                    </View>
                </View>
            )} */}

            <View style={styles.searchContainer}>
                <SearchBar
                    onClick={handleSearchPress}
                    value=""
                    isSearch={true}
                    onChangeText={() => {}}
                    placeholder="Search for groceries..."
                    editable={false}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: '#004738',
    },
    container2: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 3,
        marginBottom: 5,
    },
    locationInfo: {
        marginLeft: 2,
        marginTop: 4,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // brandImage: {
    //     width: 40, // adjust as needed
    //     height: 40, // adjust as needed
    //     marginRight: 20,
    // },

    locationText: {
        color: 'white',
        fontSize: 14,
    },

    addressText: {
        color: 'white',
        fontSize: 14,
        marginTop: 4, // small spacing between lines
    },
    rightContainer: {
        position: 'absolute',
        flexDirection: 'row',
        columnGap: 7,
        top: 15,
        right: 20,
        alignItems: 'flex-end',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        marginLeft: 5,
    },
    blinkitBadge: {
        marginLeft: 5,
    },
    searchContainer: {
        marginTop: 10,
        paddingHorizontal: 20,
    },
});

export default Header;
