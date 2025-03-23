package sessions

type SessionInput struct {
	DeviceID string `json:"deviceID"`
	Lat      string `json:"lat"`
	Lng      string `json:"lng"`
}

type Session struct {
	DeviceID              string                `json:"deviceID" bson:"deviceID"`
	Lat                   string                `json:"lat" bson:"lat"`
	Lng                   string                `json:"lng" bson:"lng"`
	Address               string                `json:"address" bson:"address"`
	UpdatedAt             int64                 `json:"updatedAt" bson:"updatedAt"`
	MarketPlaceAttributes MarketPlaceAttributes `json:"marketplaceAttributes" bson:"marketplaceAttributes"`
	ZeptoAuth             ZeptoAuthData         `json:"zeptoAuth" bson:"zeptoAuth"` // Added Zepto auth data
}

type ZeptoAuthData struct {
	Cookie    string `json:"cookie" bson:"cookie"`
	XSRFToken string `json:"x-xsrf-token" bson:"x-xsrf-token"`
	SessionID string `json:"sessionId" bson:"sessionId"`
}

type MarketPlaceAttributes struct {
	ZeptoStoreAttributes     ZeptoStoreAttributes     `json:"zeptoStoreAttributes" bson:"zeptoStoreAttributes"`
	InstamartStoreAttributes InstamartStoreAttributes `json:"instamartStoreAttributes" bson:"instamartStoreAttributes"`
	BlinkitStoreAttributes   BlinkitStoreAttributes   `json:"blinkitStoreAttributes" bson:"blinkitStoreAttributes"`
}

type InstamartStoreAttributes struct {
	StoreID     string `json:"storeId" bson:"storeId"`
	Serviceable bool   `json:"serviceable" bson:"serviceable"`
	ETA         string `json:"eta" bson:"eta"`
}

type BlinkitStoreAttributes struct {
	StoreID     string `json:"storeId" bson:"storeId"`
	Serviceable bool   `json:"serviceable" bson:"serviceable"`
	ETA         string `json:"eta" bson:"eta"`
}

type ZeptoStoreAttributes struct {
	StoreID     string `json:"storeId" bson:"storeId"`
	Serviceable bool   `json:"serviceable" bson:"serviceable"`
	ETA         string `json:"eta" bson:"eta"`
}
