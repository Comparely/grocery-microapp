// src/injectionScripts.ts

/**
 * Generates JS to log in (request OTP)
 */
export function injectLoginScript_zepto(phoneNumber: string, pinCode: string = '110001'): string {
    return `
      (function(params) {
  const btn = document.querySelector('[aria-label="login"]');
  if (btn) btn.click();

  // Step 2: Wait for input field to appear
  setTimeout(() => {
    const input = document.querySelector('input[placeholder="Enter Phone Number"]');
    if (!input) return console.log('Input field not found');

    // Step 3: Set value and trigger input events
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, params.phoneNumber);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Step 4: Click Continue button
    setTimeout(() => {
      const continueButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent.trim() === 'Continue'
      );
      if (!continueButton) return console.log('Continue button not found');
      continueButton.click();

      // Notify RN that Phone No. is filled
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'LOGIN_FLOW_COMPLETE'
      }));
    }, 1000);

  }, 1000);

})(${JSON.stringify({ phoneNumber, pinCode })});
    true;
    `;
}
/**
 * Generates JS to submit OTP digits
 */
export function injectOtpScript_zepto(otp: string): string {
    // Split into an array of characters, e.g. ["1","2","3","4"]
    const digitsArray = otp.split('').map((d) => parseInt(d)); // [1,2,3,4,5,6]
    const script = `
    (function() {
      const digits = ${JSON.stringify(digitsArray)};
      const inputs = Array.from(document.querySelectorAll('div.flex input[type="text"]'));
      inputs.forEach((input, i) => {
        input.style.pointerEvents = "auto";
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, digits[i]);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        });
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "OTP_SUBMITTED" }));
    })();
    true;
  `;
    return script;
}

/**
 * Generates JS to add products to cart and then scrape the summary
 */

export const injectSingleProductScript_zepto = (product: {
    url: string;
    variant?: string;
}): string => {
    const { url, variant } = product;
    const script = `
  (function() {
    const TARGET_URL = "${url}";
    const CLICK_TEXT = "Add To Cart";
    let clicked = false;

    // Core click routine
    function clickSequence() {
      try {
        // 1. Navigate if needed
        if (window.location.href !== TARGET_URL) {
          window.location.href = TARGET_URL;
        }

        // 2. Find the Add to Cart div
        const btn = document.querySelector('button[aria-label="Increase quantity by 1"]');

        if (btn && !clicked) {
          clicked = true;
          btn.click();
          console.log("🔘 Clicked Add to cart");

          // 3. After click, open cart and report
          setTimeout(() => {
            const cartIcon = document.querySelector('.Header__CartIcon-sc-1v2x4b8-0');
            if (cartIcon) {
              cartIcon.click();
              setTimeout(reportCart, 2000);
            } else {
              console.warn("Cart icon not found, retrying...");
            }
          }, 1500);
        }
      } catch (e) {
        console.error("Error in clickSequence:", e);
      }
    }

    // Build and send the cart summary
    function reportCart() {
      try {
        const items = Array.from(document.querySelectorAll('.CartItem__Wrapper-sc-1r7h4k3-0'))
          .map(item => ({
            name: item.querySelector('.ProductName__Name-sc-1z4m3g5-0')?.innerText || '',
            quantity: parseInt(item.querySelector('.Quantity__Quantity-sc-1r7h4k3-2')?.innerText || '0'),
            price: parseFloat(item.querySelector('.Price__Price-sc-1z4m3g5-0')?.innerText.replace('₹', '').replace(',', '') || '0')
          }));
        const totalPrice = parseFloat(document.querySelector('.TotalPrice__TotalPrice-sc-1z4m3g5-0')?.innerText.replace('₹', '').replace(',', '') || '0');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "CART_SUMMARY",
          data: { items, totalPrice }
        }));
        console.log("🛒 Cart reported");
      } catch (e) {
        console.error("Error in reportCart:", e);
      }
    }

    // Re-try on these events:
    ['DOMContentLoaded', 'load', 'visibilitychange', 'pageshow', 'focus'].forEach(evt => {
      document.addEventListener(evt, clickSequence, true);
      window.addEventListener(evt, clickSequence, true);
    });

    // MutationObserver for dynamic loading (e.g. SPA or lazy render)
    const obs = new MutationObserver(() => {
      if (!clicked) clickSequence();
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Poll every 1s as a last resort
    const poller = setInterval(() => {
      if (!clicked) clickSequence();
      else clearInterval(poller);
    }, 1000);

    // Initial kick-off
    clickSequence();
    window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CART_FLOW_COMPLETE',
      }));
  })();
  true;
  `;
    return script;
};

export const isUserLoggedInScript = `
  (function() {
    try {
      let isLoggedIn = false;
      const btn = document.querySelector('.ProfileButton__Container-sc-975teb-3');
      if (btn) btn.click();
      const isLogoutPresent = document.querySelector('.UserAccountList__Wrapper-sc-1hz2ugh-0 csiqBe');
      if(btn){
        isLoggedIn = true;
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "LOGIN_STATUS",
        isLoggedIn
      }));
    } catch (err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "LOGIN_STATUS_ERROR",
        message: err.message
      }));
    }
  })();
  true;
  `;

export const productScrapingScript = `(function () {
  const BASE_URL = 'https://www.zeptonow.com';

  const getHighestResImage = (srcSet) => {
    if (!srcSet) return '';
    const urls = srcSet.split(',').map(s => s.trim().split(' ')[0]);
    return urls[urls.length - 1]; // last one is highest-res
  };

  const products = Array.from(document.querySelectorAll('[data-testid="product-card"]')).map(card => {
    const name = card.querySelector('[data-testid="product-card-name"]')?.innerText.trim() || '';
    const price = card.querySelector('[data-testid="product-card-price"]')?.innerText.trim() || '';
    const quantity = card.querySelector('[data-testid="product-card-quantity"]')?.innerText.trim() || '';
    const deliveryTime = card.querySelector('p.block.font-body')?.innerText.trim() || '';

    const imgEl = card.querySelector('img');
    const image = getHighestResImage(imgEl?.getAttribute('srcset')) || imgEl?.src || '';

    const relativeLink = card.getAttribute('href') || '';
    const link = relativeLink.startsWith('http') ? relativeLink : BASE_URL + relativeLink;

    return { name, price, quantity, deliveryTime, image, link };
  });

  window.ReactNativeWebView.postMessage(JSON.stringify(products));
})();

true;
`;

export const injectCartSummaryScript_zepto = (): string => {
    const script = `
    (function() {
      try {
        const modals = document.querySelectorAll('div.fixed.inset-0.z-\\\\[99999999\\\\]');
        const modal = modals[1];
        const billDetails = {};

        if (!modal) {
          throw new Error("Cart modal not found.");
        }

        const summaryLines = modal.querySelectorAll('div[style*="margin-bottom"]');

        summaryLines.forEach(line => {
          const labelText = line.querySelector('button span')?.textContent?.trim();
          const priceSpans = line.querySelectorAll('div.flex.items-center span');

          let value = '';
          if (priceSpans.length === 2) {
            value = priceSpans[1].textContent.trim();
          } else if (priceSpans.length === 1) {
            value = priceSpans[0].textContent.trim();
          }

          if (labelText && value) {
            let cleanedLabel = labelText.toLowerCase().replace(/:/g, "").trim();

            if (cleanedLabel.includes("item total")) cleanedLabel = "Item Total";
            else if (cleanedLabel.includes("delivery")) cleanedLabel = "Delivery charge";
            else if (cleanedLabel.includes("handling")) cleanedLabel = "Platform fee";
            else if (cleanedLabel.includes("membership")) cleanedLabel = "Membership fee";
            else if (cleanedLabel.includes("to pay")) cleanedLabel = "Grand total";
            else if (cleanedLabel.includes("incl")) cleanedLabel = "Tax";

            billDetails[cleanedLabel] = value;
          }
        });

        // Extract delivery time as a string (e.g., "6 mins")
        const deliveryText = document.querySelector('p.text-cta1.truncate')?.innerText || '';
        const timeMatch = deliveryText.match(/\\d+\\s*mins?/i);
        const deliveryTime = timeMatch ? timeMatch[0] : null;

        if (deliveryTime) {
          billDetails['Delivery Time'] = deliveryTime;
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CART_BILL_SUMMARY',
          data: {
            'Bill details': billDetails
          }
        }));
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CART_BILL_SUMMARY',
          data: { error: e.message }
        }));
      }
    })();
    true;
  `;
    return script;
};

export const injectAddOrSubScript_zepto = (action: 'add' | 'sub', index: number): string => {
    const script = `
    (function() {
      const i = ${index};
      const addButtons = document.querySelectorAll('button[aria-label="Add"]');
      const subButtons = document.querySelectorAll('button[aria-label="Remove"]');

      if ('${action}' === 'add' && addButtons[i]) {
        addButtons[i].click();
        console.log('Clicked ADD button at index', i);
      } else if ('${action}' === 'sub' && subButtons[i]) {
        subButtons[i].click();
        console.log('Clicked REMOVE button at index', i);
      } else {
        console.warn('No button found for action "${action}" at index', i);
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PRODUCT_QUANTITY_UPDATED'
        }));
    })();
    true;
  `;
    return script;
};
