package search

import (
	"encoding/json"
	"log"
	"net/http"
)

var scrapedProducts []Product

func HandlePostProducts(w http.ResponseWriter, r *http.Request) {
	log.Println("Incoming POST request")

	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var incomingProducts []Product
	if err := json.NewDecoder(r.Body).Decode(&incomingProducts); err != nil {
		log.Printf("❌ Invalid JSON body: %v\n", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	scrapedProducts = append(scrapedProducts, incomingProducts...)

	log.Printf("✅ Stored %d new products (total: %d)\n", len(incomingProducts), len(scrapedProducts))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Products saved successfully",
		"count":   len(scrapedProducts),
		"data":    incomingProducts,
	})
}

func HandleGetProducts(w http.ResponseWriter, r *http.Request) {
	log.Println("Serving GET request for /api/products")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(scrapedProducts)
}