package config

import (
	"fmt"
	"os"
)

var GINGER_URL string = os.Getenv("GINGER_URL")

var GINGER_SPAWN_URL string = fmt.Sprintf("%sspawn", GINGER_URL)
