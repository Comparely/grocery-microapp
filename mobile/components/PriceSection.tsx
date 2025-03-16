import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/Product';
import { Session } from '@/types/Session';

type PriceSectionParams = {
  session: Session
  products: Product[]
}

const PriceSection: React.FC<PriceSectionParams> = ({session, products}) => {
  console.log("products", products)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lowest Prices</Text>
      <Text style={styles.subtitle}>best prices across all platforms</Text>
      
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard fullWidth={true} session={session} product={item} />}
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