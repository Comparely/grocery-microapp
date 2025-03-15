package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/comparely/comparely-grocery-backend/config"
	"github.com/comparely/comparely-grocery-backend/search"
	"github.com/comparely/comparely-grocery-backend/sessions"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const PORT = 4500

var appState config.AppState = config.AppState{}

func main() {
	var err error
	if appState.RedisClient, err = config.InitRedis(); err != nil {
		log.Println("could not connect to redis", err)
		os.Exit(1)
	}
	log.Println("✅ Redis connected")
	log.Println("Redis AppState", appState)

	var cancelMongo func()
	if appState.MongoClient, cancelMongo, err = config.InitMongo(); err != nil {
		log.Println("could not connect to mongodb", err)
		os.Exit(1)
	}
	log.Println("✅ Mongo connected")
	log.Println("Mongo AppState", appState)

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
		log.Println("AppState", appState)
		ctx := context.Background()
		if err := sessions.SaveSession(ctx, appState, &sess); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session"})
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
		products, err := search.SearchProducts(appState, query, deviceID)
		if err != nil {
			log.Println("Error during search:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
		c.JSON(http.StatusOK, products)
	})
	router.Run(fmt.Sprintf(":%d", PORT))
}
