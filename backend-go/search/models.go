package search

type Variant struct {
	OriginalPrice   float64 `json:"original_price"`
	DiscountedPrice float64 `json:"discounted_price"`
	Deeplink        string  `json:"deeplink"`
	ImageURL        string  `json:"image_url"`
	Weight          string  `json:"weight,omitempty"`
}

type PriceOption struct {
	Source   string    `json:"source"`
	Variants []Variant `json:"variants"`
	Platform     string  `json:"platform"`
	Price        float64 `json:"price"`
	DeliveryTime string  `json:"delivery_time"`
	Link         string  `json:"link"`
	ProductID    string  `json:"product_id"`
	ProductURL   string  `json:"product_url"`
	ASIN         string  `json:"asin,omitempty"`
}

type Product struct {
	ID       string        `json:"id"`
	Name     string        `json:"name"`
	Brand    string        `json:"brand"`
	Weight   string        `json:"weight"`
	MRP      float64       `json:"mrp"`
	ImageURL string        `json:"image_url"`
	Prices   []PriceOption `json:"prices"`
}

type AmazonFreshRawProduct struct {
	ASIN         string
	Name         string
	Brand        string
	Weight       string
	MRP          float64
	Image        string
	Price        float64
	DeliveryTime string
	Link         string
}

type PendingMappingItem struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Brand    string  `json:"brand"`
	Mrp      float64 `json:"mrp"`
	Source   string  `json:"source"`
	Weight   string  `json:"weight"`
	Deeplink string  `json:"deeplink"`
	ImageURL string  `json:"image_url"`
}

type PendingMappings struct {
	Query    string `json:"query"`
	Mappings []struct {
		Source     PendingMappingItem `json:"source"`
		Match      PendingMappingItem `json:"match"`
		Similarity float64            `json:"similarity"`
	} `json:"mappings"`
}
type ScrapedAmazonProduct struct {
  Name         string `json:"name"`
  Price        string `json:"price"`
  DeliveryTime string `json:"DeliveryTime"` // <-- uppercase `D`
  Image        string `json:"image"`
  Link         string `json:"link"`
  ASIN         string `json:"asin"`
  Weight       string `json:"weight"`
  Mrp          float64 `json:"mrp"`
}