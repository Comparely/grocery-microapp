package search

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/comparely/comparely-grocery-backend/config"
	"github.com/comparely/comparely-grocery-backend/sessions"
	"github.com/google/uuid"
	"github.com/jdkato/prose/v2"
)

// -----------------------
// Existing functions for mapping products remain unchanged

func mapBlinkit(data map[string]interface{}) []Product {
	var products []Product
	prods, ok := data["products"].([]interface{})
	if !ok {
		return products
	}
	for _, p := range prods {
		prodMap, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		name, _ := prodMap["name"].(string)
		brand, _ := prodMap["brand"].(string)
		var weight string
		var variants []Variant
		if vi, ok := prodMap["variant_info"].([]interface{}); ok && len(vi) > 0 {
			// Use first variant's "unit" as product weight.
			if first, ok := vi[0].(map[string]interface{}); ok {
				weight, _ = first["unit"].(string)
			}
			for _, v := range vi {
				vm, ok := v.(map[string]interface{})
				if !ok {
					continue
				}
				mrp, _ := vm["mrp"].(float64)
				price, _ := vm["price"].(float64)
				productID := strconv.Itoa(int(vm["product_id"].(float64)))
				imageURL, _ := vm["image_url"].(string)
				unit, _ := vm["unit"].(string)
				variant := Variant{
					OriginalPrice:   mrp,
					DiscountedPrice: price,
					Deeplink:        fmt.Sprintf("https://blinkit.com/prn/x/prid/%s", productID),
					ImageURL:        imageURL,
					Weight:          unit,
				}
				variants = append(variants, variant)
			}
		}
		prod := Product{
			ID:     uuid.NewString(),
			Name:   name,
			Brand:  brand,
			Weight: weight,
			Prices: []PriceOption{
				{
					Source:   "blinkit",
					Variants: variants,
				},
			},
		}
		// Use the overall lowest variant to set product MRP and image.
		if len(variants) > 0 {
			lowest := variants[0]
			for _, v := range variants {
				if v.DiscountedPrice < lowest.DiscountedPrice {
					lowest = v
				}
			}
			prod.MRP = lowest.OriginalPrice
			prod.ImageURL = lowest.ImageURL
		}
		products = append(products, prod)
	}
	return products
}

func mapInstamart(data map[string]interface{}) []Product {
	var products []Product
	d, ok := data["data"].(map[string]interface{})
	if !ok {
		return products
	}
	widgets, ok := d["widgets"].([]interface{})
	if !ok {
		return products
	}
	var items []interface{}
	for _, w := range widgets {
		widget, ok := w.(map[string]interface{})
		if !ok {
			continue
		}
		if arr, ok := widget["data"].([]interface{}); ok {
			items = append(items, arr...)
		}
	}
	for _, item := range items {
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		variations, ok := itemMap["variations"].([]interface{})
		if !ok || len(variations) == 0 {
			continue
		}
		firstVar, ok := variations[0].(map[string]interface{})
		if !ok {
			continue
		}
		name, _ := firstVar["display_name"].(string)
		brand, _ := firstVar["brand"].(string)
		weight, _ := firstVar["unit"].(string)
		var variants []Variant
		// itemMap may have a "product_id" used in deeplink.
		productID, _ := itemMap["product_id"].(string)
		for _, v := range variations {
			vm, ok := v.(map[string]interface{})
			if !ok {
				continue
			}
			priceMap, _ := vm["price"].(map[string]interface{})
			mrp, _ := priceMap["mrp"].(float64)
			offerPrice, okOffer := priceMap["offer_price"].(float64)
			storePrice, _ := priceMap["store_price"].(float64)
			discounted := storePrice
			if okOffer && offerPrice > 0 {
				discounted = offerPrice
			}
			var imageURL string
			if imgs, ok := vm["images"].([]string); ok && len(imgs) > 0 {
				imageURL = formatSwiggyImages(imgs[0])
			} else if imgs, ok := vm["images"].([]interface{}); ok && len(imgs) > 0 {
				imageURL = formatSwiggyImages(imgs[0].(string))
			}
			unit, _ := vm["sku_quantity_with_combo"].(string)
			variant := Variant{
				OriginalPrice:   mrp,
				DiscountedPrice: discounted,
				Deeplink:        fmt.Sprintf("https://www.swiggy.com/stores/instamart/item/%s", productID),
				ImageURL:        imageURL,
				Weight:          unit,
			}
			variants = append(variants, variant)
		}
		prod := Product{
			ID:     uuid.NewString(),
			Name:   name,
			Brand:  brand,
			Weight: weight,
			Prices: []PriceOption{
				{
					Source:   "instamart",
					Variants: variants,
				},
			},
		}
		if len(variants) > 0 {
			lowest := variants[0]
			for _, v := range variants {
				if v.DiscountedPrice < lowest.DiscountedPrice {
					lowest = v
				}
			}
			prod.MRP = lowest.OriginalPrice
			prod.ImageURL = lowest.ImageURL
		}
		products = append(products, prod)
	}
	return products
}

// mapZepto extracts products from Zepto's response.
// It looks for all widgets with widgetId "PRODUCT_GRID" and extracts items from them.
func mapZepto(data map[string]interface{}) []Product {
	var products []Product
	layout, ok := data["layout"].([]interface{})
	if !ok {
		return products
	}
	var items []interface{}
	for _, widget := range layout {
		widgetMap, ok := widget.(map[string]interface{})
		if !ok {
			continue
		}
		if widgetMap["widgetId"] == "PRODUCT_GRID" {
			if d, ok := widgetMap["data"].(map[string]interface{}); ok {
				if resolver, ok := d["resolver"].(map[string]interface{}); ok {
					if resData, ok := resolver["data"].(map[string]interface{}); ok {
						if it, ok := resData["items"].([]interface{}); ok {
							items = append(items, it...)
						}
					}
				}
			}
		}
	}
	for _, item := range items {
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		pr, ok := itemMap["productResponse"].(map[string]interface{})
		if !ok {
			continue
		}
		productData, ok := pr["product"].(map[string]interface{})
		if !ok {
			continue
		}
		variantData, ok := pr["productVariant"].(map[string]interface{})
		if !ok {
			continue
		}
		name, _ := productData["name"].(string)
		brand, _ := productData["brand"].(string)
		weight, _ := productData["packsize"].(string)
		mrp, _ := variantData["mrp"].(float64)
		offerPrice, _ := variantData["offer_price"].(float64)
		storePrice, _ := variantData["store_price"].(float64)
		discounted := mrp
		if offerPrice > 0 {
			discounted = offerPrice
		} else if storePrice > 0 {
			discounted = storePrice
		}
		discounted = discounted / 100.0
		mrp = mrp / 100.0
		var imageURL string
		if imgs, ok := variantData["images"].([]interface{}); ok && len(imgs) > 0 {
			if im, ok := imgs[0].(map[string]interface{}); ok {
				path, _ := im["path"].(string)
				imageURL = formatZeptoImages(path)
			}
		}
		deeplink := fmt.Sprintf("https://www.zeptonow.com/pn/x/pvid/%s", variantData["id"].(string))
		var varWeight string
		if variWt, ok := variantData["formattedPacksize"].(string); ok {
			varWeight = variWt
		}
		variant := Variant{
			OriginalPrice:   mrp,
			DiscountedPrice: discounted,
			Deeplink:        deeplink,
			ImageURL:        imageURL,
			Weight:          varWeight,
		}
		prod := Product{
			ID:       uuid.NewString(),
			Name:     name,
			Brand:    brand,
			Weight:   weight,
			MRP:      mrp,
			ImageURL: imageURL,
			Prices: []PriceOption{
				{
					Source:   "zepto",
					Variants: []Variant{variant},
				},
			},
		}
		products = append(products, prod)
	}
	return products
}

// -----------------------
// New Helper Functions for Improved NLP Processing

// normalizeText standardizes text by lowercasing and removing punctuation.
func normalizeText(s string) string {
	s = strings.ToLower(s)
	// Remove punctuation (keeping spaces and letters only)
	s = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || r == ' ' {
			return r
		}
		return -1
	}, s)
	s = strings.TrimSpace(s)
	return s
}

// computeEmbedding returns a dummy 2-dimensional embedding for a given string.
// Replace this with a real embedding lookup using a pre-trained model.
func computeEmbedding(s string) []float64 {
	// For demonstration, we use two simple features:
	// 1. Length of the normalized string.
	// 2. Sum of (a=1, b=2, ..., z=26) for each letter.
	normalized := normalizeText(s)
	length := float64(len(normalized))
	sum := 0.0
	for _, ch := range normalized {
		if ch >= 'a' && ch <= 'z' {
			sum += float64(ch - 'a' + 1)
		}
	}
	return []float64{length, sum}
}

// cosineSimilarity computes the cosine similarity between two vectors.
func cosineSimilarity(vec1, vec2 []float64) float64 {
	if len(vec1) != len(vec2) {
		return 0
	}
	var dot, normA, normB float64
	for i := 0; i < len(vec1); i++ {
		dot += vec1[i] * vec2[i]
		normA += vec1[i] * vec1[i]
		normB += vec2[i] * vec2[i]
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return dot / (math.Sqrt(normA) * math.Sqrt(normB))
}

// clusterSuggestions groups suggestions based on cosine similarity of their embeddings.
// Suggestions with similarity above the threshold are grouped together.
// The representative suggestion from each cluster is chosen (here, the first one encountered).
func clusterSuggestions(suggestions []string, threshold float64) []string {
	type cluster struct {
		rep       string    // representative suggestion
		embedding []float64 // embedding of the representative
	}

	var clusters []cluster

	for _, suggestion := range suggestions {
		normalized := normalizeText(suggestion)
		embedding := computeEmbedding(normalized)
		added := false
		// Compare with existing clusters
		for i, cl := range clusters {
			if cosineSimilarity(embedding, cl.embedding) >= threshold {
				// Already in a similar cluster; you may update the representative if desired.
				added = true
				// Optionally, update the representative embedding (e.g., averaging)
				_ = i
				break
			}
		}
		if !added {
			// Create a new cluster with this suggestion as representative.
			clusters = append(clusters, cluster{rep: suggestion, embedding: embedding})
		}
	}

	// Extract representative suggestions from clusters.
	var result []string
	for _, cl := range clusters {
		result = append(result, cl.rep)
	}
	return result
}

// -----------------------
// Pagination and Fetch Functions remain unchanged

func fetchBlinkitProducts(query string, lat string, lng string) ([]interface{}, error) {
	baseUrl := "https://blinkit.com"
	url := fmt.Sprintf("%s/v6/search/products?q=%s", baseUrl, query)
	headers := map[string]string{
		"accept":       "*/*",
		"content-type": "application/json",
		"lat":          lat,
		"lon":          lng,
		"Cookie":       "__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"user-agent":   "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
		"User-Agent":   "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
	}
	allProducts := make([]interface{}, 0)
	count := 0
	for url != "" && count < 5 {
		result, err := fetchJSON(url, "GET", headers, "")
		if err != nil {
			return allProducts, err
		}
		if prods, ok := result["products"].([]interface{}); ok {
			allProducts = append(allProducts, prods...)
		}
		if pag, ok := result["pagination"].(map[string]interface{}); ok {
			if next, ok := pag["next_url"].(string); ok && next != "" {
				url = baseUrl + next
			} else {
				url = ""
			}
		} else {
			url = ""
		}
		count++
	}
	return allProducts, nil
}

func fetchInstamartProducts(query string, storeId string) (map[string]interface{}, error) {
	baseUrl := "https://www.swiggy.com/api/instamart/search"
	pageNumber := 0
	searchResultsOffset := 0
	aggregatedWidgets := make([]interface{}, 0)
	count := 0
	hasMorePages := true
	headers := map[string]string{
		"accept":          "*/*",
		"accept-language": "en-US,en;q=0.9",
		"cache-control":   "no-cache",
		"priority":        "u=1, i",
		"Cookie":          "__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"user-agent":      "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
		"content-type":    "application/json",
	}
	clientBody := func() string {
		b, _ := json.Marshal(map[string]interface{}{
			"facets":        map[string]interface{}{},
			"sortAttribute": "",
		})
		return string(b)
	}
	var result map[string]interface{}
	for hasMorePages && count < 5 {
		url := fmt.Sprintf("%s?query=%s&ageConsent=true&pageNumber=%d&searchResultsOffset=%d&storeId=%s",
			baseUrl, query, pageNumber, searchResultsOffset, storeId)
		res, err := fetchJSON(url, "POST", headers, clientBody())
		if err != nil {
			return nil, err
		}
		if data, ok := res["data"].(map[string]interface{}); ok {
			if widgets, ok := data["widgets"].([]interface{}); ok {
				aggregatedWidgets = append(aggregatedWidgets, widgets...)
			}
		}
		if pNum, ok := res["pageNumber"].(float64); ok {
			pageNumber = int(pNum) + 1
		} else {
			pageNumber++
		}
		if offset, ok := res["searchResultsOffset"].(float64); ok {
			searchResultsOffset = int(offset)
		}
		if more, ok := res["hasMorePages"].(bool); ok {
			hasMorePages = more
		} else {
			hasMorePages = false
		}
		result = res // keep last result if needed
		count++
	}
	_ = result
	return map[string]interface{}{
		"data": map[string]interface{}{
			"widgets": aggregatedWidgets,
		},
	}, nil
}

func fetchZeptoProducts(query string, storeId string, deviceID string) (map[string]interface{}, error) {
	zeptoUrl := "https://api.zeptonow.com/api/v3/search"

	// Headers aligned with successful request
	headers := map[string]string{
		"accept":                "application/json, text/plain, */*",
		"accept-language":       "en-US,en;q=0.9",
		"app_sub_platform":      "WEB",
		"app_version":           "12.63.1", // Updated from 12.55.1
		"appversion":            "12.63.1",
		"content-type":          "application/json",
		"marketplace_type":      "ZEPTO_NOW",
		"platform":              "WEB",
		"requestid":             deviceID,
		"storeid":               storeId,
		"tenant":                "ZEPTO",
		"user-agent":            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
		"origin":                "https://www.zeptonow.com",
		"referer":               "https://www.zeptonow.com/",
		"compatible_components": "CONVENIENCE_FEE,RAIN_FEE,EXTERNAL_COUPONS,STANDSTILL,BUNDLE,MULTI_SELLER_ENABLED,PIP_V1,ROLLUPS,SCHEDULED_DELIVERY,SAMPLING_ENABLED,ETA_NORMAL_WITH_149_DELIVERY,ETA_NORMAL_WITH_149_DELIVERY,HOMEPAGE_V2,NEW_ETA_BANNER,VERTICAL_FEED_PRODUCT_GRID,AUTOSUGGESTION_PAGE_ENABLED,AUTOSUGGESTION_PIP,AUTOSUGGESTION_AD_PIP,BOTTOM_NAV_FULL_ICON,COUPON_WIDGET_CART_REVAMP,DELIVERY_UPSELLING_WIDGET,MARKETPLACE_CATEGORY_GRID,NO_PLATFORM_CHECK_ENABLED_V2,SUPER_SAVER:1,SUPERSTORE_V1,PROMO_CASH:0,24X7_ENABLED_V1,TABBED_CAROUSEL_V2,HP_V4_FEED,WIDGET_BASED_ETA,NEW_FEE_STRUCTURE,NEW_BILL_INFO,RE_PROMISE_ETA_ORDER_SCREEN_ENABLED,SUPERSTORE_V1,MANUALLY_APPLIED_DELIVERY_FEE_RECEIVABLE,MARKETPLACE_REPLACEMENT,ZEPTO_PASS,ZEPTO_PASS:1,ZEPTO_PASS:2,ZEPTO_PASS_RENEWAL,CART_REDESIGN_ENABLED,SHIPMENT_WIDGETIZATION_ENABLED,TABBED_CAROUSEL_V2,24X7_ENABLED_V1,PROMO_CASH:0,HOMEPAGE_V2,SUPER_SAVER:1,NO_PLATFORM_CHECK_ENABLED_V2,HP_V4_FEED,GIFT_CARD,SCLP_ADD_MONEY,GIFTING_ENABLED,OFSE,WIDGET_BASED_ETA",
	}

	aggregatedLayout := make([]interface{}, 0)
	pageNumber := 0
	count := 0
	hasMorePages := true
	const maxRetries = 5
	var backoff time.Duration = 5 * time.Second // Initial backoff

	bodyFunc := func() string {
		b, _ := json.Marshal(map[string]interface{}{
			"query":      url.QueryEscape(query),
			"pageNumber": pageNumber,
			"store_ids":  storeId,
			"store_etas": map[string]int{storeId: -1},
		})
		return string(b)
	}

	for hasMorePages && count < 5 {
		for attempt := 0; attempt <= maxRetries; attempt++ {
			res, err := fetchJSON(zeptoUrl, "POST", headers, bodyFunc())
			if err != nil {
				return nil, fmt.Errorf("fetch attempt %d failed: %v", attempt+1, err)
			}

			if res["statusCode"] != nil && int(res["statusCode"].(float64)) == http.StatusTooManyRequests {
				if attempt == maxRetries {
					return nil, fmt.Errorf("max retries reached: Zepto returned 429 Too Many Requests")
				}
				retryAfter := ""
				if headersMap, ok := res["headers"].(map[string]interface{}); ok {
					if ra, ok := headersMap["Retry-After"].(string); ok {
						retryAfter = ra
					}
				}
				if retryAfter != "" {
					if seconds, err := strconv.Atoi(retryAfter); err == nil {
						backoff = time.Duration(seconds) * time.Second
					}
				} else {
					backoff = time.Duration(5*(attempt+1)) * time.Second // Linear: 5s, 10s, 15s, etc.
					if backoff > 30*time.Second {
						backoff = 30 * time.Second // Cap at 30s
					}
				}
				log.Printf("Rate limit hit on page %d, attempt %d/%d, retrying after %v", pageNumber, attempt+1, maxRetries, backoff)
				time.Sleep(backoff)
				continue
			}

			if layout, ok := res["layout"].([]interface{}); ok {
				aggregatedLayout = append(aggregatedLayout, layout...)
			}
			if more, ok := res["hasMorePages"].(bool); ok && more {
				pageNumber++
			} else {
				hasMorePages = false
			}
			break // Successful fetch, move to next page
		}
		count++
	}

	return map[string]interface{}{
		"layout": aggregatedLayout,
	}, nil
}

// -----------------------
// Merge products from different sources by name, remove duplicate variants.
func mergeProducts(productArrays [][]Product) []Product {
	merged := make(map[string]Product)
	for _, products := range productArrays {
		for _, prod := range products {
			if existing, ok := merged[prod.Name]; ok {
				existing.Prices = append(existing.Prices, prod.Prices...)
				merged[prod.Name] = existing
			} else {
				merged[prod.Name] = prod
			}
		}
	}
	// Optionally, remove duplicate variants per source.
	finalArray := make([]Product, 0, len(merged))
	for _, prod := range merged {
		priceMap := make(map[string][]Variant)
		for _, po := range prod.Prices {
			for _, v := range po.Variants {
				keyBytes, _ := json.Marshal(v)
				key := string(keyBytes)
				priceMap[po.Source] = appendIfNotExists(priceMap[po.Source], v, key)
			}
		}
		var mergedPrices []PriceOption
		for source, variants := range priceMap {
			mergedPrices = append(mergedPrices, PriceOption{Source: source, Variants: variants})
		}
		prod.Prices = mergedPrices
		finalArray = append(finalArray, prod)
	}

	sort.Slice(finalArray, func(i, j int) bool {
		return countUniqueSources(finalArray[i].Prices) > countUniqueSources(finalArray[j].Prices)
	})

	return finalArray
}

func SearchProducts(appState config.AppState, query string, deviceID string) ([]Product, error) {
	var (
		blinkitProducts   []Product
		instamartProducts []Product
		zeptoProducts     []Product

		errBlinkit, errInstamart, errZepto error
	)
	var lat, lng string
	var zeptoStoreId string
	var instamartStoreId string

	if deviceID != "" {
		ctx := context.Background()
		sess, err := sessions.GetSession(ctx, appState, deviceID)
		if err == nil {
			lat = sess.Lat
			lng = sess.Lng
			zeptoStoreId = sess.MarketPlaceAttributes.ZeptoStoreAttributes.StoreID
			instamartStoreId = sess.MarketPlaceAttributes.InstamartStoreAttributes.StoreID
		} else {
			log.Printf("Session not found for deviceID %s: %v", deviceID, err)
		}
	}
	if lat == "" && lng == "" {
		lat = "12.975060"
		lng = "77.604691"
	}
	if zeptoStoreId == "" {
		zeptoStoreId = "fa5e892d-65d7-4da6-9bde-e1f22deb7b6f"
	}
	if instamartStoreId == "" {
		instamartStoreId = "1402463"
	}
	var wg sync.WaitGroup
	wg.Add(3)

	// Blinkit
	go func() {
		defer wg.Done()
		blinkitRaw, err := fetchBlinkitProducts(url.QueryEscape(query), lat, lng)
		if err != nil {
			errBlinkit = err
			return
		}
		blinkitProducts = mapBlinkit(map[string]interface{}{"products": blinkitRaw})
	}()

	// Instamart
	go func() {
		defer wg.Done()
		instaRaw, err := fetchInstamartProducts(url.QueryEscape(query), instamartStoreId)
		if err != nil {
			errInstamart = err
			return
		}
		instamartProducts = mapInstamart(instaRaw)
	}()

	// Zepto
	go func() {
		defer wg.Done()
		zeptoRaw, err := fetchZeptoProducts(url.QueryEscape(query), zeptoStoreId, deviceID)
		if err != nil {
			errZepto = err
			return
		}
		zeptoProducts = mapZepto(zeptoRaw)
	}()

	wg.Wait()

	// Check errors (you could choose to ignore some errors if desired).
	if errBlinkit != nil {
		return nil, errBlinkit
	}
	if errInstamart != nil {
		return nil, errInstamart
	}
	if errZepto != nil {
		return nil, errZepto
	}

	log.Printf("blinkit: %d, instamart: %d, zepto: %d", len(blinkitProducts), len(instamartProducts), len(zeptoProducts))

	mergedProducts := mergeProducts([][]Product{blinkitProducts, instamartProducts, zeptoProducts})
	return mergedProducts, nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// ZeptoSuggestions fetches product suggestions from Zepto based on a query.
// This updated version applies text normalization, computes dummy embeddings for semantic similarity,
// and then clusters the suggestions to remove redundancy and irrelevant items.
func ZeptoSuggestions(appState config.AppState, query string, deviceID string) ([]string, error) {
	var storeID, sessionID, cookie, xsrfToken, lat, lng string

	// Fetch session
	if deviceID != "" {
		ctx := context.Background()
		sess, err := sessions.GetSession(ctx, appState, deviceID)
		if err == nil {
			storeID = sess.MarketPlaceAttributes.ZeptoStoreAttributes.StoreID
			sessionID = sess.ZeptoAuth.SessionID
			cookie = sess.ZeptoAuth.Cookie
			xsrfToken = sess.ZeptoAuth.XSRFToken
			lat = sess.Lat
			lng = sess.Lng
			log.Printf("Using session - StoreID: %s, SessionID: %s, Lat: %s, Lng: %s", storeID, sessionID, lat, lng)

			if !sess.MarketPlaceAttributes.ZeptoStoreAttributes.Serviceable {
				log.Printf("Session store not serviceable, refreshing session")
				storeAttributes, authData, err := sessions.FetchZeptoStoreDetails(lat, lng, sessionID)
				if err != nil {
					log.Printf("Failed to refresh Zepto session: %v", err)
				} else {
					sess.MarketPlaceAttributes.ZeptoStoreAttributes = storeAttributes
					sess.ZeptoAuth = authData
					err = sessions.SaveSession(ctx, appState, &sess)
					if err != nil {
						log.Printf("Failed to save refreshed session: %v", err)
					}
					storeID = sess.MarketPlaceAttributes.ZeptoStoreAttributes.StoreID
					sessionID = sess.ZeptoAuth.SessionID
					cookie = sess.ZeptoAuth.Cookie
					xsrfToken = sess.ZeptoAuth.XSRFToken
				}
			}
		} else {
			log.Printf("Session not found for deviceID %s: %v, using defaults", deviceID, err)
		}
	}

	// Fallback defaults
	if storeID == "" {
		storeID = "fa5e892d-65d7-4da6-9bde-e1f22deb7b6f"
	}
	if sessionID == "" {
		sessionID = uuid.New().String()
	}
	if lat == "" {
		lat = "12.975060"
	}
	if lng == "" {
		lng = "77.604691"
	}

	// Headers aligned with successful request
	headers := map[string]string{
		"accept":                "application/json, text/plain, */*",
		"accept-language":       "en-US,en;q=0.9",
		"app_sub_platform":      "WEB",
		"app_version":           "12.63.1", // Updated from 12.55.3
		"appversion":            "12.63.1",
		"content-type":          "application/json",
		"marketplace_type":      "ZEPTO_NOW",
		"platform":              "WEB",
		"requestid":             sessionID,
		"storeid":               storeID,
		"tenant":                "ZEPTO",
		"user-agent":            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
		"origin":                "https://www.zeptonow.com",
		"referer":               "https://www.zeptonow.com/",
		"compatible_components": "CONVENIENCE_FEE,RAIN_FEE,EXTERNAL_COUPONS,STANDSTILL,BUNDLE,MULTI_SELLER_ENABLED,PIP_V1,ROLLUPS,SCHEDULED_DELIVERY,SAMPLING_ENABLED,ETA_NORMAL_WITH_149_DELIVERY,ETA_NORMAL_WITH_149_DELIVERY,HOMEPAGE_V2,NEW_ETA_BANNER,VERTICAL_FEED_PRODUCT_GRID,AUTOSUGGESTION_PAGE_ENABLED,AUTOSUGGESTION_PIP,AUTOSUGGESTION_AD_PIP,BOTTOM_NAV_FULL_ICON,COUPON_WIDGET_CART_REVAMP,DELIVERY_UPSELLING_WIDGET,MARKETPLACE_CATEGORY_GRID,NO_PLATFORM_CHECK_ENABLED_V2,SUPER_SAVER:1,SUPERSTORE_V1,PROMO_CASH:0,24X7_ENABLED_V1,TABBED_CAROUSEL_V2,HP_V4_FEED,WIDGET_BASED_ETA,NEW_FEE_STRUCTURE,NEW_BILL_INFO,RE_PROMISE_ETA_ORDER_SCREEN_ENABLED,SUPERSTORE_V1,MANUALLY_APPLIED_DELIVERY_FEE_RECEIVABLE,MARKETPLACE_REPLACEMENT,ZEPTO_PASS,ZEPTO_PASS:1,ZEPTO_PASS:2,ZEPTO_PASS_RENEWAL,CART_REDESIGN_ENABLED,SHIPMENT_WIDGETIZATION_ENABLED,TABBED_CAROUSEL_V2,24X7_ENABLED_V1,PROMO_CASH:0,HOMEPAGE_V2,SUPER_SAVER:1,NO_PLATFORM_CHECK_ENABLED_V2,HP_V4_FEED,GIFT_CARD,SCLP_ADD_MONEY,GIFTING_ENABLED,OFSE,WIDGET_BASED_ETA",
	}
	if cookie != "" {
		headers["Cookie"] = cookie
	}
	if xsrfToken != "" {
		headers["x-xsrf-token"] = xsrfToken // Uncommented to use if available
	}

	// Payload
	payload := map[string]interface{}{
		"query":         url.QueryEscape(query),
		"pageNumber":    0,
		"mode":          "AUTOSUGGEST",
		"intentId":      uuid.New().String(),
		"userSessionId": sessionID,
		"store_etas":    map[string]int{storeID: -1},
		"store_ids":     storeID,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %v", err)
	}

	// Make API call
	result, err := fetchJSON("https://api.zeptonow.com/api/v3/search", "POST", headers, string(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch suggestions: %v", err)
	}

	// Determine the primary category from the API response
	var primaryCategory string
	if meta, ok := result["meta"].(map[string]interface{}); ok {
		if category, ok := meta["plp_primary_category_name_from_recall"].(string); ok {
			primaryCategory = category
		}
	}

	// Fallback to a broader set of categories if primary category is not found
	allowedCategories := map[string]bool{
		"Munchies":     true,
		"Ice Creams":   true,
		"Chocolates":   true,
		"Beverages":    true,
		"Dairy":        true,
		"Snacks":       true,
		"Frozen Foods": true,
	}
	if primaryCategory != "" {
		allowedCategories = map[string]bool{primaryCategory: true}
	}

	// Extract suggestions from PRODUCT_GRID widgets
	suggestions := []string{}
	seen := make(map[string]bool)
	if layout, ok := result["layout"].([]interface{}); ok {
		for i, widget := range layout {
			widgetMap, ok := widget.(map[string]interface{})
			if !ok {
				log.Printf("Layout item %d is not a map", i)
				continue
			}
			widgetID, _ := widgetMap["widgetId"].(string)
			widgetName, _ := widgetMap["widgetName"].(string)

			if widgetID == "PRODUCT_GRID" {
				if data, ok := widgetMap["data"].(map[string]interface{}); ok {
					if resolver, ok := data["resolver"].(map[string]interface{}); ok {
						if resolverData, ok := resolver["data"].(map[string]interface{}); ok {
							if items, ok := resolverData["items"].([]interface{}); ok {
								for _, item := range items {
									itemMap, ok := item.(map[string]interface{})
									if !ok {
										continue
									}
									productResponse, ok := itemMap["productResponse"].(map[string]interface{})
									if !ok {
										continue
									}

									// Check category to filter out unrelated items
									primaryCategory, _ := productResponse["primaryCategoryName"].(string)
									if primaryCategory != "" && !allowedCategories[primaryCategory] {
										continue
									}

									name, ok := productResponse["name"].(string)
									if !ok {
										if product, ok := productResponse["product"].(map[string]interface{}); ok {
											name, ok = product["name"].(string)
											if !ok {
												continue
											}
										} else {
											continue
										}
									}

									// Extract key terms using NLP
									cleanedName, err := extractKeyTerms(name)
									if err != nil {
										log.Printf("Failed to extract key terms for name %s: %v", name, err)
										continue
									}
									if cleanedName == "" {
										log.Printf("No key terms extracted for name %s", name)
										continue
									}

									if !seen[cleanedName] {
										suggestions = append(suggestions, cleanedName)
										seen[cleanedName] = true
									}
								}
							} else {
								log.Printf("Items missing or not an array in widget %s", widgetName)
							}
						}
					}
				}
			}
		}
	} else {
		log.Printf("Layout missing or not an array in response")
	}

	// Rank suggestions based on similarity to the query
	rankedSuggestions := rankSuggestions(query, suggestions)

	// Extract the ranked names
	finalSuggestions := []string{}
	for _, suggestion := range rankedSuggestions {
		finalSuggestions = append(finalSuggestions, suggestion.Name)
	}

	if len(finalSuggestions) == 0 {
	} else {
		log.Printf("Final suggestions: %v", finalSuggestions)
	}
	return finalSuggestions, nil
}

// -----------------------
// Utility Fetch Functions

// ProductSuggestion represents a suggestion with its score
type ProductSuggestion struct {
	Name  string
	Score float64
}

// extractKeyTerms uses NLP to extract the most relevant terms from a product name
func extractKeyTerms(name string) (string, error) {
	// Create a new document from the product name
	doc, err := prose.NewDocument(name)
	if err != nil {
		return "", fmt.Errorf("failed to process name with NLP: %v", err)
	}

	// Tokenize and extract key terms
	tokens := []string{}
	for _, tok := range doc.Tokens() {
		// Skip tokens that are likely pack sizes or units (e.g., "52", "g", "combo")
		if strings.ContainsAny(tok.Text, "0123456789") || strings.ToLower(tok.Text) == "combo" {
			continue
		}
		// Use the token in lowercase
		token := strings.ToLower(tok.Text)
		// Skip common filler words
		if token == "yummy" || token == "delicious" || token == "pack" {
			continue
		}
		tokens = append(tokens, token)
	}

	// Extract key terms (take up to 3 significant tokens to capture more context)
	keyTerms := []string{}
	for i, token := range tokens {
		if i < 3 { // Limit to 3 tokens to keep suggestions concise
			keyTerms = append(keyTerms, token)
		}
	}

	// Join the key terms into a suggestion
	if len(keyTerms) == 0 {
		return "", nil // No meaningful terms extracted
	}
	suggestion := strings.Join(keyTerms, " ")
	return suggestion, nil
}

// levenshteinDistance calculates the Levenshtein distance between two strings
func levenshteinDistance(s1, s2 string) int {
	s1 = strings.ToLower(s1)
	s2 = strings.ToLower(s2)
	if len(s1) < len(s2) {
		return levenshteinDistance(s2, s1)
	}

	if len(s2) == 0 {
		return len(s1)
	}

	previousRow := make([]int, len(s2)+1)
	for i := 0; i <= len(s2); i++ {
		previousRow[i] = i
	}

	for i := 1; i <= len(s1); i++ {
		currentRow := make([]int, len(s2)+1)
		currentRow[0] = i

		for j := 1; j <= len(s2); j++ {
			cost := 1
			if s1[i-1] == s2[j-1] {
				cost = 0
			}
			currentRow[j] = min(
				previousRow[j]+1,      // deletion
				currentRow[j-1]+1,     // insertion
				previousRow[j-1]+cost, // substitution
			)
		}
		previousRow = currentRow
	}

	return previousRow[len(s2)]
}

func min(a, b, c int) int {
	if a < b {
		if a < c {
			return a
		}
		return c
	}
	if b < c {
		return b
	}
	return c
}

// rankSuggestions ranks suggestions based on Levenshtein distance to the query
func rankSuggestions(queryStr string, suggestions []string) []ProductSuggestion {
	rankedSuggestions := []ProductSuggestion{}
	for _, suggestion := range suggestions {
		// Calculate Levenshtein distance
		distance := levenshteinDistance(queryStr, suggestion)
		// Convert distance to a similarity score (lower distance = higher score)
		score := 1.0 / (float64(distance) + 1.0) // Add 1 to avoid division by zero
		rankedSuggestions = append(rankedSuggestions, ProductSuggestion{
			Name:  suggestion,
			Score: score,
		})
	}

	// Sort by score (descending)
	sort.Slice(rankedSuggestions, func(i, j int) bool {
		return rankedSuggestions[i].Score > rankedSuggestions[j].Score
	})

	return rankedSuggestions
}

func fetchJSON(url string, method string, headers map[string]string, body string) (map[string]interface{}, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest(method, url, strings.NewReader(body))
	if err != nil {
		return nil, err
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		log.Printf("Failed to parse JSON response: %v", err)
		return nil, err
	}

	return result, nil
}
