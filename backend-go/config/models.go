package config

import (
	"github.com/go-redis/redis/v8"
	"go.mongodb.org/mongo-driver/mongo"
)

type AppState struct {
	RedisClient *redis.Client
	MongoClient *mongo.Client
}
