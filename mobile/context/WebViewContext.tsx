// WebViewContext.tsx
import React, { createContext, useRef, useContext, useState } from 'react';
import HiddenWebView, { HiddenWebViewRef } from '../components/HiddenWebView';

type WebViewContextType = {
    blinkitWebViewRef: React.RefObject<HiddenWebViewRef>;
    zeptoWebViewRef: React.RefObject<HiddenWebViewRef>;
    instamartWebViewRef: React.RefObject<HiddenWebViewRef>;
    blinkitCart: string[];
    zeptoCart: string[];
    instamartCart: string[];
    blinkitLoggedIn: boolean;
    zeptoLoggedIn: boolean;
    instamartLoggedIn: boolean;
    setBlinkitLoggedIn: (status: boolean) => void;
    setZeptoLoggedIn: (status: boolean) => void;
    setInstamartLoggedIn: (status: boolean) => void;
    billSummaries: Record<string, any>;
    setBillSummaries: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    visibleWebViews: Record<string, boolean>;
    setVisibleWebViews: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export type BillDetailsMap = {
    itemTotal: number;
    grandTotal: number;
    time: number;
};

export type BillSummary = {
    'Bill details': BillDetailsMap;
};

const WebViewContext = createContext<WebViewContextType | undefined>(undefined);

export const WebViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const blinkitWebViewRef = useRef<HiddenWebViewRef>(null);
    const zeptoWebViewRef = useRef<HiddenWebViewRef>(null);
    const instamartWebViewRef = useRef<HiddenWebViewRef>(null);
    const [billSummaries, setBillSummaries] = useState<Record<string, BillSummary>>({});

    const [visibleWebViews, setVisibleWebViews] = useState<Record<string, boolean>>({
        blinkit: false,
        zepto: false,
        instamart: false,
    });

    const [blinkitCart, setBlinkitCart] = useState<string[]>([]);
    const [zeptoCart, setZeptoCart] = useState<string[]>([]);
    const [instamartCart, setInstamartCart] = useState<string[]>([]);

    const [blinkitLoggedIn, setBlinkitLoggedIn] = useState(false);
    const [zeptoLoggedIn, setZeptoLoggedIn] = useState(false);
    const [instamartLoggedIn, setInstamartLoggedIn] = useState(false);
    return (
        <WebViewContext.Provider
            value={{
                blinkitWebViewRef,
                zeptoWebViewRef,
                instamartWebViewRef,
                blinkitCart,
                zeptoCart,
                instamartCart,
                blinkitLoggedIn,
                zeptoLoggedIn,
                instamartLoggedIn,
                setBlinkitLoggedIn,
                setZeptoLoggedIn,
                setInstamartLoggedIn,
                billSummaries,
                setBillSummaries,
                visibleWebViews,
                setVisibleWebViews,
            }}>
            {children}
            <HiddenWebView
                ref={blinkitWebViewRef}
                url="https://blinkit.com"
                platform="blinkit"
                visible={visibleWebViews.blinkit}
                onOtpSubmitted={() => setBlinkitLoggedIn(true)}
            />
            <HiddenWebView
                ref={zeptoWebViewRef}
                url="https://www.zeptonow.com"
                platform="zepto"
                visible={visibleWebViews.zepto}
                onOtpSubmitted={() => setZeptoLoggedIn(true)}
            />
            <HiddenWebView
                ref={instamartWebViewRef}
                url="https://www.instamart.com"
                platform="instamart"
                visible={visibleWebViews.instamart}
                onOtpSubmitted={() => setInstamartLoggedIn(true)}
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
