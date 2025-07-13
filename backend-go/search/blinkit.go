package search

import (
	"fmt"
	"strconv"
	"strings"
)

// ParseBlinkit takes the raw Blinkit JSON payload and returns your domain products.
func ParseBlinkit(raw map[string]interface{}) ([]Product, error) {
	// 1. unmarshal into generic map

	// 2. dig down to response.snippets
	resp, ok := raw["response"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("missing response")
	}
	snips, ok := resp["snippets"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("missing snippets array")
	}

	var products []Product

	for _, s := range snips {
		sn, ok := s.(map[string]interface{})
		if !ok {
			continue
		}
		if widgetType, _ := sn["widget_type"].(string); widgetType != "product_card_snippet_type_2" {
			continue
		}

		dataMap, _ := sn["data"].(map[string]interface{})

		// build the Product
		var p Product

		defaultVariant := Variant{
			OriginalPrice:   0,
			DiscountedPrice: 0,
			Deeplink:        "",
			ImageURL:        "",
			Weight:          "",
		}

		// --- ID
		if idMap, ok := dataMap["identity"].(map[string]interface{}); ok {
			p.ID, _ = idMap["id"].(string)
		} else if meta, ok := dataMap["meta"].(map[string]interface{}); ok {
			p.ID, _ = meta["product_id"].(string)
		}

		// --- Name
		if n, ok := dataMap["name"].(map[string]interface{}); ok {
			p.Name, _ = n["text"].(string)
		} else if dn, ok := dataMap["display_name"].(map[string]interface{}); ok {
			p.Name, _ = dn["text"].(string)
		}

		// --- Brand
		if bn, ok := dataMap["brand_name"].(map[string]interface{}); ok {
			p.Brand, _ = bn["text"].(string)
		}

		// --- Top‐level weight (first variant label)
		if v, ok := dataMap["variant"].(map[string]interface{}); ok {
			p.Weight, _ = v["text"].(string)
			defaultVariant.Weight = p.Weight
		}

		// --- Top‐level MRP
		if mrpField, ok := dataMap["mrp"].(map[string]interface{}); ok {
			if txt, _ := mrpField["text"].(string); txt != "" {
				p.MRP = parsePrice(txt)
			}
		}
		if p.MRP == 0 {
			// fallback to normal_price
			if np, ok := dataMap["normal_price"].(map[string]interface{}); ok {
				if txt, _ := np["text"].(string); txt != "" {
					p.MRP = parsePrice(txt)

				}
			}
		}
		defaultVariant.OriginalPrice = p.MRP

		if np, ok := dataMap["normal_price"].(map[string]interface{}); ok {
			if txt, _ := np["text"].(string); txt != "" {
				defaultVariant.DiscountedPrice = parsePrice(txt)
			}
		}

		// --- Top‐level image URL
		if img, ok := dataMap["image"].(map[string]interface{}); ok {
			p.ImageURL, _ = img["url"].(string)
			defaultVariant.ImageURL = img["url"].(string)
		} else if mc, ok := dataMap["media_container"].(map[string]interface{}); ok {
			if items, ok := mc["items"].([]interface{}); ok && len(items) > 0 {
				if itm, ok := items[0].(map[string]interface{}); ok {
					if im, ok := itm["image"].(map[string]interface{}); ok {
						p.ImageURL, _ = im["url"].(string)
						defaultVariant.ImageURL = im["url"].(string)
					}
				}
			}
		}

		if ca, ok := dataMap["click_action"].(map[string]interface{}); ok {
			if bd, ok := ca["blinkit_deeplink"].(map[string]interface{}); ok {
				defaultVariant.Deeplink, _ = bd["url"].(string)
			}
		}

		// --- Build the single PriceOption (merchant source + variants)
		var po PriceOption
		po.Source = "blinkit"

		// --- Each variant in data.variant_list
		if vlist, ok := dataMap["variant_list"].([]interface{}); ok {
			for _, vi := range vlist {
				vm, ok := vi.(map[string]interface{})
				if !ok {
					continue
				}
				if dm, ok := vm["data"].(map[string]interface{}); ok {
					var v Variant

					// deeplink
					if ca, ok := dm["click_action"].(map[string]interface{}); ok {
						if bd, ok := ca["blinkit_deeplink"].(map[string]interface{}); ok {
							v.Deeplink, _ = bd["url"].(string)
						}
					}

					// image_url
					if im, ok := dm["image"].(map[string]interface{}); ok {
						v.ImageURL, _ = im["url"].(string)
					}

					// weight
					if wt, ok := dm["variant"].(map[string]interface{}); ok {
						v.Weight, _ = wt["text"].(string)
					}

					// discounted price
					if np, ok := dm["normal_price"].(map[string]interface{}); ok {
						if txt, _ := np["text"].(string); txt != "" {
							v.DiscountedPrice = parsePrice(txt)
						}
					}

					// original price (mrp) or fallback
					if mp, ok := dm["mrp"].(map[string]interface{}); ok {
						if txt, _ := mp["text"].(string); txt != "" {
							v.OriginalPrice = parsePrice(txt)
						} else {
							v.OriginalPrice = v.DiscountedPrice
						}
					} else {
						v.OriginalPrice = v.DiscountedPrice
					}

					po.Variants = append(po.Variants, v)
				}
			}
		}

		po.Variants = append(po.Variants, defaultVariant)

		p.Prices = []PriceOption{po}
		products = append(products, p)
	}

	return products, nil
}

// parsePrice strips out “₹”, commas, etc., and parses to float64.
func parsePrice(s string) float64 {
	var b strings.Builder
	for _, r := range s {
		if (r >= '0' && r <= '9') || r == '.' {
			b.WriteRune(r)
		}
	}
	f, _ := strconv.ParseFloat(b.String(), 64)
	return f
}
