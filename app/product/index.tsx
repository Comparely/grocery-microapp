import React from 'react';
import ProductDetailScreen from '@/screens/ProductScreen';
import Head from 'expo-router/head';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import CartBar from '../../components/CartBar';

const App = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#004738" />
            <Head>
                <title>{'Search - Comparely'}</title>
            </Head>

            <View style={styles.container}>
                <View style={styles.screenContent}>
                    <ProductDetailScreen />
                </View>
                <CartBar />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#004738',
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    screenContent: {
        flex: 1,
    },
});

export default App;
