import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import {
    clearCart,
    injectLocationSelectionScript,
    injectLoginScript,
    injectOtpScript,
} from '@/script/injectionScript_blinkit';
import {
    injectLocationPermissionScript_zepto,
    injectLoginScript_zepto,
    injectOtpScript_zepto,
} from '@/script/injectionScript_zepto';
import { BillDetailsMap, BillSummary, useWebViews } from '@/context/WebViewContext';
// import { injectCartSummaryScript_instamart } from '@/script/injectionScript_instamart';

export type HiddenWebViewRef = {
    injectPhoneNumber: (phone: string) => void;
    injectOtp: (otp: string) => void;
    injectScript: (jsCode: string) => void; // ✅ New method
    scrapeProduct: (jsCode: string) => void; // ✅ New method
};

type Props = {
    url: string;
    platform: 'blinkit' | 'zepto' | 'instamart';
    visible: boolean;
    onOtpSubmitted?: () => void;
};

const HiddenWebView = forwardRef<HiddenWebViewRef, Props>(
    ({ url, platform, visible, onOtpSubmitted }, ref) => {
        const webviewRef = useRef<WebView>(null);
        const loadedRef = useRef(false);
        const {
            visibleWebViews,
            setVisibleWebViews,
            setBillSummaries,
            cartClearedOnce,
            setCartClearedOnce,
        } = useWebViews();

        useEffect(() => {
            console.log(`🚀 WebView mounted for: ${url}`);
            // return () => console.log(`🧹 WebView unmounted for: ${url}`);
        }, [url]);

        type WebViewMessage =
            | { type: 'INJECTED_SUCCESS' }
            | { type: 'CART_CLEARED' }
            | { type: 'LOCATION_ACCESS_TRIGGERED' }
            | { type: 'LOCATION_ACCESS_ERROR'; error: string }
            | { type: 'LOGIN_FLOW_COMPLETE' }
            | { type: 'OTP_SUBMITTED' }
            | { type: 'CART_FLOW_COMPLETE' }
            | {
                  data: any;
                  type: 'CART_BILL_SUMMARY';
              }
            | { type: 'PRODUCT_QUANTITY_UPDATED'; payload: { productId: string; quantity: number } }
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
                case 'CART_CLEARED':
                    console.log(`✅ Cart cleared for ${platform}`);
                    break;
                case 'LOCATION_ACCESS_TRIGGERED':
                    console.log(`✅ Location access triggered for ${platform}`);
                    break;
                case 'LOCATION_ACCESS_ERROR':
                    console.error(`❌ Location access error for ${platform}:`, msg.error);
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
                case 'CART_BILL_SUMMARY':
                    console.log('✅ Cart Billing details extracted successfully');
                    console.log('📊 Bill details:', msg.data);
                    setBillSummaries((prev) => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        const rawData = msg.data?.['Bill details'] || {};

                        const labelMap: Record<string, keyof BillDetailsMap> = {
                            'Item Total': 'itemTotal',
                            'Grand total': 'grandTotal',
                            'Delivery Time': 'time',
                        };

                        const numeric = (val: string) =>
                            parseFloat(val.replace(/[₹,\s]/g, '') || '0');

                        const mapped: BillDetailsMap = {
                            itemTotal: 0,
                            grandTotal: 0,
                            time: 0,
                        };

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        Object.entries(rawData).forEach(([label, value]) => {
                            const key = labelMap[label];
                            if (key) {
                                mapped[key] = numeric(value as string);
                            }
                        });

                        const formattedSummary: BillSummary = {
                            'Bill details': mapped,
                        };

                        return {
                            ...prev,
                            [platform]: formattedSummary,
                        };
                    });

                    break;
                case 'PRODUCT_QUANTITY_UPDATED':
                    console.log('✅ Product quantity updated for ' + platform, msg.payload);
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
                setTimeout(() => {
                    webviewRef.current?.injectJavaScript(jsCode);
                }, 1000); // wait 1s to avoid timing issues
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
            // extractCart_details() {
            //     let jsCode = '';
            //     if (platform === 'blinkit') {
            //         jsCode = injectCartSummaryScript();
            //     } else if (platform === 'zepto') {
            //         jsCode = injectCartSummaryScript_zepto();
            //     } else if (platform === 'instamart') {
            //         jsCode = injectCartSummaryScript_instamart();
            //     }
            //     webviewRef.current?.injectJavaScript(jsCode);
            // },
            scrapeProduct(jsCode: string) {
                webviewRef.current?.injectJavaScript(jsCode);
            },
        }));

        // return (
        //     <View style={styles.hidden}>
        //         <WebView
        //             ref={webviewRef}
        //             source={{ uri: url }}
        //             onLoadEnd={() => {
        //                 if (!loadedRef.current) {
        //                     console.log(`${url} loaded`);
        //                     loadedRef.current = true;
        //                 }
        //             }}
        //             javaScriptEnabled
        //             domStorageEnabled
        //             onMessage={onMessage}
        //         />
        //     </View>
        // );

        return (
            <View style={visible ? styles.overlay : styles_hidden.hidden}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setVisibleWebViews({ ...visibleWebViews, [platform]: false })}>
                    <Text style={styles.backButtonText}>{'← Back'}</Text>
                </TouchableOpacity>

                <WebView
                    ref={webviewRef}
                    source={{ uri: url }}
                    onLoadEnd={() => {
                        if (!loadedRef.current) {
                            console.log(`${url} loaded`);
                            loadedRef.current = true;

                            let jsCode = '';
                            if (platform === 'blinkit') {
                                jsCode = injectLocationSelectionScript();
                            } else if (platform === 'zepto') {
                                jsCode = injectLocationPermissionScript_zepto();
                            }
                            webviewRef.current?.injectJavaScript(jsCode);

                            setTimeout(() => {
                                if (!cartClearedOnce[platform as keyof typeof cartClearedOnce]) {
                                    setCartClearedOnce((prev) => ({
                                        ...prev,
                                        [platform]: true,
                                    }));
                                    webviewRef.current?.injectJavaScript(clearCart());
                                }
                            }, 2000); // wait 1s to avoid timing issues
                        }
                    }}
                    javaScriptEnabled
                    domStorageEnabled
                    onMessage={onMessage}
                    style={styles.webview}
                />
            </View>
        );
    },
);

HiddenWebView.displayName = 'HiddenWebView';

const styles_hidden = StyleSheet.create({
    hidden: {
        width: 0,
        height: 0,
        opacity: 1,
        position: 'relative',
        top: 0,
        left: 0,
    },
});

// const styles_hidden = StyleSheet.create({
//     hidden: {
//         flex: 1,
//         // Temporary for debugging:
//         opacity: 1,
//         position: 'relative',
//         height: '100%',
//         width: '100%',
//     },
// });

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        zIndex: 999,
        backgroundColor: '#fff',
    },
    webview: {
        flex: 1,
        marginTop: 50, // leave space for back button
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 3,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HiddenWebView;
