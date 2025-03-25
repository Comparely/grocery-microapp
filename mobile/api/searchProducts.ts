import { PriceOption, Product } from '../types/Product';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@/types/Session';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

const generateUUID = () =>
  Platform.OS === 'web'
    ? (crypto.randomUUID?.() ?? uuidv4Fallback())
    : Crypto.randomUUID();

const uuidv4Fallback = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return ((c === 'x' ? r : (r & 0x3) | 0x8)).toString(16);
  });

const getStorage = () => (Platform.OS === 'web' ? localStorage : AsyncStorage);

const getItemAsync = async (key: string): Promise<string | null> =>
  Platform.OS === 'web' ? localStorage.getItem(key) : await AsyncStorage.getItem(key);

const setItemAsync = async (key: string, value: string): Promise<void> =>
  Platform.OS === 'web' ? localStorage.setItem(key, value) : await AsyncStorage.setItem(key, value);

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

  const loc = lat != null && lng != null ? `&lat=${lat}&lng=${lng}` : '';
  const url = `http://localhost:4500/search?q=${encodeURIComponent(query)}${loc}&deviceID=${deviceID}`;

  const res = await fetch(url);
  const json = await res.json();
  if (!Array.isArray(json)) return [];

  return json.map((item: any, index: number) => {
    const priceMap: Record<string, any> = {};
    item.prices.forEach((p: any) => {
      const variant = p.variants.reduce((min: any, v: any) =>
        !min || v.discounted_price < min.discounted_price ? v : min
      , null);
      if (variant) priceMap[p.source] = variant;
    });

    let id = index + 1;
    const priceOptions: PriceOption[] = Object.entries(priceMap).map(([platform, v], i) => ({
      id: i + 1,
      platform,
      price: v.discounted_price,
      deliveryTime: 0,
      deeplink: v.deeplink,
      weight: v.weight,
    }));

    let mrp = Math.min(...item.prices.flatMap((p: any) => p.variants.map((v: any) => v.original_price))) || 0;
    const imageUrl = item.prices.flatMap((p: any) => p.variants.map((v: any) => v.image_url))[0] || '';

    return {
      id,
      name: item.name,
      brand: item.brand,
      weight: '',
      mrp,
      imageUrl,
      isNewPack: false,
      priceOptions,
    };
  });
}

export async function initiateSessionForUser(lat: number, lng: number): Promise<Session> {
  let deviceID = await getItemAsync('deviceID');
  if (!deviceID) {
    deviceID = generateUUID();
    await setItemAsync('deviceID', deviceID);
  }

  const res = await fetch('http://localhost:4500/start-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceID, lat: String(lat), lng: String(lng) }),
  });

  if (!res.ok) throw new Error(`Failed to initiate session: ${res.statusText}`);
  const data = (await res.json()) as Session;
  await setItemAsync('session', JSON.stringify(data));
  return data;
}
