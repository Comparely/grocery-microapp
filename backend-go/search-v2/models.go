package searchv2

type RawProduct struct {
	ID       string
	Name     string
	Brand    string
	Platform string // It can be blinkit, zepto, instamart, bigbasket
	ImageURL string
	Variants []RawVariant
}

type RawVariant struct {
	OriginalPrice   float64
	DiscountedPrice float64
	Deeplink        string
	ImageURL        string
	Weight          string
}

// Response of search API
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
