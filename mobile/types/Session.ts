type StoreAttrs = {
  eta: string
}

type marketplaceAttributes = {
  blinkitStoreAttributes: StoreAttrs
  zeptoStoreAttributes: StoreAttrs
  instamartStoreAttributes: StoreAttrs
}

export type Session = {
  deviceID: string
  lat: string
  lng: string
  updatedAt: string
  marketplaceAttributes: marketplaceAttributes
}