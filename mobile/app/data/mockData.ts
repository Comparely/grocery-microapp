import type { Product } from "../types/Product"

export const mockProductData: Product[] = [
  {
    id: 1,
    name: "Daawat Basmati Rice - Rozana Super",
    brand: "Daawat",
    weight: "1 kg",
    mrp: 100,
    imageUrl: "https://m.media-amazon.com/images/I/71vJWk3PL+L._SL1500_.jpg",
    priceOptions: [
      {
        id: 1,
        platform: "zepto",
        price: 82,
        deliveryTime: 14,
      },
      {
        id: 2,
        platform: "blinkit",
        price: 88,
        deliveryTime: 8,
      },
    ],
  },
  {
    id: 2,
    name: "Whole Farm Premium Parmal Rice",
    brand: "Whole Farm",
    weight: "1 kg",
    mrp: 120,
    imageUrl: "https://m.media-amazon.com/images/I/61eDXs+IfIL._SL1500_.jpg",
    priceOptions: [
      {
        id: 3,
        platform: "blinkit",
        price: 62,
        deliveryTime: 8,
      },
    ],
  },
  {
    id: 3,
    name: "India Gate Mini Mogra Basmati Rice",
    brand: "India Gate",
    weight: "1 kg",
    mrp: 110,
    imageUrl: "https://m.media-amazon.com/images/I/61eDXs+IfIL._SL1500_.jpg",
    isNewPack: true,
    priceOptions: [
      {
        id: 4,
        platform: "zepto",
        price: 82,
        deliveryTime: 14,
      },
      {
        id: 5,
        platform: "blinkit",
        price: 88,
        deliveryTime: 8,
      },
    ],
  },
  {
    id: 4,
    name: "Sugar Watchers Low GI Rice",
    brand: "Whole Farm",
    weight: "1 kg",
    mrp: 120,
    imageUrl: "https://m.media-amazon.com/images/I/71vJWk3PL+L._SL1500_.jpg",
    priceOptions: [
      {
        id: 6,
        platform: "blinkit",
        price: 62,
        deliveryTime: 8,
      },
    ],
  },
  {
    id: 5,
    name: "Fortune Rozana Basmati Rice",
    brand: "Fortune",
    weight: "1 kg",
    mrp: 95,
    imageUrl: "https://m.media-amazon.com/images/I/71vJWk3PL+L._SL1500_.jpg",
    priceOptions: [
      {
        id: 7,
        platform: "zepto",
        price: 78,
        deliveryTime: 12,
      },
      {
        id: 8,
        platform: "blinkit",
        price: 82,
        deliveryTime: 10,
      },
    ],
  },
  {
    id: 6,
    name: "Popular Essentials Sona Masoori Rice",
    brand: "Popular",
    weight: "1 kg",
    mrp: 85,
    imageUrl: "https://m.media-amazon.com/images/I/61eDXs+IfIL._SL1500_.jpg",
    priceOptions: [
      {
        id: 9,
        platform: "blinkit",
        price: 70,
        deliveryTime: 9,
      },
    ],
  },
]

