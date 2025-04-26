import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const setItem = async (key: string, value: any) => {
    try {
        const stringValue = JSON.stringify(value);
        if (Platform.OS === 'web') {
            localStorage.setItem(key, stringValue);
        } else {
            await AsyncStorage.setItem(key, stringValue);
        }
    } catch (error) {
        console.error('Error setting item:', error);
    }
};

export const getItem = async (key: string) => {
    try {
        if (Platform.OS === 'web') {
            const value = localStorage.getItem(key);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return value != null ? JSON.parse(value) : null;
        } else {
            const value = await AsyncStorage.getItem(key);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return value != null ? JSON.parse(value) : null;
        }
    } catch (error) {
        console.error('Error getting item:', error);
        return null;
    }
};

export const removeItem = async (key: string) => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            await AsyncStorage.removeItem(key);
        }
    } catch (error) {
        console.error('Error removing item:', error);
    }
};

export const mergeItem = async (key: string, value: any) => {
    try {
        const stringValue = JSON.stringify(value);
        if (Platform.OS === 'web') {
            // localStorage doesn’t have mergeItem; simulate it
            const existing = localStorage.getItem(key);
            const merged = existing
                ? { ...JSON.parse(existing), ...JSON.parse(stringValue) }
                : JSON.parse(stringValue);
            localStorage.setItem(key, JSON.stringify(merged));
        } else {
            await AsyncStorage.mergeItem(key, stringValue);
        }
    } catch (error) {
        console.error('Error merging item:', error);
    }
};

export const clear = async () => {
    try {
        if (Platform.OS === 'web') {
            localStorage.clear();
        } else {
            await AsyncStorage.clear();
        }
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
};

export const getAllKeys = async () => {
    try {
        if (Platform.OS === 'web') {
            return Object.keys(localStorage);
        } else {
            return await AsyncStorage.getAllKeys();
        }
    } catch (error) {
        console.error('Error getting all keys:', error);
        return [];
    }
};
