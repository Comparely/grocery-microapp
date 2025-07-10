import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '@/types/Session';
import { Product } from '@/types/Product';
import { useSession } from '@/context/SessionContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = '49%';

interface FeaturedProductsSectionProps {
  featuredProducts: Product[];
}

export default function FeaturedProductsSection({
  featuredProducts,
}: FeaturedProductsSectionProps) {
  const router = useRouter();
  const session = useSession();

  const getPlatformLogo = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'blinkit':
        return require('@/assets/images/blinkitv2.png');
      case 'zepto':
        return require('@/assets/images/zeptov2.png');
      case 'instamart':
        return require('@/assets/images/instamartv3.png');
      default:
        return require('@/assets/images/bbv3.png');
    }
  };

  const getPlatformBg = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'blinkit':
        return '#E6FFF4';
      case 'zepto':
        return '#F3E8FF';
      case 'instamart':
        return '#FFF4E6';
      default:
        return '#F8F9FA';
    }
  };

  const renderCard = ({ item }: { item: Product }) => {
    const sorted = [...item.priceOptions]
      .filter(o => o.price != null)
      .sort((a, b) => (a.price! - b.price!));
    const primary = sorted[0];
    const others = sorted.slice(1, 4);
    const platform = primary?.platform;

    const onCardPress = () => {
      router.push({ pathname: '/product', params: { product: JSON.stringify(item) } });
    };

    const onDeepLink = async (url?: string) => {
      if (!url) return;
      try {
        const ok = await Linking.canOpenURL(url);
        if (ok) await Linking.openURL(url);
      } catch {}
    };

    return (
      <TouchableOpacity style={styles.card} onPress={onCardPress} activeOpacity={0.9}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.brand}>{item.brand}</Text>
          {item.mrp != null && <Text style={styles.mrp}>MRP ₹{item.mrp}</Text>}
        </View>

        {primary && (
          <TouchableOpacity
            style={[styles.primaryOption, { backgroundColor: getPlatformBg(platform) }]}
            onPress={() => onDeepLink(primary.deeplink)}
          >
            <View style={styles.primaryRow}>
              <Image source={getPlatformLogo(platform)} style={styles.platformLogo} />
              <View style={styles.primaryPriceCol}>
                <Text style={styles.primaryPrice}>₹{primary.price}</Text>
                <Text style={styles.primaryWeight}>{item.weight}</Text>
              </View>
            </View>
            <Text style={styles.primaryEta} numberOfLines={1} ellipsizeMode="tail">
              {primary.deliveryTime || '10 mins'}
            </Text>
          </TouchableOpacity>
        )}

        {others.length > 0 && (
          <>
            <View style={styles.divider} />
            {others.map((opt, i) => {
              const plat = opt.platform?.toLowerCase() || '';
              return (
                <TouchableOpacity
                  key={`${plat}-${i}`}
                  onPress={() => onDeepLink(opt.deeplink || '')}
                  style={styles.comparisonOption}
                >
                  <View style={styles.comparisonOptionCol}>
                    <Image
                      source={getPlatformLogo(plat)}
                      style={styles.comparisonLogo}
                    />
                    <Text style={styles.comparisonOptionColSubtitle}>
                      {opt.weight}
                    </Text>
                  </View>
                  <View style={styles.comparisonOptionCol}>
                    <Text style={styles.comparisonPrice}>₹{opt.price}</Text>
                    <Text style={styles.comparisonOptionColSubtitle}>
                      {
                        session.session?.marketplaceAttributes?.[
                          `${plat}StoreAttributes`
                        ]?.eta || '10 mins'
                      }
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={featuredProducts}
      keyExtractor={p => p.id.toString()}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      renderItem={renderCard}
      contentContainerStyle={{ padding: 12, paddingBottom: 24, gap: 12 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 100,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  info: {
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 2,
  },
  brand: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  mrp: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  primaryOption: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  platformLogo: {
    width: 28,
    height: 20,
    resizeMode: 'contain',
    marginRight: 6,
  },
  primaryPriceCol: {
    flexShrink: 1,
    maxWidth: 100,
  },
  primaryPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  primaryWeight: {
    fontSize: 11,
    color: '#6B7280',
  },
  primaryEta: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 8,
    flexShrink: 0,
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
});
