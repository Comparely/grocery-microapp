package places

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

const autocompleteURL = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
const detailsURL = "https://maps.googleapis.com/maps/api/place/details/json"

func NewClient(apiKey string) *Client {
	return &Client{
		APIKey:     apiKey,
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Step 1: Get place predictions
func (c *Client) GetPlacePredictions(input string) ([]AutocompletePrediction, error) {
	params := url.Values{}
	params.Add("input", input)
	params.Add("key", c.APIKey)

	url := fmt.Sprintf("%s?%s", autocompleteURL, params.Encode())
	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Predictions []struct {
			Description string `json:"description"`
			PlaceID     string `json:"place_id"`
		} `json:"predictions"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.Status != "OK" {
		return nil, fmt.Errorf("autocomplete API error: %s", result.Status)
	}

	var predictions []AutocompletePrediction
	for _, p := range result.Predictions {
		predictions = append(predictions, AutocompletePrediction{
			Description: p.Description,
			PlaceID:     p.PlaceID,
		})
	}
	return predictions, nil
}

// Step 2: Get lat/lng for a PlaceID
func (c *Client) GetPlaceDetails(placeID string) (Place, error) {
	params := url.Values{}
	params.Add("place_id", placeID)
	params.Add("fields", "formatted_address,geometry")
	params.Add("key", c.APIKey)
	params.Add("region", "in")

	url := fmt.Sprintf("%s?%s", detailsURL, params.Encode())
	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		return Place{}, err
	}
	defer resp.Body.Close()

	var result struct {
		Result struct {
			FormattedAddress string `json:"formatted_address"`
			Geometry         struct {
				Location struct {
					Lat float64 `json:"lat"`
					Lng float64 `json:"lng"`
				} `json:"location"`
			} `json:"geometry"`
		} `json:"result"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return Place{}, err
	}
	if result.Status != "OK" {
		return Place{}, fmt.Errorf("details API error: %s", result.Status)
	}

	return Place{
		Address: result.Result.FormattedAddress,
		Lat:     result.Result.Geometry.Location.Lat,
		Lng:     result.Result.Geometry.Location.Lng,
	}, nil
}
