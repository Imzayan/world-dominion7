package com.worlddominion.game;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import ir.mservices.market.IInAppBillingService;

/* ============================================================
   V153 — WDIab: مدیر پرداخت درون‌برنامه‌ای واقعی مایکت (IAB v3)
   جریان رسمی: bind سرویس مایکت → isBillingSupported → getBuyIntent
   → PendingIntent مایکت → صفحه‌ی پرداخت واقعی مایکت → onActivityResult
   → purchaseToken به جاوااسکریپت → راستی‌آزمایی سرور → گرنت جم → consume
   هیچ پرداخت جعلی/تستی اینجا وجود ندارد؛ فقط مسیر واقعی مایکت.
   هر خطا Log.w با برچسب PAYMENT_* — هرگز Crash نمی‌کند.
   ============================================================ */
public final class WDIab {

    public static final int REQ_BUY = 7001;
    private static final String TAG = "WD-PAY";
    private static final int API_V = 3;
    private static final String IAB_ACTION = "ir.mservices.market.InAppBillingService.BIND";
    private static final String IAB_PKG = "ir.mservices.market";

    private static IInAppBillingService svc;
    private static boolean bound = false;
    private static boolean connecting = false;
    /* درخواست در صف تا سرویس وصل شود (JS نباید ببیند «مرده») */
    private static String queuedSku = null;

    public interface ResultSink {
        /* وضعیت‌ها: ok | cancel | fail | pending | unsupported */
        void send(String json);
    }

    private static final ServiceConnection conn = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder service) {
            svc = IInAppBillingService.Stub.asInterface(service);
            bound = true; connecting = false;
            Log.i(TAG, "PRODUCT_FOUND service bound (myket IAB)");
            String q = queuedSku; queuedSku = null;
            if (q != null && actRef.get() != null) buy(actRef.get(), q, actSink);
        }
        @Override public void onServiceDisconnected(ComponentName name) {
            svc = null; bound = false;
            Log.w(TAG, "PURCHASE_FAILED service disconnected");
        }
    };

    private static final java.util.concurrent.atomic.AtomicReference<Activity> actRef =
            new java.util.concurrent.atomic.AtomicReference<Activity>();
    private static volatile ResultSink actSink;

    /* V153: پیش‌چک PackageManager — آیا اپ مایکت روی دستگاه دیده می‌شود؟
       دقت: روی Android 11+ بدون <queries> این چک همیشه false می‌دهد حتی با نصب بودن مایکت
       (پکیج برای اپ نامرئی است) — لاگ هر دو حالت را جداجدا ثبت می‌کند. */
    private static boolean myketVisible(Context c) {
        try { c.getPackageManager().getPackageInfo(IAB_PKG, 0); return true; }
        catch (Exception e) { return false; }
    }

    /* اتصال به سرویس مایکت — در onCreate و در صورت نیاز دوباره.
       V153: خروجی کد وضعیت دقیق است تا buy() بتواند علت شکست را جدا کند:
       'ok'       = وصل شد یا در حال اتصال است (نتیجه‌ی async از onServiceConnected می‌آید)
       'nomyket'  = اپ مایکت قبل از bind دیده نشد (نصب نیست، یا Android 11+ بدون <queries>)
       'bindfail' = مایکت نصب و دیده می‌شود ولی bindService رد شد
                    ⇒ تقریباً همیشه: این APK مجوز ir.mservices.market.BILLING را اعلام نکرده (بیلد قدیمی)
                    یا اپ فروشگاه force-stop/معیوب است
       'error'    = استثنای غیرمنتظره در setup */
    public static String setupStatus(Activity act) {
        try {
            if (bound && svc != null) return "ok";
            if (connecting) return "ok"; /* اتصال در جریان است */
            boolean vis = myketVisible(act);
            Log.i(TAG, "PAYMENT_INIT myket visible=" + vis);
            if (!vis) {
                Log.w(TAG, "PURCHASE_FAILED myket app not visible to this app (not installed, or Android 11+ without <queries> in old builds)");
                return "nomyket"; /* قبل از bind — بدون تلاش بی‌فایده */
            }
            connecting = true;
            Intent i = new Intent(IAB_ACTION);
            i.setPackage(IAB_PKG);
            boolean ok = act.bindService(i, conn, Context.BIND_AUTO_CREATE);
            Log.i(TAG, "PAYMENT_INIT bind myket iab=" + ok);
            if (!ok) {
                connecting = false;
                /* مایکت نصب و قابل‌مشاهده است ولی bind رد شد ⇒ علت تقریباً قطعی:
                   مجوز BILLING مایکت در مانیفست همین APK اعلام نشده (بیلدهای تا vc14) —
                   حالت ثانویه: فروشگاه force-stop شده. این خط، علت دقیق را در لاگ می‌گذارد. */
                Log.w(TAG, "PURCHASE_FAILED bind=false while myket IS installed ⇒ this APK almost certainly lacks ir.mservices.market.BILLING permission (old build) or store app is force-stopped");
                return "bindfail";
            }
            return "ok";
        } catch (Exception e) {
            connecting = false;
            Log.w(TAG, "PAYMENT_INIT bind error " + e.getClass().getSimpleName());
            return "error";
        }
    }

    /* سازگاری با MainActivity (onCreate) — خلاصه‌ی boolean همان وضعیت دقیق */
    public static boolean setup(Activity act) { return "ok".equals(setupStatus(act)); }

    public static void unbind(Activity act) {
        try { if (bound) act.unbindService(conn); } catch (Exception ignored) { }
        bound = false; svc = null; connecting = false;
        if (actRef.compareAndSet(act, null)) actSink = null;
    }

    public static boolean ready() { return bound && svc != null; }

    /* پایان چرخه‌ی خرید فعلی — اجازه‌ی خرید بعدی (ضد «busy» همیشگی) */
    public static void clearRequest() { actRef.set(null); actSink = null; }

    /* خرید — همیشه async؛ نتیجه از onActivityResult به sink می‌رسد.
       خروجی: '1' یعنی جریان شروع شد (نتیجه بعداً می‌آید)، '0:<دلیل>' یعنی شروع نشد. */
    public static synchronized String buy(Activity act, String sku, ResultSink sink) {
        if (act == null || sku == null || sku.length() == 0 || !sku.matches("[a-z0-9_]{2,60}")) return "0:bad_sku";
        if (actRef.get() != null && actRef.get() != act) return "0:busy";
        actRef.set(act); actSink = sink;
        if (!bound || svc == null) {
            /* V153: پیش‌چک PackageManager قبل از bind — کدِ برگشتی علت دقیق را می‌گوید:
               0:nomyket = مایکت دیده نمی‌شود | 0:bind = مایکت هست ولی bind رد شد (مجوز؟) */
            String st = setupStatus(act);
            if (!"ok".equals(st)) {
                clearRequest();
                if ("nomyket".equals(st)) {
                    Log.w(TAG, "PURCHASE_FAILED myket app not installed/not visible (pre-check) — bind not attempted");
                    return "0:nomyket";
                }
                if ("bindfail".equals(st)) {
                    Log.w(TAG, "PURCHASE_FAILED myket installed but bindService refused (most likely missing BILLING permission in this APK)");
                    return "0:bind";
                }
                Log.w(TAG, "PURCHASE_FAILED iab setup exception");
                return "0:error:IabSetup";
            }
            queuedSku = sku;
            Log.w(TAG, "PURCHASE_START queued (service not connected yet)");
            /* V120: نگهبان اتصال — اگر سرویس فروشگاه تا ۱۰ ثانیه وصل نشود، JS را آزاد کن (نه انتظار بی‌پایان).
               اگر تا آن موقع وصل شده باشد، queuedSku در onServiceConnected مصرف شده و این نگهبان کاری نمی‌کند. */
            final String fsku = sku;
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
                @Override public void run() {
                    if (queuedSku != null && queuedSku.equals(fsku) && !ready()) {
                        queuedSku = null;
                        ResultSink s = actSink; clearRequest();
                        Log.w(TAG, "PURCHASE_FAILED connect timeout (store service never connected)");
                        if (s != null) { try { s.send("{\"status\":\"fail\",\"code\":-2}"); } catch (Exception ignored) { } }
                    }
                }
            }, 10000);
            return "1";
        }
        try {
            Log.i(TAG, "PURCHASE_START sku=" + sku);
            String payload = "wd-" + sku + "-" + Long.toString(System.currentTimeMillis(), 36);
            Bundle buy = svc.getBuyIntent(API_V, act.getPackageName(), sku, "inapp", payload);
            int rc = buy == null ? 6 : buy.getInt("RESPONSE_CODE", 6);
            if (rc != 0 || buy == null || !buy.containsKey("BUY_INTENT")) {
                Log.w(TAG, "PURCHASE_FAILED getBuyIntent rc=" + rc);
                return "0:rc" + rc;
            }
            PendingIntent pi = buy.getParcelable("BUY_INTENT");
            if (pi == null) return "0:nopi";
            act.startIntentSenderForResult(pi.getIntentSender(), REQ_BUY, new Intent(), 0, 0, 0);
            Log.i(TAG, "PURCHASE_START myket payment ui launched sku=" + sku);
            return "1";
        } catch (IntentSender.SendIntentException e) {
            Log.w(TAG, "PURCHASE_FAILED send " + e.getClass().getSimpleName());
            return "0:send";
        } catch (RemoteException e) {
            Log.w(TAG, "PURCHASE_FAILED remote " + e.getClass().getSimpleName());
            return "0:remote";
        } catch (Exception e) {
            Log.w(TAG, "PURCHASE_FAILED detail", e);
            /* V121: نام کلاس استثنا در کد برمی‌گردد تا JS/پشتیبانی علت دقیق را ببیند
               (رایج: SecurityException یعنی فروشگاه بازی/امضا را نمی‌شناسد — بازی هنوز در پنل تأیید نشده) */
            String en = e.getClass().getSimpleName();
            if (e instanceof SecurityException) return "0:sec:" + en;
            return "0:error:" + en;
        }
    }

    /* پاسخ صفحه‌ی پرداخت مایکت — از MainActivity.onActivityResult صدا زده می‌شود */
    public static void onResult(int resultCode, Intent data) {
        ResultSink sink = actSink;
        Activity act = actRef.get();
        if (sink == null || act == null) { Log.w(TAG, "onResult no sink"); return; }
        try {
            if (data == null) {
                Log.w(TAG, "PURCHASE_CANCELLED null intent data");
                sink.send("{\"status\":\"cancel\"}");
                return;
            }
            int rc = data.getIntExtra("RESPONSE_CODE", 6);
            /* resultCode RESULT_OK (-1) یعنی جریان خرید برگشت؛ کد واقعی در RESPONSE_CODE */
            if (resultCode != Activity.RESULT_OK || rc != 0) {
                boolean userCancel = (rc == 1 || resultCode != Activity.RESULT_OK);
                Log.w(TAG, (userCancel ? "PURCHASE_CANCELLED" : "PURCHASE_FAILED") + " rc=" + rc);
                sink.send("{\"status\":\"" + (userCancel ? "cancel" : "fail") + "\",\"code\":" + rc + "}");
                return;
            }
            String pd = data.getStringExtra("INAPP_PURCHASE_DATA");
            String sig = data.getStringExtra("INAPP_DATA_SIGNATURE");
            if (pd == null) {
                Log.w(TAG, "PURCHASE_FAILED no purchase data");
                sink.send("{\"status\":\"fail\"}");
                return;
            }
            JSONObject j = new JSONObject(pd);
            String token = j.optString("purchaseToken", "");
            String sku = j.optString("productId", "");
            String orderId = j.optString("orderId", "");
            int pstate = j.optInt("purchaseState", 1);
            Log.i(TAG, "PURCHASE_RESULT sku=" + sku + " state=" + pstate + " orderId=" + orderId);
            if (pstate != 0) {
                /* 1=pending 2=refunded … */
                sink.send("{\"status\":\"" + (pstate == 1 ? "pending" : "fail") + "\",\"sku\":\"" + sku + "\"}");
                return;
            }
            /* داده‌ی خام رسید به JS می‌رود تا سمت سرور با API مایکت راستی‌آزمایی شود؛
               کلاینت هرگز تصمیم‌گیرنده‌ی گرنت جم نیست. */
            JSONObject out = new JSONObject();
            out.put("status", "ok");
            out.put("sku", sku);
            out.put("token", token);
            out.put("order_id", orderId);
            out.put("json", pd);
            out.put("signature", sig == null ? "" : sig);
            Log.i(TAG, "PURCHASE_SUCCESS awaiting server verify sku=" + sku);
            sink.send(out.toString());
        } catch (Exception e) {
            Log.w(TAG, "PURCHASE_FAILED parse " + e.getClass().getSimpleName());
            try { sink.send("{\"status\":\"fail\"}"); } catch (Exception ignored) { }
        }
    }

    /* مصرف خرید (فقط جم‌های مصرفی — بعد از تأیید سرور صدا زده می‌شود) */
    public static String consume(String token) {
        try {
            if (!ready() || token == null || token.length() == 0) return "0:notready";
            int rc = svc.consumePurchase(API_V, actRef.get().getPackageName(), token);
            Log.i(TAG, "consume rc=" + rc);
            return rc == 0 ? "1" : "0:rc" + rc;
        } catch (Exception e) {
            Log.w(TAG, "consume error " + e.getClass().getSimpleName());
            return "0:error";
        }
    }

    /* بازیابی خریدهای پرداخت‌شده ولی مصرف‌نشده (برنامه وسط پرداخت بسته شد / callback دیر رسید)
       V146 (G1): امضای هر رسید هم برگردد — خروجی: [{"raw":"<رشته‌ی خام دقیق مایکت>","sig":"<امضا>"},…]
       رشته‌ی raw عمداً دست‌نخورده می‌ماند (parse/re-serialize ممنوع — امضای RSA روی همان متن خام است)
       تا سرور بتواند مسیر کلید عمومی (SHA1withRSA) را بدون MYKET_ACCESS_TOKEN اجرا کند.
       سازگاری: JS سمت قدیم (آرایه‌ی مستقیم آبجکت‌ها) در کلاینت V146 هر دو شکل را می‌فهمد. */
    public static String ownedPurchases() {
        try {
            if (!ready() || actRef.get() == null) return "[]";
            Bundle b = svc.getPurchases(API_V, actRef.get().getPackageName(), "inapp", null);
            if (b == null) return "[]";
            ArrayList<String> items = b.getStringArrayList("INAPP_PURCHASE_DATA_LIST");
            if (items == null || items.isEmpty()) return "[]";
            ArrayList<String> sigs = b.getStringArrayList("INAPP_DATA_SIGNATURE_LIST");
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < items.size(); i++) {
                if (i > 0) sb.append(',');
                JSONObject w = new JSONObject();
                w.put("raw", items.get(i));
                w.put("sig", (sigs != null && i < sigs.size()) ? sigs.get(i) : "");
                sb.append(w.toString());
            }
            sb.append("]");
            Log.i(TAG, "PURCHASE_RESULT owned=" + items.size() + " signed=" + (sigs == null ? 0 : sigs.size()));
            return sb.toString();
        } catch (Exception e) {
            Log.w(TAG, "ownedPurchases error " + e.getClass().getSimpleName());
            return "[]";
        }
    }
}
