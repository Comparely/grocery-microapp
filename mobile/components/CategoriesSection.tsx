import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

// Sample categories data
const categories = [
  {
    id: '1',
    name: 'Fresh Fruits & Vegetable',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    backgroundColor: '#e8f5e9',
  },
  {
    id: '2',
    name: 'Cooking Oil & Ghee',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    backgroundColor: '#fff3e0',
  },
  {
    id: '3',
    name: 'Bakery & Snacks',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    backgroundColor: '#f3e5f5',
  },
  {
    id: '4',
    name: 'Meat & Fish',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    backgroundColor: '#ffebee',
  },
  {
    id: '5',
    name: 'Dairy & Eggs',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    backgroundColor: '#fffde7',
  },
  {
    id: '6',
    name: 'Beverages',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comparely_App-S1tHdjD85X2cF8GpYqUWzmikD4U2jy.png',
    backgroundColor: '#e3f2fd',
  },
];

interface CategoryCardProps {
  category: {
    name: string;
    image: string;
    backgroundColor: string;
  };
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <TouchableOpacity 
      style={[styles.categoryCard, { backgroundColor: category.backgroundColor }]}
      activeOpacity={0.7}
    >
      <Image source={{ uri: category.image }} style={styles.categoryImage} />
      <Text style={styles.categoryName}>{category.name}</Text>
    </TouchableOpacity>
  );
};

const CategoriesSection = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Popular Categories</Text>
      
      <FlatList
        data={categories}
        renderItem={({ item }) => <CategoryCard category={item} />}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.categoriesList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004738',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoriesList: {
    paddingBottom: 20,
  },
  categoryCard: {
    flex: 1,
    margin: 8,
    borderRadius: 15,
    padding: 15,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#181b19',
    textAlign: 'center',
  },
});

export default CategoriesSection;