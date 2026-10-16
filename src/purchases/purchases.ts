import { Platform } from 'react-native';
import Purchases, { PURCHASES_ERROR_CODE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { useAppStore } from '../store/useAppStore';

/**
 * Subscriptions via RevenueCat (handles App Store + Google Play billing, receipts and
 * restore in one API). Set up products/entitlement as described in docs/STORE_LAUNCH.md.
 *
 * With no API key configured the app runs in "demo" mode: purchases are simulated in
 * development builds and unavailable in release builds.
 */
export const ENTITLEMENT_ID = 'premium';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

export const purchasesConfigured = Boolean(API_KEY);
// EXPO_PUBLIC_DEMO_PURCHASES=1 enables simulated purchases in a test build. Never set it for store builds.
export const demoPurchases = !purchasesConfigured && (__DEV__ || process.env.EXPO_PUBLIC_DEMO_PURCHASES === '1');

export interface Plan {
  id: string;
  title: string;
  price: string;
  period: string;
  badge?: string;
  pkg?: PurchasesPackage;
}

function applyCustomerInfo(info: CustomerInfo) {
  useAppStore.getState().setPremium(Boolean(info.entitlements.active[ENTITLEMENT_ID]));
}

let initialized = false;
export async function initPurchases(): Promise<void> {
  if (initialized || !API_KEY) return;
  initialized = true;
  try {
    Purchases.configure({ apiKey: API_KEY });
    Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch (e) {
    console.warn('Purchases init failed; using cached entitlement', e);
  }
}

const PERIOD_LABEL: Record<string, string> = {
  ANNUAL: 'per year',
  SIX_MONTH: 'every 6 months',
  THREE_MONTH: 'every 3 months',
  MONTHLY: 'per month',
  WEEKLY: 'per week',
  LIFETIME: 'one time',
};

export async function getPlans(): Promise<Plan[]> {
  if (!API_KEY) {
    return demoPurchases
      ? [
          { id: 'demo-annual', title: 'Yearly', price: '$39.99', period: 'per year', badge: 'Best value' },
          { id: 'demo-monthly', title: 'Monthly', price: '$5.99', period: 'per month' },
        ]
      : [];
  }
  const offerings = await Purchases.getOfferings();
  return (offerings.current?.availablePackages ?? []).map((pkg) => ({
    id: pkg.identifier,
    title: pkg.product.title,
    price: pkg.product.priceString,
    period: PERIOD_LABEL[pkg.packageType] ?? '',
    badge: pkg.packageType === 'ANNUAL' ? 'Best value' : undefined,
    pkg,
  }));
}

/** Returns true if the purchase completed, false if the parent cancelled. Throws on real errors. */
export async function buy(plan: Plan): Promise<boolean> {
  if (!plan.pkg) {
    if (!demoPurchases) throw new Error('Purchases are not configured.');
    useAppStore.getState().setPremium(true);
    return true;
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    applyCustomerInfo(customerInfo);
    return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
  } catch (e: any) {
    if (e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || e?.userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  if (!API_KEY) return useAppStore.getState().isPremium;
  const info = await Purchases.restorePurchases();
  applyCustomerInfo(info);
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}
