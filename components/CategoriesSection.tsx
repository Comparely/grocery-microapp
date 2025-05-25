import { router } from 'expo-router';
import React from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text } from '@/ui/Text';
import { Category } from '@/types/Category';

interface CategoryCardProps {
    category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
    const handleCategoryClick = () => {
        router.push(`/search`);
    };

    return (
        <TouchableOpacity
            onPress={handleCategoryClick}
            style={[styles.categoryCard, { backgroundColor: category.backgroundColor }]}>
            <Image source={{ uri: category.image }} style={styles.categoryImage} />
            <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
    );
};

type CategoriesSectionProps = {
    categories: Category[];
};

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ categories }) => {
    console.log('CategoriesSection received:', categories);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{'Popular Categories'}</Text>
            <FlatList
                data={categories}
                renderItem={({ item }) => <CategoryCard category={item} />}
                keyExtractor={(_, index) => String(index)}
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
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryImage: {
        width: '80%',
        height: '60%',
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
