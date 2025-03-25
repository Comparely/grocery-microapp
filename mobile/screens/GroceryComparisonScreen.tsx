"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  FlatList,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { ProductList } from '../components/ProductList';
import { Product } from '../types/Product';
import { fetchAndConvertProducts, initiateSessionForUser } from '../api/searchProducts';
import { getItem } from '@/api/localStorage';
import { Session } from '@/types/Session';
import Navbar from '@/components/Navbar';

export const GroceryComparisonScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [session, setSession] = useState<Session | undefined>();
  const suggestionSelectedRef = useRef<boolean>(false);
  const isSuggestionClickedRef = useRef<boolean>(false);
  const searchBarRef = useRef<TextInput>(null);

  const debounce = useCallback((func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    const debounced = (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timeoutId);
    return debounced;
  }, []);

  useEffect(() => {
    getItem('session')
      .then((val) => {
        if (val) {
          console.log('Local Storage Session:', val);
          setSession(val);
        }
      })
      .catch((err) => console.log('Could not find session', err));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          initiateSessionForUser(latitude, longitude)
            .then((val: any) => {
              setSession(val);
              console.log('Remote Session:', val);
            })
            .catch((err) => console.log('Session Error:', err));
        },
        (error) => console.error('Error obtaining location:', error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      console.error('Geolocation not supported.');
    }
  }, []);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim() || suggestionSelectedRef.current) {
        setSuggestions([]);
        return;
      }
      try {
        const suggestionResponse = await fetch('http://localhost:4500/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            deviceID: session?.deviceID?.replace(/"/g, '') || '',
          }),
        });
        const suggestionData = await suggestionResponse.json();
        console.log('Suggestions Response:', suggestionData);
        setSuggestions(suggestionData.suggestions || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    },
    [session]
  );

  const fetchProducts = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setProducts([]);
        return;
      }
      setIsLoading(true);
      try {
        const result = await fetchAndConvertProducts(
          query,
          location.lat || undefined,
          location.lng || undefined
        );
        setProducts(result);
        console.log('Products:', result);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [location]
  );

  // Debounce suggestions (fast, 300ms)
  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 100), [fetchSuggestions]);

  // Debounce products (slower, 1500ms)
  const debouncedFetchProducts = useCallback(debounce(fetchProducts, 1000), [fetchProducts]);

  useEffect(() => {
    if (searchQuery && !suggestionSelectedRef.current) {
      debouncedFetchSuggestions(searchQuery); // Fetch suggestions quickly
      debouncedFetchProducts(searchQuery); // Fetch products with delay
    } else {
      debouncedFetchSuggestions.cancel();
      debouncedFetchProducts.cancel();
      setSuggestions([]);
      setProducts([]);
    }
  }, [searchQuery, debouncedFetchSuggestions, debouncedFetchProducts]);

  const handleSearch = (text: string) => {
    suggestionSelectedRef.current = false;
    setSearchQuery(text);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    isSuggestionClickedRef.current = true;
    suggestionSelectedRef.current = true;
    setSearchQuery(suggestion);
    setSuggestions([]); // Clear suggestions immediately
    debouncedFetchProducts.cancel(); // Cancel any pending product fetch
    fetchProducts(suggestion); // Fetch products immediately
  };

  const handleSubmit = () => {
    setSuggestions([]);
    debouncedFetchProducts.cancel(); // Cancel debounce
    fetchProducts(searchQuery); // Fetch immediately on submit
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!isSuggestionClickedRef.current) {
        setSuggestions([]);
      }
      isSuggestionClickedRef.current = false;
    }, 200);
  };

  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.searchContainer}>
        <SearchBar
          ref={searchBarRef}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search for groceries..."
          editable={true}
          onSubmitEditing={handleSubmit}
          onBlur={handleBlur}
        />
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSuggestionSelect(item)}
                style={styles.suggestionItem}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
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
  scrollView: {
    flex: 1,
    marginTop: 16,
    zIndex: 1000,
  },
  scrollViewContent: {
    paddingBottom: 0,
  },
  suggestionList: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
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