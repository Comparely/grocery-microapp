import { GroceryComparisonScreen } from '@/screens/GroceryComparisonScreen';
import Head from 'expo-router/head';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';

const App = () => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#004738" />
            {Platform.OS === 'web' && (
                <Head>
                    <title>{'Search - Comparely'}</title>
                </Head>
            )}
            <GroceryComparisonScreen />
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
