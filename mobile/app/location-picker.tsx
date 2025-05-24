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
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/ui/Text';

const API_BASE_URL = 'http://192.168.0.215:4500';

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

    const fetchCoordinatesFromSearch = async (query: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/place?query=${encodeURIComponent(query)}`);
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

    const handleSelectLocation = async (address: string) => {
        try {
            await AsyncStorage.setItem('selected_location', address);
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

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Text style={styles.title}>{'Set Your Delivery Location'}</Text>

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

            {loading && (
                <ActivityIndicator size="small" color="#fff" style={{ marginBottom: 20 }} />
            )}

            {searchResults.length > 0 && (
                <FlatList
                    style={{ maxHeight: 200, marginBottom: 20 }}
                    data={searchResults}
                    keyExtractor={(item, idx) => item.address + idx}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
                                void handleSelectLocation(item.address);
                            }}
                            style={styles.resultItem}>
                            <RNText style={styles.resultText}>{item.address}</RNText>
                        </TouchableOpacity>
                    )}
                />
            )}

            {location && searchResults.length === 0 && (
                <Text style={styles.locationPreview}>
                    {'📍'} {location}
                </Text>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004738',
        padding: 20,
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
        justifyContent: 'center',
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
    locationPreview: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    resultItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
        borderRadius: 5,
    },
    resultText: {
        color: '#000',
    },
});

export default LocationPicker;
