import { useSession } from '@/context/SessionContext';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const BADGE_WIDTH = 160;

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
            key: null, // not session-dependent
            color: '#A8D34F',
            logo: require('../assets/images/bbv3.png'),
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
            scrollEnabled={false}>
            {[...services, ...services].map((service, index) => (
                <View key={index} style={styles.badgeWrapper}>
                    <View style={[styles.badgeContainer, { backgroundColor: service.color }]}>
                        <Text style={styles.bolt}>
                            <Feather name="zap" size={16} color="#181b19" />
                        </Text>
                        <Text
                            style={[
                                styles.time,
                                (service.name === 'zepto' || service.name === 'instamart') && {
                                    color: 'white',
                                },
                            ]}>
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

const styles = StyleSheet.create({
    scroll: {
        marginVertical: 16,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    badgeWrapper: {
        width: BADGE_WIDTH - 10,
        marginRight: 20,
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
        color: '#000',
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

export default DeliveryBadges;
