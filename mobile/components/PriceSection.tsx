import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/Product';
import { Session } from '@/types/Session';

const { width } = Dimensions.get('window'); // For responsive design

type PriceSectionParams = {
  session: Session;
  products: Product[];
};

const PriceSection: React.FC<PriceSectionParams> = ({ session, products }) => {
  console.log('products', products);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lowest Prices</Text>
      <Text style={styles.subtitle}>Best prices across all platforms</Text>
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard fullWidth={true} session={session} product={item} />}
        keyExtractor={(item) => String(item.id)}
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
    width: '100%',
  },
  title: {
    fontSize: width > 768 ? 28 : 24, // Smaller on mobile
    fontWeight: 'bold',
    color: '#004738',
    textAlign: 'left',
    paddingHorizontal: 15,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width > 768 ? 18 : 16, // Smaller on mobile
    color: '#181b19',
    textAlign: 'left',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  productList: {
    paddingHorizontal: 15,
  },
});

export default PriceSection;