package places

import (
	"net/http"
)

type AutocompletePrediction struct {
	Description string `json:"description"`
	PlaceID     string `json:"place_id"`
}

type Place struct {
	Address string  `json:"address"`
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
}

type Client struct {
	APIKey     string
	HTTPClient *http.Client
}
