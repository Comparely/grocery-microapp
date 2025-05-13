package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/chromedp/cdproto/browser"
	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/cdproto/emulation"
	"github.com/chromedp/cdproto/fetch"
	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const PORT = 5500

func fetchZeptoProductsV2(query, lat, lng string) (map[string]interface{}, error) {
	prof := filepath.Join("./tmp", uuid.New().String())
	absProf, err := filepath.Abs(prof)
	if err != nil {
		return nil, fmt.Errorf("abs profileDir: %w", err)
	}
	if err := os.MkdirAll(absProf, 0700); err != nil {
		return nil, fmt.Errorf("mkdir profileDir: %w", err)
	}
	defer RemoveContents(absProf)

	allocCtx, cancelAlloc := chromedp.NewExecAllocator(
		context.Background(),
		chromedp.UserDataDir(absProf),
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("ignore-certificate-errors", true),
		chromedp.Flag("allow-insecure-localhost", true),
	)
	defer cancelAlloc()

	ctxBrowser, cancelBrowser := chromedp.NewContext(allocCtx)
	defer cancelBrowser()

	ctxRun, cancelRun := context.WithTimeout(ctxBrowser, 6*time.Second)
	defer cancelRun()

	respCh := make(chan []byte, 1)
	var requestID network.RequestID
	chromedp.ListenTarget(ctxBrowser, func(ev interface{}) {
		switch ev := ev.(type) {
		case *network.EventResponseReceived:
			//log.Printf("\nGot network: %s", ev.Response.URL)
			if ev.Type == network.ResourceTypeXHR &&
				strings.Contains(ev.Response.URL, "/api/v3/search") {
				//log.Printf("Got search \n")
				requestID = ev.RequestID
			}
		case *network.EventLoadingFinished:
			if ev.RequestID == requestID {
				log.Printf("Got search finish \n")
				go func(requestID network.RequestID) {
					var data []byte
					if err := chromedp.Run(ctxBrowser, chromedp.ActionFunc(func(ctx1 context.Context) error {
						var err error
						data, err = network.GetResponseBody(requestID).Do(ctx1)
						if err != nil {
							return err
						}
						//log.Printf("Got resp", data)
						return nil
					})); err != nil {
						log.Printf("could not read response body: %v", data)
					}
					if err == nil {
						select {
						case respCh <- data:
						default:
						}
					}
				}(ev.RequestID)
			}

		}
	})
	chromedp.ListenTarget(ctxBrowser, DisableImageLoad(ctxBrowser))

	latF, err := strconv.ParseFloat(lat, 64)
	if err != nil {
		return nil, err
	}
	lngF, err := strconv.ParseFloat(lng, 64)
	if err != nil {
		return nil, err
	}

	var outBody []byte
	var buf []byte
	runErr := chromedp.Run(ctxRun,
		network.Enable(),
		fetch.Enable(),
		browser.GrantPermissions([]browser.PermissionType{browser.PermissionTypeGeolocation}).
			WithOrigin("https://www.zeptonow.com"),
		emulation.SetGeolocationOverride().WithAccuracy(100).WithLatitude(latF).WithLongitude(lngF),
		chromedp.Navigate(fmt.Sprintf("https://www.zeptonow.com/search?query=%s", query)),
		chromedp.Sleep(2*time.Second), // wait for JS
		chromedp.FullScreenshot(&buf, 90),
		chromedp.ActionFunc(func(ctx context.Context) error {
			select {
			case b := <-respCh:
				outBody = b
				return nil
			case <-ctx.Done():
				return errors.New("timed out waiting for search API response")
			}
		}),
	)
	if runErr != nil {
		return nil, runErr
	}

	if err := os.WriteFile("./screen.png", buf, 0644); err != nil {
		log.Printf("could not create file: %+v", err)
	}

	var full map[string]interface{}
	if err := json.Unmarshal(outBody, &full); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w", err)
	}
	var agg []interface{}
	if layout, ok := full["layout"].([]interface{}); ok {
		agg = append(agg, layout...)
	}
	return map[string]interface{}{"layout": agg}, nil
}

func RemoveContents(dir string) error {
	files, err := filepath.Glob(filepath.Join(dir, "*"))
	if err != nil {
		return err
	}
	for _, file := range files {
		err = os.RemoveAll(file)
		if err != nil {
			return err
		}
	}
	return nil
}

func DisableImageLoad(ctx context.Context) func(event interface{}) {
	return func(event interface{}) {
		switch ev := event.(type) {
		case *fetch.EventRequestPaused:
			go func() {
				c := chromedp.FromContext(ctx)
				ctx := cdp.WithExecutor(ctx, c.Target)

				if ev.ResourceType == network.ResourceTypeImage {
					fetch.FailRequest(ev.RequestID, network.ErrorReasonBlockedByClient).Do(ctx)
				} else {
					fetch.ContinueRequest(ev.RequestID).Do(ctx)
				}
			}()
		}
	}
}

func main() {
	router := gin.Default()

	router.POST("/zepto", func(c *gin.Context) {
		var req struct {
			Query string `json:"query"    binding:"required"`
			Lat   string `json:"lat"      binding:"required"`
			Lng   string `json:"lng"      binding:"required"`
		}

		// Bind JSON body into req; on error, return 400
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Call your product-fetching function
		data, err := fetchZeptoProductsV2(req.Query, req.Lat, req.Lng)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Return the fetched layout as JSON
		c.JSON(http.StatusOK, data)
	})

	router.Run(fmt.Sprintf(":%d", PORT))
}
