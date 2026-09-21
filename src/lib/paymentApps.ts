export type Platform = "ios" | "android";
export type AppKey = "lemfi" | "worldremit" | "wapipay";

export const PAYMENT_APPS: Record<AppKey, { name: string; ios: string; android: string }> = {
  lemfi: {
    name: "LemFi",
    ios: "https://apps.apple.com/us/app/lemfi/id1533066809",
    android: "https://play.google.com/store/apps/details?id=com.lemonadeFinance.android",
  },
  worldremit: {
    name: "WorldRemit",
    ios: "https://apps.apple.com/us/app/worldremit-money-transfer-app/id875855935",
    android: "https://play.google.com/store/apps/details?id=com.worldremit.android",
  },
  wapipay: {
    name: "WapiPay",
    ios: "https://apps.apple.com/us/app/wapipay-global/id1532846160",
    android: "https://play.google.com/store/apps/details?id=com.wapipay",
  },
};

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIOS ? "ios" : "android";
}
