import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Header from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import PriceSection from '../components/PriceSection';
import CategoriesSection from '../components/CategoriesSection';
import { fetchAndConvertProducts, initiateSessionForUser } from '@/api/searchProducts';
import { getItem } from '@/api/localStorage';
import { Session } from '@/types/Session';
import { Product } from '@/types/Product';

const HomeScreen = () => {
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [products, setProducts] = useState<Product[]>([])
    const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
    const [session, setSession] = useState<Session>()
    
    useEffect(() => {
      getItem("session").then((val) => {
        console.log("localSt", session)
        if(val != null) setSession(val)
      }).catch(err => console.log("Could not find session", err))
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });

            initiateSessionForUser(position.coords.latitude, position.coords.longitude).then((val: any) => {
              setSession(val)
              console.log("remote", val)
              //console.log("session", session)
            }).catch(err => {
              console.log("sess err", err)
            })
          },
          (error) => {
            console.error('Error obtaining location:', error);
          }
        );
      } else {
        console.error('Geolocation is not supported by this device.');
      }
    }, []);

    useEffect(() => {
      console.log("Updated session:", session);
    }, [session]);

    useEffect(() => {
      if (searchQuery.trim()) {
        setIsLoading(true);
        const timer = setTimeout(async () => {
          try {
            // Optionally, you can pass lat and lng if available.
            const result = await fetchAndConvertProducts(
              searchQuery,
              location.lat || undefined,
              location.lng || undefined
            );
            setProducts(result);
            console.log("Products", result)
          } catch (error) {
            console.error('Error fetching products:', error);
          } finally {
            setIsLoading(false);
          }
        }, 300); // 300ms debounce delay

        return () => clearTimeout(timer);
      } else {
        setProducts([]);
      }
    }, [searchQuery]);

    const handleSearch = (text: string) => {
      setSearchQuery(text)
      if (text.trim() === "") {
        setProducts([])
      }
    }
  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SearchBar value={searchQuery} onChangeText={handleSearch} placeholder="Search for groceries..." />
        <PriceSection session={session!} />
        <CategoriesSection />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004738',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fffaf0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default HomeScreen;