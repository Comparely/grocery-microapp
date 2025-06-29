import {
    PriceOption,
    PriceOptionAPIResp,
    PriceOptionVariantsAPIResp,
    Product,
    ProductAPIResp,
} from '../types/Product';
import { getItem, setItem } from './localStorage';
import { Session } from '@/types/Session';
import * as Crypto from 'expo-crypto';

export async function fetchAndConvertProducts(
    query: string,
    lat?: number,
    lng?: number,
): Promise<Product[]> {
    try {
        let deviceID = await getItem('deviceID');
        if (!deviceID) {
            deviceID = Crypto.randomUUID();
            await setItem('deviceID', deviceID);
        }

        const locParams = lat && lng ? `&lat=${lat}&lng=${lng}` : '';
        const url = `${process.env.EXPO_PUBLIC_API_URL}search?q=${encodeURIComponent(query)}${locParams}&deviceID=${deviceID}`;
        const response = await fetch(url);
        const data: ProductAPIResp[] = await response.json();

        const products: Product[] = data.map((item: ProductAPIResp, index: number) => {
            const priceMap: Record<
                string,
                { 
                    price: number; 
                    originalPrice: number;
                    image_url: string; 
                    deeplink: string; 
                    weight: string;
                    discountPercentage?: number;
                }
            > = {};

            item.prices.forEach((priceEntry: PriceOptionAPIResp) => {
                const platform = priceEntry.source;
                
                // Find the cheapest variant for this platform
                const lowestVariant: PriceOptionVariantsAPIResp | undefined =
                    priceEntry.variants.reduce(
                        (
                            min: PriceOptionVariantsAPIResp | undefined,
                            variant: PriceOptionVariantsAPIResp,
                        ) => {
                            // Ensure we have valid prices before comparing
                            const currentPrice = Number(variant.discounted_price) || 0;
                            const minPrice = min ? Number(min.discounted_price) || 0 : Infinity;
                            
                            return !min || currentPrice < minPrice ? variant : min;
                        },
                        undefined,
                    );

                if (lowestVariant) {
                    const discountedPrice = Number(lowestVariant.discounted_price) || 0;
                    const originalPrice = Number(lowestVariant.original_price) || 0;

                    // Calculate discount percentage
                    const discountPercentage = originalPrice > 0 
                        ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
                        : 0;

                    // Only update if this is the first entry for this platform or if we found a cheaper variant
                    if (
                        !priceMap[platform] ||
                        discountedPrice < priceMap[platform].price
                    ) {
                        priceMap[platform] = {
                            price: discountedPrice,
                            originalPrice: originalPrice,
                            image_url: lowestVariant.image_url,
                            deeplink: lowestVariant.deeplink,
                            weight: lowestVariant.weight,
                            discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
                        };
                    }
                }
            });

            let priceOptionId = 1;
            const priceOptions: PriceOption[] = Object.entries(priceMap)
                .map(([platform, value]) => ({
                    id: priceOptionId++,
                    platform,
                    price: value.price,
                    originalPrice: value.originalPrice,
                    deliveryTime: 0,
                    deeplink: value.deeplink,
                    weight: value.weight,
                }))
                .sort((a, b) => (a.price || 0) - (b.price || 0)); // Sort by price, cheapest first

            // Find the overall lowest MRP and best image from all variants
            let mrp = Infinity;
            let imageUrl = '';
            let bestImageUrl = '';
            
            item.prices.forEach((priceEntry: PriceOptionAPIResp) => {
                priceEntry.variants.forEach((variant: PriceOptionVariantsAPIResp) => {
                    const originalPrice = Number(variant.original_price) || 0;
                    
                    if (originalPrice > 0 && originalPrice < mrp) {
                        mrp = originalPrice;
                        bestImageUrl = variant.image_url;
                    }
                    
                    // Fallback to any available image
                    if (!imageUrl && variant.image_url) {
                        imageUrl = variant.image_url;
                    }
                });
            });
            
            if (mrp === Infinity) {
                mrp = 0;
            }

            return {
                id: index + 1,
                name: item.name,
                brand: item.brand,
                weight: item.weight || priceOptions[0]?.weight || '',
                mrp,
                imageUrl: bestImageUrl || imageUrl,
                isNewPack: false,
                priceOptions,
            };
        });

        return products;
    } catch (err) {
        throw err;
    }
}

export async function initiateSessionForUser(lat: number, lng: number): Promise<Session> {
    let deviceID = await getItem('deviceID');
    if (!deviceID) {
        deviceID = Crypto.randomUUID();
        await setItem('deviceID', deviceID);
    }

    const url = `${process.env.EXPO_PUBLIC_API_URL}start-session`; // Use local backend
    const body = {
        deviceID: deviceID,
        lat: String(lat),
        lng: String(lng),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Failed to initiate session: ${response.statusText}`);
    }

    const data = await response.json();
    await setItem('session', data);
    console.log('rec sess', data);
    return data as Session;
}
