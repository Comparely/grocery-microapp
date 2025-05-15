import ProductDetailScreen from '@/screens/ProductScreen';
import Head from 'expo-router/head';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

const App = () => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#004738" />
            <Head>
                <title>{'Search - Comparely'}</title>
            </Head>
            <ProductDetailScreen />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004738',
    },
});

export default App;
