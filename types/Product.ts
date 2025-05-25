export interface Product {
    id: number;
    name: string;
    brand: string;
    weight: string;
    mrp: number;
    imageUrl: string;
    isNewPack?: boolean;
    priceOptions: PriceOption[];
}

export interface PriceOption {
    id?: number;
    platform?: string;
    price?: number;
    deliveryTime?: number;
    deeplink?: string;
    weight?: string;
}

export interface ProductAPIResp {
    id: string;
    name: string;
    brand: string;
    weight: string;
    mrp: number;
    image_url: string;
    isNewPack?: boolean;
    prices: PriceOptionAPIResp[];
}

export interface PriceOptionAPIResp {
    source: string;
    variants: PriceOptionVariantsAPIResp[];
}

export interface PriceOptionVariantsAPIResp {
    original_price: number;
    discounted_price: 33;
    deeplink: string;
    image_url: string;
    weight: string;
}
