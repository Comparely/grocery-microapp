import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/Product';
import { Session } from '@/types/Session';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui/Text';

const { width } = Dimensions.get('window');

type PriceSectionParams = {
  session: Session;
  products: Product[];
};

const PriceSection: React.FC<PriceSectionParams> = ({ session, products }) => {
  const flatListRef = useRef<FlatList>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [itemWidth, setItemWidth] = useState(0); // Track width of ProductCard

  console.log('products', products);

  // Assume ProductCard width is consistent; adjust this based on actual ProductCard styling
  const scrollAmount = itemWidth || width * 0.6; // Fallback to 60% of screen if itemWidth not set

  const scrollRight = () => {
    if (flatListRef.current) {
      const newOffset = scrollOffset + scrollAmount;
      flatListRef.current.scrollToOffset({ offset: newOffset, animated: true });
    }
  };

  const scrollLeft = () => {
    if (flatListRef.current) {
      const newOffset = Math.max(0, scrollOffset - scrollAmount); // Prevent scrolling past start
      flatListRef.current.scrollToOffset({ offset: newOffset, animated: true });
    }
  };

  const handleScroll = (event: any) => {
    setScrollOffset(event.nativeEvent.contentOffset.x);
  };

  // Capture the width of the first ProductCard when it renders
  const handleItemLayout = (event: any) => {
    if (!itemWidth) {
      const { width } = event.nativeEvent.layout;
      setItemWidth(width);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lowest Prices</Text>
      <Text style={styles.subtitle}>Best prices across all platforms</Text>
      <View style={styles.listContainer}>
        <TouchableOpacity style={styles.arrowLeft} onPress={scrollLeft}>
          <Ionicons name="chevron-back" size={30} color="#004738" />
        </TouchableOpacity>
        <FlatList
          ref={flatListRef}
          data={products}
          renderItem={({ item, index }) => (
            <View onLayout={index === 0 ? handleItemLayout : undefined}>
              <ProductCard fullWidth={true} session={session} product={item} />
            </View>
          )}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productList}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        <TouchableOpacity style={styles.arrowRight} onPress={scrollRight}>
          <Ionicons name="chevron-forward" size={30} color="#004738" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    width: '100%',
  },
  title: {
    fontSize: width > 768 ? 28 : 24,
    fontWeight: 'bold',
    color: '#004738',
    textAlign: 'left',
    paddingHorizontal: 15,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width > 768 ? 18 : 16,
    color: '#181b19',
    textAlign: 'left',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  listContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  productList: {
    paddingHorizontal: 15,
  },
  arrowLeft: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    padding:0,
    height:6,
    borderRadius: 20,
  },
  arrowRight: {
    position: 'absolute',
    right: 0,
    zIndex: 1,
    padding: 0,
    height:6,
    borderRadius: 20,
  },
});

export default PriceSection;
