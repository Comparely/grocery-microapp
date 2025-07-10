import { useSession } from '@/context/SessionContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';

const BADGE_WIDTH = 180;

const DeliveryBadges = () => {
  const { session } = useSession();

  const allServices = [
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

  const scrollRef = useRef<ScrollView>(null);
  const position = useRef(0);
  const scrollLimit = BADGE_WIDTH * services.length;

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        position.current += 1;

        if (position.current >= scrollLimit) {
          scrollRef.current.scrollTo({ x: 0, animated: false });
          position.current = 1;
        }

        scrollRef.current.scrollTo({ x: position.current, animated: false });
      }
    }, 10);

    return () => clearInterval(interval);
  }, [scrollLimit]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      scrollEnabled={false}
    >
      {[...services, ...services].map((service, index) => (
        <View key={index} style={styles.badgeWrapper}>
          <View style={[styles.badgeContainer, { backgroundColor: service.color }]}>
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
                  (service.name === 'zepto' || service.name === 'instamart') && {
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
    </ScrollView>
  );
};

export default DeliveryBadges;

const styles = StyleSheet.create({
  scroll: {
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  badgeWrapper: {
    width: BADGE_WIDTH - 10,
    marginRight: 20,

    // ✅ Shadow styling for iOS/web
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,

    // ✅ Shadow styling for Android
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
