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
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>Comparely - Compare Food Prices Across Platforms</title>
        <meta name="description" content="Compare food prices across Zomato, Swiggy, and Magicpin with Comparely. Find the best deals and save money on every order."/>
        <meta name="keywords" content="food price comparison, Zomato, Swiggy, Magicpin, best deals, food orders"/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href="https://comparely.co.in/"/>

        <meta property="og:title" content="Comparely - Compare Food Prices Across Platforms"/>
        <meta property="og:description" content="Compare food prices across Zomato, Swiggy, and Magicpin with Comparely. Find the best deals and save money on every order."/>
        <meta property="og:type" content="website"/>
        <meta property="og:url" content="https://comparely.co.in/"/>
        <meta property="og:image" content="https://comparely.co.in/screenshots.png"/>

        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content="Comparely - Compare Food Prices Across Platforms"/>
        <meta name="twitter:description" content="Compare food prices across Zomato, Swiggy, and Magicpin with Comparely. Find the best deals and save money on every order."/>
        <meta name="twitter:image" content="https://comparely.co.in/screenshots.png"/>

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
