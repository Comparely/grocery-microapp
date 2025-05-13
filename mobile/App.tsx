import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Item {
  id: string;
  query: string;
  zepto: string;
  blinkit: string;
  instamart: string;
  bigbasket: string;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [zepto, setZepto] = useState('');
  const [blinkit, setBlinkit] = useState('');
  const [instamart, setInstamart] = useState('');
  const [bigbasket, setBigbasket] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  
  useEffect(() => {
    const loadItems = async () => {
      try {
        const savedItems = await AsyncStorage.getItem('items');
        if (savedItems) {
          setItems(JSON.parse(savedItems));
        }
      } catch (error) {
        console.error('Error loading items', error);
      }
    };

    loadItems();
  }, []);

  
  useEffect(() => {
    const saveItems = async () => {
      try {
        await AsyncStorage.setItem('items', JSON.stringify(items));
      } catch (error) {
        console.error('Error saving items', error);
      }
    };

    saveItems();
  }, [items]);

  const addItem = () => {
    if (!query || !zepto || !blinkit || !instamart || !bigbasket) return;

    const newItem: Item = {
      id: Math.random().toString(),
      query,
      zepto,
      blinkit,
      instamart,
      bigbasket,
    };

    setItems((prev) => [newItem, ...prev]);
    setQuery('');
    setZepto('');
    setBlinkit('');
    setInstamart('');
    setBigbasket('');
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004738" />
      
      <ScrollView contentContainerStyle={styles.scroll}>
      
        <View style={styles.topSection}>
          <Text style={styles.title}>Comparely</Text>
        </View>

      
        <View style={styles.contentSection}>
          <TextInput
            style={styles.input}
            placeholder="Enter product name or query"
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
          />

          <View style={styles.linkRow}>
            <TextInput
              style={styles.linkInput}
              placeholder="Zepto link"
              placeholderTextColor="#999"
              value={zepto}
              onChangeText={setZepto}
            />
            <TextInput
              style={styles.linkInput}
              placeholder="Blinkit link"
              placeholderTextColor="#999"
              value={blinkit}
              onChangeText={setBlinkit}
            />
          </View>

          <View style={styles.linkRow}>
            <TextInput
              style={styles.linkInput}
              placeholder="Instamart link"
              placeholderTextColor="#999"
              value={instamart}
              onChangeText={setInstamart}
            />
            <TextInput
              style={styles.linkInput}
              placeholder="BigBasket link"
              placeholderTextColor="#999"
              value={bigbasket}
              onChangeText={setBigbasket}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={addItem}>
            <Text style={styles.buttonText}>Click</Text>
          </TouchableOpacity>

        
          {items.length > 0 && (
            <View style={styles.cardContainer}>
              {items.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.query}</Text>
                  <View style={styles.linksContainer}>
                    <TouchableOpacity style={styles.linkButton} onPress={() => openLink(item.zepto)}>
                      <Text style={styles.linkText}>Zepto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => openLink(item.blinkit)}>
                      <Text style={styles.linkText}>Blinkit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => openLink(item.instamart)}>
                      <Text style={styles.linkText}>Instamart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => openLink(item.bigbasket)}>
                      <Text style={styles.linkText}>BigBasket</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFAF0',
    flex: 1,
  },
  scroll: {
    alignItems: 'center',
  },
  topSection: {
    backgroundColor: '#004738',
    width: '100%',
    paddingVertical: 30,
    alignItems: 'center',
  },
  contentSection: {
    backgroundColor: '#FFFAF0', 
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'black',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
    width: '60%',
    alignSelf: 'center',
  },
  linkInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    borderWidth: 2,
    borderColor: 'black',
  },
  button: {
    backgroundColor: '#004738',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
    width: '10%',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  card: {
    backgroundColor: '#FFF1D6',
    padding: 20,
    borderRadius: 12,
    width: '30%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 4,
    borderColor: '#CBD402',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 15,
    color: 'black',
    alignSelf: 'center',
  },
  linksContainer: {
    marginTop: 10,
  },
  linkButton: {
    marginVertical: 5,
  },
  linkText: {
    color: 'black',
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
