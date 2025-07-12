package searchv2

import (
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

func fetchZeptoProducts(query string, lat, lng string) ([]RawProduct, error) {
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
	return mapZepto(res), nil
}

// mapZepto extracts products from Zepto's response.
// It looks for all widgets with widgetId "PRODUCT_GRID" and extracts items from them.
// It adds brand from product.brand and weight from product.packsize.
func mapZepto(data map[string]interface{}) []RawProduct {
	var products []RawProduct
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
		variant := RawVariant{
			OriginalPrice:   mrp,
			DiscountedPrice: discounted,
			Deeplink:        deeplink,
			ImageURL:        imageURL,
			Weight:          varWeight,
		}
		prod := RawProduct{
			ID:       uuid.NewString(),
			Name:     name,
			Brand:    brand,
			ImageURL: imageURL,
			Platform: "zepto",
			Variants: []RawVariant{variant},
		}
		products = append(products, prod)
	}
	return products
}
