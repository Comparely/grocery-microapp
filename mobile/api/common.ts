// export const fetchHomePageData = async () => {
//     const url = `https://comparely-static-data.storage.googleapis.com/homepage.json?version=3`;
//     const response = await fetch(url, {
//         method: "GET",
//         cache: 'no-store'
//     });
//     const data = await response.json();
//     console.log("homepage", data)
//     return [data.featuredProducts, data.categories]
// }

// @/api/common.ts
import { Product } from '@/types/Product';
import homepageData from '../homepage.json';
import { fetchAndConvertProducts } from './searchProducts';

export const fetchHomePageData = () => {
    try {
        // Use the local JSON data directly
        console.log('Using local homepage data:', homepageData);
        return {
            featuredProducts: homepageData.featuredProducts,
            featuredCategories: homepageData.categories,
        };
    } catch (error) {
        console.error('Error loading local homepage data:', error);
        return {
            featuredProducts: [],
            featuredCategories: [],
        };
    }
};

export function shuffleArray<T extends { priceOptions: any[] }>(array: T[]): T[] {
    return array
        .map((value) => ({
            value,
            sort: Math.random(),
            priceOptionCount: value.priceOptions?.length || 0,
        }))
        .sort((a, b) => {
            if (b.priceOptionCount === a.priceOptionCount) {
                return a.sort - b.sort; // Shuffle within same group
            }
            return b.priceOptionCount - a.priceOptionCount; // Group by length descending
        })
        .map(({ value }) => value);
}

export const fetchHomePageDatav2 = async (lat?: number, lng?: number): Promise<Product[]> => {
    try {
        const queries = [
            'Chocolate',
            'Pasta',
            'Lipstick',
            'Nail Paint',
            'Chips',
            'Ice Cream',
            'Onion',
            'Bread',
        ];

        const allResults: Product[] = [];

        for (const query of queries) {
            const results = await fetchAndConvertProducts(query, lat, lng);
            allResults.push(...results.slice(0, 2));
        }

        const shuffled = shuffleArray(allResults);
        return shuffled;
    } catch (error) {
        console.error('Failed to fetch homepage data:', error);
        return [];
    }
};
