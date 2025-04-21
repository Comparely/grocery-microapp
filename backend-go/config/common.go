package config

import (
	"context"
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
	url := "redis://0.0.0.0:6379/"
	opts, err := redis.ParseURL(url)

	if err != nil {
		return nil, err
	}

	return redis.NewClient(opts), nil
}

func InitMongo() (*mongo.Client, func(), error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb+srv://comparably-sbx:comparely-sbx-001@cluster-sandbox0.xnku9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-Sandbox0"))
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
