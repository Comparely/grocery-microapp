import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SearchBar } from './SearchBar';
import { Session } from '@/types/Session';

interface HeaderProps {
  session: Session;
}

const Header: React.FC<HeaderProps> = ({ session }) => {
  const router = useRouter();

  const findLeastTimeStore = () => {
    const blinkitETA = parseFloat(session.marketplaceAttributes.blinkitStoreAttributes.eta);
    const zeptoETA = parseFloat(session.marketplaceAttributes.zeptoStoreAttributes.eta);
    const instamartETA = parseFloat(session.marketplaceAttributes.instamartStoreAttributes.eta);

    const validNumbers = [blinkitETA, zeptoETA, instamartETA].filter((num) => !Number.isNaN(num));
    const least = validNumbers.length ? Math.min(...validNumbers) : NaN;
    let leastStoreName = '';
    if (least === blinkitETA) leastStoreName = 'blinkit';
    if (least === zeptoETA) leastStoreName = 'zepto';
    if (least === instamartETA) leastStoreName = 'instamart';
    return [least, leastStoreName];
  };

  function trimIfNeeded(str: string) {
    const maxLength = 28;
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    return str;
  }

  const findBgColor = (storeName: string): string => {
    if (storeName === 'instamart') return '#fff';
    if (storeName === 'blinkit') return '#cbd402';
    if (storeName === 'zepto') return '#cbd402';
    return '#cbd402';
  };

  const handleSearchPress = () => {
    console.log('Search bar clicked'); // Debugging log
    router.push('/search');
  };

  return (
    <View style={styles.container}>
      <View style={styles.locationContainer}>
        <Ionicons name="location" size={24} color="#cbd402" />
        <TouchableOpacity style={styles.locationSelector}>
          <Text style={styles.locationText}>Address</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.addressText}>{trimIfNeeded(session.address)}</Text>

      <View style={styles.rightContainer}>
        <View
          style={[
            styles.timeContainer,
            { backgroundColor: findBgColor(String(findLeastTimeStore()[1])) },
          ]}
        >
          <Ionicons name="flash" size={18} color="#000000" />
          <Text style={styles.timeText}>{findLeastTimeStore()[0]} mins</Text>
          <View style={styles.blinkitBadge}>
            {findLeastTimeStore()[1] === 'blinkit' && (
              <Image
                style={{ width: 28, height: 28 }}
                source={require('@/assets/images/blinkit.png')}
              />
            )}
            {findLeastTimeStore()[1] === 'zepto' && (
              <Image
                style={{ height: 28, width: 42 }}
                source={require('@/assets/images/zepto.png')}
              />
            )}
            {findLeastTimeStore()[1] === 'instamart' && (
              <Image
                style={{ width: 72, height: 28 }}
                source={require('@/assets/images/swiggy_instamart.webp')}
              />
            )}
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          onClick={handleSearchPress}
          value=""
          onChangeText={() => {}} // No-op since not editable
          placeholder="Search for groceries..."
          editable={false} // Navigation only on home screen
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#004738',
  },
  locationContainer: {
    marginTop: 8,
    paddingHorizontal: 20,
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
    flexDirection: 'row',
    columnGap: 7,
    top: 15,
    right: 20,
    alignItems: 'flex-end',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 5,
  },
  searchContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
});

export default Header;
