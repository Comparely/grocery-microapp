import React, { useState, useRef } from 'react';
import { View, TextInput, Button, Text, Image, StyleSheet, Alert, ScrollView } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import axios from 'axios';

const BASE_URL = 'https://www.amazon.in';

type Variant = {
    name: string;
    value: string;
};

type PriceOption = {
    source: string;
    variants: Variant[];
    platform: string;
    price: number;
    delivery_time: string;
    link: string;
    product_id: string;
    product_url: string;
    asin?: string;
};

type Product = {
    id: string;
    name: string;
    brand: string;
    weight: string;
    mrp: number;
    image_url: string;
    prices: PriceOption[];
};

type ScrapedItem = {
    name: string;
    price?: string;
    DeliveryTime?: string; // ✅ Note: capitalized D to match Go struct
    image: string;
    link: string;
    asin: string;
    weight?: string;
};

const SearchScrapeProduct = () => {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<ScrapedItem[]>([]);
    const webviewRef = useRef<WebView>(null);
    const [currentUrl, setCurrentUrl] = useState(BASE_URL);

    const handleSearch = () => {
        if (!search.trim()) return;
        const url = `${BASE_URL}/s?k=${encodeURIComponent(search.trim())}`;
        setCurrentUrl(url);
        setProducts([]);
    };

    const handleScrape = () => {
        webviewRef.current?.injectJavaScript(scrapeScript);
    };

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            const { type, data } = message;
            if (type === 'scrapeData') {
                const scrapedData = Array.isArray(data) ? data : [];
                console.log('🧪 Scraped Data:', scrapedData);
                setProducts(scrapedData);
                void sendScrapedProductsToBackend(scrapedData as ScrapedItem[]);
            }
        } catch (err) {
            console.error('Message Handling Error:', err);
        }
    };

    const sendScrapedProductsToBackend = async (scrapedData: ScrapedItem[]) => {
        try {
            const transformed: Product[] = scrapedData
                .filter((item) => item.name && item.price && item.asin)
                .map((item, index) => {
                    const parsedPrice = parseFloat(item.price?.replace(/[₹,]/g, '') || '0') || 0;

                    return {
                        id: item.asin || `generated-id-${index}`,
                        name: item.name || 'Unknown Product',
                        brand: '',
                        weight: item.weight || '',
                        mrp: parsedPrice,
                        image_url: item.image || '',
                        prices: [
                            {
                                source: 'scraper',
                                variants: [],
                                platform: 'amazon_fresh',
                                price: parsedPrice,
                                delivery_time: item.DeliveryTime || '',
                                link: item.link || '',
                                product_id: item.asin || '',
                                product_url: item.link || '',
                                asin: item.asin || '',
                            },
                        ],
                    };
                });

            console.log('📦 Transformed Products:', JSON.stringify(transformed, null, 2));

            const response = await axios.post('http://10.0.2.2:4500/api/products', transformed, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('✅ Sent to backend:', response.data);
            Alert.alert('Success', 'Products sent to backend');
        } catch (error) {
            console.error('❌ Error sending products:', error);
            Alert.alert('Error', 'Failed to send to backend');
        }
    };

    const scrapeScript = `(async function () {
        const sleep = (ms) => new Promise(res => setTimeout(res, ms));
        const autoScroll = async () => {
            const distance = 500;
            for (let i = 0; i < 20; i++) {
                window.scrollBy(0, distance);
                await sleep(500);
            }
        };
        await autoScroll();

        const products = Array.from(document.querySelectorAll('.puisg-row')).map(card => {
            const name = card.querySelector('h2')?.innerText?.trim() || '';
            const price = card.querySelector('.a-price .a-offscreen')?.innerText?.trim() || '';
            const deliveryTime = card.querySelector('.puis-bold-weight-text, .a-color-success')?.innerText?.trim() || '';
            const image = card.querySelector('img')?.src || '';

            let link = card.querySelector('a.a-link-normal')?.getAttribute('href') || '';
            if (link && link.startsWith('/')) {
                link = 'https://www.amazon.in' + link;
            }

            const asinMatch = link.match(/\\/dp\\/([A-Z0-9]{10})/) || [];
            const asin = asinMatch[1] || '';

            const weightText = card.querySelector('.a-size-mini.a-color-secondary.puis-light-weight-text')?.innerText || '';
            const weightMatch = weightText.match(/(\\d+(\\.\\d+)?\\s?(g|kg|ml|l|litre|pack|pcs))/i);
            const weight = weightMatch ? weightMatch[0].trim() : '';

            return { name, price, DeliveryTime: deliveryTime, image, link, asin, weight };
        });

        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scrapeData', data: products }));
    })(); true;`;

    return (
        <View style={{ flex: 1, backgroundColor: '#004738' }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.input}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search Amazon..."
                        placeholderTextColor="#555"
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                    />
                    <Button title="Search" onPress={handleSearch} />
                </View>

                <View style={styles.scrapeButtonContainer}>
                    <Button title="Scrape" onPress={handleScrape} />
                </View>

                <View style={styles.scrapeButtonContainer}>
                    <Button
                        title="Send to Backend"
                        onPress={() => {
                            if (products.length > 0) {
                                void sendScrapedProductsToBackend(products);
                            } else {
                                Alert.alert('No products to send');
                            }
                        }}
                    />
                </View>

                <View style={{ height: 300, marginVertical: 10 }}>
                    <WebView
                        ref={webviewRef}
                        source={{ uri: currentUrl }}
                        onMessage={handleMessage}
                        javaScriptEnabled
                        domStorageEnabled
                    />
                </View>

                {products.map((item, index) => (
                    <View style={styles.card} key={index}>
                        <Image source={{ uri: item.image }} style={styles.image} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{item.name || 'Unnamed Product'}</Text>
                            <Text style={styles.text}>{item.price || 'Price not found'}</Text>
                            {item.weight && <Text style={styles.text}>{'Weight: ' + item.weight}</Text>}
                            {item.DeliveryTime && <Text style={styles.text}>{item.DeliveryTime}</Text>}
                            {item.asin && <Text style={styles.text}>{'ASIN: ' + item.asin}</Text>}
                            <Text style={[styles.text, { color: 'skyblue' }]} numberOfLines={1} ellipsizeMode="tail">
                                {item.link}
                            </Text>
                        </View>
                    </View>
                ))}

                {products.length === 0 && (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: '#fff' }}>{'No products found.'}</Text>
                    </View>
                )}
            </ScrollView>
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
    scrapeButtonContainer: {
        paddingHorizontal: 10,
        marginBottom: 6,
    },
    input: {
        flex: 1,
        padding: 8,
        borderColor: 'white',
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderRadius: 6,
        marginRight: 8,
        color: '#000',
    },
    card: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 0.5,
        borderColor: '#ccc',
        backgroundColor: '#004738',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
    },
    title: {
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    text: {
        color: '#ccc',
        fontSize: 13,
    },
});
