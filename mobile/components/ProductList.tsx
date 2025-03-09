import type React from "react"
import { StyleSheet, View, Text, FlatList } from "react-native"
import { ProductCard } from "./ProductCard"
import { ProductCardShimmer } from "./ProductCardShimmer"
import type { Product } from "../types/Product"

interface ProductListProps {
  products: Product[]
  isLoading: boolean
}

export const ProductList: React.FC<ProductListProps> = ({ products, isLoading }) => {
  // Render shimmer loading state
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
    )
  }

  // Render empty state
  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Search for products to see results</Text>
      </View>
    )
  }

  // Render product list
  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} key={item.id} />}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffaf0",
    borderRadius: 24,
    padding: 16,
    height: '100%',
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#fffaf0",
    borderRadius: 24,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: "#9d9d9d",
    textAlign: "center",
  },
})

