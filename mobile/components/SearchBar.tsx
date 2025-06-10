import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    TextInput,
    View,
    TouchableOpacity,
    Platform,
    Text,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'recentSearches';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onClick?: () => void;
    editable?: boolean;
    onSubmitEditing?: () => Promise<void> | void; // Marked as potentially async
    onBlur?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    placeholder = 'Search',
    onClick,
    editable = Platform.OS === 'web',
    onSubmitEditing,
    onBlur,
}) => {
    const inputRef = useRef<TextInput>(null);
    const [showRecent, setShowRecent] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Load recent searches from AsyncStorage on mount
    useEffect(() => {
        const loadRecentSearches = async () => {
            try {
                const storedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
                if (storedSearches) {
                    setRecentSearches(JSON.parse(storedSearches));
                }
            } catch (error) {
                console.error('Failed to load recent searches:', error);
            }
        };
        loadRecentSearches();
    }, []);

    // Save recent searches to AsyncStorage whenever they change
    useEffect(() => {
        const saveRecentSearches = async () => {
            try {
                await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
            } catch (error) {
                console.error('Failed to save recent searches:', error);
            }
        };
        saveRecentSearches();
    }, [recentSearches]);

    const handlePress = () => {
        if (onClick && !editable) {
            onClick();
        } else {
            setShowRecent(true);
        }
    };

    const handleRemoveRecent = (item: string) => {
        setRecentSearches((prev) => prev.filter((search) => search !== item));
    };

    const handleRecentSearchClick = (item: string) => {
        onChangeText(item);
        setShowRecent(false);
    };

    const handleBlur = () => {
        setShowRecent(false);
        onBlur && onBlur();
    };

    const handleSubmitEditing = async () => {
        if (value.trim().length > 0) {
            setRecentSearches((prev) => {
                const filtered = prev.filter((search) => search.toLowerCase() !== value.trim().toLowerCase());
                const newList = [value.trim(), ...filtered];
                return newList.slice(0, 5); // Limit to 5 items
            });
        }
        setShowRecent(false);

        // Show loading overlay
        setLoading(true);

        try {
            // Await potential async search logic
            await onSubmitEditing?.();
        } finally {
            setLoading(false); // Hide loading when done
        }
    };

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                onPress={editable ? undefined : handlePress}
                style={styles.touchableContainer}
                activeOpacity={editable ? 1 : 0.7}
            >
                <View
                    style={styles.container}
                    pointerEvents={editable ? 'auto' : 'none'}
                >
                    <Feather name="search" size={20} color="#181b19" style={styles.icon} />
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor="#9d9d9d"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={editable}
                        onFocus={handlePress}
                        onSubmitEditing={handleSubmitEditing}
                        onBlur={handleBlur}
                    />
                    {value.length > 0 && editable && (
                        <TouchableOpacity onPress={() => onChangeText('')}>
                            <Feather name="x" size={20} color="#181b19" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>

            {showRecent && recentSearches.length > 0 && (
                <View style={styles.dropdown}>
                    {recentSearches.map((item) => (
                        <View style={styles.recentItem} key={item}>
                            <TouchableOpacity
                                onPress={() => handleRecentSearchClick(item)}
                                style={styles.recentTextContainer}
                            >
                                <Text style={styles.recentText}>{item}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleRemoveRecent(item)}
                                style={styles.crossContainer}
                            >
                                <Feather name="x" size={16} color="#181b19" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Loading overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#181b19" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { width: '100%' },
    touchableContainer: { width: '100%' },
    container: {
        backgroundColor: '#fffaf0',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    icon: { marginRight: 8 },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#181b19',
        fontWeight: '500',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    dropdown: {
        marginTop: 4,
        backgroundColor: '#fffaf0',
        borderRadius: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    recentTextContainer: { flex: 1 },
    recentText: { fontSize: 16, color: '#181b19' },
    crossContainer: { marginLeft: 8 },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    loadingText: {
        marginTop: 8,
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SearchBar;
