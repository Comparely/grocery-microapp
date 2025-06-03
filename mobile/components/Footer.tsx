import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Text } from '@/ui/Text';

const Footer = () => {
    return (
        <View style={styles.container}>
            <View style={styles.brandRow}>
                <Image
                    source={require('../assets/images/comparely-yellow.png')}
                    style={styles.brandImage}
                    resizeMode="contain"
                />
                <Text style={styles.comparelyText}>Comparely</Text>
            </View>

            <Text style={styles.developedBy}>Developed by</Text>
            <Text style={styles.company}>RKA FORTUNE Pvt. Ltd.</Text>
            <Text style={styles.location}>Noida, Uttar Pradesh{'\n'}India - 201310</Text>

            <View style={styles.socialRow}>
                <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com')}>
                    <FontAwesome name="instagram" size={22} color="#fff" style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://linkedin.com')}>
                    <FontAwesome
                        name="linkedin-square"
                        size={22}
                        color="#fff"
                        style={styles.icon}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://facebook.com')}>
                    <FontAwesome
                        name="facebook-square"
                        size={22}
                        color="#fff"
                        style={styles.icon}
                    />
                </TouchableOpacity>
            </View>



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
};

export default Footer;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#004738',
        padding: 20,
        marginTop: 20,
        alignItems: 'flex-start',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandImage: {
        width: 40, // adjust as needed
        height: 40, // adjust as needed
    },
    comparelyText: {
        fontSize: 18,
        color: 'yellow',
        marginLeft: 10,
    },

    developedBy: {
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 8,
        fontSize: 14,
    },
    company: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 4,
    },
    icon: {
        marginHorizontal: 6,
    },
    location: {
        color: '#fff',
        fontSize: 13,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    socialRow: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    socialIcon: {
        width: 24,
        height: 24,
        marginHorizontal: 6,
        tintColor: '#fff', // optional: if icons are transparent and you want to color them white
    },
    copyright: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
    link: {
        textDecorationLine: 'underline',
        color: '#fff',
    },
});
