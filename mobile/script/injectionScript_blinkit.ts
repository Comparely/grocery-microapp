// src/injectionScripts.ts

/**
 * Generates JS to log in (request OTP)
 */
export function injectLoginScript(phoneNumber: string, pinCode: string = '110001'): string {
    // 1) Serialize your params once
    const params = JSON.stringify({ phoneNumber, pinCode });
    return `
    (function(params) {
          const btn = document.querySelector('.ProfileButton__Container-sc-975teb-3');
          if (btn) btn.click();

          // Step 2: Wait a little to ensure input field loads
          setTimeout(() => {
            const input = document.querySelector('input[data-test-id="phone-no-text-box"]');
            if (!input) return console.log('Input field not found');

            // Step 3: Properly update the value and trigger events
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, params.phoneNumber);

            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            // Step 4: Wait again for Continue button to be enabled
            setTimeout(() => {
              const btn2 = document.querySelector('[data-test-id="login-continue-button"], .PhoneNumberLogin__LoginButton-sc-1j06udd-4');
              if (!btn2) {
                console.log('Continue button not found yet');
                return;
              }
              console.log('Continue button found:', btn2);
              btn2.click();
            }, 1000);

          }, 1000);
      // Notify RN that Pnone No. is filled
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'LOGIN_FLOW_COMPLETE',
      }));
    })(${params});
    true;
  `;
}
/**
 * Generates JS to submit OTP digits
 */
export function injectOtpScript(otp: string): string {
    // Split into an array of characters, e.g. ["1","2","3","4"]
    const digitsArray = otp.split('').map((d) => parseInt(d)); // [1,2,3,4,5,6]
    const script = `
      (function() {
        const digits = ${JSON.stringify(digitsArray)};
        const inputs = Array.from(document.querySelectorAll('input[data-test-id="otp-text-box"]'));
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
 * Generates JS to add a product to the cart
 * @param product - The product object containing URL and optional variant
 */

export const injectSingleProductScript = (product: { url: string; variant?: string }): string => {
    const { url } = product;
    console.log(url);
    const script = `
  (function() {
    const TARGET_URL = "${url}";
    const CLICK_TEXT = "Add to cart";
    let clicked = false;

    // Core click routine
    function clickSequence() {
      try {
        // 1. Navigate if needed
        if (window.location.href !== TARGET_URL) {
          window.location.href = TARGET_URL;
        }

        // 2. Find the Add to Cart div
        const btn = Array.from(document.querySelectorAll('[data-pf="reset"]'))
          .find(el => el.textContent.trim() === CLICK_TEXT);

        if (btn && !clicked) {
          clicked = true;
          btn.click();
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
    const cart = localStorage.getItem('cart') || '{}';
    window.ReactNativeWebView.postMessage(cart);
    window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CART_FLOW_COMPLETE',
      }));
  })();
  true;
  `;
    return script;
};

export const getNavigationScript = (url: string): string => {
    const script = `
      (function() {
        const TARGET_URL = "${url}";

        if (!window.location.href.includes(TARGET_URL)) {
          window.location.href = TARGET_URL;
        }
      })();
      true;
    `;
    return script;
};

export const injectCartSummaryScript = (): string => {
    const script = `
    (function() {
        const items = document.querySelectorAll('.BillCard__BillItemWrap-sc-1ctm5d1-10');
        const innerData = {};

        items.forEach(item => {
          const text = item.innerText.trim();
          const lines = text.split('\\n').map(line => line.trim()).filter(Boolean);

          if (lines.length === 2) {
            const [label, value] = lines;
            innerData[label] = value;
          } else if (lines.length === 3 && lines[0].toLowerCase().includes('saved')) {
            const [label, saved, value] = lines;
            innerData[label] = value;
            innerData["Savings"] = saved.replace("Saved", "").trim();
          } else if (lines.length === 4) {
            const [label, saved, original, final] = lines;
            innerData[label] = final;
            innerData["Savings"] = saved.replace("Saved", "").trim();
          }
        });

        // Extract only the number from delivery time
        const deliveryElem = document.querySelector('.HeaderStrip__Heading-sc-df6z0i-5.hUdYUP');
        if (deliveryElem) {
          const match = deliveryElem.textContent.match(/\\d+/);
          if (match) {
            innerData["Delivery Time"] = match[0];
          }
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CART_BILL_SUMMARY',
          data: {
            "Bill details": innerData
          }
        }));
    })();
    true;
  `;
    return script;
};
