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
	UpdatedAt             int64                 `json:"updatedAt" bson:"updatedAt"`
	MarketPlaceAttributes MarketPlaceAttributes `json:"marketplaceAttributes" bson:"marketplaceAttributes"`
}

type MarketPlaceAttributes struct {
	ZeptoStoreAttributes     ZeptoStoreAttributes     `json:"zeptoStoreAttributes" bson:"zeptoStoreAttributes"`
	InstamartStoreAttributes InstamartStoreAttributes `json:"instamartStoreAttributes" bson:"instamartStoreAttributes"`
}

type InstamartStoreAttributes struct {
	StoreID     string `json:"storeId" bson:"storeId"`
	Serviceable bool   `json:"serviceable" bson:"serviceable"`
	ETA         string `json:"eta" bson:"eta"`
}

type ZeptoStoreAttributes struct {
	StoreID     string `json:"storeId" bson:"storeId"`
	Serviceable bool   `json:"serviceable" bson:"serviceable"`
	ETA         string `json:"eta" bson:"eta"`
}
