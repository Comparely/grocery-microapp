import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

interface CategoryCardProps {
  category: {
    name: string;
    image: string;
    backgroundColor: string;
  };
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const handleCategoryClick = () => {
    router.push(`/search?q=${encodeURIComponent(category.name)}`);
  };

  return (
    <TouchableOpacity onPress={handleCategoryClick} style={[styles.categoryCard, { backgroundColor: category.backgroundColor }]}>
      {/* Existing content */}
    </TouchableOpacity>
  );
};

type CategoriesSectionProps = {
  categories: any
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({categories}) => {
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