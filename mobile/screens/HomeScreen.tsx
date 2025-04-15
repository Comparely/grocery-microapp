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
import { LoadingProgress } from '@/components/Loaders';

const AARAV_NUMBER = '+918076078942';
// Gurugram coordinates
const GURUGRAM_COORDS = { lat: 28.4595, lng: 77.0266 };
const isWeb = Platform.OS === 'web';

const HomeScreen = () => {
  const [pageReady, setPageReady] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [session, setSession] = useState<Session | undefined>();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const router = useRouter();

  

  useEffect(() => {
    

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
      // Gurugram fallback function
      const fallbackToGurugram = () => {
        console.log("Falling back to Gurugram location");
        setLocationDenied(true);
        setLocation({ lat: GURUGRAM_COORDS.lat, lng: GURUGRAM_COORDS.lng });
        initiateSessionForUser(GURUGRAM_COORDS.lat, GURUGRAM_COORDS.lng)
          .then((val) => {
            setSession(val);
            setPageReady(true);
            console.log('Session initiated with fallback to Gurugram:', val);
          })
          .catch((err) => console.log('Session initiation error (fallback):', err));
      };

      // Handle successful location retrieval
      const handleLocationSuccess = (latitude: number, longitude: number) => {
        setLocationDenied(false);
        setLocation({ lat: latitude, lng: longitude });
        initiateSessionForUser(latitude, longitude)
          .then((val) => {
            setSession(val);
            setPageReady(true);
            console.log('Session initiated:', val);
          })
          .catch((err) => {
            console.log('Session initiation error:', err);
            fallbackToGurugram();
          });
      };

      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              handleLocationSuccess(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
              console.error('Web geolocation error:', error);
              fallbackToGurugram();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          console.error('Geolocation not supported on web');
          fallbackToGurugram();
        }
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          fallbackToGurugram();
          return;
        }

        try {
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          handleLocationSuccess(location.coords.latitude, location.coords.longitude);
        } catch (error) {
          console.error('Error getting location:', error);
          fallbackToGurugram();
        }
      }
    };

    initGeolocation();
  }, []);

  const requestLocationPermission = async () => {
    // Gurugram fallback function
    const fallbackToGurugram = () => {
      console.log("Falling back to Gurugram location on retry");
      setLocationDenied(false); // We don't show the permission screen anymore since we're using fallback
      setLocation({ lat: GURUGRAM_COORDS.lat, lng: GURUGRAM_COORDS.lng });
      initiateSessionForUser(GURUGRAM_COORDS.lat, GURUGRAM_COORDS.lng)
        .then((val) => {
          setSession(val);
          setPageReady(true);
          console.log('Session initiated with fallback on retry:', val);
        })
        .catch((err) => console.log('Session initiation error (fallback on retry):', err));
    };

    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationDenied(false);
            setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            initiateSessionForUser(position.coords.latitude, position.coords.longitude)
              .then((val) => {
                setSession(val);
                setPageReady(true);
              })
              .catch((err) => {
                console.log('Session initiation error on retry:', err);
                fallbackToGurugram();
              });
          },
          (error) => {
            console.error('Web geolocation retry error:', error);
            fallbackToGurugram();
          }
        );
      } else {
        fallbackToGurugram();
      }
    } else {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        fallbackToGurugram();
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocationDenied(false);
        setLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
        initiateSessionForUser(location.coords.latitude, location.coords.longitude)
          .then((val) => {
            setSession(val);
            setPageReady(true);
          })
          .catch((err) => {
            console.log('Session initiation error on retry:', err);
            fallbackToGurugram();
          });
      } catch (error) {
        console.error('Error retrying location:', error);
        fallbackToGurugram();
      }
    }
  };

  //  -------------------------------------------------WHATSAPP FIX------------------------------------------------------------
  const handleWhatsappRedirect = () => {
    const AARAV_NUMBER = '918076078942';
    const message = encodeURIComponent("Hi, I'm interested in Comparely!");

    const webUrl = `https://api.whatsapp.com/send?phone=${AARAV_NUMBER}&text=${message}`;

    if (Platform.OS === 'web') {
      try {
        window.open(webUrl, '_blank');
      } catch (error) {
        console.error("Error opening WhatsApp in web browser:", error);
        Alert.alert("Error", "Could not open WhatsApp. Please try again later.");
      }
    } else {
      Linking.openURL(webUrl)
        .catch(error => {
          console.error("Error opening WhatsApp:", error);
          Alert.alert(
            "Cannot Open WhatsApp",
            "Please make sure WhatsApp is installed or try again later."
          );
        });
    }
  };

  

  //------------------------------------Handel social media---------------------------------
  const handleSocialMediaRedirect = (platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin') => {
    // Define your social media URLs
    const socialMediaUrls: Record<string, string> = {
      instagram: 'https://www.instagram.com/comparelyy?igsh=Y2d5ODRkN2Y4MTh5&utm_source=qr',
      twitter: 'https://twitter.com',
      facebook: 'https://www.facebook.com',
      linkedin: 'https://www.linkedin.com'
    };

    // Validate platform before using it
    if (!socialMediaUrls[platform]) {
      console.error(`Invalid platform: ${platform}`);
      Alert.alert("Error", `Invalid platform selected: ${platform}.`);
      return;
    }

    const url = socialMediaUrls[platform];

    if (Platform.OS === 'web') {
      try {
        window.open(url, '_blank');
      } catch (error) {
        console.error(`Error opening ${platform}:`, error);
        Alert.alert("Error", `Could not open ${platform}. Please try again later.`);
      }
    } else {
      Linking.openURL(url).catch(error => {
        console.error(`Error opening ${platform}:`, error);
        Alert.alert("Cannot Open Link", `Please try opening ${platform} manually or try again later.`);
      });
    }
  };

  //----------------------------------------------------------------------------------------

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
        <TouchableOpacity
          style={[styles.retryButton, styles.secondaryButton]}
          onPress={() => requestLocationPermission()}
        >
          <Text style={styles.secondaryButtonText}>Continue with default location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!pageReady) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingProgress />
      </View>
    );
  }


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

        {/* -----------------------------app coming soon----------------------------------------------- */}
        
        {isWeb && (
          <View style={styles.appComingSoonContainer}>
            <Text style={styles.appComingSoonHeader}>
              App Coming Soon
            </Text>
            
            <View style={styles.appComingSoonContent}>
              <Text style={styles.appComingSoonDescription}>
                We're working hard to bring you the complete Comparely experience on mobile. Stay tuned for our app launch!
              </Text>
              
              <Text style={styles.followSocialsText}>
                Till then, follow our socials:
              </Text>
              
              <View style={styles.socialsContainer}>
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMediaRedirect('instagram')}>
                  <Ionicons name="logo-instagram" size={30} color="#004738" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMediaRedirect('twitter')}>
                  <Ionicons name="logo-twitter" size={30} color="#004738" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMediaRedirect('facebook')}>
                  <Ionicons name="logo-facebook" size={30} color="#004738" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMediaRedirect('linkedin')}>
                  <Ionicons name="logo-linkedin" size={30} color="#004738" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      <View style={[styles.floatingWhatsapp]}>
        <TouchableOpacity onPress={handleWhatsappRedirect}>
          <Ionicons name="logo-whatsapp" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  // -------------------------------------------APP COMMING SOON STYLE---------------------------------------------------
  appComingSoonContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appComingSoonHeader: {
    backgroundColor: '#004738',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 12,
  },
  appComingSoonContent: {
    padding: 20,
    alignItems: 'center',
  },
  appComingSoonDescription: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  followSocialsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004738',
    marginBottom: 15,
    textAlign: 'center',
  },
  socialsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  // --------------------------------------------------------------------------------------------------------------------
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
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#181b19',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#cbd402',
  },
  secondaryButtonText: {
    color: '#cbd402',
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
