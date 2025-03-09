import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

import { fetchToCurl } from 'fetch-to-curl';

const app = express();
const PORT = process.env.PORT || 3000;
import cors from 'cors';


app.use(cors());

// Helper: Merge products by name from multiple sources
function mergeProducts(productArrays) {
  const merged = {};
  productArrays.flat().forEach(prod => {
    if (merged[prod.name]) {
      merged[prod.name].prices.push(...prod.prices);
      if(prod.brand != "") merged[prod.name].brand = prod.brand
    } else {
      merged[prod.name] = {
        id: uuidv4(),
        name: prod.name,
        prices: prod.prices
      };
      if(prod.brand != "") merged[prod.name].brand = prod.brand
    }
  });
  
  let finalArray = mergeAndRemoveDuplicates(Object.values(merged));
  finalArray.sort((a, b) => {
    const uniqueCountA = new Set(a.prices.map(item => item.source)).size;
    const uniqueCountB = new Set(b.prices.map(item => item.source)).size;
    return uniqueCountB - uniqueCountA; // Descending order
  });
  return finalArray
}

function mergeAndRemoveDuplicates(products) {
  return products.map(product => {
    const mergedPricesBySource = {};

    product.prices.forEach(price => {
      const { source, variants } = price;
      if (!mergedPricesBySource[source]) {
        mergedPricesBySource[source] = [];
      }
      variants.forEach(variant => {
        // Create a unique key for the variant (this assumes key order is consistent)
        const key = JSON.stringify(variant);
        // Only add if not already present
        if (!mergedPricesBySource[source].some(existing => JSON.stringify(existing) === key)) {
          mergedPricesBySource[source].push(variant);
        }
      });
    });

    // Reconstruct the prices array with each unique source and its merged variants
    const mergedPrices = Object.keys(mergedPricesBySource).map(source => ({
      source,
      variants: mergedPricesBySource[source]
    }));

    return { ...product, prices: mergedPrices };
  });
}

// Mapping for Blinkit response
function mapBlinkit(blinkitData) {
  if (!blinkitData || !Array.isArray(blinkitData.products)) return [];
  return blinkitData.products.map(product => {
    const variants = (product.variant_info || []).map(variant => ({
      original_price: variant.mrp,
      discounted_price: variant.price,
      deeplink: `https://blinkit.com/prn/x/prid/${variant.product_id}`,
      image_url: variant.image_url,
      weight: variant.unit || ""
    }));
    return {
      id: uuidv4(),
      name: product.name,
      brand: product.brand,
      prices: [{
        source: 'blinkit',
        variants
      }]
    };
  });
}

function formatSwiggyImages(url) {
  if(url.endsWith(".png")){
    return "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_252,h_272/" + url
  }else{
    return "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_252,h_272/" + url + ".png"
  }
}

function formatZeptoImages(url){
  return "https://cdn.zeptonow.com/production/tr:w-400,ar-1021-1021,pr-true,f-auto,q-80/" + url
}

// Mapping for Instamart response
function mapInstamart(instaData) {
  if (!instaData || typeof instaData !== 'object') return [];
  if (!instaData.data || !Array.isArray(instaData.data.widgets)) return [];
  
  const items = [];
  instaData.data.widgets.forEach(widget => {
    if (widget.data && Array.isArray(widget.data)) {
      items.push(...widget.data);
    }
  });
  
  return items.map(item => {
    const variations = item.variations || [];
    if (variations.length === 0) return null;
    const productName = variations[0].display_name || 'Unknown Product';
    const variants = variations.map(variation => ({
      original_price: variation.price.mrp,
      discounted_price: variation.price.offer_price || variation.price.store_price,
      deeplink: `https://www.swiggy.com/stores/instamart/item/${item.product_id}`,
      image_url: formatSwiggyImages((variation.images && variation.images.length > 0)
                  ? (typeof variation.images[0] === 'object' ? variation.images[0].path : variation.images[0])
                  : ""),
      weight: variation.sku_quantity_with_combo || "",
      brand: variation.brand || ""
    }));
    return {
      id: uuidv4(),
      name: productName,
      brand: variants[0].brand,
      prices: [{
        source: 'instamart',
        variants
      }]
    };
  }).filter(item => item !== null);
}

// Mapping for Zepto response
function mapZepto(zeptoData) {
    if (!zeptoData || !Array.isArray(zeptoData.layout)) return [];
    // Get all widgets with widgetId "PRODUCT_GRID"
    const gridWidgets = zeptoData.layout.filter(widget => widget.widgetId === 'PRODUCT_GRID');
    let items = [];
    gridWidgets.forEach(widget => {
      if (
        widget.data &&
        widget.data.resolver &&
        widget.data.resolver.data &&
        Array.isArray(widget.data.resolver.data.items)
      ) {
        items.push(...widget.data.resolver.data.items);
      }
    });
    
    return items.map(item => {
      const product = item.productResponse && item.productResponse.product;
      const variant = item.productResponse && item.productResponse.productVariant;
      if (!product || !variant) return null;
      return {
        id: uuidv4(),
        name: product.name,
        brand: product.brand,
        prices: [{
          source: 'zepto',
          variants: [{
            original_price: variant.mrp,
            discounted_price: (item.discountedSellingPrice || variant.offer_price || variant.store_price || variant.mrp)/100,
            deeplink: `https://www.zepto.com/pn/x/pvid/${variant.id}`,
            image_url: formatZeptoImages((variant.images && variant.images.length > 0 && variant.images[0].path) || ""),
            weight: variant.formattedPacksize || ""
          }]
        }]
      };
    }).filter(item => item !== null);
}

// Helper: Fetch JSON from a URL with given options
async function fetchJson(url, options) {
  const response = await fetch(url, options);
  fetchToCurl(url, options)
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`Failed to parse JSON from ${url}:`, err);
    return {};
  }
}

async function fetchBlinkitProducts(query) {
  const baseUrl = 'https://blinkit.com';
  let url = `${baseUrl}/v6/search/products?q=${encodeURIComponent(query)}`;
  const headers = {
    'accept': '*/*',
    'content-type': 'application/json',
    'lat': '12.9394384',
    'lon': '77.6247365',
    "Cookie":"__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
    "user-agent": "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
  };
  let allProducts = [];
  let count = 0;
  while (url && count < 5) {
    const data = await fetchJson(url, { method: 'GET', headers });
    if (data && Array.isArray(data.products)) {
      allProducts = allProducts.concat(data.products);
    }
    if (data.pagination && data.pagination.next_url) {
      url = baseUrl + data.pagination.next_url;
    } else {
      url = null;
    }
    count++;
  }
  return allProducts;
}

async function fetchInstamartProducts(query) {
  const baseUrl = 'https://www.swiggy.com/api/instamart/search';
  // Start with pageNumber 0 and searchResultsOffset 0.
  let pageNumber = 0;
  let searchResultsOffset = 0;
  let aggregatedWidgets = [];
  let count = 0;
  let hasMorePages = true;
  while (hasMorePages && count < 5) {
    // Construct URL with query parameters.
    const url = `${baseUrl}?query=${encodeURIComponent(query)}&ageConsent=true&pageNumber=${pageNumber}&searchResultsOffset=${searchResultsOffset}&storeId=1402463`;
    const options = {
      method: 'POST',
      headers: {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "priority": "u=1, i",
        "Cookie":"__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
        "user-agent": "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        facets: {},
        sortAttribute: ""
      })
    };

    const resp = await fetchJson(url, options);
    // Check if the response has the expected structure
    if (resp.data && Array.isArray(resp.data.widgets)) {
      aggregatedWidgets = aggregatedWidgets.concat(resp.data.widgets);
    }
    // Update pagination parameters if present.
    // Assume the response has top-level fields: pageNumber, hasMorePages, searchResultsOffset.
    pageNumber = (resp.pageNumber !== undefined) ? resp.pageNumber + 1 : pageNumber + 1;
    searchResultsOffset = resp.searchResultsOffset || searchResultsOffset;
    hasMorePages = resp.hasMorePages !== false; // Stop if explicitly false
    count++;
  }
  // Return aggregated widgets wrapped as { data: { widgets: aggregatedWidgets } } for mapping.
  return { data: { widgets: aggregatedWidgets } };
}

async function searchProducts(query) {
  // Blinkit: GET request
  const blinkitUrl = `https://blinkit.com/v6/search/products?q=${query}`;
  const blinkitOptions = {
    method: 'GET',
    headers: {
      'accept': '*/*',
      'content-type': 'application/json',
      'lat': '12.9394384',
      'lon': '77.6247365',
      "Cookie":"__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
      "user-agent": "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
      "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
    }
  };

  // Instamart: POST request with headers
  const instamartUrl = `https://www.swiggy.com/api/instamart/search?query=${query}&ageConsent=false`;
  const instamartOptions = {
    method: 'POST',
    headers: {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "priority": "u=1, i",
      "Cookie":"__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
      "user-agent": "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      facets: {},
      sortAttribute: ""
    })
  };

  // Zepto: POST request
  const zeptoUrl = `https://api.zeptonow.com/api/v3/search`;
  const zeptoOptions = {
    method: 'POST',
    headers: {
      "accept": "application/json, text/plain, */*",
      "appversion": "12.55.1",
      "content-type": "application/json",
      "Cookie":"__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
      "marketplace_type": "ZEPTO_NOW",
      "storeid": "fa5e892d-65d7-4da6-9bde-e1f22deb7b6f"
    },
    body: JSON.stringify({
      query,
      pageNumber: 0
    })
  };

  const zeptoData = await fetchJson(zeptoUrl, zeptoOptions)

  const blinkitProductsData = await fetchBlinkitProducts(query);
  // Wrap the accumulated array into an object with property "products" for mapping.
  const blinkitProducts = mapBlinkit({ products: blinkitProductsData });
  const instaAggregatedData = await fetchInstamartProducts(query);
  const instamartProducts = mapInstamart(instaAggregatedData);
  const zeptoProducts = mapZepto(zeptoData);

  console.log("blinkit products, instamart products, zepto products", blinkitProducts.length, instamartProducts.length, zeptoProducts.length)

  const mergedProducts = mergeProducts([blinkitProducts, instamartProducts, zeptoProducts]);
  return mergedProducts;
}

app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });
  try {
    const products = await searchProducts(query);
    res.json(products);
  } catch (err) {
    console.error('Error during search:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
