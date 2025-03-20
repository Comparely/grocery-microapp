package search

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/comparely/comparely-grocery-backend/config"
	"github.com/comparely/comparely-grocery-backend/sessions"
	"github.com/google/uuid"
)

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
// It adds brand from product.brand and weight from product.packsize.
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
// Helper: fetchJSON makes an HTTP request and parses the JSON response.

// -----------------------
// Pagination functions

// fetchBlinkitProducts fetches up to 5 pages from Blinkit.
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

// fetchInstamartProducts fetches up to 5 pages from Instamart.
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

// fetchZeptoProducts fetches up to 5 pages from Zepto.
func fetchZeptoProducts(query string, storeId string) (map[string]interface{}, error) {
	zeptoUrl := "https://api.zeptonow.com/api/v3/search"
	headers := map[string]string{
		"accept":           "application/json, text/plain, */*",
		"appversion":       "12.55.1",
		"content-type":     "application/json",
		"Cookie":           "latitude=some; longitude=some; __SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"marketplace_type": "ZEPTO_NOW",
		"storeid":          storeId,
	}
	aggregatedLayout := make([]interface{}, 0)
	pageNumber := 0
	count := 0
	hasMorePages := true
	bodyFunc := func() string {
		b, _ := json.Marshal(map[string]interface{}{
			"query":      query,
			"pageNumber": pageNumber,
		})
		return string(b)
	}
	for hasMorePages && count < 5 {
		res, err := fetchJSON(zeptoUrl, "POST", headers, bodyFunc())
		if err != nil {
			return nil, err
		}
		if layout, ok := res["layout"].([]interface{}); ok {
			aggregatedLayout = append(aggregatedLayout, layout...)
		}
		if more, ok := res["hasMorePages"].(bool); ok && more {
			pageNumber++
		} else {
			hasMorePages = false
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
		zeptoRaw, err := fetchZeptoProducts(url.QueryEscape(query), zeptoStoreId)
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

// ZeptoSuggestions fetches product suggestions from Zepto based on a query

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
				storeAttributes, authData, err := sessions.FetchZeptoStoreDetails(lat, lng)
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

	// Headers
	headers := map[string]string{
		"accept":                "application/json, text/plain, */*",
		"accept-language":       "en-US,en;q=0.9",
		"app_sub_platform":      "WEB",
		"app_version":           "12.55.3",
		"appversion":            "12.55.3",
		"auth_revamp_flow":      "v2",
		"compatible_components": "CONVENIENCE_FEE,RAIN_FEE,EXTERNAL_COUPONS,STANDSTILL,BUNDLE,MULTI_SELLER_ENABLED,PIP_V1,ROLLUPS,SCHEDULED_DELIVERY,SAMPLING_ENABLED,ETA_NORMAL_WITH_149_DELIVERY,ETA_NORMAL_WITH_199_DELIVERY,HOMEPAGE_V2,NEW_ETA_BANNER,VERTICAL_FEED_PRODUCT_GRID,AUTOSUGGESTION_PAGE_ENABLED,AUTOSUGGESTION_PIP,AUTOSUGGESTION_AD_PIP,BOTTOM_NAV_FULL_ICON,COUPON_WIDGET_CART_REVAMP,DELIVERY_UPSELLING_WIDGET,MARKETPLACE_CATEGORY_GRID,NO_PLATFORM_CHECK_ENABLED_V2,SUPER_SAVER:1,SUPERSTORE_V1,PROMO_CASH:0,24X7_ENABLED_V1,TABBED_CAROUSEL_V2,HP_V4_FEED,NEW_ROLLUPS_ENABLED,RERANKING_QCL_RELATED_PRODUCTS,PLP_ON_SEARCH,PAAN_BANNER_WIDGETIZED,ROLLUPS_UOM,DYNAMIC_FILTERS,PHARMA_ENABLED,AUTOSUGGESTION_RECIPE_PIP,SEARCH_FILTERS_V1,QUERY_DESCRIPTION_WIDGET,MEDS_WITH_SIMILAR_SALT_WIDGET,NEW_FEE_STRUCTURE,NEW_BILL_INFO,RE_PROMISE_ETA_ORDER_SCREEN_ENABLED,SUPERSTORE_V1,MANUALLY_APPLIED_DELIVERY_FEE_RECEIVABLE,MARKETPLACE_REPLACEMENT,ZEPTO_PASS,ZEPTO_PASS:1,ZEPTO_PASS:2,ZEPTO_PASS_RENEWAL,CART_REDESIGN_ENABLED,SHIPMENT_WIDGETIZATION_ENABLED,TABBED_CAROUSEL_V2,24X7_ENABLED_V1,PROMO_CASH:0,HOMEPAGE_V2,SUPER_SAVER:1,NO_PLATFORM_CHECK_ENABLED_V2",
		"content-type":          "application/json",
		"marketplace_type":      "ZEPTO_NOW",
		"origin":                "https://www.zeptonow.com",
		"platform":              "WEB",
		"referer":               "https://www.zeptonow.com/",
		"session_id":            sessionID,
		"storeid":               storeID,
		"tenant":                "ZEPTO",
		"user-agent":            "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
	}
	if cookie != "" {
		headers["Cookie"] = cookie
	}
	if xsrfToken != "" {
		headers["X-XSRF-TOKEN"] = xsrfToken
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
	log.Printf("Request payload: %s", string(payloadBytes))
	log.Printf("Request headers: %v", headers)

	// Make API call
	result, err := fetchJSON("https://api.zeptonow.com/api/v3/search", "POST", headers, string(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch suggestions: %v", err)
	}

	// Log response
	resultBytes, _ := json.MarshalIndent(result, "", "  ")
	log.Printf("Zepto API Raw Response: %s", string(resultBytes))
	logFile, err := os.OpenFile("zepto_suggestions_log.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("Failed to open log file: %v", err)
	} else {
		defer logFile.Close()
		timestamp := time.Now().Format("2006-01-02 15:04:05")
		logEntry := fmt.Sprintf("\n[%s] Query: %s\nResponse: %s\n", timestamp, query, string(resultBytes))
		if _, err := logFile.WriteString(logEntry); err != nil {
			log.Printf("Failed to write to log file: %v", err)
		}
	}

	// Extract suggestions from PRODUCT_GRID widgets
	suggestions := []string{}
	seen := make(map[string]bool) // To avoid duplicates
	if layout, ok := result["layout"].([]interface{}); ok {
		log.Printf("Found %d layout items", len(layout))
		for i, widget := range layout {
			widgetMap, ok := widget.(map[string]interface{})
			if !ok {
				log.Printf("Layout item %d is not a map", i)
				continue
			}
			widgetID, _ := widgetMap["widgetId"].(string)
			widgetName, _ := widgetMap["widgetName"].(string)
			log.Printf("Processing widget - ID: %s, Name: %s", widgetID, widgetName)

			if widgetID == "PRODUCT_GRID" {
				if data, ok := widgetMap["data"].(map[string]interface{}); ok {
					if resolver, ok := data["resolver"].(map[string]interface{}); ok {
						if resolverData, ok := resolver["data"].(map[string]interface{}); ok {
							if items, ok := resolverData["items"].([]interface{}); ok {
								log.Printf("Found %d items in widget %s", len(items), widgetName)
								for j, item := range items {
									itemMap, ok := item.(map[string]interface{})
									if !ok {
										log.Printf("Item %d in widget %s is not a map", j, widgetName)
										continue
									}
									productResponse, ok := itemMap["productResponse"].(map[string]interface{})
									if !ok {
										log.Printf("productResponse missing in item %d of widget %s", j, widgetName)
										continue
									}
									name, ok := productResponse["name"].(string)
									if !ok {
										if product, ok := productResponse["product"].(map[string]interface{}); ok {
											name, ok = product["name"].(string)
											if !ok {
												log.Printf("Name missing in product of item %d in widget %s", j, widgetName)
												continue
											}
										} else {
											log.Printf("product missing in item %d of widget %s", j, widgetName)
											continue
										}
									}
									if !seen[name] {
										suggestions = append(suggestions, name)
										seen[name] = true
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

	if len(suggestions) == 0 {
		log.Printf("No suggestions extracted. Query: %s", query)
	} else {
		log.Printf("Extracted Suggestions: %v", suggestions)
	}
	return suggestions, nil
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

	log.Printf("Zepto Response Status: %s", resp.Status)
	log.Printf("Zepto Response Headers: %v", resp.Header)

	bodyBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	log.Printf("Zepto Raw Response Body: %s", string(bodyBytes))

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		log.Printf("Failed to parse JSON response: %v", err)
		return nil, err
	}

	return result, nil
}
