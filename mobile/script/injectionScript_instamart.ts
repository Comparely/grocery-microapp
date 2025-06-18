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
    return `
    (function () {
      const optionsBtn = document.querySelector('[data-testid="add_buttons_center"][aria-label^="View"]');
      if (optionsBtn) {
        optionsBtn.click();
        setTimeout(() => {
          const variantInterval = setInterval(() => {
            const variants = document.querySelectorAll('[data-testid="variants-container"]');

            for (const variant of variants) {
              const priceEl = variant.querySelector('[data-testid="item-offer-price"]');
              if (priceEl?.getAttribute("aria-label") === "${targetPrice}") {
                const addButton = variant.querySelector('[data-testid="add_buttons_center"]');
                if (addButton) {
                  addButton.click();
                  setTimeout(() => {
                    const confirmBtn = document.querySelector('[data-testid="InstamartItemCustomizationWidget-cta"]');
                    if (confirmBtn) {
                      confirmBtn.click();
                    } else {
                      console.warn("⚠️ Confirm button not found");
                    }
                  }, 500);

                  clearInterval(variantInterval);
                  return;
                }
              }
            }
          }, 300);
        }, 500);
      } else {
        console.warn("⚠️ 'View options' button not found.");
      }
    window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CART_FLOW_COMPLETE',
      }));
    })();
  `;
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
