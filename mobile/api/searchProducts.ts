import { v4 } from "uuid";
import { PriceOption, Product } from "../types/Product";
import { setItem } from "./localStorage";
import { Session } from "@/types/Session";

export async function fetchAndConvertProducts(
  query: string,
  lat?: number,
  lng?: number
): Promise<Product[]> {
  let deviceID = localStorage.getItem("deviceID")
  if(deviceID == null){
    deviceID = v4()
    localStorage.setItem("deviceID", deviceID)
  }
  const locParams = lat && lng ? `&lat=${lat}&lng=${lng}` : "";
  const url = `https://grocery-api.comparely.co.in/search?q=${encodeURIComponent(query)}${locParams}&deviceID=${deviceID}`;
  const response = await fetch(url);
  const data = await response.json();

  const products: Product[] = data.map((item: any, index: number) => {
    // Group variants by platform (source) and choose the lowest discounted_price for each.
    const priceMap: Record<string, { price: number; image_url: string; deeplink: string; weight: string }> = {};

    item.prices.forEach((priceEntry: any) => {
      const platform = priceEntry.source;
      // Find the variant with the lowest discounted_price in this priceEntry.
      const lowestVariant = priceEntry.variants.reduce((min: any, variant: any) => {
        return !min || variant.discounted_price < min.discounted_price ? variant : min;
      }, null);

      if (lowestVariant) {
        // If we've already seen this platform, update if we found a lower price.
        if (!priceMap[platform] || lowestVariant.discounted_price < priceMap[platform].price) {
          priceMap[platform] = {
            price: lowestVariant.discounted_price,
            image_url: lowestVariant.image_url,
            deeplink: lowestVariant.deeplink,
            weight: lowestVariant.weight
          };
        }
      }
    });

    // Build the PriceOption array. We assign a sequential id for each option.
    let priceOptionId = 1;
    const priceOptions: PriceOption[] = Object.entries(priceMap).map(([platform, value]) => ({
      id: priceOptionId++,
      platform,
      price: value.price,
      deliveryTime: 0, // Not provided by API; defaulting to 0.
      deeplink: value.deeplink,
      weight: value.weight
    }));

    // Determine the product's mrp and imageUrl from the lowest original_price among all variants.
    let mrp = Infinity;
    let imageUrl = '';
    item.prices.forEach((priceEntry: any) => {
      priceEntry.variants.forEach((variant: any) => {
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
      id: index + 1,              // Converting string id to a sequential numeric id.
      name: item.name,
      brand: item.brand,                  // Default value (adjust as needed)
      weight: '',                 // Default value (adjust as needed)
      mrp,
      imageUrl,
      isNewPack: false,           // Default value; adjust as needed
      priceOptions,
    };
  });

  return products;
}

export async function initiateSessionForUser(
  lat: number,
  lng: number
): Promise<Session> {
  let deviceID = localStorage.getItem("deviceID")
  if(deviceID == null){
    deviceID = v4()
    localStorage.setItem("deviceID", deviceID)
  }
  const url = `https://grocery-api.comparely.co.in/start-session`;
  const body = {
    deviceID: deviceID,
    lat: String(lat),
    lng: String(lng)
  }
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  });
  const data = await response.json();
  setItem("session", data)
  console.log("rec sess", data)
  return data as Session
}