import React from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  Linking 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/ui/Text';
import { Product } from '@/types/Product';
import { Session } from '@/types/Session';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ProductCardProps {
  fullWidth: boolean;
  session: Session;
  product: Product;
  isHomeScreenView?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  fullWidth,
  session,
  product,
  isHomeScreenView,
}) => {
  const router = useRouter();
  
  // Platform prioritization logic
  const bigbasketVariants = ['bigbasket', 'bbnow', 'bb'];
  const sortedOptions = [...product.priceOptions]
    .filter(opt => opt.price != null)
    .sort((a, b) => (a.price! - b.price!));

  const firstOption = sortedOptions[0];
  const comparisonOptions = sortedOptions.slice(1, 4);
  const platform = firstOption?.platform?.toLowerCase() ?? '';

  // Calculate savings
  const calculateSavings = () => {
    if (product.mrp && firstOption?.price) {
      return product.mrp - firstOption.price;
    }
    return 0;
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/product',
      params: { product: JSON.stringify(product) },
    });
  };

  const handleDeepLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (err) {
      console.log("Can't open URL", err);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zepto': return require('@/assets/images/zeptov2.png');
      case 'blinkit': return require('@/assets/images/blinkitv2.png');
      case 'instamart': return require('@/assets/images/instamartv2.png');
      default:
        if (bigbasketVariants.includes(platform)) {
          return require('@/assets/images/bbnow.webp');
        }
        return null;
    }
  };

  const getPlatformBackgroundColor = (platform: string) => {
    switch (platform) {
      case 'blinkit': return '#E6FFF4'; // Light green
      case 'zepto': return '#F3E8FF';
      case 'instamart': return '#FFF4E6';
      default: return '#F8F9FA';
    }
  };

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      activeOpacity={0.9}
      style={[
        styles.container,
        fullWidth && styles.fullWidthContainer,
        isHomeScreenView && styles.homeCard,
      ]}
    >
      {/* Heart Icon */}
      {/* <TouchableOpacity style={styles.heartIcon}>
        <Ionicons name="heart-outline" size={20} color="#666" />
      </TouchableOpacity> */}

      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.brandText}>{product.brand}</Text>
        {product.mrp && (
          <Text style={styles.mrpText}>MRP ₹{product.mrp}</Text>
        )}
      </View>

      {/* Price Options */}
      <View style={styles.priceOptionsContainer}>
        {firstOption ? (
          <TouchableOpacity
            onPress={() => handleDeepLink(firstOption.deeplink || '')}
            style={[
              styles.primaryOption,
              { backgroundColor: getPlatformBackgroundColor(platform) }
            ]}
          >
            <View style={styles.primaryOptionContent}>
              <View style={styles.platformInfo}>
                <Image
                  source={getPlatformIcon(platform)}
                  style={styles.platformLogo}
                />
                <View style={styles.priceInfo}>
                  <Text style={styles.price}>₹{firstOption.price}</Text>
                  <Text style={styles.weight}>{product.weight}</Text>
                </View>
              </View>
              <Text style={styles.deliveryTime}>{firstOption.deliveryTime || '10 mins'}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noOptionsText}>No price options available</Text>
        )}

        {comparisonOptions.length > 0 && (
          <>
            <View style={styles.divider} />
            {comparisonOptions.map((opt, i) => {
              const plat = opt.platform?.toLowerCase() || '';
              return (
                <TouchableOpacity
                  key={`${plat}-${i}`}
                  onPress={() => handleDeepLink(opt.deeplink || '')}
                  style={styles.comparisonOption}
                >
                  <View style={styles.comparisonOptionCol}>
                    <Image
                      source={getPlatformIcon(plat)}
                      style={styles.comparisonLogo}
                    />
                    <Text style={styles.comparisonOptionColSubtitle}>{product.weight}</Text>
                  </View>
                  <View style={styles.comparisonOptionCol}>
                    <Text style={styles.comparisonPrice}>₹{opt.price}</Text>
                    <Text style={styles.comparisonOptionColSubtitle}>
                      {session.marketplaceAttributes[`${plat}StoreAttributes`]?.eta || '10 mins'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fullWidthContainer: {
    width: 300,
    alignSelf: 'center',
  },
  homeCard: {
    width: '30%',
  },
  heartIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  mrpText: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  priceOptionsContainer: {
    marginBottom: 12,
  },
  noOptionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
  },
  primaryOption: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  primaryOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformLogo: {
    width: 50,
    height: 32,
    resizeMode: 'contain',
    marginRight: 12,
  },
  priceInfo: { flex: 1 },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  weight: {
    fontSize: 12,
    color: '#6B7280',
  },
  deliveryTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  comparisonOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonLogo: {
    width: 32,
    height: 24,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  comparisonPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  comparisonOptionColSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  comparisonOptionCol: {
    flexDirection: 'column',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  addToCartButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProductCard;
