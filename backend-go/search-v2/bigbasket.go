package searchv2

import (
	"encoding/base64"
	"fmt"
	"log"
	"strconv"
)

func fetchBigBasketProducts(query string, lat string, lng string) ([]RawProduct, error) {
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
	return mapBigBasket(map[string]interface{}{
		"data": map[string]interface{}{
			"products": aggregatedProducts,
		},
	}), nil
}

func mapBigBasket(data map[string]any) []RawProduct {
	rawProds, ok := data["data"].(map[string]any)["products"].([]any)
	if !ok {
		return nil
	}
	log.Printf("Bigbasket prods %d", len(rawProds))

	mapped := make([]RawProduct, 0, len(rawProds))
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

func mapBBRawProduct(raw map[string]interface{}) (RawProduct, error) {
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

	var variants []RawVariant
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

				variant := RawVariant{
					OriginalPrice:   mrp,
					DiscountedPrice: sp,
					Deeplink:        deeplink,
					ImageURL:        imageURL,
					Weight:          weight,
				}

				variants = append(variants, variant)
			}
		}
	}

	return RawProduct{
		ID:       id,
		Name:     name,
		Brand:    brand,
		Platform: "bigbasket",
		ImageURL: imageURL,
		Variants: variants,
	}, nil
}
