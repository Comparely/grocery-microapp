import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/Product';
import { Session } from '@/types/Session';

// Sample product data
const products: Product[] = [
  {
    id: 1,
    imageUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    weight: '1 kg',
    brand: 'Daawat',
    name: 'Daawat Basmati Rice - Rozana Super',
    mrp: 100,
    priceOptions: [
        {
            platform: "zepto",
            price: 82
        },
        {
            platform: "blinkit",
            price: 89
        }
    ]
  },
  {
    id: 2,
    imageUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    weight: '1 kg',
    brand: 'Whole Farm',
    name: 'Whole Farm Premium Parmal Rice',
    mrp: 120,
    priceOptions: [
        {
            platform: "zepto",
            price: 62
        },
        {
            platform: "blinkit",
            price: 89
        }
    ]
  },
  {
    id: 3,
    imageUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    weight: '10 kg',
    brand: 'Chakki',
    name: 'Chakki Atta',
    mrp: 485,
    priceOptions: [
        {
            platform: "zepto",
            price: 480
        },
        {
            platform: "blinkit",
            price: 480
        }
    ]
  },
];

type PriceSectionParams = {
    session: Session
}

const PriceSection: React.FC<PriceSectionParams> = ({session}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lowest Prices</Text>
      <Text style={styles.subtitle}>best prices across all platforms</Text>
      
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard session={session} product={item} />}
        keyExtractor={item => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004738',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#181b19',
    textAlign: 'center',
    marginBottom: 20,
  },
  productList: {
    paddingHorizontal: 15,
  },
});

export default PriceSection;