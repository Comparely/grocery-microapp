export interface Product {
  id: number
  name: string
  brand: string
  weight: string
  mrp: number
  imageUrl: string
  isNewPack?: boolean
  priceOptions: PriceOption[]
}

export interface PriceOption {
  id: number
  platform: string
  price: number
  deliveryTime: number
  deeplink: string
  weight: string
}

