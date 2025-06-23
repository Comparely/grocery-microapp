export const productScrapingScript_instamart = () => {
    const script = `(function () {
        // Intercept XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function () {
            this.addEventListener('load', function () {
                try {
                    window.ReactNativeWebView.postMessage(
                        JSON.stringify({
                            type: 'xhr',
                            url: this.responseURL,
                            status: this.status,
                            response: this.responseText,
                        }),
                    );
                } catch (err) {}
            });
            originalXHROpen.apply(this, arguments);
        };

        // Intercept fetch
        const originalFetch = window.fetch;
        window.fetch = function () {
            return originalFetch.apply(this, arguments).then(function (response) {
                const clone = response.clone();
                clone.text().then(function (bodyText) {
                    try {
                        window.ReactNativeWebView.postMessage(
                            JSON.stringify({
                                type: 'fetch',
                                url: response.url,
                                status: response.status,
                                response: bodyText,
                            }),
                        );
                    } catch (err) {}
                });
                return response;
            });
        };
    })();`;
    return script;
};

export const injectSingleProductScript_instamart = (targetPrice: number): string => {
    const script = `
    (function () {
      try {
        const addOrOptionBtn =
          document.querySelector('[data-testid="add_buttons_center"]') ||
          document.querySelector('#product-details-page-container > div > div._2_95H.bottomOffsetPadBottom._1Xu6u > div._7I7zN > div._1Cxye > div._AHZN._3M_WX.Hxf8j > div._2zozL > div > div > button');

        if (!addOrOptionBtn) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CART_FLOW_ERROR',
            message: 'No ADD/Options button found'
          }));
          return;
        }

        addOrOptionBtn.click();

        let attempts = 0;
        const maxAttempts = 20;
        const interval = setInterval(() => {
          const variants = document.querySelectorAll('[data-testid="variants-container"]');

          if (variants.length === 0) {
            attempts++;
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CART_FLOW_COMPLETE',
                message: 'Direct add assumed successful (no variants shown)'
              }));
            }
            return;
          }

          let matched = false;
          for (const variant of variants) {
            const priceEl = variant.querySelector('[data-testid="item-offer-price"]');
            if (priceEl?.getAttribute("aria-label") === "${targetPrice}") {
              const addBtn = variant.querySelector('button[data-testid="add_buttons_center"]');
              if (addBtn) {
                addBtn.click();

                const confirmBtn = document.querySelector('[data-testid="InstamartItemCustomizationWidget-cta"]');
                if (confirmBtn) {
                  confirmBtn.click();
                }

                clearInterval(interval);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'CART_FLOW_COMPLETE',
                  message: 'Variant with price ${targetPrice} added and confirmed'
                }));
                matched = true;
                break;
              }
            }
          }

          if (!matched) {
            clearInterval(interval);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CART_FLOW_ERROR',
              message: 'No matching variant found for price ${targetPrice}'
            }));
          }

        }, 300);
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CART_FLOW_ERROR',
          message: 'Script error: ' + err.message
        }));
      }
    })();
    true;
  `;
    return script;
};

export const injectCartSummaryScript_instamart = (): string => {
    const script = `
    (function() {
        const billDetails = {};
        document.querySelectorAll('div[role="listitem"]').forEach((item) => {
            const labels = item.querySelectorAll('[data-testid="billline-segment-text"]');

            if (labels.length === 2 || labels.length === 3) {
                const labelRaw = labels[0]?.textContent.trim();
                const value = labels[labels.length - 1]?.textContent.trim();

                let cleanedLabel = labelRaw.toLowerCase();

                // Normalize key names
                if (cleanedLabel.includes("item total")) cleanedLabel = "Items total";
                else if (cleanedLabel.includes("handling")) cleanedLabel = "Handling charge";
                else if (cleanedLabel.includes("delivery partner")) cleanedLabel = "Delivery charge";
                else if (cleanedLabel.includes("gst")) cleanedLabel = "GST";
                else if (cleanedLabel.includes("to pay")) cleanedLabel = "Grand total";
                else return; // skip irrelevant items

                billDetails[cleanedLabel] = value;
            }
        });

        const deliveryTimeEl = document.querySelector('div[data-testid="sla"]');
        if (deliveryTimeEl) {
            billDetails["Delivery Time"] = deliveryTimeEl.innerText.trim();
        }

        const result = { "Bill Details": billDetails };

        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CART_BILL_SUMMARY',
            data: {
            'Bill details': billDetails
          }
        }));
    })();
    true;`;
    return script;
};

export const injectAddOrSubScript_instamart = (action: 'add' | 'sub', index: number): string => {
    const script = `
    (function() {
        const i = ${index};
        const addButtons = document.querySelectorAll('button[data-testid="add_buttons_plus"]');
        const subButtons = document.querySelectorAll('button[data-testid="add_buttons_minus"]');

        if ('${action}' === 'add' && addButtons[i]) {
          addButtons[i].click();
        } else if ('${action}' === 'sub' && subButtons[i]) {
          subButtons[i].click();
        } else {
          console.warn('❌ No button found for action "${action}" at index', i);
        }

        setTimeout(() => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'PRODUCT_QUANTITY_UPDATED',
            source: 'instamart',
            index: i,
            action: '${action}'
          }));
        }, 0);
    })();
    true;
  `;
    return script;
};

export const injectLocationSelectionScript_instamart = () => {
    const script = `
  (function() {
      const locationButton = document.querySelector('[data-testid="set-gps-button"]')?.click();
      if (locationButton) {
          locationButton.click();
      }
      window.ReactNativeWebView?.postMessage?.(JSON.stringify({
        type: 'LOCATION_ACCESS_TRIGGERED'
      }));
  })();
  true;
  `;
    return script;
};
