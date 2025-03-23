import React from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClick?: () => void; // Optional: for navigation
  editable?: boolean;  // Control editability
  onSubmitEditing?: () => void; // New: Handle submission (e.g., Enter key)
  onBlur?: () => void; // New: Handle loss of focus
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  onClick,
  editable = Platform.OS === 'web', // Default: editable on web, not on mobile
  onSubmitEditing, // Pass through to TextInput
  onBlur, // Pass through to TextInput
}) => {
  const handlePress = () => {
    if (onClick && !editable) {
      onClick(); // Trigger navigation only if not editable
    }
  };

  return (
    <TouchableOpacity
      onPress={editable ? undefined : handlePress} // Only make it tappable if not editable
      style={styles.touchableContainer}
      activeOpacity={editable ? 1 : 0.7} // No opacity change if editable
    >
      <View style={styles.container} pointerEvents={editable ? 'auto' : 'none'}>
        <Feather name="search" size={20} color="#181b19" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9d9d9d"
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          onFocus={editable ? undefined : handlePress} // Fallback for navigation
          onSubmitEditing={onSubmitEditing} // Pass through to parent
          onBlur={onBlur} // Pass through to parent
        />
        {value.length > 0 && editable && (
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Feather name="x" size={20} color="#181b19" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    width: '100%',
  },
  container: {
    backgroundColor: '#fffaf0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#181b19',
    fontWeight: '500',
  },
});