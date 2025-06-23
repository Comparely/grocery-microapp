import React, { useState, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text, Image, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const BASE_URL = 'https://www.zeptonow.com';

const productScrapingScript = `(function () {
  const BASE_URL = 'https://www.zeptonow.com';

  const getHighestResImage = (srcSet) => {
    if (!srcSet) return '';
    const urls = srcSet.split(',').map(s => s.trim().split(' ')[0]);
    return urls[urls.length - 1];
  };

  const products = Array.from(document.querySelectorAll('[data-testid="product-card"]')).map(card => {
    const name = card.querySelector('[data-testid="product-card-name"]')?.innerText.trim() || '';
    const price = card.querySelector('[data-testid="product-card-price"]')?.innerText.trim() || '';
    const quantity = card.querySelector('[data-testid="product-card-quantity"]')?.innerText.trim() || '';
    const deliveryTime = card.querySelector('p.block.font-body')?.innerText.trim() || '';

    const imgEl = card.querySelector('img');
    const image = getHighestResImage(imgEl?.getAttribute('srcset')) || imgEl?.src || '';

    const anchor = card.querySelector('a');
    const relativeLink = anchor ? anchor.getAttribute('href') : '';
    const link = relativeLink && relativeLink.startsWith('http') ? relativeLink : BASE_URL + relativeLink;

    return { name, price, quantity, deliveryTime, image, link };
  });
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scrapeData', data: products }));
})(); true;`;

const SearchScrapeProduct = () => {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState([]);
    const webviewRef = useRef<WebView>(null);

    const handleSearch = () => {
        if (!search.trim()) return;
        const url = `${BASE_URL}/search?query=${encodeURIComponent(search.trim())}`;
        webviewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
        setProducts([]);
    };

    const handleScrape = () => {
        webviewRef.current?.injectJavaScript(productScrapingScript);
    };

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            const { type, data } = message;

            if (type === 'scrapeData') {
                setProducts(data);
            }
        } catch (err) {
            console.error('Message Handling Error:', err);
        }
    };
    return (
        <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search Zepto..."
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                />
                <Button title="Search" onPress={handleSearch} />
            </View>
            <Button title="Scrape" onPress={handleScrape} />

            <WebView
                ref={webviewRef}
                source={{ uri: BASE_URL }}
                onMessage={handleMessage}
                javaScriptEnabled
                domStorageEnabled
            />

            <FlatList
                data={products}
                keyExtractor={(item, index) => item.link || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{ uri: item.image }} style={styles.image} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{item.name}</Text>
                            <Text>
                                {item.quantity} | {item.price}
                            </Text>
                            <Text>{item.deliveryTime}</Text>
                            <Text style={{ color: 'blue' }} numberOfLines={1} ellipsizeMode="tail">
                                {item.link}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text>No products found.</Text>
                    </View>
                )}
            />
        </View>
    );
};

export default SearchScrapeProduct;

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 8,
        borderColor: 'white',
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderRadius: 6,
        marginRight: 8,
    },
    card: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 0.5,
        borderColor: '#ccc',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
    },
    title: {
        fontWeight: 'bold',
    },
});
