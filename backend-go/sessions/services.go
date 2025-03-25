package sessions

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/comparely/comparely-grocery-backend/config"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Removed global rate limiter variables

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

func fetchBlinkitStoreDetails(lat string, lng string) (BlinkitStoreAttributes, error) {
	baseUrl := "https://blinkit.com/layout/earliest_promise_time?template_version=9"
	headers := map[string]string{
		"accept":          "*/*",
		"accept-language": "en-US,en;q=0.9",
		"cache-control":   "no-cache",
		"priority":        "u=1, i",
		"lat":             lat,
		"lon":             lng,
		"app_client":      "consumer_web",
		"Cookie":          "__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"user-agent":      "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
		"content-type":    "application/json",
	}
	var result BlinkitStoreAttributes
	res, err := fetchJSON(baseUrl, "GET", headers, "")
	if err != nil {
		return BlinkitStoreAttributes{}, err
	}
	if data, ok := res["data"].(map[string]interface{}); ok {
		result.StoreID = ""
		result.Serviceable = true // TODO: Change this if needed

		if data["eta_in_minutes"] != nil {
			eta := fmt.Sprintf("%s Mins", strconv.Itoa(int(data["eta_in_minutes"].(float64))))
			result.ETA = eta
		}
	}
	return result, nil
}

func fetchZeptoInitialCookies() (string, string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", "https://www.zeptonow.com/", nil)
	if err != nil {
		return "", "", err
	}

	req.Header.Set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36")
	req.Header.Set("accept-language", "en-US,en;q=0.9")

	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	cookies := resp.Header["Set-Cookie"]
	cookieStr := strings.Join(cookies, "; ")
	xsrfToken := resp.Header.Get("x-xsrf-token")

	return cookieStr, xsrfToken, nil
}

func fetchAddressUsingInstamart(lat string, lng string) (string, error) {
	baseUrl := fmt.Sprintf("https://www.swiggy.com/api/instamart/maps/address-widgets?intent=ANY&service_line=INSTAMART&address_type=OTHERS&address_action=NEW&lat=%s&lng=%s", lat, lng)
	headers := map[string]string{
		"accept":          "*/*",
		"accept-language": "en-US,en;q=0.9",
		"cache-control":   "no-cache",
		"priority":        "u=1, i",
		"Cookie":          "__SW=9QmfCnSQcvpkyIwI-6umQ18QRNdGE9sc; _cid=MTA2ODg4NDU5; _device_id=846a4f24-003f-b080-2d71-53faeaf6141e; _session_tid=585d1f947945ddfe9d2fa8633361264a1c2ace308d38f5be3ba5e3e958dfc362d690f000d6276eb14a9c155d9492dfc42cb984676e49b219e0dfcaf1f14d8e69253138148da9e3a46a701912480bdcd83341b2e4375a2d1abe05b803f2f574976406492fce2c426e049b76ac823c35f5; _swuid=846a4f24-003f-b080-2d71-53faeaf6141e; ally-on=false; bottomOffset=0; deviceId=s%3A7d44adb5-c252-405f-a395-68222759bb78.oVmO1zqM2i5%2BNBTrHeUaXoV91npFCHkqtq5BmQ0QxaE; genieTrackOn=false; isNative=false; openIMHP=false; platform=web; sid=s%3Aj833e338-b6d7-4c9a-bc97-b41c064f873d.JCSEPujJwmNk7qRempcIYBmANtzySDxF%2F9BZm9iVcpU; statusBarHeight=0; strId=; subplatform=mweb; tid=s%3Ae3e4fbaf-5aa2-4d09-9c06-f031fc2d044c.cJNiPnkRnuMxVeW6j%2BhVZOxJwYPizk6n%2FwaBtNrmzUE; versionCode=1200",
		"user-agent":      "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36 Edg/133.0.0.0",
		"content-type":    "application/json",
	}

	log.Println("Start InstamartAddr Fetch")
	var address string = ""
	res, err := fetchJSON(baseUrl, "GET", headers, "")
	if err != nil {
		return "", err
	}
	if data, ok := res["data"].(map[string]interface{}); ok {
		if addressData, ok := data["address"].(map[string]interface{}); ok {
			address = addressData["title"].(string)
		}
	}
	return address, nil
}

// FetchZeptoStoreDetails fetches store details from Zepto with improved session handling.
// Removed rate limiter code.
func FetchZeptoStoreDetails(lat string, lng string, sessionId string) (ZeptoStoreAttributes, ZeptoAuthData, error) {
	initialCookie, initialXSRFToken, err := fetchZeptoInitialCookies()
	if err != nil {
		log.Printf("Failed to fetch initial cookies: %v", err)
	}

	zeptoUrl := "https://api.zeptonow.com/api/v2/get_page?"
	headers := map[string]string{
		"accept":                "application/json, text/plain, */*",
		"accept-language":       "en-US,en;q=0.9",
		"app_sub_platform":      "WEB",
		"app_version":           "12.63.1", // Updated to match successful request
		"appversion":            "12.63.1",
		"auth_revamp_flow":      "v2",
		"compatible_components": "CONVENIENCE_FEE,RAIN_FEE,EXTERNAL_COUPONS,STANDSTILL,BUNDLE,MULTI_SELLER_ENABLED,PIP_V1,ROLLUPS,SCHEDULED_DELIVERY,SAMPLING_ENABLED,ETA_NORMAL_WITH_149_DELIVERY,ETA_NORMAL_WITH_199_DELIVERY,HOMEPAGE_V2,NEW_ETA_BANNER,VERTICAL_FEED_PRODUCT_GRID,AUTOSUGGESTION_PAGE_ENABLED,AUTOSUGGESTION_PIP,AUTOSUGGESTION_AD_PIP,BOTTOM_NAV_FULL_ICON,COUPON_WIDGET_CART_REVAMP,DELIVERY_UPSELLING_WIDGET,MARKETPLACE_CATEGORY_GRID,NO_PLATFORM_CHECK_ENABLED_V2,SUPER_SAVER:1,SUPERSTORE_V1,PROMO_CASH:0,24X7_ENABLED_V1,TABBED_CAROUSEL_V2,HP_V4_FEED,WIDGET_BASED_ETA,NEW_FEE_STRUCTURE,NEW_BILL_INFO,RE_PROMISE_ETA_ORDER_SCREEN_ENABLED,SUPERSTORE_V1,MANUALLY_APPLIED_DELIVERY_FEE_RECEIVABLE,MARKETPLACE_REPLACEMENT,ZEPTO_PASS,ZEPTO_PASS:1,ZEPTO_PASS:2,ZEPTO_PASS_RENEWAL,CART_REDESIGN_ENABLED,SHIPMENT_WIDGETIZATION_ENABLED,TABBED_CAROUSEL_V2,24X7_ENABLED_V1,PROMO_CASH:0,HOMEPAGE_V2,SUPER_SAVER:1,NO_PLATFORM_CHECK_ENABLED_V2,HP_V4_FEED,GIFT_CARD,SCLP_ADD_MONEY,GIFTING_ENABLED,OFSE,WIDGET_BASED_ETA",
		"content-type":          "application/json",
		"marketplace_type":      "ZEPTO_NOW",
		"platform":              "WEB",
		"user-agent":            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
		"requestid":             sessionId,
		"sessionid":             sessionId,
		"deviceid":              uuid.New().String(), // Unique device ID per request
		"storeid":               "fa5e892d-65d7-4da6-9bde-e1f22deb7b6f",
		"origin":                "https://www.zeptonow.com",
		"referer":               "https://www.zeptonow.com/",
	}

	zeptoQueryParams := map[string]string{
		"latitude":              lat,
		"longitude":             lng,
		"page_type":             "HOME",
		"version":               "v2",
		"show_new_eta_banner":   "false", // Match successful request
		"page_size":             "1",
		"enforce_platform_type": "WEB",
	}

	params := url.Values{}
	for key, val := range zeptoQueryParams {
		params.Add(key, val)
	}
	zeptoUrl += params.Encode()

	const maxRetries = 5
	var backoff time.Duration = 5 * time.Second // Increased initial delay

	client := &http.Client{Timeout: 15 * time.Second}

	for attempt := 0; attempt <= maxRetries; attempt++ {
		req, err := http.NewRequest("GET", zeptoUrl, nil)
		if err != nil {
			return ZeptoStoreAttributes{}, ZeptoAuthData{}, err
		}

		for k, v := range headers {
			req.Header.Set(k, v)
		}
		if initialCookie != "" {
			req.Header.Set("Cookie", initialCookie)
		}
		if initialXSRFToken != "" {
			req.Header.Set("x-xsrf-token", initialXSRFToken)
		}

		resp, err := client.Do(req)
		if err != nil {
			return ZeptoStoreAttributes{}, ZeptoAuthData{}, err
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusTooManyRequests {
			if attempt == maxRetries {
				return ZeptoStoreAttributes{}, ZeptoAuthData{}, fmt.Errorf("max retries reached: Zepto returned 429 Too Many Requests")
			}
			retryAfter := resp.Header.Get("Retry-After")
			if retryAfter != "" {
				if seconds, err := strconv.Atoi(retryAfter); err == nil {
					backoff = time.Duration(seconds) * time.Second
				}
			} else {
				backoff = time.Duration(5*(attempt+1)) * time.Second // Linear backoff: 5s, 10s, 15s, 20s, 25s
				if backoff > 30*time.Second {
					backoff = 30 * time.Second // Cap at 30s
				}
			}
			log.Printf("Rate limit hit, retrying after %v (attempt %d/%d)", backoff, attempt+1, maxRetries)
			time.Sleep(backoff)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			return ZeptoStoreAttributes{}, ZeptoAuthData{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
		}

		bytes, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return ZeptoStoreAttributes{}, ZeptoAuthData{}, err
		}

		var result map[string]interface{}
		if err := json.Unmarshal(bytes, &result); err != nil {
			log.Printf("Failed to parse JSON from %s: %v", zeptoUrl, err)
			return ZeptoStoreAttributes{}, ZeptoAuthData{}, err
		}

		var storeAttrs ZeptoStoreAttributes
		if data, ok := result["storeServiceableResponse"].(map[string]interface{}); ok {
			if data["storeId"] != nil && data["serviceable"] != nil {
				storeAttrs.StoreID = data["storeId"].(string)
				storeAttrs.Serviceable = data["serviceable"].(bool)
				headers["storeid"] = storeAttrs.StoreID
			}
		}

		if pageLayout, ok := result["pageLayout"].(map[string]interface{}); ok {
			if widgets, ok := pageLayout["widgets"].([]interface{}); ok && len(widgets) > 0 {
				for _, widget := range widgets {
					widgetMap, ok := widget.(map[string]interface{})
					if !ok {
						continue
					}
					if widgetMap["widgetName"] == "ETA_BANNER" {
						if widgetData, ok := widgetMap["data"].(map[string]interface{}); ok {
							if widgetDataItems, ok := widgetData["items"].(map[string]interface{}); ok {
								if displayText, ok := widgetDataItems["displayText"].(string); ok && strings.Compare(displayText, "Delivery In") == 0 {
									if etaInMinutes, ok := widgetDataItems["etaInMinutes"].(string); ok {
										storeAttrs.ETA = fmt.Sprintf("%s Mins", etaInMinutes)
									} else if etaInMinutesFloat, ok := widgetDataItems["etaInMinutes"].(float64); ok {
										storeAttrs.ETA = fmt.Sprintf("%d Mins", int(etaInMinutesFloat))
									}
								} else if displayText, ok := widgetDataItems["displayText"].(string); ok {
									storeAttrs.ETA = displayText
								}
							}
						}
						break
					}
				}
			}
		}

		cookies := resp.Header["Set-Cookie"]
		cookieStr := strings.Join(cookies, "; ")
		xsrfToken := resp.Header.Get("x-xsrf-token")

		if cookieStr == "" && initialCookie != "" {
			cookieStr = initialCookie
		}
		if xsrfToken == "" && initialXSRFToken != "" {
			xsrfToken = initialXSRFToken
		}

		var sessionID string
		if cookieStr != "" {
			cookieParts := strings.Split(cookieStr, "; ")
			for _, part := range cookieParts {
				if strings.HasPrefix(part, "XSRF-TOKEN=") {
					xsrfToken = strings.TrimPrefix(part, "XSRF-TOKEN=")
				}
				if strings.HasPrefix(part, "session_id=") {
					sessionID = strings.TrimPrefix(part, "session_id=")
				}
			}
		}

		if sessionID == "" {
			if userSessionID, ok := result["userSessionId"]; ok && userSessionID != nil {
				if sessionIDStr, ok := userSessionID.(string); ok {
					sessionID = sessionIDStr
				}
			}
			if sessionID == "" {
				sessionID = sessionId // Fall back to passed sessionId
			}
		}

		authData := ZeptoAuthData{
			Cookie:    cookieStr,
			XSRFToken: xsrfToken,
			SessionID: sessionID,
		}

		return storeAttrs, authData, nil
	}

	return ZeptoStoreAttributes{}, ZeptoAuthData{}, fmt.Errorf("max retries exceeded for Zepto API")
}

// SaveSession remains largely unchanged, but ensure it uses the updated FetchZeptoStoreDetails
func SaveSession(ctx context.Context, appState config.AppState, sess *Session) error {
	var instamartErr, zeptoErr, blinkitErr, addressErr error
	var zeptoAuth ZeptoAuthData
	var wg sync.WaitGroup
	wg.Add(4)

	go func() {
		defer wg.Done()
		sess.MarketPlaceAttributes.InstamartStoreAttributes, instamartErr = fetchInstamartStoreDetails(sess.Lat, sess.Lng)
		if instamartErr != nil {
			log.Printf("Instamart fetch error: %v", instamartErr)
		}
	}()

	go func() {
		defer wg.Done()
		var zeptoStore ZeptoStoreAttributes
		sessionID := sess.ZeptoAuth.SessionID
		if sessionID == "" {
			sessionID = uuid.New().String()
		}
		zeptoStore, zeptoAuth, zeptoErr = FetchZeptoStoreDetails(sess.Lat, sess.Lng, sessionID)
		sess.MarketPlaceAttributes.ZeptoStoreAttributes = zeptoStore
		sess.ZeptoAuth = zeptoAuth
		if zeptoErr != nil {
			log.Printf("Zepto fetch error: %v", zeptoErr)
		}
	}()

	go func() {
		defer wg.Done()
		sess.MarketPlaceAttributes.BlinkitStoreAttributes, blinkitErr = fetchBlinkitStoreDetails(sess.Lat, sess.Lng)
		if blinkitErr != nil {
			log.Printf("Blinkit fetch error: %v", blinkitErr)
		}
	}()

	go func() {
		defer wg.Done()
		sess.Address, addressErr = fetchAddressUsingInstamart(sess.Lat, sess.Lng)
		if addressErr != nil {
			log.Printf("Address fetch error: %v", addressErr)
		}
	}()

	wg.Wait()

	sessionCollection := appState.MongoClient.Database("comparelySBX").Collection("UserSessions")
	filter := bson.M{"deviceID": sess.DeviceID}
	update := bson.M{"$set": sess}
	opts := options.Update().SetUpsert(true)
	_, err := sessionCollection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		log.Printf("MongoDB upsert error: %v", err)
		return fmt.Errorf("failed to upsert session in MongoDB: %v", err)
	}

	sessionJSON, err := json.Marshal(sess)
	if err != nil {
		log.Printf("JSON marshal error: %v", err)
		return fmt.Errorf("failed to marshal session: %v", err)
	}
	redisCtx := context.Background()
	err = appState.RedisClient.Set(redisCtx, "session:"+sess.DeviceID, sessionJSON, time.Hour).Err()
	if err != nil {
		log.Printf("Redis set error: %v", err)
		return fmt.Errorf("failed to set session in Redis: %v", err)
	}

	log.Printf("Session saved successfully: %+v", sess)

	if instamartErr != nil && zeptoErr != nil && blinkitErr != nil {
		return fmt.Errorf("all marketplace fetches failed: Instamart: %v, Zepto: %v, Blinkit: %v", instamartErr, zeptoErr, blinkitErr)
	}
	if zeptoErr != nil {
		log.Printf("Proceeding with partial session save due to Zepto error: %v", zeptoErr)
	}
	return nil
}

func GetSession(ctx context.Context, appState config.AppState, deviceID string) (Session, error) {
	var sess Session

	// Try Redis first
	redisCtx := context.Background()
	sessionJSON, err := appState.RedisClient.Get(redisCtx, "session:"+deviceID).Result()
	if err == nil {
		if err := json.Unmarshal([]byte(sessionJSON), &sess); err == nil {
			return sess, nil
		}
	}

	// Fallback to MongoDB
	sessionCollection := appState.MongoClient.Database("comparelySBX").Collection("UserSessions")
	filter := bson.M{"deviceID": deviceID}
	err = sessionCollection.FindOne(ctx, filter).Decode(&sess)
	if err != nil {
		return Session{}, fmt.Errorf("failed to find session for deviceID %s: %v", deviceID, err)
	}

	// Cache in Redis for future use
	sessionJSONBytes, err := json.Marshal(sess)
	if err == nil {
		sessionJSON = string(sessionJSONBytes)
		appState.RedisClient.Set(redisCtx, "session:"+deviceID, sessionJSON, time.Hour)
	}

	return sess, nil
}
