import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';

export type TextProps = RNTextProps & {
  children: React.ReactNode;
};

export function Text({ style, children, ...props }: TextProps) {
  return (
    <RNText
      {...props}
      style={[styles.base, style]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Sora',
  },
});
