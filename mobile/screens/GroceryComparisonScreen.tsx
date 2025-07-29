'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView, Keyboard, TouchableOpacity, Text } from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { ProductList } from '../components/ProductList';
import { Product } from '../types/Product';
import { fetchAndConvertProducts } from '../api/searchProducts';
import Navbar from '@/components/Navbar';
import { useSession } from '@/context/SessionContext';
import { FlatList } from 'react-native-gesture-handler';
import { AntDesign } from '@expo/vector-icons';
import FeaturedProductsSection from '@/components/FeatureProducts';

export const GroceryComparisonScreen: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const { session, location } = useSession();
    const suggestionSelectedRef = useRef<boolean>(false);

    // const debounce = useCallback((func: (...args: any[]) => void, delay: number) => {
    //     let timeoutId: NodeJS.Timeout;
    //     const debounced = (...args: any[]) => {
    //         clearTimeout(timeoutId);
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    //         timeoutId = setTimeout(() => func(...args), delay);
    //     };
    //     debounced.cancel = () => clearTimeout(timeoutId);
    //     return debounced;
    // }, []);

    // const fetchSuggestions = useCallback(
    //   async (query: string) => {
    //     if (!query.trim() || suggestionSelectedRef.current) {
    //       setSuggestions([]);
    //       return;
    //     }
    //     try {
    //       const suggestionResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}suggestions`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //           query,
    //           deviceID: session?.deviceID?.replace(/"/g, '') || '',
    //         }),
    //       });
    //       const suggestionData = await suggestionResponse.json();
    //       console.log('Suggestions Response:', suggestionData);
    //       setSuggestions(suggestionData.suggestions || []);
    //     } catch (error) {
    //       console.error('Error fetching suggestions:', error);
    //     }
    //   },
    //   [session]
    // );

    const fetchProducts = useCallback(
        async () => {
            if (!searchQuery.trim()) {
                setProducts([]);
                return;
            }
            setIsLoading(true);
            try {
                const result = await fetchAndConvertProducts(
                    searchQuery,
                    location.lat || undefined,
                    location.lng || undefined,
                );
                setProducts(result);
                console.log('Products:', result);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [searchQuery],
    );

    // const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    // const debouncedFetchProducts = useCallback(debounce(fetchProducts, 300), [fetchProducts]);

    // useEffect(() => {
    //     if (searchQuery /* && !suggestionSelectedRef.current */) {
    //         // debouncedFetchSuggestions(searchQuery);
    //         debouncedFetchProducts(searchQuery);
    //     }
    // }, [searchQuery, /* debouncedFetchSuggestions, */ debouncedFetchProducts]);

    const handleSearch = (text: string) => {
        // suggestionSelectedRef.current = false;
        setSearchQuery(text);
    };

    const handleSuggestionSelect = (suggestion: string) => {
        suggestionSelectedRef.current = true;
        setSearchQuery(suggestion);
        setSuggestions([]);
        void fetchProducts();
    };

    // Handle search submission (e.g., pressing Enter or the keyboard's search button)
    const handleSubmit = () => {
        setSuggestions([]);
        void fetchProducts(); // Fetch products immediately
    };

    // Handle when the search input loses focus
    const handleBlur = () => {
        // setSuggestions([]); // No need to clear suggestions since they’re commented out
    };

    return (
        <View style={styles.container}>
            <Navbar title='Comparely' />
            {!isLoading && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchRow}>
                        <View style={styles.searchBarWrapper}>
                            <SearchBar
                                // onClick={() => { }}
                                value={searchQuery}
                                onChangeText={handleSearch}
                                placeholder={`Search for "ice-cream"`}
                                editable={true}
                                onBlur={handleBlur}
                                isSearch={false}
                                onSubmitEditing={handleSubmit}
                            />
                        </View>
                    </View>

                    {suggestions.length > 0 && (
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleSuggestionSelect(item)}
                                    style={styles.suggestionItem}>
                                    <Text style={styles.suggestionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            style={styles.suggestionList}
                        />
                    )}
                </View>
            )}

            <ScrollView
                onTouchStart={() => Keyboard.dismiss()}
                onScroll={handleBlur}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}>
                <ProductList products={products} isLoading={isLoading} session={session!} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004738',
        padding: 0,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        position: 'relative',
        zIndex: 2000,
    },

    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    searchBarWrapper: {
        flex: 1,
        marginRight: 8,
    },

    scrollView: {
        flex: 1,
        marginTop: 12,
        borderRadius: 24,
        zIndex: 1000,
    },
    scrollViewContent: {
        paddingBottom: 0,
    },
    cartWrapper: {
        zIndex: 10000,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderColor: '#eee',
    },
    suggestionList: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 2500,
    },
    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 16,
        color: '#181b19',
    },
});

export default GroceryComparisonScreen;
