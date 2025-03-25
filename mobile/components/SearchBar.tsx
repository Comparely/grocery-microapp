"use client";

import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClick?: () => void;
  editable?: boolean;
  onSubmitEditing?: () => void;
  onBlur?: () => void;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(
  (
    {
      value,
      onChangeText,
      placeholder = 'Search',
      onClick,
      editable = Platform.OS === 'web' ? true : false, // Ensure editable is true by default on web
      onSubmitEditing,
      onBlur,
    },
    ref
  ) => {
    const inputRef = React.useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        inputRef.current?.clear();
        onChangeText(''); // Ensure state is cleared
      },
    }));

    const handlePress = () => {
      if (onClick && !editable) {
        onClick();
      }
    };

    return (
      <TouchableOpacity
        onPress={editable ? undefined : handlePress}
        style={styles.touchableContainer}
        activeOpacity={editable ? 1 : 0.7}
      >
        <View style={styles.container} pointerEvents={editable ? 'auto' : 'none'}>
          <Feather name="search" size={20} color="#181b19" style={styles.icon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value} // Controlled by parent state
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9d9d9d"
            autoCapitalize="none"
            autoCorrect={false}
            editable={editable}
            onSubmitEditing={onSubmitEditing}
            onBlur={onBlur}
          />
          {value.length > 0 && editable && (
            <TouchableOpacity onPress={() => onChangeText('')}>
              <Feather name="x" size={20} color="#181b19" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

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

SearchBar.displayName = 'SearchBar';