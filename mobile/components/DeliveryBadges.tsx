// DeliveryBadges.tsx
import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing, StyleSheet, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/context/SessionContext';

const BADGE_WIDTH = 180;

type ServiceConfig = {
  name: string;
  key: string | null;
  color: string;
  logo: any;
  fallbackEta: string;
};

const allServices: ServiceConfig[] = [
  {
    name: 'blinkit',
    key: 'blinkitStoreAttributes',
    color: '#FECF2D',
    logo: require('../assets/images/blinkitv3.png'),
    fallbackEta: '6 mins',
  },
  {
    name: 'instamart',
    key: 'instamartStoreAttributes',
    color: '#F95C0B',
    logo: require('../assets/images/instamartv3.png'),
    fallbackEta: '8 mins',
  },
  {
    name: 'zepto',
    key: 'zeptoStoreAttributes',
    color: '#8C38D6',
    logo: require('../assets/images/zeptov3.png'),
    fallbackEta: '13 mins',
  },
  {
    name: 'bigbasket',
    key: null,
    color: '#A8D34F',
    logo: require('../assets/images/bbv4.png'),
    fallbackEta: '12 mins',
  },
];

const DeliveryBadges: React.FC = () => {
  const { session } = useSession();

  // compute ETAs
  const services = allServices.map((svc) => {
    let eta = svc.fallbackEta;
    if (svc.key) {
      const data = session.marketplaceAttributes?.[svc.key];
      if (data?.eta && data.serviceable) {
        eta = data.eta;
      }
    }
    return {
      name: svc.name,
      time: eta,
      color: svc.color,
      logo: svc.logo,
    };
  });

  // duplicate for seamless loop
  const looped = [...services, ...services];
  const totalWidth = BADGE_WIDTH * services.length;

  // animated value on native thread
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: -totalWidth,
        duration: totalWidth * 50, // tweak speed here
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [translateX, totalWidth]);

  return (
    // allow touches to pass through
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.scroll,
          { flexDirection: 'row', transform: [{ translateX }] },
        ]}
      >
        {looped.map((service, index) => (
          <View key={index} style={styles.badgeWrapper}>
            <View
              style={[
                styles.badgeContainer,
                { backgroundColor: service.color },
              ]}
            >
              <Ionicons
                name="flash"
                size={24}
                color={
                  service.name === 'blinkit' || service.name === 'bigbasket'
                    ? '#000'
                    : '#fff'
                }
                style={styles.bolt}
              />
              <Text
                style={[
                  styles.time,
                  {
                    color:
                      service.name === 'blinkit' || service.name === 'bigbasket'
                        ? '#000'
                        : '#fff',
                  },
                ]}
              >
                {service.time}
              </Text>
              <View style={styles.logoBadge}>
                <Image
                  source={service.logo}
                  style={[
                    styles.logo,
                    (service.name === 'zepto' ||
                      service.name === 'instamart') && {
                      width: 50,
                      height: 50,
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

export default DeliveryBadges;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // Important for iOS
    zIndex: 0,
  },
  scroll: {
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  badgeWrapper: {
    width: BADGE_WIDTH - 10,
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    paddingVertical: 2,
    paddingHorizontal: 12,
    position: 'relative',
  },
  bolt: {
    marginRight: 6,
  },
  time: {
    fontSize: 16,
    fontWeight: '700',
    paddingRight: 40,
  },
  logoBadge: {
    position: 'absolute',
    right: -5,
    top: -4,
    bottom: -4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
});
