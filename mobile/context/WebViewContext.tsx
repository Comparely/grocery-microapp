// WebViewContext.tsx
import React, { createContext, useRef, useContext, useState } from 'react';
import HiddenWebView, { HiddenWebViewRef } from '../components/HiddenWebView';

type WebViewContextType = {
    blinkitWebViewRef: React.RefObject<HiddenWebViewRef>;
    zeptoWebViewRef: React.RefObject<HiddenWebViewRef>;
    blinkitLoggedIn: boolean;
    zeptoLoggedIn: boolean;
    setBlinkitLoggedIn: (status: boolean) => void;
    setZeptoLoggedIn: (status: boolean) => void;
};

const WebViewContext = createContext<WebViewContextType | undefined>(undefined);

export const WebViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const blinkitWebViewRef = useRef<HiddenWebViewRef>(null);
    const zeptoWebViewRef = useRef<HiddenWebViewRef>(null);

    const [blinkitLoggedIn, setBlinkitLoggedIn] = useState(false);
    const [zeptoLoggedIn, setZeptoLoggedIn] = useState(false);

    return (
        <WebViewContext.Provider
            value={{
                blinkitWebViewRef,
                zeptoWebViewRef,
                blinkitLoggedIn,
                zeptoLoggedIn,
                setBlinkitLoggedIn,
                setZeptoLoggedIn,
            }}>
            {children}
            <HiddenWebView
                ref={blinkitWebViewRef}
                url="https://blinkit.com"
                platform="blinkit"
                onOtpSubmitted={() => setBlinkitLoggedIn(true)}
            />
            <HiddenWebView
                ref={zeptoWebViewRef}
                url="https://www.zeptonow.com"
                platform="zepto"
                onOtpSubmitted={() => setZeptoLoggedIn(true)}
            />
        </WebViewContext.Provider>
    );
};

export const useWebViews = (): WebViewContextType => {
    const context = useContext(WebViewContext);
    if (!context) {
        throw new Error('useWebViews must be used within a WebViewProvider');
    }
    return context;
};
