import {
    PriceOption,
    PriceOptionAPIResp,
    PriceOptionVariantsAPIResp,
    Product,
    ProductAPIResp,
} from '@/types/Product';

// Helper: Returns the index of the query in the product name (lower index = better match)
function getMatchIndex(name: string, query: string): number {
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    return idx === -1 ? Infinity : idx;
}

/**
 * Calls the search API with the given query and optional location parameters,
 * sorts the products so that those with more price sources come first and for
 * single-source products uses the match index in the name as a secondary criterion,
 * and returns the result as Product[].
 */
export async function searchProducts(
    query: string,
    lat?: number,
    lng?: number,
): Promise<Product[]> {
    try {
        const locParams = lat && lng ? `&lat=${lat}&lng=${lng}` : '';
        const url = `${process.env.EXPO_PUBLIC_API_URL}search?q=${encodeURIComponent(query)}${locParams}`;
        const response = await fetch(url);
        const data: ProductAPIResp[] = await response.json();

        // Assume API returns an array of product objects with at least:
        //   - name: string
        //   - prices: Array<{ source: string, variants: Array<{ discounted_price: number|string, original_price: number|string, image_url: string, deeplink: string }> }>
        // We'll sort them as follows:
        //   1. Products available on more sources (prices.length descending) come first.
        //   2. If a product is available on only one source, we sort by the index of the query in the name.
        const sorted = data.sort((a: ProductAPIResp, b: ProductAPIResp) => {
            const aCount = a.prices?.length || 0;
            const bCount = b.prices?.length || 0;
            if (aCount !== bCount) {
                return bCount - aCount;
            }
            if (aCount === 1) {
                const aMatch = getMatchIndex(a.name, query);
                const bMatch = getMatchIndex(b.name, query);
                return aMatch - bMatch;
            }
            return 0;
        });

        // Transform each product into our Product type.
        // Since our API response might not contain fields like brand or weight,
        // we set defaults (empty string). We use the overall lowest-priced variant
        // (from any source) to pick the image and mrp.
        const transformed: Product[] = sorted.map((item: ProductAPIResp, index: number) => {
            // Determine overall lowest variant among all sources.
            let overallVariant: PriceOptionVariantsAPIResp | undefined;
            if (item.prices && Array.isArray(item.prices)) {
                item.prices.forEach((priceInfo: PriceOptionAPIResp) => {
                    if (priceInfo.variants && priceInfo.variants.length > 0) {
                        const lowest = priceInfo.variants.reduce(
                            (prev: PriceOptionVariantsAPIResp, curr: PriceOptionVariantsAPIResp) =>
                                Number(curr.discounted_price) < Number(prev.discounted_price)
                                    ? curr
                                    : prev,
                        );
                        if (
                            !overallVariant ||
                            Number(lowest.discounted_price) <
                                Number(overallVariant.discounted_price)
                        ) {
                            overallVariant = lowest;
                        }
                    }
                });
            }

            const priceOptions: PriceOption[] = (item.prices || []).map(
                (priceInfo: PriceOptionAPIResp, i: number) => {
                    const lowest =
                        priceInfo.variants && priceInfo.variants.length > 0
                            ? priceInfo.variants.reduce(
                                  (
                                      prev: PriceOptionVariantsAPIResp,
                                      curr: PriceOptionVariantsAPIResp,
                                  ) =>
                                      Number(curr.discounted_price) < Number(prev.discounted_price)
                                          ? curr
                                          : prev,
                              )
                            : null;
                    return {
                        id: i + 1,
                        platform: priceInfo.source,
                        price: lowest ? Number(lowest.discounted_price) : 0,
                        deliveryTime: 0, // Default since we don't have delivery time info
                    };
                },
            );

            return {
                id: index + 1, // Simple numeric id; adjust as needed.
                name: item.name,
                brand: item.brand || '',
                weight: item.weight || '',
                mrp: overallVariant ? Number(overallVariant.original_price) : 0,
                imageUrl: overallVariant ? overallVariant.image_url : '',
                isNewPack: item.isNewPack || false,
                priceOptions,
            };
        });

        return transformed;
    } catch (error) {
        console.error('Error in searchProducts:', error);
        return [];
    }
}
