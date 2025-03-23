import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
  Linking,
  TextInput,
  Alert,
  Animated
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import PriceSection from '../components/PriceSection';
import CategoriesSection from '../components/CategoriesSection';
import { initiateSessionForUser } from '@/api/searchProducts';
import { getItem } from '@/api/localStorage';
import { Session } from '@/types/Session';
import { fetchHomePageData } from '@/api/common';
import { Product } from '@/types/Product';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const AARAV_NUMBER = '+918076078942';

const HomeScreen = () => {
  const [pageReady, setPageReady] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [session, setSession] = useState<Session | undefined>();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const router = useRouter();

  const wiggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wiggleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();

    fetchHomePageData()
      .then((val) => {
        console.log('Fetched data:', val); // Debug log
        console.log('Categories set:', val[1])
        setCategories(val[1] || []);
        setFeaturedProducts(val[0] || []);
      })
      .catch((err) => console.log('Error fetching homepage data:', err));

    getItem('session')
      .then((val) => {
        if (val) setSession(val);
      })
      .catch((err) => console.log('Could not find session:', err));

    const initGeolocation = async () => {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
              initiateSessionForUser(position.coords.latitude, position.coords.longitude)
                .then((val) => {
                  setSession(val);
                  setPageReady(true);
                  console.log('Session initiated:', val);
                })
                .catch((err) => console.log('Session initiation error:', err));
            },
            (error) => {
              console.error('Web geolocation error:', error);
              setLocationDenied(true);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          console.error('Geolocation not supported on web');
          setLocationDenied(true);
        }
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          setLocationDenied(true);
          return;
        }

        try {
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
          initiateSessionForUser(location.coords.latitude, location.coords.longitude)
            .then((val) => {
              setSession(val);
              setPageReady(true);
              console.log('Session initiated:', val);
            })
            .catch((err) => console.log('Session initiation error:', err));
        } catch (error) {
          console.error('Error getting location:', error);
          setLocationDenied(true);
        }
      }
    };

    initGeolocation();
  }, [wiggleAnim]);

  const requestLocationPermission = async () => {
    setLocationDenied(false);
    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            initiateSessionForUser(position.coords.latitude, position.coords.longitude)
              .then((val) => {
                setSession(val);
                setPageReady(true);
              });
          },
          (error) => {
            console.error('Web geolocation retry error:', error);
            setLocationDenied(true);
          }
        );
      } else {
        setLocationDenied(true);
      }
    } else {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
        initiateSessionForUser(location.coords.latitude, location.coords.longitude)
          .then((val) => {
            setSession(val);
            setPageReady(true);
          });
      } catch (error) {
        console.error('Error retrying location:', error);
        setLocationDenied(true);
      }
    }
  };

  const handleSearch = () => {
    router.push('/search');
  };

  const handleWhatsappRedirect = async () => {
    const url = `whatsapp://send?phone=${AARAV_NUMBER}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert("WhatsApp is not installed on your device.");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
    }
  };

  const handleWaitlistSubmit = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    Alert.alert("Thank you!", "You've been added to our waitlist.");
    setEmail('');
  };

  if (locationDenied) {
    return (
      <View style={styles.deniedContainer}>
        <Ionicons name="location-outline" size={50} color="#fff" />
        <Text style={styles.deniedText}>
          Comparely needs access to your location to work properly.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestLocationPermission}>
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!pageReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Comparely...</Text>
      </View>
    );
  }

  const rotate = wiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <View style={styles.container}>
      <Header session={session!} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {session && featuredProducts.length > 0 ? (
          <PriceSection session={session} products={featuredProducts} />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No featured products available.</Text>
          </View>
        )}
        {categories.length > 0 ? (
          <CategoriesSection categories={categories} />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No categories available.</Text>
          </View>
        )}

        <View style={styles.waitlistContainer}>
          <Text style={styles.waitlistHeader}>
            We're Launching Soon!
          </Text>
          <Text style={styles.waitlistSubText}>
            Enter your email below to join our waitlist and get early access.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Your email address"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.waitlistSubmitButton} onPress={handleWaitlistSubmit}>
            <Text style={styles.waitlistSubmitButtonText}>Submit</Text>
          </TouchableOpacity>
          <Text style={styles.appComingSoonText}>
            Our app is coming soon!
          </Text>
          <View style={styles.storeIconsContainer}>
            <View style={styles.storeIconWrapper}>
              <Ionicons name="logo-google-playstore" size={40} color="#9d9d9d" />
            </View>
            <View style={styles.storeIconWrapper}>
              <Ionicons name="logo-apple-appstore" size={40} color="#9d9d9d" />
            </View>
          </View>
        </View>
      </ScrollView>

      <Animated.View style={[styles.floatingWhatsapp, { transform: [{ rotate }] }]}>
        <TouchableOpacity onPress={handleWhatsappRedirect}>
          <Ionicons name="logo-whatsapp" size={40} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
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
  scrollContent: {
    paddingBottom: 20,
  },
  deniedContainer: {
    flex: 1,
    backgroundColor: '#004738',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deniedText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#cbd402',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#181b19',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#004738',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  emptySection: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9d9d9d',
    fontSize: 16,
    textAlign: 'center',
  },
  waitlistContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#fffaf0',
    borderRadius: 10,
    alignItems: 'center',
  },
  waitlistHeader: {
    fontSize: 24,
    color: '#004738',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  waitlistSubText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  waitlistSubmitButton: {
    backgroundColor: '#cbd402',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  waitlistSubmitButtonText: {
    color: '#181b19',
    fontSize: 18,
    fontWeight: '600',
  },
  appComingSoonText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
  },
  storeIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeIconWrapper: {
    marginHorizontal: 10,
    opacity: 0.5,
  },
  floatingWhatsapp: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#25D366',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
  },
});

export default HomeScreen;