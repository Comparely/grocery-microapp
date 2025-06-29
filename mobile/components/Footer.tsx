import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Text } from '@/ui/Text';

const Footer = () => (
    <View style={styles.container}>
        {/* logo + brand */}
        {/* <View style={styles.brandRow}>
            <Image
                source={require('../assets/images/comparely-yellow.png')}
                style={styles.brandImage}
                resizeMode="contain"
            />
            <Text style={styles.comparelyText}>Comparely</Text>
        </View> */}

        {/* company information */}
        <Text style={styles.label}>Developed by</Text>
        <Text style={styles.company}>RKA FORTUNE Pvt. Ltd.</Text>
        <Text style={styles.location}>
            Greater Noida, Uttar Pradesh{'\n'}
            India – 201310
        </Text>

        {/* social icons */}
        <View style={styles.socialRow}>
            {[
                {
                    name: 'instagram',
                    url: 'https://www.instagram.com/comparelyy?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
                },
                { name: 'linkedin-square', url: 'https://www.linkedin.com/company/comparelyy/' },
                { name: 'facebook', url: 'https://www.facebook.com/comparelyyy' },
            ].map(({ name, url }) => (
                <TouchableOpacity
                    key={name}
                    style={styles.iconButton}
                    onPress={() => Linking.openURL(url)}>
                    <FontAwesome name={name} size={16} color="#ffffff" />
                </TouchableOpacity>
            ))}
        </View>

        {/* copyright */}
        <Text style={styles.copyright}>
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

export default Footer;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#004738',
        paddingVertical: 20,
        paddingHorizontal: 24,
        alignItems: 'flex-start',
    },

    /* brand */
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    brandImage: { width: 40, height: 40 },
    comparelyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFD600', // same yellow used in logo
        marginLeft: 10,
    },

    /* company text */
    label: { color: '#ffffff', fontWeight: '600', fontSize: 14, marginTop: 6 },
    company: { color: '#ffffff', fontSize: 14 },
    location: { color: '#ffffff', fontSize: 13, marginBottom: 14 },

    /* social icons */
    socialRow: { flexDirection: 'row', marginBottom: 18 },
    iconButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    /* copyright */
    copyright: { color: '#ffffff', fontSize: 12 },
    link: { textDecorationLine: 'underline', color: '#ffffff' },
});
