package searchv2

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func fetchJSON(url1 string, method string, headers map[string]string, body string) (map[string]interface{}, error) {
	proxyURL, _ := url.Parse("http://34.131.214.195:3128")
	proxy := http.ProxyURL(proxyURL)
	transport := &http.Transport{Proxy: proxy}

	client := &http.Client{Timeout: 10 * time.Second, Transport: transport}
	req, err := http.NewRequest(method, url1, strings.NewReader(body))
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

func containsVariant(existing []RawVariant, key string) bool {
	for _, v := range existing {
		b, _ := json.Marshal(v)
		if string(b) == key {
			return true
		}
	}
	return false
}

func appendIfNotExists(existing []RawVariant, v RawVariant, key string) []RawVariant {
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
