import { PriceOption, Product } from '../types/Product';
import { setItem } from './localStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@/types/Session';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

// Use expo-crypto's randomUUID for mobile, fallback to uuid v4 for web if needed
const generateUUID = () => {
  if (Platform.OS === 'web') {
    // Web can use the native crypto API or a uuid library if preferred
    return crypto.randomUUID ? crypto.randomUUID() : uuidv4Fallback();
  } else {
    return Crypto.randomUUID(); // Expo Crypto for mobile
  }
};

// Fallback UUID generator for web if crypto.randomUUID isn’t available (rare cases)
const uuidv4Fallback = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper function to get storage based on platform
const getStorage = () => (Platform.OS === 'web' ? localStorage : AsyncStorage);

// Helper function to handle storage getItem
const getItemAsync = async (key: string): Promise<string | null> => {
  const storage = getStorage();
  if (Platform.OS === 'web') {
    return storage.getItem(key);
  } else {
    return await storage.getItem(key);
  }
};

// Helper function to handle storage setItem
const setItemAsync = async (key: string, value: string): Promise<void> => {
  const storage = getStorage();
  if (Platform.OS === 'web') {
    storage.setItem(key, value);
  } else {
    await storage.setItem(key, value);
  }
};

export async function fetchAndConvertProducts(
  query: string,
  lat?: number,
  lng?: number
): Promise<Product[]> {
  let deviceID = await getItemAsync('deviceID');
  if (!deviceID) {
    deviceID = generateUUID();
    await setItemAsync('deviceID', deviceID);
  }

  const locParams = lat && lng ? `&lat=${lat}&lng=${lng}` : '';
  const url = `http://localhost:4500/search?q=${encodeURIComponent(query)}${locParams}&deviceID=${deviceID}`;
  const response = await fetch(url);
  const data = await response.json();

  const products: Product[] = data.map((item: any, index: number) => {
    const priceMap: Record<string, { price: number; image_url: string; deeplink: string; weight: string }> = {};

    item.prices.forEach((priceEntry: any) => {
      const platform = priceEntry.source;
      const lowestVariant = priceEntry.variants.reduce((min: any, variant: any) => {
        return !min || variant.discounted_price < min.discounted_price ? variant : min;
      }, null);

      if (lowestVariant) {
        if (!priceMap[platform] || lowestVariant.discounted_price < priceMap[platform].price) {
          priceMap[platform] = {
            price: lowestVariant.discounted_price,
            image_url: lowestVariant.image_url,
            deeplink: lowestVariant.deeplink,
            weight: lowestVariant.weight,
          };
        }
      }
    });

    let priceOptionId = 1;
    const priceOptions: PriceOption[] = Object.entries(priceMap).map(([platform, value]) => ({
      id: priceOptionId++,
      platform,
      price: value.price,
      deliveryTime: 0,
      deeplink: value.deeplink,
      weight: value.weight,
    }));

    let mrp = Infinity;
    let imageUrl = '';
    item.prices.forEach((priceEntry: any) => {
      priceEntry.variants.forEach((variant: any) => {
        if (variant.original_price < mrp) {
          mrp = variant.original_price;
          imageUrl = variant.image_url;
        }
      });
    });
    if (mrp === Infinity) {
      mrp = 0;
    }

    return {
      id: index + 1,
      name: item.name,
      brand: item.brand,
      weight: '',
      mrp,
      imageUrl,
      isNewPack: false,
      priceOptions,
    };
  });

  return products;
}

export async function initiateSessionForUser(lat: number, lng: number): Promise<Session> {
  let deviceID = await getItemAsync('deviceID');
  if (!deviceID) {
    deviceID = generateUUID();
    await setItemAsync('deviceID', deviceID);
  }

  const url = 'http://localhost:4500/start-session'; // Use local backend
  const body = {
    deviceID: deviceID,
    lat: String(lat),
    lng: String(lng),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate session: ${response.statusText}`);
  }

  const data = await response.json();
  await setItem('session', data);
  console.log('rec sess', data);
  return data as Session;
}