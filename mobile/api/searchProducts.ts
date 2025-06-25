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
                { price: number; image_url: string; deeplink: string; weight: string }
            > = {};

            item.prices.forEach((priceEntry: PriceOptionAPIResp) => {
                const platform = priceEntry.source;
                const lowestVariant: PriceOptionVariantsAPIResp | undefined =
                    priceEntry.variants.reduce(
                        (
                            min: PriceOptionVariantsAPIResp | undefined,
                            variant: PriceOptionVariantsAPIResp,
                        ) => {
                            return !min || variant.discounted_price < min.discounted_price
                                ? variant
                                : min;
                        },
                        undefined,
                    );

                if (lowestVariant) {
                    if (
                        !priceMap[platform] ||
                        lowestVariant.discounted_price < priceMap[platform].price
                    ) {
                        priceMap[platform] = {
                            price: lowestVariant.discounted_price,
                            image_url: lowestVariant.image_url,
                            deeplink: lowestVariant.deeplink,
                            weight: lowestVariant.weight,
                        };
                    }
                }
            });

            let priceOptionId = 1;
            const priceOptions: PriceOption[] = Object.entries(priceMap).map(
                ([platform, value]) => ({
                    id: priceOptionId++,
                    platform,
                    price: value.price,
                    deliveryTime: 0,
                    deeplink: value.deeplink,
                    weight: value.weight,
                }),
            );

            let mrp = Infinity;
            let imageUrl = '';
            item.prices.forEach((priceEntry: PriceOptionAPIResp) => {
                priceEntry.variants.forEach((variant: PriceOptionVariantsAPIResp) => {
                    if (variant.original_price < mrp) {
                        mrp = variant.original_price;
                        imageUrl = variant.image_url;
                    }
                });
            });
            if (mrp === Infinity) {
                mrp = 0;
            }

            return {
                id: `${query}-${index + 1}`,
                name: item.name,
                brand: item.brand,
                weight: '',
                mrp,
                imageUrl,
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
