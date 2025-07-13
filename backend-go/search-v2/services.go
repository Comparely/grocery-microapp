package searchv2

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"sync"

	"github.com/comparely/comparely-grocery-backend/config"
	"github.com/comparely/comparely-grocery-backend/sessions"
)

func SearchProducts(appState config.AppState, query string, deviceID string) ([]Product, error) {
	ctx := context.Background()

	var (
		blinkitProducts   []RawProduct
		instamartProducts []RawProduct
		zeptoProducts     []RawProduct
		bigbasketProducts []RawProduct
		errBlinkit        error
		errInstamart      error
		errZepto          error
		errBigbasket      error
	)
	var lat, lng string
	var zeptoStoreId string
	var instamartStoreId string

	if deviceID != "" {
		sess, err := sessions.GetSession(ctx, appState, deviceID)
		if err == nil {
			lat = sess.Lat
			lng = sess.Lng
			zeptoStoreId = sess.MarketPlaceAttributes.ZeptoStoreAttributes.StoreID
			instamartStoreId = sess.MarketPlaceAttributes.InstamartStoreAttributes.StoreID
		} else {
			log.Printf("Session not found for deviceID %s: %v", deviceID, err)
		}
	}

	if lat == "" && lng == "" {
		lat = "12.975060"
		lng = "77.604691"
	}
	if zeptoStoreId == "" {
		zeptoStoreId = "fa5e892d-65d7-4da6-9bde-e1f22deb7b6f"
	}
	if instamartStoreId == "" {
		instamartStoreId = "1402463"
	}

	var wg sync.WaitGroup
	wg.Add(4)

	go func() {
		defer wg.Done()
		blinkitProducts, errBlinkit = fetchBlinkitProducts(url.QueryEscape(query), lat, lng)
		if errBlinkit != nil {
			log.Printf("Blinkit fetch failed for query '%s': %v", query, errBlinkit)
			return
		}
	}()

	go func() {
		defer wg.Done()
		instamartProducts, errInstamart = fetchInstamartProducts(url.QueryEscape(query), instamartStoreId)
		if errInstamart != nil {
			log.Printf("Instamart fetch failed for query '%s': %v", query, errInstamart)
			return
		}
	}()

	go func() {
		defer wg.Done()
		zeptoProducts, errZepto = fetchZeptoProducts(url.QueryEscape(query), lat, lng)
		if errZepto != nil {
			log.Printf("Zepto fetch failed for query '%s': %v", query, errZepto)
			return
		}
	}()

	go func() {
		defer wg.Done()
		bigbasketProducts, errBigbasket = fetchBigBasketProducts(url.QueryEscape(query), lat, lng)
		if errBigbasket != nil {
			log.Printf("BigBasket fetch failed for query '%s': %v", query, errBigbasket)
			return
		}
	}()

	wg.Wait()

	log.Printf("blinkit: %d, instamart: %d, zepto: %d, bigbasket: %d", len(blinkitProducts), len(instamartProducts), len(zeptoProducts), len(bigbasketProducts))

	if errBlinkit != nil && errInstamart != nil && errZepto != nil {
		return nil, fmt.Errorf("all sources failed: Blinkit (%v), Instamart (%v), Zepto (%v)", errBlinkit, errInstamart, errZepto)
	}

	availableProducts := []RawProduct{}
	if errBlinkit == nil {
		availableProducts = append(availableProducts, blinkitProducts...)
	}
	if errInstamart == nil {
		availableProducts = append(availableProducts, instamartProducts...)
	}
	if errZepto == nil {
		availableProducts = append(availableProducts, zeptoProducts...)
	}
	if errBigbasket == nil {
		availableProducts = append(availableProducts, bigbasketProducts...)
	}

	return mergeProducts(availableProducts), nil
}
