import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    FlatList,
    Text as RNText,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/ui/Text';
import { useSession } from '@/context/SessionContext';
import Navbar from '@/components/Navbar';
import Head from 'expo-router/head';

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}place`;

type PlaceResult = {
    address: string;
    lat: number;
    lng: number;
};

const LocationPicker = () => {
    const [input, setInput] = useState('');
    const [location, setLocation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
    const router = useRouter();
    const { manualLocationUpdate } = useSession();

    const fetchCoordinatesFromSearch = async (query: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}?query=${encodeURIComponent(query)}`);
            const data: PlaceResult[] = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                Alert.alert('No results', 'No matching locations found.');
                setSearchResults([]);
                return;
            }

            setSearchResults(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch location data.');
            console.error('Fetch error:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLocation = async (location: PlaceResult) => {
        try {
            await AsyncStorage.setItem('selected_location', location.address);
            manualLocationUpdate(location.lat, location.lng);
            router.back();
        } catch (e) {
            console.error('Failed to save location:', e);
            Alert.alert('Error', 'Failed to save location.');
        }
    };

    useEffect(() => {
        void (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                const loc = await Location.getCurrentPositionAsync({});
                const reverseGeocoded = await Location.reverseGeocodeAsync(loc.coords);
                if (reverseGeocoded.length > 0) {
                    const address = reverseGeocoded[0];
                    const formatted = `${address.name}, ${address.street}, ${address.city}`;
                    setLocation(formatted);
                }
            } catch (error) {
                console.warn('Location fetch failed:', error);
            }
        })();
    }, []);

    const selectLocationScreen = (
        <View style={styles.container}>
            <Navbar title='Select Location' />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#aaa" />
                    <TextInput
                        style={styles.input}
                        value={input}
                        placeholder="Search Indian location..."
                        onChangeText={(text) => {
                            setInput(text);
                            if (text.length > 3) {
                                void fetchCoordinatesFromSearch(text);
                            } else {
                                setSearchResults([]);
                            }
                        }}
                    />
                </View>

                <View style={styles.emptyContainer}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#000" style={{ marginBottom: 20 }} />
                    ) : searchResults.length > 0 ? (
                        <FlatList
                            style={{ width: '100%' }}
                            data={searchResults}
                            keyExtractor={(item, idx) => item.address + idx}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        void handleSelectLocation(item);
                                    }}
                                    style={styles.resultItem}>
                                    <RNText style={styles.resultText}>{item.address}</RNText>
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <Text style={styles.emptyText}>{'Search Location to see results'}</Text>
                    )}
                </View>

                {location && searchResults.length === 0 && (
                    <Text style={styles.locationPreview}>
                        {'📍'} {location}
                    </Text>
                )}
            </KeyboardAvoidingView>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#004738" />
            {Platform.OS === 'web' && (
                <Head>
                    <title>{'Select Location'}</title>
                </Head>
            )}
            { selectLocationScreen }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004738',
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 15,
        position: 'relative',
        height: 40,
    },
    backButton: {
        zIndex: 2,
    },
    title: {
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 12,
        marginBottom: 10,
    },
    input: {
        marginLeft: 10,
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: '#fffaf0',
        borderRadius: 24,
        padding: 16,
        margin: 16,
        justifyContent: 'flex-start',
        alignItems: 'center',
        minHeight: 700,
        width: '99%',
        alignSelf: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: 'black',
        textAlign: 'center',
        marginTop: 20,
    },
    locationPreview: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    resultItem: {
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 8,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
        width: '100%',
    },
    resultText: {
        color: '#000',
        fontSize: 14,
    },
});

export default LocationPicker;
