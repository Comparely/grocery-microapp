"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { SearchBar } from "../components/SearchBar"
import { ProductList } from "../components/ProductList"
import type { Product } from "../types/Product"
import { fetchAndConvertProducts, initiateSessionForUser } from "../api/searchProducts"
import { getItem } from "@/api/localStorage"
import { Session } from "@/types/Session"

export const GroceryComparisonScreen: React.FC = () => {
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
      <SearchBar onClick={() => {}} value={searchQuery} onChangeText={handleSearch} placeholder="Search for groceries..." />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <ProductList products={products} isLoading={isLoading} session={session!} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#004738",
    padding: 0,
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
    height: '100%',
  },
  scrollViewContent: {
    paddingBottom: 0,
    height: '100%',
  },
})

