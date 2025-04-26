import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "qlb3gcv83i");`
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q7Y4T21Y1H"></script>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q7Y4T21Y1H');`
          }}
        />
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>Comparely - Compare Grocery Prices Across Zepto, Blinkit, Instamart</title>
        <meta name="description" content="Compare grocery prices across Blinkit, Instamart and Zepto with Comparely. Find the best deals and save money on every order."/>
        <meta name="keywords" content="food price comparison, grocery price comparison, price comparison, grocery orders, order grocery, Zomato, Swiggy, Magicpin, Zepto, Instamart, Blinkit, best deals, food orders"/>
        {/* <meta name="viewport" content="width=768, initial-scale=1, maximum-scale=1, user-scalable=no" /> */}
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href="https://comparely.co.in/"/>

        <meta property="og:title" content="Comparely - Compare Grocery Prices Across Platforms"/>
        <meta property="og:description" content="Compare grocery prices across Blinkit, Instamart and Zepto with Comparely. Find the best deals and save money on every order."/>
        <meta property="og:type" content="website"/>
        <meta property="og:url" content="https://comparely.co.in/"/>
        <meta property="og:image" content="/assets/assets/images/1.png"/>

        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content="Comparely - Compare Grocery Prices Across Platforms"/>
        <meta name="twitter:description" content="Compare grocery prices across Blinkit, Instamart and Zepto with Comparely. Find the best deals and save money on every order."/>
        <meta name="twitter:image" content="/assets/assets/images/1.png"/>

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
