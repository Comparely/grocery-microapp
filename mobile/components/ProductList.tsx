import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import ComparingScreen from './waitingscreen';
import type { Product } from '../types/Product';
import { Session } from '@/types/Session';
import { Text } from '@/ui/Text';
import { ProductCard } from './ProductCard';

interface ProductListProps {
    session: Session;
    products: Product[];
    isLoading: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({ session, products, isLoading }) => {
    const [showInitialLoadingAnimation, setShowInitialLoadingAnimation] = useState(true);

    useEffect(() => {
        if (!isLoading && products.length > 0 && showInitialLoadingAnimation) {
        } else if (!isLoading && products.length === 0) {
            setShowInitialLoadingAnimation(false);
        }
    }, [products, isLoading, showInitialLoadingAnimation]);

    const handleComparingAnimationComplete = () => {
        setShowInitialLoadingAnimation(false);
    };

    if (isLoading || showInitialLoadingAnimation) {
        return (
            <View>
                <ComparingScreen onAnimationComplete={handleComparingAnimationComplete} />
            </View>
        );
    }

    if (products.length === 0) {
        // return (
        //     <View style={styles.emptyContainer}>
        //         <Text style={styles.emptyText}>{'Search for products to see results'}</Text>
        //     </View>
        // );
    }

    // return (
    //     <View style={styles.wrapper}>
    //         <FlatList
    //             data={products}
    //             numColumns={2}
    //             renderItem={({ item }) => (
    //                 <ProductCard fullWidth={false} session={session} product={item} key={item.id} />
    //             )}
    //             keyExtractor={(item) => item.id.toString()}
    //             columnWrapperStyle={styles.columnWrapper}
    //             showsVerticalScrollIndicator={false}
    //             contentContainerStyle={{
    //                 paddingBottom: 100,
    //                 paddingHorizontal: 16,
    //                 paddingTop: 16,
    //             }}
    //             style={styles.list}
    //         />
    //     </View>
    // );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#fffaf0',
    },
    list: {
        flex: 1,
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
