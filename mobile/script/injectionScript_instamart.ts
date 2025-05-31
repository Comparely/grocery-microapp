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

        const result = { "Bill Details": billDetails };

        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CART_SUMMARY',
            data: result
        }));
    })();
    true;`;
    return script;
};
