type StoreAttrs = {
    eta: string;
};

type marketplaceAttributes = {
    [key: string]: any;
    blinkitStoreAttributes: StoreAttrs;
    zeptoStoreAttributes: StoreAttrs;
    instamartStoreAttributes: StoreAttrs;
    bigbasketStoreAttributes?: StoreAttrs;
};

export type Session = {
    deviceID: string;
    lat: string;
    lng: string;
    address: string;
    updatedAt: string;
    marketplaceAttributes: marketplaceAttributes;
};
