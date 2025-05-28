import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';
import { injectLoginScript, injectOtpScript } from '@/script/injectionScript_blinkit';
import { injectLoginScript_zepto, injectOtpScript_zepto } from '@/script/injectionScript_zepto';

export type HiddenWebViewRef = {
    injectPhoneNumber: (phone: string) => void;
    injectOtp: (otp: string) => void;
    injectScript: (jsCode: string) => void; // ✅ New method
    scrapeProduct: (jsCode: string) => void; // ✅ New method
};

type Props = {
    url: string;
    platform: 'blinkit' | 'zepto';
    onOtpSubmitted?: () => void;
};

const HiddenWebView = forwardRef<HiddenWebViewRef, Props>(
    ({ url, platform, onOtpSubmitted }, ref) => {
        const webviewRef = useRef<WebView>(null);
        const loadedRef = useRef(false);

        useEffect(() => {
            console.log(`🚀 WebView mounted for: ${url}`);
            return () => console.log(`🧹 WebView unmounted for: ${url}`);
        }, [url]);

        type WebViewMessage =
            | { type: 'INJECTED_SUCCESS' }
            | { type: 'LOGIN_FLOW_COMPLETE' }
            | { type: 'OTP_SUBMITTED' }
            | { type: 'CART_FLOW_COMPLETE' }
            | { type: 'RAW'; payload: string };

        const onMessage = (e: WebViewMessageEvent) => {
            const raw = e.nativeEvent.data;
            let msg: WebViewMessage;

            try {
                msg = JSON.parse(raw) as WebViewMessage;
            } catch {
                msg = { type: 'RAW', payload: raw };
            }

            switch (msg.type) {
                case 'INJECTED_SUCCESS':
                    console.log('✅ Generic injection confirmed!');
                    break;
                case 'LOGIN_FLOW_COMPLETE':
                    console.log(`✅ Login script completed for ${platform} moving to OTP phase`);
                    break;
                case 'OTP_SUBMITTED':
                    console.log(`✅ OTP submitted for ${platform} moving to add-to-cart phase`);
                    if (onOtpSubmitted) onOtpSubmitted();
                    break;
                case 'CART_FLOW_COMPLETE':
                    console.log('✅ Add-to-cart script completed—moving to summary phase');
                    break;
                case 'RAW':
                default:
                    console.warn('⚠️ Unrecognized message type:', msg);
            }
        };

        useImperativeHandle(ref, () => ({
            injectPhoneNumber(phone: string) {
                let jsCode = '';
                if (platform === 'blinkit') {
                    jsCode = injectLoginScript(phone);
                } else if (platform === 'zepto') {
                    jsCode = injectLoginScript_zepto(phone);
                }
                webviewRef.current?.injectJavaScript(jsCode);
            },
            injectOtp(otp: string) {
                let jsCode = '';
                if (platform === 'blinkit') {
                    jsCode = injectOtpScript(otp);
                } else if (platform === 'zepto') {
                    jsCode = injectOtpScript_zepto(otp);
                }
                webviewRef.current?.injectJavaScript(jsCode);
            },
            injectScript(jsCode: string) {
                webviewRef.current?.injectJavaScript(jsCode);
            },
            scrapeProduct(jsCode: string) {
                webviewRef.current?.injectJavaScript(jsCode);
            },
        }));

        return (
            <View style={styles.hidden}>
                <WebView
                    ref={webviewRef}
                    source={{ uri: url }}
                    onLoadEnd={() => {
                        if (!loadedRef.current) {
                            console.log(`${url} loaded`);
                            loadedRef.current = true;
                        }
                    }}
                    javaScriptEnabled
                    domStorageEnabled
                    onMessage={onMessage}
                />
            </View>
        );
    },
);

HiddenWebView.displayName = 'HiddenWebView';

const styles = StyleSheet.create({
    hidden: {
        width: 0,
        height: 0,
        opacity: 1,
        position: 'relative',
        top: 0,
        left: 0,
    },
});

// const styles = StyleSheet.create({
//     hidden: {
//         flex: 1,
//         // Temporary for debugging:
//         opacity: 1,
//         position: 'relative',
//         height: '100%',
//         width: '100%',
//     },
// });

export default HiddenWebView;
