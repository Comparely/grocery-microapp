import React, { useState, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text, Image, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const BASE_URL = 'https://www.amazon.in';

const productScrapingScript = `(function () {
  const BASE_URL = 'https://www.amazon.in';
  const products = [];
  const productElements = document.querySelectorAll('.puisg-row');

  productElements.forEach(el => {
    try {
      const anchor = el.querySelector('a.a-link-normal');
      const image = el.querySelector('img.s-image');
      const title = image?.alt?.trim();
      const imageUrl = image?.src;
      const url = anchor?.href;

      const asinMatch = url?.match(/\\/dp\\/([A-Z0-9]{10})/);
      const asin = asinMatch ? asinMatch[1] : null;

      if (title && imageUrl && url) {
        products.push({
          name: title,
          image: imageUrl,
          link: BASE_URL + url,
          asin
        });
      }
    } catch (e) {
      console.log('Error parsing product', e);
    }
  });

  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scrapeData', data: products }));
})(); true;`;

type Product = {
    name: string;
    image: string;
    link: string;
    asin: string | null;
};

const SearchScrapeProduct = () => {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const webviewRef = useRef<WebView>(null);

    const handleSearch = () => {
        if (!search.trim()) return;
        const url = `${BASE_URL}/s?k=${encodeURIComponent(search.trim())}`;
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
                if (Array.isArray(data)) {
                    setProducts(data as Product[]);
                } else {
                    setProducts([]);
                }
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
                    placeholder="Search Amazon Fresh..."
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
                style={{ flex: 1 }}
            />

            <FlatList
                data={products}
                keyExtractor={(item, index) => item.link || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{ uri: item.image }} style={styles.image} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{item.name}</Text>
                            {item.asin && (
                                <Text>
                                    {'ASIN: '}
                                    {item.asin}
                                </Text>
                            )}
                            <Text style={{ color: 'blue' }} numberOfLines={1} ellipsizeMode="tail">
                                {item.link}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text>{'No products found.'}</Text>
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
