/* IInAppBillingService.aidl — Myket In-App Billing v3 interface
   Myket IAB mirrors the standard In-app Billing v3 contract under the
   ir.mservices.market namespace (official Myket technical docs / IAB sample).
   Bound via action "ir.mservices.market.InAppBillingService.BIND". */
package ir.mservices.market;

import android.os.Bundle;

interface IInAppBillingService {
    int isBillingSupported(int apiVersion, String packageName, String type);
    Bundle getSkuDetails(int apiVersion, String packageName, String type, in Bundle skusBundle);
    Bundle getBuyIntent(int apiVersion, String packageName, String sku, String type, String developerPayload);
    Bundle getPurchases(int apiVersion, String packageName, String type, String continuationToken);
    int consumePurchase(int apiVersion, String packageName, String purchaseToken);
}
