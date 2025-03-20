import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Header from '../components/Header';
import PriceSection from '../components/PriceSection';
import CategoriesSection from '../components/CategoriesSection';
import { initiateSessionForUser } from '@/api/searchProducts';
import { getItem } from '@/api/localStorage';
import { Session } from '@/types/Session';
import { fetchHomePageData } from '@/api/common';
import { Product } from '@/types/Product';

const HomeScreen = () => {
  const [pageReady, setPageReady] = useState<boolean>(false)
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [session, setSession] = useState<Session>()
  const [categories, setCategories] = useState<any>()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>()

  useEffect(() => {
    fetchHomePageData().then(val => {
      setCategories(val[1])
      setFeaturedProducts(val[0])
    }).catch(err => console.log(err))

    getItem("session").then((val) => {
      console.log("localSt", session)
      if(val != null) setSession(val)
    }).catch(err => console.log("Could not find session", err))
    try{
      setSession(JSON.parse(localStorage.getItem("session")!))
    }catch(err){
      console.log("nil sess")
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });

          initiateSessionForUser(position.coords.latitude, position.coords.longitude).then((val: any) => {
            setSession(val)
            setPageReady(true)
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
    
  return (
    <>
    {pageReady &&
      <View style={styles.container}>
        <Header session={session!} />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {session != undefined && featuredProducts != undefined && <PriceSection session={session} products={featuredProducts} />}
          {categories != undefined && <CategoriesSection categories={categories} />}
        </ScrollView>
      </View>
    }
    </>
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