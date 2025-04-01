package config

import (
	"context"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/go-redis/redis/v8"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetCorsConfig() cors.Config {
	return cors.Config{
		AllowOrigins:     []string{"https://app.comparely.co.in", "http://localhost:8081", "http://localhost:3039"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
}

func InitRedis() (*redis.Client, error) {
	url := os.Getenv("REDIS_URL") //34.118.230.24
	opts, err := redis.ParseURL(url)

	if err != nil {
		return nil, err
	}

	return redis.NewClient(opts), nil
}

func InitMongo() (*mongo.Client, func(), error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGO_URL")))
	if err != nil {
		return nil, nil, err
	}

	return mongoClient, func() {
		if err = mongoClient.Disconnect(ctx); err != nil {
			panic(err)
		}
		cancel()
	}, nil
}
