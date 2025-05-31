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

export const productScrapingScript_blinkit = () => {
    const script = `(async function () {
  const BASE_URL = 'https://blinkit.com';

  const slugify = (text) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Auto-scroll down the page
  const autoScroll = async () => {
    const distance = 500;
    for (let i = 0; i < 20; i++) {
      window.scrollBy(0, distance);
      await sleep(500); // wait for new items to load
    }
  };

  await autoScroll();

  const cards = Array.from(document.querySelectorAll('div[role="button"][class*="tw-relative"]'));

  const products = cards.map((card) => {
    const id = card.getAttribute('id') || '';
    const name = card.querySelector('div[class*="tw-text-300"]')?.innerText.trim() || '';
    const price = card.querySelector('div[class*="tw-text-200 tw-font-semibold"]')?.innerText.trim() || '';
    const quantity = card.querySelector('div[class*="tw-text-200 tw-font-medium tw-line-clamp-1"]')?.innerText.trim() || '';
    const image = card.querySelector('img')?.src || '';
    const slug = slugify(name);
    const link = id && slug ? \`\${BASE_URL}/prn/\${slug}/prid/\${id}\` : BASE_URL;

    return { name, price, quantity, image, link };
  }).filter(p => p.name && p.price && p.image && p.link.includes('blinkit.com'));

  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scrapeData', data: products }));
})(); true;`;
    return script;
};
