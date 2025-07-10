import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Text } from '@/ui/Text';

const Footer = () => {
  return (
    <View style={styles.container}>

      <Text style={styles.developedBy}>Developed by</Text>
      <Text style={styles.company}>RKA FORTUNE Pvt. Ltd.</Text>
      <Text style={styles.location}>
        Greater Noida, Uttar Pradesh{'\n'}India - 201310
      </Text>

      <View style={styles.socialRow}>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL('https://www.instagram.com/comparelyy?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==')
          }
          style={styles.socialIcon}
        >
          <FontAwesome name="instagram" size={22} color="#004738" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL('https://www.linkedin.com/company/comparelyy/')
          }
          style={styles.socialIcon}
        >
          <FontAwesome name="linkedin-square" size={22} color="#004738" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL('https://youtube.com/@comparelyyy?si=gRzzrTiC9qqQfn_O')
          }
          style={styles.socialIcon}
        >
          <FontAwesome name="youtube-play" size={22} color="#004738" />
        </TouchableOpacity>
      </View>

      <Text style={styles.copyText}>
        © 2025 – RKA FORTUNE Pvt. Ltd.{' '}
        <Text style={styles.link} onPress={() => Linking.openURL('#')}>
          Terms
        </Text>{' '}
        |{' '}
        <Text style={styles.link} onPress={() => Linking.openURL('#')}>
          Privacy
        </Text>
      </Text>
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#004738',
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'flex-start',
  },
  developedBy: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f0f0f0',
    marginBottom: 2,
  },
  company: {
    fontSize: 16,
    color: '#f0f0f0',
    marginBottom: 2,
  },
  location: {
    fontSize: 15,
    color: '#f0f0f0',
    marginBottom: 18,
  },
  socialRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  socialIcon: {
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  copyText: {
    fontSize: 14,
    color: '#f0f0f0',
  },
  link: {
    color: '#f0f0f0',
    textDecorationLine: 'underline',
  },
});
