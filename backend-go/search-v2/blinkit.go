package searchv2

import (
	"fmt"
	"log"
)

func fetchBlinkitProducts(query string, lat string, lng string) ([]RawProduct, error) {
	baseUrl := "https://blinkit.com"
	url := fmt.Sprintf("%s/v1/layout/search?q=%s", baseUrl, query)
	headers := map[string]string{
		"accept":       "*/*",
		"content-type": "application/json",
		"lat":          lat,
		"lon":          lng,
		"Cookie":       "__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"user-agent":   "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
		"User-Agent":   "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
	}
	allProducts := make([]RawProduct, 0)
	count := 0
	for url != "" && count < 1 {
		result, err := fetchJSON(url, "POST", headers, "")
		if err != nil {
			return allProducts, err
		}
		blinkitProds, err := ParseBlinkit(result)
		allProducts = append(allProducts, blinkitProds...)
		count++
	}
	log.Printf("blinkit size %d", len(allProducts))
	return allProducts, nil
}

// ParseBlinkit takes the raw Blinkit JSON payload and returns your domain products.
func ParseBlinkit(raw map[string]interface{}) ([]RawProduct, error) {
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

	var products []RawProduct

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
		var p RawProduct
		p.Platform = "blinkit"

		defaultVariant := RawVariant{
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
			defaultVariant.Weight = v["text"].(string)
		}

		// --- Top‐level MRP
		var MRP float64
		if mrpField, ok := dataMap["mrp"].(map[string]interface{}); ok {
			if txt, _ := mrpField["text"].(string); txt != "" {
				MRP = parsePrice(txt)
			}
		}
		if MRP == 0 {
			// fallback to normal_price
			if np, ok := dataMap["normal_price"].(map[string]interface{}); ok {
				if txt, _ := np["text"].(string); txt != "" {
					MRP = parsePrice(txt)

				}
			}
		}
		defaultVariant.OriginalPrice = MRP

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

		// --- Each variant in data.variant_list
		if vlist, ok := dataMap["variant_list"].([]interface{}); ok {
			for _, vi := range vlist {
				vm, ok := vi.(map[string]interface{})
				if !ok {
					continue
				}
				if dm, ok := vm["data"].(map[string]interface{}); ok {
					var v RawVariant

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

					p.Variants = append(p.Variants, v)
				}
			}
		}

		p.Variants = append(p.Variants, defaultVariant)

		products = append(products, p)
	}

	return products, nil
}
