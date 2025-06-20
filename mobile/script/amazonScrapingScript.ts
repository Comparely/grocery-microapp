const productScrapingScript = `(async function () {
        const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
        const autoScroll = async () => {
            const distance = 500;
            for (let i = 0; i < 20; i++) {
                window.scrollBy(0, distance);
                await sleep(500);
            }
        };
        await autoScroll();
        const products = Array.from(document.querySelectorAll('.puisg-row')).map(card => {
        const name = card.querySelector('h2')?.innerText?.trim() || '';
        const price = card.querySelector('.a-price .a-offscreen')?.innerText?.trim() || '';
        const deliveryTime = card.querySelector('.puis-bold-weight-text, .a-color-success')?.innerText?.trim() || '';
        const image = card.querySelector('img')?.src || '';
        
        let link = card.querySelector('a.a-link-normal')?.getAttribute('href') || '';
        if (link && link.startsWith('/')) {
            link = 'https://www.amazon.in' + link;
        }

        const asinMatch = link.match(/\\/dp\\/([A-Z0-9]{10})/) || [];
        const asin = asinMatch[1] || '';

        const weightText = card.querySelector('.a-size-mini.a-color-secondary.puis-light-weight-text')?.innerText || '';
        const weightMatch = weightText.match(/(\\d+(\\.\\d+)?\\s?(g|kg|ml|l|litre|pack|pcs))/i);
        const weight = weightMatch ? weightMatch[0].trim() : '';

        return { name, price, deliveryTime, image, link, asin, weight };
    });
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scrapeData', data: products }));
    })(); true;`;


export default productScrapingScript;
