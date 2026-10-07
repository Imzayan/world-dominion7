package com.worlddominion.game;

import android.app.Activity;
import android.webkit.JavascriptInterface;

/* ============================================================
   V118 — WDBridge: پل امن JavaScript ↔ Android برای پرداخت مایکت
   قواعد امنیتی:
   • این پل فقط «شروع» خرید و «دریافت نتیجه‌ی خام» را ممکن می‌کند.
   • هیچ متدی جم نمی‌دهد؛ جم فقط بعد از راستی‌آزمایی سرور (API مایکت) اضافه می‌شود.
   • JS نمی‌تواند با صدا زدن تابعی، موفقیت جعلی بسازد — نتیجه فقط از
     onActivityResult اندروید می‌آید که از Intent واقعی مایکت پر می‌شود.
   ============================================================ */
public class WDBridge {

    private final MainActivity act;

    public WDBridge(MainActivity act) { this.act = act; }

    /* آیا این نسخه بومیِ پرداخت مایکت را دارد؟ ('1' = بله) */
    @JavascriptInterface
    public String billingAvailable() {
        try { return "1"; } catch (Exception e) { return "0"; }
    }

    /* شروع خرید واقعی مایکت — نتیجه به window.__wdOnPurchase(json) برمی‌گردد.
       خروجی: '1' جریان شروع شد / '0:<دلیل>' شروع نشد (JS پیام فارسی نشان می‌دهد) */
    @JavascriptInterface
    public String startPurchase(final String sku) {
        try {
            final Activity a = act;
            final java.util.concurrent.atomic.AtomicReference<String> r =
                    new java.util.concurrent.atomic.AtomicReference<String>("0:busy");
            final Object lock = new Object();
            a.runOnUiThread(new Runnable() {
                @Override public void run() {
                    String res = WDIab.buy(a, sku, new WDIab.ResultSink() {
                        @Override public void send(final String json) {
                            a.runOnUiThread(new Runnable() {
                                @Override public void run() { act.deliverPurchaseResult(json); }
                            });
                        }
                    });
                    synchronized (lock) { r.set(res); lock.notifyAll(); }
                }
            });
            synchronized (lock) {
                if (r.get().equals("0:busy")) {
                    try { lock.wait(4000); } catch (InterruptedException ignored) { }
                }
            }
            return r.get();
        } catch (Exception e) {
            return "0:error";
        }
    }

    /* مصرف خرید جم پس از تأیید سرور — '1' موفق / '0:...' ناموفق */
    @JavascriptInterface
    public String consumePurchase(final String token) {
        try {
            if (token == null || token.length() == 0) return "0:bad_token";
            final java.util.concurrent.atomic.AtomicReference<String> r =
                    new java.util.concurrent.atomic.AtomicReference<String>("0:busy");
            final Object lock = new Object();
            act.runOnUiThread(new Runnable() {
                @Override public void run() {
                    String res = WDIab.consume(token);
                    synchronized (lock) { r.set(res); lock.notifyAll(); }
                }
            });
            synchronized (lock) {
                if (r.get().equals("0:busy")) {
                    try { lock.wait(4000); } catch (InterruptedException ignored) { }
                }
            }
            return r.get();
        } catch (Exception e) {
            return "0:error";
        }
    }

    /* بازیابی خریدهای باز (پرداخت موفق ولی اعمال‌نشده) — JSON آرایه‌ی خام مایکت */
    @JavascriptInterface
    public String ownedPurchases() {
        try { return WDIab.ownedPurchases(); } catch (Exception e) { return "[]"; }
    }

    /* شماره نسخه‌ی پل — برای دیباگ */
    @JavascriptInterface
    public String version() { return "118-iab3"; }
}
