import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Comparely</Text>
      </View>
      
      <View style={styles.locationContainer}>
        <Ionicons name="location" size={24} color="#cbd402" />
        <TouchableOpacity style={styles.locationSelector}>
          <Text style={styles.locationText}>College</Text>
          <Ionicons name="chevron-down" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.addressText}>Galgotias College, Knowledge Park...</Text>
      
      <View style={styles.rightContainer}>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryText}>Fastest Delivery</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="flash" size={18} color="#000000" />
            <Text style={styles.timeText}>6 mins</Text>
            <View style={styles.blinkitBadge}>
              <Text style={styles.blinkitText}>blinkit</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.profileButton}>
          <Image 
            source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png' }} 
            style={styles.profileImage} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#004738',
  },
  logoContainer: {
    marginBottom: 15,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '500',
    color: '#cbd402',
    fontStyle: 'italic',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginLeft: 29,
  },
  rightContainer: {
    position: 'absolute',
    top: 15,
    right: 20,
    alignItems: 'flex-end',
  },
  deliveryInfo: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  deliveryText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cbd402',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 5,
  },
  blinkitBadge: {
    backgroundColor: '#f8a44c',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 5,
  },
  blinkitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#cbd402',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});

export default Header;