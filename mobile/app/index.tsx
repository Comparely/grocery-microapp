import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import HomeScreen from '@/screens/HomeScreen';
import '@/global.css';
import Head from 'expo-router/head';
// import SearchScrapeProduct from '@/screens/amazonproductscrape';

const App = () => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#004738" />
            <Head>
                <meta property='expo:handoff' content='true' />
                <title>
                    {'Comparely - Compare Grocery Prices Across Zepto, Blinkit, Instamart'}
                </title>
            </Head>
            <HomeScreen />
            {/* <SearchScrapeProduct /> */}
            {/* <FlipkartMinutesScraper /> */}
            {/* <SearchScrapeProduct /> */}
            {/* <FlipkartMinutesScraper /> */}
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
