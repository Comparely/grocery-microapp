package search

import (
	"encoding/json"
	"strings"
)

// Slugify converts a string into a URL-friendly slug.
func slugify(text string) string {
	text = strings.ToLower(strings.TrimSpace(text))
	text = strings.ReplaceAll(text, " ", "-")
	var sb strings.Builder
	for _, r := range text {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			sb.WriteRune(r)
		}
	}
	return sb.String()
}

// formatSwiggyImages formats Instamart image URLs.
func formatSwiggyImages(url string) string {
	base := "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_252,h_272/"
	if strings.HasSuffix(url, ".png") {
		return base + url
	}
	return base + url + ".png"
}

// formatZeptoImages formats Zepto image URLs.
func formatZeptoImages(url string) string {
	return "https://cdn.zeptonow.com/production/tr:w-400,ar-1021-1021,pr-true,f-auto,q-80/" + url
}

func containsVariant(existing []Variant, key string) bool {
	for _, v := range existing {
		b, _ := json.Marshal(v)
		if string(b) == key {
			return true
		}
	}
	return false
}

func countUniqueSources(prices []PriceOption) int {
	unique := make(map[string]struct{})
	for _, po := range prices {
		unique[po.Source] = struct{}{}
	}
	return len(unique)
}

func appendIfNotExists(existing []Variant, v Variant, key string) []Variant {
	// simple duplicate check by comparing JSON string representation.
	vBytes, _ := json.Marshal(v)
	vKey := string(vBytes)
	for _, ex := range existing {
		exBytes, _ := json.Marshal(ex)
		if string(exBytes) == vKey {
			return existing
		}
	}
	return append(existing, v)
}
