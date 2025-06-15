package search

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/chromedp/cdproto/browser"
	"github.com/chromedp/cdproto/emulation"
	"github.com/chromedp/cdproto/fetch"
	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
	"github.com/comparely/comparely-grocery-backend/config"
	"github.com/comparely/comparely-grocery-backend/sessions"
	"github.com/go-redis/redis/v8"
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
		offerPrice, _ := pr["discountedSellingPrice"].(float64)
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

func mapBigBasket(data map[string]any) []Product {
	rawProds, ok := data["data"].(map[string]any)["products"].([]any)
	if !ok {
		return nil
	}
	log.Printf("Bigbasket prods %d", len(rawProds))

	mapped := make([]Product, 0, len(rawProds))
	for _, item := range rawProds {
		raw, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if p, err := mapBBRawProduct(raw); err == nil {
			mapped = append(mapped, p)
		}
	}
	return mapped
}

func mapBBRawProduct(raw map[string]interface{}) (Product, error) {
	id, _ := raw["id"].(string)

	name, _ := raw["desc"].(string)

	brand := ""
	if b, ok := raw["brand"].(map[string]interface{}); ok {
		brand, _ = b["name"].(string)
	}

	weight, _ := raw["w"].(string)
	if weight == "" {
		mag := fmt.Sprint(raw["magnitude"])
		unit := fmt.Sprint(raw["unit"])
		weight = mag + unit
	}

	imageURL := ""
	if imgs, ok := raw["images"].([]interface{}); ok && len(imgs) > 0 {
		if first, ok := imgs[0].(map[string]interface{}); ok {
			imageURL, _ = first["l"].(string)
		}
	}

	mrp := 0.0
	if pricing, ok := raw["pricing"].(map[string]interface{}); ok {
		if discount, ok := pricing["discount"].(map[string]interface{}); ok {
			if mrpStr, ok := discount["mrp"].(string); ok && mrpStr != "" {
				if f, err := strconv.ParseFloat(mrpStr, 64); err == nil {
					mrp = f
				}
			}
		}
	}

	prices := []PriceOption{}
	if pricing, ok := raw["pricing"].(map[string]interface{}); ok {
		if discount, ok := pricing["discount"].(map[string]interface{}); ok {
			if prim, ok := discount["prim_price"].(map[string]interface{}); ok {
				sp := 0.0
				if spStr, ok := prim["sp"].(string); ok && spStr != "" {
					if f, err := strconv.ParseFloat(spStr, 64); err == nil {
						sp = f
					}
				}
				deeplink, _ := raw["absolute_url"].(string)
				deeplink = fmt.Sprintf("https://www.bigbasket.com/%s", deeplink)

				variant := Variant{
					OriginalPrice:   mrp,
					DiscountedPrice: sp,
					Deeplink:        deeplink,
					ImageURL:        imageURL,
					Weight:          weight,
				}

				prices = append(prices, PriceOption{
					Source:   "bigbasket",
					Variants: []Variant{variant},
				})
			}
		}
	}

	return Product{
		ID:       id,
		Name:     name,
		Brand:    brand,
		Weight:   weight,
		MRP:      mrp,
		ImageURL: imageURL,
		Prices:   prices,
	}, nil
}

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

func fetchBigBasketProducts(query string, lat string, lng string) (map[string]any, error) {
	baseUrl := "https://bbnow.bigbasket.com/listing-svc/v2/products"
	pageNumber := 1
	aggregatedProducts := make([]any, 0)
	count := 0
	hasMorePages := true
	latLngB64 := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s|%s", lat, lng)))
	headers := map[string]string{
		"accept":          "*/*",
		"accept-language": "en-US,en;q=0.9",
		"cache-control":   "no-cache",
		"priority":        "u=1, i",
		"Cookie":          fmt.Sprintf("_bb_vid=NzIyNDQ1Mjc5NzE1ODM2OTEw; _is_tobacco_enabled=1; _bb_lat_long=%s;", latLngB64),
		"user-agent":      "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
		"content-type":    "application/json",
	}

	log.Printf(fmt.Sprintf("_bb_vid=NzIyNDQ1Mjc5NzE1ODM2OTEw; _is_tobacco_enabled=1; _bb_lat_long=%s;", latLngB64))

	for hasMorePages && count < 5 {
		url := fmt.Sprintf("%s?type=ps&slug=%s&page=%d",
			baseUrl, query, pageNumber)
		res, err := fetchJSON(url, "GET", headers, "")
		if err != nil {
			return nil, err
		}

		if _, hasErrors := res["errors"]; hasErrors {
			return nil, fmt.Errorf("unservicable area")
		}
		if data, ok := res["tabs"].([]any)[0].(map[string]interface{}); ok {
			if prodInfo, ok := data["product_info"].(map[string]interface{}); ok {
				if products, ok := prodInfo["products"].([]any); ok {
					aggregatedProducts = append(aggregatedProducts, products...)
				}
			}
		}
		hasMorePages = false
	}
	log.Printf("aggregated_prods %d", len(aggregatedProducts))
	return map[string]interface{}{
		"data": map[string]interface{}{
			"products": aggregatedProducts,
		},
	}, nil
}

// fetchZeptoProducts fetches up to 5 pages from Zepto.
func fetchZeptoProducts(query string, storeId string, deviceID string) (map[string]interface{}, error) {
	zeptoUrl := "https://api.zeptonow.com/api/v3/search"
	headers := map[string]string{
		"accept":            "application/json, text/plain, */*",
		"appversion":        "12.63.1",
		"content-type":      "application/json",
		"Cookie":            "latitude=some; longitude=some; __SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"marketplace_type":  "ZEPTO_NOW",
		"requestid":         deviceID,
		"storeid":           storeId,
		"request-signature": "c030cf594f9d17a528909874ab4c490bf898510bd94ca31783c9a29599db49ed",
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
func fetchZeptoProductsV2(query, storeID, deviceID, lat, lng string) (map[string]interface{}, error) {
	prof := filepath.Join("./tmp", uuid.New().String())
	absProf, err := filepath.Abs(prof)
	if err != nil {
		return nil, fmt.Errorf("abs profileDir: %w", err)
	}
	if err := os.MkdirAll(absProf, 0700); err != nil {
		return nil, fmt.Errorf("mkdir profileDir: %w", err)
	}
	defer RemoveContents(absProf)
	edgeUA := "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
		"(KHTML, like Gecko) Chrome/115.0.5790.102 Safari/537.36 Edg/115.0.5790.102"

	allocCtx, cancelAlloc := chromedp.NewExecAllocator(
		context.Background(),
		chromedp.UserDataDir(absProf),
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("ignore-certificate-errors", true),
		chromedp.Flag("allow-insecure-localhost", true),
		chromedp.Flag("user-agent", edgeUA),
	)
	defer cancelAlloc()

	ctxBrowser, cancelBrowser := chromedp.NewContext(allocCtx)
	defer cancelBrowser()

	ctxRun, cancelRun := context.WithTimeout(ctxBrowser, 6*time.Second)
	defer cancelRun()

	respCh := make(chan []byte, 1)
	var requestID network.RequestID
	chromedp.ListenTarget(ctxBrowser, func(ev interface{}) {
		switch ev := ev.(type) {
		case *network.EventResponseReceived:
			//log.Printf("\nGot network: %s", ev.Response.URL)
			if ev.Type == network.ResourceTypeXHR &&
				strings.Contains(ev.Response.URL, "/api/v3/search") {
				//log.Printf("Got search \n")
				requestID = ev.RequestID
			}
		case *network.EventLoadingFinished:
			if ev.RequestID == requestID {
				log.Printf("Got search finish \n")
				go func(requestID network.RequestID) {
					var data []byte
					if err := chromedp.Run(ctxBrowser, chromedp.ActionFunc(func(ctx1 context.Context) error {
						var err error
						data, err = network.GetResponseBody(requestID).Do(ctx1)
						if err != nil {
							return err
						}
						//log.Printf("Got resp", data)
						return nil
					})); err != nil {
						log.Printf("could not read response body: %v", data)
					}
					if err == nil {
						select {
						case respCh <- data:
						default:
						}
					}
				}(ev.RequestID)
			}

		}
	})
	chromedp.ListenTarget(ctxBrowser, DisableImageLoad(ctxBrowser))

	latF, err := strconv.ParseFloat(lat, 64)
	if err != nil {
		return nil, err
	}
	lngF, err := strconv.ParseFloat(lng, 64)
	if err != nil {
		return nil, err
	}

	var outBody []byte
	var buf []byte
	runErr := chromedp.Run(ctxRun,
		network.Enable(),
		fetch.Enable(),
		browser.GrantPermissions([]browser.PermissionType{browser.PermissionTypeGeolocation}).
			WithOrigin("https://www.zeptonow.com"),
		emulation.SetGeolocationOverride().WithAccuracy(100).WithLatitude(latF).WithLongitude(lngF),
		chromedp.Navigate(fmt.Sprintf("https://www.zeptonow.com/search?query=%s", query)),
		chromedp.Sleep(2*time.Second), // wait for JS
		chromedp.FullScreenshot(&buf, 90),
		chromedp.ActionFunc(func(ctx context.Context) error {
			select {
			case b := <-respCh:
				outBody = b
				return nil
			case <-ctx.Done():
				return errors.New("timed out waiting for search API response")
			}
		}),
	)
	if runErr != nil {
		return nil, runErr
	}

	if err := os.WriteFile("./screen.png", buf, 0644); err != nil {
		log.Printf("could not create file: %+v", err)
	}

	var full map[string]interface{}
	if err := json.Unmarshal(outBody, &full); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w", err)
	}
	var agg []interface{}
	if layout, ok := full["layout"].([]interface{}); ok {
		agg = append(agg, layout...)
	}
	return map[string]interface{}{"layout": agg}, nil
}

func fetchZeptoProductsV3(query string, lat, lng string) (map[string]interface{}, error) {
	zeptoUrl := "http://zepto-alb-1456687545.ap-south-1.elb.amazonaws.com/zepto"
	headers := map[string]string{
		"accept":       "application/json, text/plain, */*",
		"content-type": "application/json",
		"Cookie":       "latitude=some; longitude=some; __SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
	}
	bodyFunc := func() string {
		b, _ := json.Marshal(map[string]interface{}{
			"query": query,
			"lat":   lat,
			"lng":   lng,
		})
		return string(b)
	}
	res, err := fetchJSON(zeptoUrl, "POST", headers, bodyFunc())
	if err != nil {
		return nil, err
	}
	return res, nil
}

// countMappedProducts counts how many products have mappings from multiple sources
func countMappedProducts(products []Product) int {
	count := 0
	for _, product := range products {
		if len(product.Prices) > 1 {
			count++
		}
	}
	return count
}

// mergeProducts combines products from different sources and applies the enhanced mapping system
func mergeProducts(availableProducts [][]Product, appState config.AppState, query string) []Product {
	// Flatten all products from all sources
	var allProducts []Product
	for _, sourceProducts := range availableProducts {
		allProducts = append(allProducts, sourceProducts...)
	}

	if len(allProducts) == 0 {
		return []Product{}
	}

	// Apply enhanced pending mappings using the new product-level caching system
	mergedProducts := applyEnhancedPendingMappings(allProducts, appState, query)

	// Group products by normalized name to merge similar products
	productGroups := make(map[string][]Product)
	for _, product := range mergedProducts {
		// Create a normalized key for grouping (lowercase, trimmed)
		normalizedName := strings.ToLower(strings.TrimSpace(product.Name))
		productGroups[normalizedName] = append(productGroups[normalizedName], product)
	}
	// Merge products within each group
	var finalProducts []Product
	for _, group := range productGroups {
		if len(group) == 1 {
			// Single product, no merging needed
			finalProducts = append(finalProducts, group[0])
		} else {
			// Multiple products with similar names, merge them
			merged := mergeProductGroup(group)
			finalProducts = append(finalProducts, merged)
		}
	}

	// Sort products by number of sources (more sources first)
	sort.Slice(finalProducts, func(i, j int) bool {
		sourcesI := len(finalProducts[i].Prices)
		sourcesJ := len(finalProducts[j].Prices)

		// Primary sort: by number of sources (descending)
		if sourcesI != sourcesJ {
			return sourcesI > sourcesJ
		}

		// Secondary sort: by product name (ascending) for consistent ordering
		return finalProducts[i].Name < finalProducts[j].Name
	})

	log.Printf("Sorted %d products for query '%s' (mapped: %d, unmapped: %d)",
		len(finalProducts), query, countMappedProducts(finalProducts),
		len(finalProducts)-countMappedProducts(finalProducts))

	return finalProducts
}

// mergeProductGroup merges multiple products with similar names into a single product
func mergeProductGroup(products []Product) Product {
	if len(products) == 0 {
		return Product{}
	}

	// Use the first product as the base
	merged := products[0]
	merged.ID = uuid.NewString() // Generate new ID for merged product

	// Merge all price options from other products
	sourceSet := make(map[string]bool)
	sourceSet[merged.Prices[0].Source] = true

	for i := 1; i < len(products); i++ {
		product := products[i]

		// Add price options from sources we haven't seen yet
		for _, priceOption := range product.Prices {
			if !sourceSet[priceOption.Source] {
				merged.Prices = append(merged.Prices, priceOption)
				sourceSet[priceOption.Source] = true
			} else {
				// Source already exists, merge variants
				for j, existingPriceOption := range merged.Prices {
					if existingPriceOption.Source == priceOption.Source {
						// Deduplicate variants by deeplink
						for _, variant := range priceOption.Variants {
							isDuplicate := false
							for _, existingVariant := range existingPriceOption.Variants {
								if existingVariant.Deeplink == variant.Deeplink {
									isDuplicate = true
									break
								}
							}
							if !isDuplicate {
								merged.Prices[j].Variants = append(merged.Prices[j].Variants, variant)
							}
						}
						break
					}
				}
			}
		}

		// Update product metadata if the new product has better data
		if merged.Brand == "" && product.Brand != "" {
			merged.Brand = product.Brand
		}
		if merged.Weight == "" && product.Weight != "" {
			merged.Weight = product.Weight
		}
		if merged.ImageURL == "" && product.ImageURL != "" {
			merged.ImageURL = product.ImageURL
		}
		if merged.MRP == 0 && product.MRP > 0 {
			merged.MRP = product.MRP
		}
	}

	return merged
}

// Helper functions for enhanced mapping
// Statistical functions
func calculateMappingEfficiency(products []Product) (float64, map[string]int) {
	total := len(products)
	mapped := countMappedProducts(products)

	sourceCount := make(map[string]int)
	for _, product := range products {
		for _, price := range product.Prices {
			sourceCount[price.Source]++
		}
	}

	efficiency := 0.0
	if total > 0 {
		efficiency = float64(mapped) / float64(total) * 100
	}

	return efficiency, sourceCount
}

func SearchProducts(appState config.AppState, query string, deviceID string) ([]Product, error) {
	var (
		blinkitProducts   []Product
		instamartProducts []Product
		zeptoProducts     []Product
		bigbasketProducts []Product
		errBlinkit        error
		errInstamart      error
		errZepto          error
		errBigbasket      error
	)
	var lat, lng string
	var zeptoStoreId string
	var instamartStoreId string

	// Fetch session data if deviceID is provided
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
	// Fallback to default coordinates and store IDs if not set
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

	// Use WaitGroup to handle concurrent fetches
	var wg sync.WaitGroup
	wg.Add(4)

	// Fetch from Blinkit
	go func() {
		defer wg.Done()
		blinkitRaw, err := fetchBlinkitProducts(url.QueryEscape(query), lat, lng)
		if err != nil {
			errBlinkit = err
			log.Printf("Blinkit fetch failed for query '%s': %v", query, err)
			return
		}
		blinkitProducts = mapBlinkit(map[string]interface{}{"products": blinkitRaw})
	}()

	// Fetch from Instamart
	go func() {
		defer wg.Done()
		instaRaw, err := fetchInstamartProducts(url.QueryEscape(query), instamartStoreId)
		if err != nil {
			errInstamart = err
			log.Printf("Instamart fetch failed for query '%s': %v", query, err)
			return
		}
		instamartProducts = mapInstamart(instaRaw)
	}()

	// Fetch from Zepto
	go func() {
		defer wg.Done()
		zeptoRaw, err := fetchZeptoProductsV3(url.QueryEscape(query), lat, lng)
		if err != nil {
			errZepto = err
			log.Printf("Zepto fetch failed for query '%s': %v", query, err)
			return
		}
		zeptoProducts = mapZepto(zeptoRaw)
	}()

	// Fetch from BigBasket
	go func() {
		defer wg.Done()
		bigbasketRaw, err := fetchBigBasketProducts(url.QueryEscape(query), lat, lng)
		if err != nil {
			errBigbasket = err
			log.Printf("BigBasket fetch failed for query '%s': %v", query, err)
			return
		}
		bigbasketProducts = mapBigBasket(bigbasketRaw)
	}()

	wg.Wait()

	// Log the number of products fetched from each source
	log.Printf("blinkit: %d, instamart: %d, zepto: %d, bigbasket: %d", len(blinkitProducts), len(instamartProducts), len(zeptoProducts), len(bigbasketProducts))

	// Check if all sources failed
	if errBlinkit != nil && errInstamart != nil && errZepto != nil {
		return nil, fmt.Errorf("all sources failed: Blinkit (%v), Instamart (%v), Zepto (%v)", errBlinkit, errInstamart, errZepto)
	}

	// Merge products from available sources
	availableProducts := [][]Product{}
	if errBlinkit == nil {
		availableProducts = append(availableProducts, blinkitProducts)
	}
	if errInstamart == nil {
		availableProducts = append(availableProducts, instamartProducts)
	}
	if errZepto == nil {
		availableProducts = append(availableProducts, zeptoProducts)
	}
	if errBigbasket == nil {
		availableProducts = append(availableProducts, bigbasketProducts)
	}

	// If no products are available, return an empty result with a warning
	if len(availableProducts) == 0 {
		log.Printf("No products available for query '%s' due to all sources failing", query)
		return []Product{}, nil
	}
	// startTime := time.Now()
	// mergedProducts := mergeProducts(availableProducts, appState, query)
	// endTime := time.Now()
	// log.Printf("mergeProductsV2 took %v", endTime.Sub(startTime))
	// mergedProducts := mergeProducts(availableProducts, appState, query)
	mergedProducts := mergeProducts(availableProducts, appState, query)
	// log.Println(mergedProducts)
	// log.Println(mergedProductsV2)

	// Identify unmapped products (those with only one source)
	unmapped := []Product{}
	for _, prod := range mergedProducts {
		if len(prod.Prices) == 1 {
			unmapped = append(unmapped, prod)
		}
	}

	// Queue unmapped products in Redis and trigger Ginger API
	if len(unmapped) > 0 {
		unmappedJSON, err := json.Marshal(unmapped)
		if err != nil {
			log.Printf("Failed to marshal unmapped products for query '%s': %v", query, err)
		} else {
			redisKey := "unmapped:" + query
			ctx := context.Background()
			err = appState.RedisClient.Set(ctx, redisKey, unmappedJSON, 24*time.Hour).Err()
			if err != nil {
				log.Printf("Failed to store unmapped products in Redis for query '%s': %v", query, err)
			} else {
				log.Printf("Queued %d unmapped products for query '%s' in Redis", len(unmapped), query)
				go func() {
					payload := fmt.Sprintf(`{"type": "search-intelligence", "data": {"query": "%s"}}`, query)
					resp, err := http.Post(config.GetGingerURL("spawn"), "application/json", bytes.NewBuffer([]byte(payload)))
					if err != nil {
						log.Printf("Failed to trigger Flask API for query '%s': %v at %s %s", query, err, config.GetGingerURL("spawn"), config.GetGingerURL(""))
					} else {
						defer resp.Body.Close()
						log.Printf("Triggered Flask API for query '%s', status: %s", query, resp.Status)
					}
				}()
			}
		}
	} else {
		log.Printf("No unmapped products found for query '%s'", query)
	}

	return mergedProducts, nil
}

func SearchProductsV2(appState config.AppState, query string, deviceID string) ([]Product, error) {
	ctx := context.Background()
	redisKey := fmt.Sprintf("products:%s", strings.ToLower(query))
	var mergedProducts []Product

	cached, err := appState.RedisClient.Get(ctx, redisKey).Bytes()
	if err == nil {
		err = json.Unmarshal(cached, &mergedProducts)
		if err == nil {
			log.Printf("Cache hit for query: %s", query)
			return mergedProducts, nil
		} else {
			log.Printf("Cache corrupted for query: %s, proceeding to fetch", query)
		}
	} else {
		log.Printf("Cache miss for query: %s, fetching fresh", query)
	}

	var (
		blinkitProducts   []Product
		instamartProducts []Product
		zeptoProducts     []Product
		bigbasketProducts []Product
		errBlinkit        error
		errInstamart      error
		errZepto          error
		errBigbasket      error
	)
	var lat, lng string
	var zeptoStoreId string
	var instamartStoreId string

	if deviceID != "" {
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
	wg.Add(4)

	go func() {
		defer wg.Done()
		blinkitRaw, err := fetchBlinkitProducts(url.QueryEscape(query), lat, lng)
		if err != nil {
			errBlinkit = err
			log.Printf("Blinkit fetch failed for query '%s': %v", query, err)
			return
		}
		blinkitProducts = mapBlinkit(map[string]interface{}{"products": blinkitRaw})
	}()

	go func() {
		defer wg.Done()
		instaRaw, err := fetchInstamartProducts(url.QueryEscape(query), instamartStoreId)
		if err != nil {
			errInstamart = err
			log.Printf("Instamart fetch failed for query '%s': %v", query, err)
			return
		}
		instamartProducts = mapInstamart(instaRaw)
	}()

	go func() {
		defer wg.Done()
		zeptoRaw, err := fetchZeptoProductsV3(url.QueryEscape(query), lat, lng)
		if err != nil {
			errZepto = err
			log.Printf("Zepto fetch failed for query '%s': %v", query, err)
			return
		}
		zeptoProducts = mapZepto(zeptoRaw)
	}()

	go func() {
		defer wg.Done()
		bigbasketRaw, err := fetchBigBasketProducts(url.QueryEscape(query), lat, lng)
		if err != nil {
			errBigbasket = err
			log.Printf("BigBasket fetch failed for query '%s': %v", query, err)
			return
		}
		bigbasketProducts = mapBigBasket(bigbasketRaw)
	}()

	wg.Wait()

	log.Printf("blinkit: %d, instamart: %d, zepto: %d, bigbasket: %d", len(blinkitProducts), len(instamartProducts), len(zeptoProducts), len(bigbasketProducts))

	if errBlinkit != nil && errInstamart != nil && errZepto != nil {
		return nil, fmt.Errorf("all sources failed: Blinkit (%v), Instamart (%v), Zepto (%v)", errBlinkit, errInstamart, errZepto)
	}

	availableProducts := [][]Product{}
	if errBlinkit == nil {
		availableProducts = append(availableProducts, blinkitProducts)
	}
	if errInstamart == nil {
		availableProducts = append(availableProducts, instamartProducts)
	}
	if errZepto == nil {
		availableProducts = append(availableProducts, zeptoProducts)
	}
	if errBigbasket == nil {
		availableProducts = append(availableProducts, bigbasketProducts)
	}

	if len(availableProducts) == 0 {
		log.Printf("No products available for query '%s' due to all sources failing", query)
		return []Product{}, nil
	}

	mergedProducts = mergeProducts(availableProducts, appState, query)

	// Cache the final result in Redis
	cachedBytes, err := json.Marshal(mergedProducts)
	if err == nil {
		err = appState.RedisClient.Set(ctx, redisKey, cachedBytes, 30*time.Minute).Err()
		if err != nil {
			log.Printf("Failed to cache merged products for query '%s': %v", query, err)
		}
	}

	// Send unmapped to Ginger (only for fresh fetches)
	unmapped := []Product{}
	for _, prod := range mergedProducts {
		if len(prod.Prices) == 1 {
			unmapped = append(unmapped, prod)
		}
	}

	if len(unmapped) > 0 {
		unmappedJSON, err := json.Marshal(unmapped)
		if err != nil {
			log.Printf("Failed to marshal unmapped products for query '%s': %v", query, err)
		} else {
			unmappedKey := "unmapped:" + query
			err = appState.RedisClient.Set(ctx, unmappedKey, unmappedJSON, 24*time.Hour).Err()
			if err != nil {
				log.Printf("Failed to store unmapped products in Redis for query '%s': %v", query, err)
			} else {
				log.Printf("Queued %d unmapped products for query '%s' in Redis", len(unmapped), query)
				go func() {
					payload := fmt.Sprintf(`{"type": "search-intelligence", "data": {"query": "%s"}}`, query)
					resp, err := http.Post(config.GetGingerURL("spawn"), "application/json", bytes.NewBuffer([]byte(payload)))
					if err != nil {
						log.Printf("Failed to trigger Ginger API for query '%s': %v", query, err)
						return
					}
					defer resp.Body.Close()
					log.Printf("Triggered Ginger API for query '%s', status: %s", query, resp.Status)
				}()
			}
		}
	}

	return mergedProducts, nil
}

func SearchProductsV3(appState config.AppState, query string, deviceID string) ([]Product, error) {
	ctx := context.Background()

	var (
		blinkitProducts   []Product
		instamartProducts []Product
		zeptoProducts     []Product
		bigbasketProducts []Product
		errBlinkit        error
		errInstamart      error
		errZepto          error
		errBigbasket      error
	)
	var lat, lng string
	var zeptoStoreId string
	var instamartStoreId string

	if deviceID != "" {
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
	wg.Add(4)

	go func() {
		defer wg.Done()
		blinkitRaw, err := fetchBlinkitProducts(url.QueryEscape(query), lat, lng)
		if err != nil {
			errBlinkit = err
			log.Printf("Blinkit fetch failed for query '%s': %v", query, err)
			return
		}
		blinkitProducts = mapBlinkit(map[string]interface{}{"products": blinkitRaw})
	}()

	go func() {
		defer wg.Done()
		instaRaw, err := fetchInstamartProducts(url.QueryEscape(query), instamartStoreId)
		if err != nil {
			errInstamart = err
			log.Printf("Instamart fetch failed for query '%s': %v", query, err)
			return
		}
		instamartProducts = mapInstamart(instaRaw)
	}()

	go func() {
		defer wg.Done()
		zeptoRaw, err := fetchZeptoProductsV3(url.QueryEscape(query), lat, lng)
		if err != nil {
			errZepto = err
			log.Printf("Zepto fetch failed for query '%s': %v", query, err)
			return
		}
		zeptoProducts = mapZepto(zeptoRaw)
	}()

	go func() {
		defer wg.Done()
		bigbasketRaw, err := fetchBigBasketProducts(url.QueryEscape(query), lat, lng)
		if err != nil {
			errBigbasket = err
			log.Printf("BigBasket fetch failed for query '%s': %v", query, err)
			return
		}
		bigbasketProducts = mapBigBasket(bigbasketRaw)
	}()

	wg.Wait()

	log.Printf("blinkit: %d, instamart: %d, zepto: %d, bigbasket: %d", len(blinkitProducts), len(instamartProducts), len(zeptoProducts), len(bigbasketProducts))

	if errBlinkit != nil && errInstamart != nil && errZepto != nil {
		return nil, fmt.Errorf("all sources failed: Blinkit (%v), Instamart (%v), Zepto (%v)", errBlinkit, errInstamart, errZepto)
	}

	availableProducts := [][]Product{}
	if errBlinkit == nil {
		availableProducts = append(availableProducts, blinkitProducts)
	}
	if errInstamart == nil {
		availableProducts = append(availableProducts, instamartProducts)
	}
	if errZepto == nil {
		availableProducts = append(availableProducts, zeptoProducts)
	}
	if errBigbasket == nil {
		availableProducts = append(availableProducts, bigbasketProducts)
	}

	if len(availableProducts) == 0 {
		log.Printf("No products available for query '%s' due to all sources failing", query)
		return []Product{}, nil
	}

	mergedProducts := mergeProducts(availableProducts, appState, query)

	// Send unmapped to Ginger (only for fresh fetches)
	unmapped := []Product{}
	for _, prod := range mergedProducts {
		if len(prod.Prices) == 1 {
			unmapped = append(unmapped, prod)
		}
	}

	if len(unmapped) > 0 {
		unmappedJSON, err := json.Marshal(unmapped)
		if err != nil {
			log.Printf("Failed to marshal unmapped products for query '%s': %v", query, err)
		} else {
			unmappedKey := "unmapped:" + query
			err = appState.RedisClient.Set(ctx, unmappedKey, unmappedJSON, 24*time.Hour).Err()
			if err != nil {
				log.Printf("Failed to store unmapped products in Redis for query '%s': %v", query, err)
			} else {
				log.Printf("Queued %d unmapped products for query '%s' in Redis", len(unmapped), query)
				go func() {
					payload := fmt.Sprintf(`{"type": "search-intelligence", "data": {"query": "%s"}}`, query)
					resp, err := http.Post(config.GetGingerURL("spawn"), "application/json", bytes.NewBuffer([]byte(payload)))
					if err != nil {
						log.Printf("Failed to trigger Ginger API for query '%s': %v", query, err)
						return
					}
					defer resp.Body.Close()
					log.Printf("Triggered Ginger API for query '%s', status: %s", query, resp.Status)
				}()
			}
		}
	}

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
		"accept":           "application/json, text/plain, */*",
		"accept-language":  "en-US,en;q=0.9",
		"app_sub_platform": "WEB",
		"app_version":      "12.64.0",
		"appversion":       "12.64.0",
		//"auth_revamp_flow":      "v2",
		//"compatible_components": "CONVENIENCE_FEE,RAIN_FEE,EXTERNAL_COUPONS,STANDSTILL,BUNDLE,MULTI_SELLER_ENABLED,PIP_V1,ROLLUPS,SCHEDULED_DELIVERY,SAMPLING_ENABLED,ETA_NORMAL_WITH_149_DELIVERY,ETA_NORMAL_WITH_199_DELIVERY,HOMEPAGE_V2,NEW_ETA_BANNER,VERTICAL_FEED_PRODUCT_GRID,AUTOSUGGESTION_PAGE_ENABLED,AUTOSUGGESTION_PIP,AUTOSUGGESTION_AD_PIP,BOTTOM_NAV_FULL_ICON,COUPON_WIDGET_CART_REVAMP,DELIVERY_UPSELLING_WIDGET,MARKETPLACE_CATEGORY_GRID,NO_PLATFORM_CHECK_ENABLED_V2,SUPER_SAVER:1,SUPERSTORE_V1,PROMO_CASH:0,24X7_ENABLED_V1,TABBED_CAROUSEL_V2,HP_V4_FEED,NEW_ROLLUPS_ENABLED,RERANKING_QCL_RELATED_PRODUCTS,PLP_ON_SEARCH,PAAN_BANNER_WIDGETIZED,ROLLUPS_UOM,DYNAMIC_FILTERS,PHARMA_ENABLED,AUTOSUGGESTION_RECIPE_PIP,SEARCH_FILTERS_V1,QUERY_DESCRIPTION_WIDGET,MEDS_WITH_SIMILAR_SALT_WIDGET,NEW_FEE_STRUCTURE,NEW_BILL_INFO,RE_PROMISE_ETA_ORDER_SCREEN_ENABLED,SUPERSTORE_V1,MANUALLY_APPLIED_DELIVERY_FEE_RECEIVABLE,MARKETPLACE_REPLACEMENT,ZEPTO_PASS,ZEPTO_PASS:1,ZEPTO_PASS:2,ZEPTO_PASS_RENEWAL,CART_REDESIGN_ENABLED,SHIPMENT_WIDGETIZATION_ENABLED,TABBED_CAROUSEL_V2,24X7_ENABLED_V1,PROMO_CASH:0,HOMEPAGE_V2,SUPER_SAVER:1,NO_PLATFORM_CHECK_ENABLED_V2",
		"content-type":     "application/json",
		"marketplace_type": "ZEPTO_NOW",
		//"origin":                "https://www.zeptonow.com",
		//"platform":              "WEB",
		//"referer":               "https://www.zeptonow.com/",
		//"session_id":            sessionID,
		"requestid":         sessionID,
		"storeid":           storeID,
		"request-signature": "c030cf594f9d17a528909874ab4c490bf898510bd94ca31783c9a29599db49ed",
		"tenant":            "ZEPTO",
		"user-agent":        "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
	}
	if cookie != "" {
		headers["Cookie"] = cookie
	}
	if xsrfToken != "" {
		//headers["X-XSRF-TOKEN"] = xsrfToken
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

	// Extract suggestions from PRODUCT_GRID widgets
	suggestions := []string{}
	seen := make(map[string]bool) // To avoid duplicates
	if layout, ok := result["layout"].([]interface{}); ok {
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

func applyPendingMappings(
	products []Product,
	appState config.AppState,
	query string,
) []Product {
	ctx := context.Background()
	key := fmt.Sprintf("pending_mappings:%s", query)
	raw, err := appState.RedisClient.Get(ctx, key).Result()
	if err != nil {
		if err != redis.Nil {
			log.Printf("error fetching %s: %v", key, err)
		}
		return products
	}

	var pm PendingMappings
	if err := json.Unmarshal([]byte(raw), &pm); err != nil {
		log.Printf("error unmarshalling %s: %v", key, err)
		return products
	}

	// For each suggestion, find the Product by name and merge in the "match" variant
	for _, m := range pm.Mappings {
		for i := range products {
			if products[i].Name == m.Source.Name {
				match := m.Match
				matchIdxinProducts := slices.IndexFunc(products, func(p Product) bool {
					return p.Name == match.Name && slices.ContainsFunc(p.Prices, func(price PriceOption) bool {
						return price.Source == match.Source
					})
				})
				if matchIdxinProducts != -1 {
					match.Mrp = products[matchIdxinProducts].Prices[0].Variants[0].DiscountedPrice
					match.Weight = products[matchIdxinProducts].Prices[0].Variants[0].Weight
					products[i] = mergeOneMapping(products[i], match)
					break
				}
			}
		}
	}

	return products
}

// mergeOneMapping adds the new variant from PendingMappingItem into prod.Prices,
// creating a new PriceOption if needed, and deduplicating by Deeplink.
func mergeOneMapping(prod Product, item PendingMappingItem) Product {
	v := Variant{
		OriginalPrice:   item.Mrp,
		DiscountedPrice: item.Mrp,
		Deeplink:        item.Deeplink,
		ImageURL:        item.ImageURL,
		Weight:          item.Weight,
	}

	// look for an existing PriceOption on item.Source
	for pi, po := range prod.Prices {
		if po.Source == item.Source {
			// dedupe by Deeplink
			for _, existing := range po.Variants {
				if existing.Deeplink == v.Deeplink {
					return prod
				}
			}
			prod.Prices[pi].Variants = append(prod.Prices[pi].Variants, v)
			return prod
		}
	}

	// not found, so add a brand new PriceOption
	prod.Prices = append(prod.Prices, PriceOption{
		Source:   item.Source,
		Variants: []Variant{v},
	})
	return prod
}

// Product-level caching functions for enhanced cross-query optimization

// generateProductKey creates a consistent cache key for product-level mapping
func generateProductKey(productName, productBrand string) string {
	normalizedName := strings.ToLower(strings.TrimSpace(productName))
	normalizedBrand := strings.ToLower(strings.TrimSpace(productBrand))
	return fmt.Sprintf("product_mapping:%s:%s", normalizedName, normalizedBrand)
}

// getProductMappings retrieves cached mappings for a specific product
func getProductMappings(appState config.AppState, productName, productBrand string) []PendingMappingItem {
	ctx := context.Background()
	key := generateProductKey(productName, productBrand)

	cached, err := appState.RedisClient.Get(ctx, key).Result()
	if err != nil {
		if err != redis.Nil {
			log.Printf("Error retrieving product mappings for %s: %v", key, err)
		}
		return []PendingMappingItem{}
	}

	var cache ProductCache
	if err := json.Unmarshal([]byte(cached), &cache); err != nil {
		log.Printf("Error unmarshalling product cache for %s: %v", key, err)
		return []PendingMappingItem{}
	}

	return cache.MappedProducts
}

// saveProductMappings stores mappings for a specific product with query tracking
func saveProductMappings(appState config.AppState, productName, productBrand string, mappings []PendingMappingItem, query string) {
	ctx := context.Background()
	key := generateProductKey(productName, productBrand)

	// Get existing cache or create new one
	var cache ProductCache
	cached, err := appState.RedisClient.Get(ctx, key).Result()
	if err == nil {
		json.Unmarshal([]byte(cached), &cache)
	}

	// Merge with existing mappings, avoiding duplicates by deeplink
	existingDeeplinks := make(map[string]bool)
	for _, existing := range cache.MappedProducts {
		existingDeeplinks[existing.Deeplink] = true
	}

	for _, mapping := range mappings {
		if !existingDeeplinks[mapping.Deeplink] {
			cache.MappedProducts = append(cache.MappedProducts, mapping)
			existingDeeplinks[mapping.Deeplink] = true
		}
	}

	// Limit number of mappings per product (keep most recent)
	maxMappings := 5
	if len(cache.MappedProducts) > maxMappings {
		cache.MappedProducts = cache.MappedProducts[len(cache.MappedProducts)-maxMappings:]
	}

	// Update metadata
	cache.ProductKey = key
	cache.LastUpdated = time.Now().Format(time.RFC3339)
	cache.MappingCount = len(cache.MappedProducts)

	// Track query usage
	queryExists := false
	for _, existingQuery := range cache.QueriesUsedIn {
		if existingQuery == query {
			queryExists = true
			break
		}
	}
	if !queryExists {
		cache.QueriesUsedIn = append(cache.QueriesUsedIn, query)
	}

	// Save to cache with 7-day expiration
	cacheJSON, err := json.Marshal(cache)
	if err != nil {
		log.Printf("Error marshalling product cache for %s: %v", key, err)
		return
	}

	err = appState.RedisClient.Set(ctx, key, cacheJSON, 7*24*time.Hour).Err()
	if err != nil {
		log.Printf("Error saving product mappings for %s: %v", key, err)
	}
}

// cleanupOldProductMappings removes old product mappings from the cache
func cleanupOldProductMappings(appState config.AppState, maxAgeDays int) error {
	ctx := context.Background()
	pattern := "product_mapping:*"

	cutoffTime := time.Now().AddDate(0, 0, -maxAgeDays)
	cleanedCount := 0

	iter := appState.RedisClient.Scan(ctx, 0, pattern, 100).Iterator()
	for iter.Next(ctx) {
		key := iter.Val()
		cached, err := appState.RedisClient.Get(ctx, key).Result()
		if err != nil {
			continue
		}

		var cache ProductCache
		if err := json.Unmarshal([]byte(cached), &cache); err != nil {
			continue
		}

		lastUpdated, err := time.Parse(time.RFC3339, cache.LastUpdated)
		if err != nil || lastUpdated.Before(cutoffTime) {
			appState.RedisClient.Del(ctx, key)
			cleanedCount++
		}
	}

	if cleanedCount > 0 {
		log.Printf("Cleaned up %d old product mappings", cleanedCount)
	}

	return iter.Err()
}

// Enhanced mapping utilities
func isProductMapped(product Product) bool {
	return len(product.Prices) > 1
}

func getUnmappedProducts(products []Product) []Product {
	var unmapped []Product
	for _, product := range products {
		if !isProductMapped(product) {
			unmapped = append(unmapped, product)
		}
	}
	return unmapped
}

// applyEnhancedPendingMappings applies the enhanced product-level caching system
func applyEnhancedPendingMappings(products []Product, appState config.AppState, query string) []Product {
	if len(products) == 0 {
		return products
	}

	startTime := time.Now()

	// Step 1: Apply product-level cached mappings
	products = applyProductLevelMappings(products, appState, query)

	// Step 2: Apply query-specific pending mappings (fallback)
	products = applyPendingMappings(products, appState, query)

	// Step 3: Save successful mappings for future queries
	saveMappingsForFutureQueries(products, appState, query)

	// Log statistics
	processingTime := time.Since(startTime)
	mappedCount := countMappedProducts(products)
	efficiency, _ := calculateMappingEfficiency(products)

	log.Printf("Enhanced mapping for query '%s': %d/%d products mapped (%.1f%%), processing time: %v",
		query, mappedCount, len(products), efficiency, processingTime)

	return products
}

// applyProductLevelMappings applies cached mappings from previous queries
func applyProductLevelMappings(products []Product, appState config.AppState, query string) []Product {
	ctx := context.Background()
	crossQueryHits := 0

	for i, product := range products {
		// Skip already mapped products
		if isProductMapped(product) {
			continue
		}

		// Get cached mappings for this product
		cachedMappings := getProductMappings(appState, product.Name, product.Brand)
		if len(cachedMappings) == 0 {
			continue
		}

		// Apply available mappings
		for _, mapping := range cachedMappings {
			// Check if the mapped product exists in current results
			if productExistsInResults(products, mapping) {
				// Apply the mapping
				products[i] = mergeOneMapping(products[i], mapping)
				crossQueryHits++
			}
		}
	}

	if crossQueryHits > 0 {
		log.Printf("Applied %d cross-query mappings for query '%s'", crossQueryHits, query)

		// Update stats in Redis
		statsKey := "mapping_stats"
		statsJSON, _ := appState.RedisClient.Get(ctx, statsKey).Result()
		var stats MappingStats
		if statsJSON != "" {
			json.Unmarshal([]byte(statsJSON), &stats)
		}
		stats.CrossQueryHits += crossQueryHits
		stats.LastUpdated = time.Now().Format(time.RFC3339)

		newStatsJSON, _ := json.Marshal(stats)
		appState.RedisClient.Set(ctx, statsKey, newStatsJSON, 24*time.Hour)
	}

	return products
}

// productExistsInResults checks if a mapped product exists in current search results
func productExistsInResults(products []Product, mapping PendingMappingItem) bool {
	for _, product := range products {
		// Check for exact name match and source match
		if strings.EqualFold(product.Name, mapping.Name) {
			for _, priceOption := range product.Prices {
				if priceOption.Source == mapping.Source {
					return true
				}
			}
		}
	}
	return false
}

// saveMappingsForFutureQueries stores successful mappings for cross-query optimization
func saveMappingsForFutureQueries(products []Product, appState config.AppState, query string) {
	for _, product := range products {
		// Only save mappings for products that have multiple sources
		if len(product.Prices) > 1 {
			// Convert product to pending mapping items
			var mappings []PendingMappingItem
			for _, priceOption := range product.Prices {
				for _, variant := range priceOption.Variants {
					mapping := PendingMappingItem{
						ID:       product.ID,
						Name:     product.Name,
						Brand:    product.Brand,
						Mrp:      variant.OriginalPrice,
						Source:   priceOption.Source,
						Weight:   variant.Weight,
						Deeplink: variant.Deeplink,
						ImageURL: variant.ImageURL,
					}
					mappings = append(mappings, mapping)
				}
			}

			// Save mappings for this product
			if len(mappings) > 1 {
				saveProductMappings(appState, product.Name, product.Brand, mappings, query)
			}
		}
	}
}
