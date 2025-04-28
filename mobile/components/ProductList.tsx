import type React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { ProductCard } from './ProductCard';
import { ProductCardShimmer } from './ProductCardShimmer';
import type { Product } from '../types/Product';
import { Session } from '@/types/Session';
import { Text } from '@/ui/Text';

interface ProductListProps {
    session: Session;
    products: Product[];
    isLoading: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({ session, products, isLoading }) => {
    if (isLoading) {
        return (
            <View style={styles.container}>
                <FlatList
                    data={[1, 2, 3, 4]}
                    numColumns={2}
                    renderItem={() => <ProductCardShimmer />}
                    keyExtractor={(item) => `shimmer-${item}`}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        );
    }

    if (products.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{'Search for products to see results'}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                numColumns={2}
                renderItem={({ item }) => (
                    <ProductCard fullWidth={false} session={session} product={item} key={item.id} />
                )}
                keyExtractor={(item) => item.id.toString()}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fffaf0',
        borderRadius: 24,
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: '#fffaf0',
        borderRadius: 24,
        padding: 16,
        paddingHorizontal: 16,
        paddingTop: 8,
        margin: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 700,
    },
    emptyText: {
        fontSize: 16,
        color: '#9d9d9d',
        textAlign: 'center',
    },
});
