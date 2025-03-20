"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, FlatList, Text, TouchableOpacity } from 'react-native';
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
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [session, setSession] = useState<Session | undefined>();

  // Debounce function
  const debounce = useCallback((func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  // Initialize session and location
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

  // Fetch suggestions and products
  const fetchData = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setProducts([]);
        setSuggestions([]);
        setIsLoading(false);
        return;
      }
  
      setIsLoading(true);
      try {
        const suggestionResponse = await fetch('http://192.168.1.36:4500/suggestions', {
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
  
        const result = await fetchAndConvertProducts(query, location.lat || undefined, location.lng || undefined);
        setProducts(result);
        console.log('Products:', result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [session, location]
  );

  useEffect(() => {
    fetchData(searchQuery);
  }, [searchQuery, fetchData]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.searchContainer}>
        <SearchBar
          onClick={() => {}}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search for groceries..."
          editable={true}
        />
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSuggestionSelect(item)}
                style={styles.suggestionItem}
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
    zIndex: 2000, // Increase zIndex to ensure it stays above scrollView
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
    zIndex: 1000, // Lower zIndex than searchContainer
  },
  scrollViewContent: {
    paddingBottom: 0,
  },
  suggestionList: {
    position: 'absolute',
    top: 60, // Position below SearchBar
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
    zIndex: 2500, // Higher zIndex than parent to ensure visibility
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