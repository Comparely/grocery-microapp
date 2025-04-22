package config

import (
	"fmt"
	"os"
)

func GetGingerURL(path string) string {
	var gingerURL string = os.Getenv("GINGER_URL")

	switch path {
	case "":
		return gingerURL

	case "spawn":
		return fmt.Sprintf("%sspawn", gingerURL)
	}

	return gingerURL
}
