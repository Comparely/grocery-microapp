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
const CARD_WIDTH = (width - 12 * 2 - 12) / 2;

interface FeaturedProductsSectionProps {
  featuredProducts: Product[];
}

export default function FeaturedProductsSection({
  featuredProducts
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
      case 'blinkit': return '#E6FFF4';
      case 'zepto': return '#F3E8FF';
      case 'instamart': return '#FFF4E6';
      default: return '#F8F9FA';
    }
  };

  const calculateSavings = (mrp: number, price?: number) =>
    mrp && price ? mrp - price : 0;

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
        {/* <TouchableOpacity style={styles.heartIcon}>
          <Ionicons name="heart-outline" size={18} color="#666" />
        </TouchableOpacity> */}

        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.brand}>{item.brand}</Text>
          {item.mrp != null && (
            <Text style={styles.mrp}>MRP ₹{item.mrp}</Text>
          )}
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
            <Text style={styles.primaryEta}>{primary.deliveryTime || '10 mins'}</Text>
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
                    <Text style={styles.comparisonOptionColSubtitle}>{opt.weight}</Text>
                  </View>
                  <View style={styles.comparisonOptionCol}>
                    <Text style={styles.comparisonPrice}>₹{opt.price}</Text>
                    <Text style={styles.comparisonOptionColSubtitle}>
                      {session.session?.marketplaceAttributes?.[`${plat}StoreAttributes`]?.eta || '10 mins'}
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
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 4,
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
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryRow: { flexDirection: 'row', alignItems: 'center' },
  platformLogo: { width: 32, height: 24, resizeMode: 'contain', marginRight: 8 },
  primaryPriceCol: { flex: 1 },
  primaryPrice: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  primaryWeight: { fontSize: 12, color: '#6B7280' },
  primaryEta: { fontSize: 10, color: '#6B7280' },
  otherContainer: { 
    flexDirection: 'column',
    marginBottom: 8,
  },
  otherRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  otherLogo: { width: 24, height: 18, resizeMode: 'contain', marginRight: 4 },
  otherPrice: { fontSize: 12, fontWeight: '600', color: '#374151', marginRight: 4 },
  otherEta: { fontSize: 10, color: '#6B7280' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savings: { fontSize: 12, fontWeight: '600', color: '#059669' },
  addBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
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
