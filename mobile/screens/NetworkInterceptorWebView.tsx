import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';

const INJECTED_JAVASCRIPT = `
(function() {
  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener("load", function() {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'xhr',
          url: this.responseURL,
          status: this.status,
          response: this.responseText
        }));
      } catch (err) {}
    });
    originalXHROpen.apply(this, arguments);
  };

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function() {
    return originalFetch.apply(this, arguments).then(function(response) {
      const clone = response.clone();
      clone.text().then(function(bodyText) {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'fetch',
            url: response.url,
            status: response.status,
            response: bodyText
          }));
        } catch (err) {}
      });
      return response;
    });
  };
})();
`;

export default function NetworkInterceptorWebView() {
    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('🔍 Intercepted:', data.type.toUpperCase(), data.url);
            console.log('📦 Response:', data.response?.data, '...');
        } catch (err) {
            console.error('Failed to parse message', err);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Text
                style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    marginVertical: 10,
                    color: '#ffff',
                }}>
                Network Interceptor WebView
            </Text>
            <WebView
                source={{ uri: 'https://www.swiggy.com/instamart' }} // or your target URL
                injectedJavaScript={INJECTED_JAVASCRIPT}
                onMessage={handleMessage}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                style={{ flex: 1 }}
            />
        </SafeAreaView>
    );
}
