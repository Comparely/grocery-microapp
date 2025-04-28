package search

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"

	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/cdproto/fetch"
	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
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

func RemoveContents(dir string) error {
	files, err := filepath.Glob(filepath.Join(dir, "*"))
	if err != nil {
		return err
	}
	for _, file := range files {
		err = os.RemoveAll(file)
		if err != nil {
			return err
		}
	}
	return nil
}

func DisableImageLoad(ctx context.Context) func(event interface{}) {
	return func(event interface{}) {
		switch ev := event.(type) {
		case *fetch.EventRequestPaused:
			go func() {
				c := chromedp.FromContext(ctx)
				ctx := cdp.WithExecutor(ctx, c.Target)

				if ev.ResourceType == network.ResourceTypeImage {
					fetch.FailRequest(ev.RequestID, network.ErrorReasonBlockedByClient).Do(ctx)
				} else {
					fetch.ContinueRequest(ev.RequestID).Do(ctx)
				}
			}()
		}
	}
}
