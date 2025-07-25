package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/comparely/comparely-grocery-backend/config"
	"github.com/comparely/comparely-grocery-backend/places"
	"github.com/comparely/comparely-grocery-backend/search"
	searchv2 "github.com/comparely/comparely-grocery-backend/search-v2"
	"github.com/comparely/comparely-grocery-backend/sessions"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

const PORT = 4500

var appState config.AppState = config.AppState{}

func main() {
	var err error
	err = godotenv.Load(".env")
	if err != nil {
		log.Println("Error loading .env file: %s", err)
	}

	if appState.RedisClient, err = config.InitRedis(); err != nil {
		log.Println("could not connect to redis", err)
		os.Exit(1)
	}
	log.Println("✅ Redis connected")

	var cancelMongo func()
	if appState.MongoClient, cancelMongo, err = config.InitMongo(); err != nil {
		log.Println("could not connect to mongodb", err)
		os.Exit(1)
	}
	log.Println("✅ Mongo connected")
	defer cancelMongo()

	router := gin.Default()
	router.Use(cors.New(config.GetCorsConfig()))

	router.POST("/start-session", func(c *gin.Context) {
		var input sessions.SessionInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}
		sess := sessions.Session{
			DeviceID:  input.DeviceID,
			Lat:       input.Lat,
			Lng:       input.Lng,
			UpdatedAt: time.Now().Unix(),
		}
		ctx := context.Background()
		if err := sessions.SaveSession(ctx, appState, &sess); err != nil {
			log.Printf("Failed to save session for deviceID %s: %v", sess.DeviceID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, sess)
	})

	router.GET("/search", func(c *gin.Context) {
		query := c.Query("q")
		deviceID := c.Query("deviceID")
		if query == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter q is required"})
			return
		}
		products, err := searchv2.SearchProducts(appState, query, deviceID)
		if err != nil {
			log.Println("Error during search:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
		c.JSON(http.StatusOK, products)
	})

	router.POST("/suggestions", func(c *gin.Context) {
		var input struct {
			Query    string `json:"query"`
			DeviceID string `json:"deviceId"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}
		if input.Query == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
			return
		}
		suggestions, err := search.ZeptoSuggestions(appState, input.Query, input.DeviceID)
		if err != nil {
			log.Println("Error fetching suggestions:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch suggestions"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"suggestions": suggestions})
	})

	// Endpoint: Fetch all queries with pending mappings
	router.GET("/admin/pending-queries", func(c *gin.Context) {
		ctx := context.Background()
		keys, err := appState.RedisClient.Keys(ctx, "pending_mappings:*").Result()
		if err != nil {
			log.Printf("Failed to fetch pending mappings keys: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch queries"})
			return
		}
		queries := []string{}
		seen := make(map[string]bool)
		for _, key := range keys {
			// Extract just the query part (before the first colon after prefix)
			parts := strings.SplitN(strings.TrimPrefix(key, "pending_mappings:"), ":", 2)
			query := parts[0]
			if !seen[query] {
				queries = append(queries, query)
				seen[query] = true
			}
		}
		c.JSON(http.StatusOK, gin.H{"queries": queries})
	})

	// Endpoint: Fetch pending mappings for a specific query
	router.GET("/admin/pending-mappings", func(c *gin.Context) {
		query := c.Query("q")
		if query == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter q is required"})
			return
		}
		ctx := context.Background()
		pattern := "pending_mappings:" + query + ":*"
		keys, err := appState.RedisClient.Keys(ctx, pattern).Result()
		if err != nil {
			log.Printf("Failed to fetch pending mappings keys: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch mappings"})
			return
		}
		if len(keys) == 0 {
			c.JSON(http.StatusOK, gin.H{"query": query, "mappings": []interface{}{}})
			return
		}
		// Return the latest process_id
		latestKey := keys[len(keys)-1]
		mappingsJSON, err := appState.RedisClient.Get(ctx, latestKey).Result()
		if err != nil {
			log.Printf("Failed to fetch mappings for key '%s': %v", latestKey, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch mappings"})
			return
		}
		var mappingsData map[string]interface{}
		if err := json.Unmarshal([]byte(mappingsJSON), &mappingsData); err != nil {
			log.Printf("Failed to unmarshal mappings JSON for key '%s': %v", latestKey, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid mappings data"})
			return
		}
		c.JSON(http.StatusOK, mappingsData)
	})

	// router.GET("/place", func(c *gin.Context) {
	// 	query := c.Query("query")

	// 	client := places.NewClient("AIzaSyDXxEstxNmu1Lr_vqLau0StAoRyUGPZqSg")

	// 	predictions, err := client.GetPlacePredictions(query)
	// 	if err != nil {
	// 		log.Println("Autocomplete error:", err)
	// 		return
	// 	}

	// 	places := make([]places.Place, 0, len(predictions))
	// 	for _, p := range predictions {
	// 		place, err := client.GetPlaceDetails(p.PlaceID)
	// 		if err != nil {
	// 			log.Println("Failed to get place details:", err)
	// 			continue
	// 		}
	// 		places = append(places, place)
	// 	}

	// 	c.JSON(http.StatusOK, places)
	// })

	router.GET("/place", func(c *gin.Context) {
		log.Println("hello")
		query := c.Query("query")

		client := places.NewClient("xcSLN1MKCaBkoYNKjvWuCXWzRkE14Pwc7L4j3V2P")

		places, err := client.GetPlacePredictionsOla(query)
		if err != nil {
			log.Println("Autocomplete error:", err)
			return
		}

		c.JSON(http.StatusOK, places)
	})

	router.Run(fmt.Sprintf(":%d", PORT))
}
