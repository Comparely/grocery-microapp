import React from 'react';
import { StyleSheet, View, Text, Image, Linking, TouchableOpacity, Dimensions } from 'react-native';
import type { Product, PriceOption } from '../types/Product';
import { Session } from '@/types/Session';

const { width } = Dimensions.get('window'); // For responsive design

interface ProductCardProps {
  fullWidth: boolean;
  session: Session;
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ fullWidth, session, product }) => {
  return (
    <View style={fullWidth ? styles.fullWidthContainer : styles.container}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.isNewPack && (
          <View style={styles.newPackBadge}>
            <Text style={styles.newPackText}>NOW IN NEW PACK</Text>
          </View>
        )}
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      </View>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        {/* Weight and Brand */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{product.brand}</Text>
          </View>
        </View>

        {/* MRP */}
        <Text style={styles.mrpText}>MRP ₹{product.mrp}</Text>

        {/* Product Name */}
        <Text style={styles.nameText} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price Options */}
        {product.priceOptions.map((priceOption) => (
          <PriceOptionSingle
            session={session}
            key={priceOption.id || `${priceOption.platform}-${priceOption.price}`} // Fallback key for safety
            priceOption={priceOption}
            productWeight={product.weight} // Pass product.weight as productWeight
            label=""
          />
        ))}
      </View>
    </View>
  );
};

interface PriceOptionSingleProps {
  session: Session;
  priceOption: PriceOption;
  productWeight?: string; // Optional product-level weight
  label: string;
}

const PriceOptionSingle: React.FC<PriceOptionSingleProps> = ({ session, priceOption, productWeight, label }) => {
  const handleDeepLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log("Don't know how to open URI: " + url);
    }
  };

  const eta = {
    zepto: session.marketplaceAttributes?.zeptoStoreAttributes?.eta || 'N/A',
    blinkit: session.marketplaceAttributes?.blinkitStoreAttributes?.eta || 'N/A',
    instamart: session.marketplaceAttributes?.instamartStoreAttributes?.eta || 'N/A',
  }[priceOption.platform] || 'N/A';

  // Determine which weight to display: prioritize priceOption.weight, fallback to productWeight
  const displayWeight = priceOption.weight || productWeight || 'N/A';

  return (
    <TouchableOpacity
      onPress={() => handleDeepLink(priceOption.deeplink)}
      style={styles.priceOptionContainer}
    >
      <View style={styles.priceRow}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{priceOption.price}</Text>
          <View style={styles.platformBadge}>
            {priceOption.platform === 'zepto' && (
              <Image source={require('@/assets/images/zepto.svg')} style={styles.platformImage} />
            )}
            {priceOption.platform === 'blinkit' && (
              <Image
                source={require('@/assets/images/blinkit.png')} // Retained PNG version
                style={styles.platformImageBlinkit}
              />
            )}
            {priceOption.platform === 'instamart' && (
              <Image
                source={require('@/assets/images/swiggy_instamart.webp')}
                style={styles.platformImage}
              />
            )}
            <View style={styles.tagSmall}>
              <Text style={styles.tagTextSmall}>{displayWeight}</Text> {/* Updated to use displayWeight */}
            </View>
          </View>
        </View>
        <View style={styles.deliveryContainer}>
          <View style={styles.deliveryDot}>
            <View style={styles.deliveryDotInner} />
          </View>
          <Text style={styles.deliveryText}>{eta}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%', // Responsive width for grid layout
    marginBottom: 16,
    marginHorizontal: 4, // Adds spacing between cards
  },
  fullWidthContainer: {
    width: 234, // Fixed width for horizontal scroll scenarios
    marginRight: 10,
  },
  imageContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    height: width > 768 ? 180 : 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  newPackBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'red',
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newPackText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  image: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  detailsContainer: {
    paddingHorizontal: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tag: {
    backgroundColor: '#fde5b6',
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  tagSmall: {
    backgroundColor: '#fde5b6',
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tagText: {
    color: '#181b19',
    fontSize: 12,
    fontWeight: '500',
  },
  tagTextSmall: {
    color: '#181b19',
    fontSize: 10,
    fontWeight: '500',
  },
  mrpText: {
    color: '#9d9d9d',
    fontSize: 12,
    marginBottom: 4,
  },
  nameText: {
    color: '#181b19',
    fontSize: width > 768 ? 16 : 14,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceOptionContainer: {
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: width > 768 ? 16 : 14,
    fontWeight: 'bold',
    color: '#181b19',
    marginRight: 8,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformImage: {
    width: 32,
    height: 13,
    resizeMode: 'contain',
  },
  platformImageBlinkit: {
    width: 32,
    height: 13,
    resizeMode: 'cover', // Retained from original PNG version
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffeb3b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  deliveryDotInner: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ffa000',
  },
  deliveryText: {
    fontSize: 12,
    color: '#181b19',
  },
});

export default ProductCard;