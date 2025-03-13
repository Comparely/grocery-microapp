package sessions

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/comparely/comparely-grocery-backend/config"
	"go.mongodb.org/mongo-driver/bson"
)

func fetchJSON(url string, method string, headers map[string]string, body string) (map[string]interface{}, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	var req *http.Request
	var err error
	if body != "" {
		req, err = http.NewRequest(method, url, strings.NewReader(body))
	} else {
		req, err = http.NewRequest(method, url, nil)
	}
	if err != nil {
		return nil, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var result map[string]interface{}
	if err := json.Unmarshal(bytes, &result); err != nil {
		log.Printf("Failed to parse JSON from %s: %v", url, err)
		return nil, err
	}
	return result, nil
}

func fetchInstamartStoreDetails(lat string, lng string) (InstamartStoreAttributes, error) {
	baseUrl := "https://www.swiggy.com/api/instamart/home/select-location"
	headers := map[string]string{
		"accept":          "*/*",
		"accept-language": "en-US,en;q=0.9",
		"cache-control":   "no-cache",
		"priority":        "u=1, i",
		"Cookie":          "__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"user-agent":      "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
		"content-type":    "application/json",
	}
	clientBody := func() string {
		b, _ := json.Marshal(map[string]interface{}{
			"data": map[string]string{
				"lat":      lat,
				"lng":      lng,
				"clientId": "INSTAMART-APP",
			},
		})
		return string(b)
	}
	var result InstamartStoreAttributes

	res, err := fetchJSON(baseUrl, "POST", headers, clientBody())
	if err != nil {
		return InstamartStoreAttributes{}, err
	}
	if data, ok := res["data"].(map[string]interface{}); ok {
		result.StoreID = data["storeId"].(string)
		serviceability := data["serviceability"].(string)
		if serviceability == "SERVICEABLE" {
			result.Serviceable = true
		}

		eta := data["slaString"].(string)
		result.ETA = eta
	}

	return result, nil
}

func fetchZeptoStoreDetails(lat string, lng string) (ZeptoStoreAttributes, error) {
	zeptoUrl := "https://api.zeptonow.com/api/v2/get_page?"
	headers := map[string]string{
		"accept":           "application/json, text/plain, */*",
		"appversion":       "12.59.0",
		"content-type":     "application/json",
		"Cookie":           "__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"marketplace_type": "ZEPTO_NOW",
		"platform":         "WEB",
	}
	zeptoQueryParams := map[string]string{
		"latitude":              lat,
		"longitude":             lng,
		"page_type":             "HOME",
		"version":               "v2",
		"show_new_eta_banner":   "true",
		"page_size":             "1",
		"enforce_platform_type": "WEB",
		"layout_id":             "5618",
	}

	for key, val := range zeptoQueryParams {
		zeptoUrl += key + "=" + val + "&"
	}
	zeptoUrl = zeptoUrl[:len(zeptoUrl)-1]

	var result ZeptoStoreAttributes

	res, err := fetchJSON(zeptoUrl, "GET", headers, "")
	if err != nil {
		return ZeptoStoreAttributes{}, err
	}
	if data, ok := res["storeServiceableResponse"].(map[string]interface{}); ok {
		result.StoreID = data["storeId"].(string)
		result.Serviceable = data["serviceable"].(bool)
	}
	if pageLayout, ok := res["pageLayout"].(map[string]interface{}); ok {
		if widgets, ok := pageLayout["widgets"].([]map[string]interface{}); ok && len(widgets) > 0 {
			for _, widget := range widgets {
				if widget["widgetName"] == "ETA_BANNER" {
					if widgetData, ok := widget["data"].(map[string]interface{}); ok {
						if widgetDataItems, ok := widgetData["items"].(map[string]interface{}); ok {
							result.ETA = widgetDataItems["displayText"].(string)
						}
					}
					break
				}
			}
		}
	}

	return result, nil
}

// SaveSession saves or updates a session in MongoDB and Redis.
func SaveSession(ctx context.Context, appState config.AppState, sess Session) error {
	var instamartErr, zeptoErr error
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		sess.MarketPlaceAttributes.InstamartStoreAttributes, instamartErr = fetchInstamartStoreDetails(sess.Lat, sess.Lng)
	}()

	go func() {
		defer wg.Done()
		sess.MarketPlaceAttributes.ZeptoStoreAttributes, zeptoErr = fetchZeptoStoreDetails(sess.Lat, sess.Lng)
	}()

	wg.Wait()

	if instamartErr != nil {
		return instamartErr
	}

	if zeptoErr != nil {
		return zeptoErr
	}

	// Upsert into MongoDB.
	sessionCollection := appState.MongoClient.Database("comparelySBX").Collection("UserSessions")

	filter := bson.M{"deviceID": sess.DeviceID}
	update := bson.M{"$set": sess}
	_, err := sessionCollection.UpdateOne(ctx, filter, update, nil)
	if err != nil {
		return err
	}
	// Save to Redis with expiration (e.g., 1 hour).
	sessionJSON, err := json.Marshal(sess)
	if err != nil {
		return err
	}
	redisCtx := context.Background()
	err = appState.RedisClient.Set(redisCtx, "session:"+sess.DeviceID, sessionJSON, time.Hour).Err()
	return err
}

// GetSession retrieves a session by deviceID.
// It first tries Redis, then falls back to MongoDB and caches it in Redis.
func GetSession(ctx context.Context, appState config.AppState, deviceID string) (*Session, error) {
	sessionCollection := appState.MongoClient.Database("comparelySBX").Collection("UserSessions")
	redisCtx := context.Background()
	val, err := appState.RedisClient.Get(redisCtx, "session:"+deviceID).Result()
	if err == nil {
		var sess Session
		if err := json.Unmarshal([]byte(val), &sess); err == nil {
			return &sess, nil
		}
	}
	// Fall back to MongoDB.
	filter := bson.M{"deviceID": deviceID}
	var sess Session
	err = sessionCollection.FindOne(ctx, filter).Decode(&sess)
	if err != nil {
		return nil, err
	}
	// Cache in Redis.
	sessionJSON, err := json.Marshal(sess)
	if err == nil {
		appState.RedisClient.Set(redisCtx, "session:"+sess.DeviceID, sessionJSON, time.Hour)
	}
	return &sess, nil
}
