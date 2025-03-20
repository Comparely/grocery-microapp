import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getStorage = () => (Platform.OS === 'web' ? localStorage : AsyncStorage);

export const setItem = async (key: string, value: any) => {
  const storage = getStorage();
  try {
    const stringValue = JSON.stringify(value);
    if (Platform.OS === 'web') {
      storage.setItem(key, stringValue);
    } else {
      await storage.setItem(key, stringValue);
    }
  } catch (error) {
    console.error('Error setting item:', error);
  }
};

export const getItem = async (key: string) => {
  const storage = getStorage();
  try {
    if (Platform.OS === 'web') {
      const value = storage.getItem(key);
      return value != null ? JSON.parse(value) : null;
    } else {
      const value = await storage.getItem(key);
      return value != null ? JSON.parse(value) : null;
    }
  } catch (error) {
    console.error('Error getting item:', error);
    return null;
  }
};

export const removeItem = async (key: string) => {
  const storage = getStorage();
  try {
    if (Platform.OS === 'web') {
      storage.removeItem(key);
    } else {
      await storage.removeItem(key);
    }
  } catch (error) {
    console.error('Error removing item:', error);
  }
};

export const mergeItem = async (key: string, value: any) => {
  const storage = getStorage();
  try {
    const stringValue = JSON.stringify(value);
    if (Platform.OS === 'web') {
      // localStorage doesn’t have mergeItem; simulate it
      const existing = storage.getItem(key);
      const merged = existing ? { ...JSON.parse(existing), ...JSON.parse(stringValue) } : JSON.parse(stringValue);
      storage.setItem(key, JSON.stringify(merged));
    } else {
      await storage.mergeItem(key, stringValue);
    }
  } catch (error) {
    console.error('Error merging item:', error);
  }
};

export const clear = async () => {
  const storage = getStorage();
  try {
    if (Platform.OS === 'web') {
      storage.clear();
    } else {
      await storage.clear();
    }
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

export const getAllKeys = async () => {
  const storage = getStorage();
  try {
    if (Platform.OS === 'web') {
      return Object.keys(storage);
    } else {
      return await storage.getAllKeys();
    }
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};