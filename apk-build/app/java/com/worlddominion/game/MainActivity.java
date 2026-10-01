package com.worlddominion.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {

    /* V91: آپدیت فقط از طریق مایکت (Myket Intent) — بدون دانلود/نصب مستقیم APK
       WebView هرگز HTML قدیمی کش‌شده را سرو نمی‌کند (پارامتر نسخه) */
    private static final int GAME_VER = 103;
    private static final String GAME_URL = "https://world-dominion7.vercel.app/game/index.html?v=" + GAME_VER;
    private static final String GAME_HOST = "world-dominion7.vercel.app";
    private static final String ERROR_URL = "file:///android_asset/error.html";

    /* latest.json فقط برای «اطلاع نسخه» خوانده می‌شود؛ فیلد url آن هرگز دانلود نمی‌شود */
    private static final String UPDATE_JSON = "https://world-dominion7.vercel.app/apk/latest.json";
    private static final long RECHECK_MS = 15 * 60 * 1000; /* هر ۱۵ دقیقه دوباره چک */

    /* PHASE 4: آدرس صفحه‌ی برنامه در مایکت — پس از انتشار، مقدار واقعی جایگزین شود.
       تا زمانی که placeholder است، مسیر پشتیبان مرورگر غیرفعال و فقط پیام راهنما نمایش داده می‌شود. */
    private static final String MYKET_APP_URL = "REPLACE_WITH_REAL_MYKET_APP_URL";
    /* پکیج رسمی اپلیکیشن مایکت — مطابق مستندات رسمی Myket Intents */
    private static final String MYKET_PKG = "ir.mservices.market";

    private WebView web;
    private FrameLayout root;
    private boolean errored = false;

    /* وضعیت چک‌کننده‌ی نسخه */
    private boolean checking = false;
    private boolean updateDlgShown = false;
    private int dismissedVc = 0; /* اگر کاربر «ادامه» زد، برای همین نسخه دوباره پرسیده نمی‌شود */

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        root = new FrameLayout(this);
        web = createWebView();
        root.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
            /* اگر state قدیمی با پارامتر نسخه‌ی دیگر بود، به نسخه‌ی تازه هدایت کن */
            String u = web.getUrl();
            if (u == null || !u.contains("?v=" + GAME_VER)) {
                web.loadUrl(GAME_URL);
            }
        } else {
            web.loadUrl(GAME_URL);
        }

        /* بررسی نسخه‌ی جدید ۴ ثانیه بعد از باز شدن بازی + چک دوره‌ای هر ۱۵ دقیقه */
        web.postDelayed(new Runnable() {
            @Override
            public void run() {
                checkUpdate();
            }
        }, 4000);
    }

    private WebView createWebView() {
        WebView w = new WebView(this);
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        w.setBackgroundColor(0xFF0A1633);

        w.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                if (url == null) return false;
                if (url.contains(GAME_HOST)) return false;
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception ignored) { }
                    return true;
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                if (url != null && url.startsWith("http")) {
                    errored = false;
                }
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
                if (req != null && req.isForMainFrame()) {
                    showOffline();
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView v, RenderProcessGoneDetail detail) {
                rebuild();
                return true;
            }
        });
        return w;
    }

    /* ============ V91: آپدیت فقط از طریق مایکت ============
       ۱) versionCode از خود پکیج نصب‌شده خوانده می‌شود (هرگز جعلی نیست)
       ۲) latest.json فقط برای اطلاع نسخه — هیچ APKای دانلود یا نصب نمی‌شود
       ۳) نسخه‌ی جدید → دیالوغ غیرمسدودکننده: [به‌روزرسانی از مایکت] [ادامه]
       ۴) دکمه‌ی مایکت → Intent رسمی myket://application?id=<package>
       ۵) مایکت نصب نبود → مرورگر (اگر آدرس واقعی صفحه تنظیم شده باشد) یا پیام راهنما
       ۶) هر خطا (شبکه/۴۰۴/JSON/timeout) → بی‌صدا؛ بازی هرگز قفل نمی‌شود            */

    private int currentVc() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    private void checkUpdate() {
        if (errored || checking) { scheduleNext(); return; }
        checking = true;
        final int curVc = currentVc();
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    HttpURLConnection c = (HttpURLConnection) new URL(UPDATE_JSON).openConnection();
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(8000);
                    c.setRequestProperty("Cache-Control", "no-cache");
                    int code = c.getResponseCode();
                    if (code != 200) throw new Exception("http " + code);
                    BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = r.readLine()) != null) sb.append(line);
                    r.close();
                    JSONObject o = new JSONObject(sb.toString());
                    final int vc = o.optInt("versionCode", 0);
                    /* فقط وقتی نسخه‌ی سروِ جدیدتر از نصب‌شده است دیالوغ بیاید (PHASE 16/17) */
                    if (vc > curVc && vc != dismissedVc) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() { showUpdateDialog(vc); }
                        });
                    }
                } catch (Exception e) {
                    /* PHASE 13/14: آفلاین/خطا → بی‌صدا ادامه؛ هیچ‌چیز دانلود یا نصب نمی‌شود */
                    Log.w("WD-Update", "update check skipped: " + e.getClass().getSimpleName());
                } finally {
                    checking = false;
                    scheduleNext();
                }
            }
        }).start();
    }

    /* PHASE 6/7: دیالوغ غیرمسدودکننده — داور مایکت همیشه می‌تواند وارد بازی شود */
    private void showUpdateDialog(final int vc) {
        try {
            if (isFinishing() || updateDlgShown) return;
            updateDlgShown = true;
            new AlertDialog.Builder(this)
                    .setTitle("🔄 به‌روزرسانی در دسترس است")
                    .setMessage("نسخه‌ی جدیدی از ورلد دامین (v" + faNum(vc) + ") منتشر شده است.\nبرای به‌روزرسانی بازی، از طریق مایکت ادامه دهید.")
                    .setCancelable(true)
                    .setPositiveButton(" به‌روزرسانی از مایکت ", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface d, int w) { openMyket(); }
                    })
                    .setNegativeButton(" ادامه ", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface d, int w) { dismissedVc = vc; }
                    })
                    .setOnCancelListener(new DialogInterface.OnCancelListener() {
                        @Override
                        public void onCancel(DialogInterface d) { dismissedVc = vc; }
                    })
                    .setOnDismissListener(new DialogInterface.OnDismissListener() {
                        @Override
                        public void onDismiss(DialogInterface d) { updateDlgShown = false; }
                    })
                    .show();
        } catch (Exception e) {
            updateDlgShown = false;
        }
    }

    /* PHASE 5/15: باز کردن صفحه‌ی برنامه در مایکت — مطابق مستندات رسمی
       https://myket.ir/kb/topics/using-myket-intents/ */
    private void openMyket() {
        /* ۱) Intent رسمی مایکت: myket://application?id=<package> — فقط اپ مایکت آن را می‌گیرد */
        try {
            Intent it = new Intent(Intent.ACTION_VIEW);
            it.setData(Uri.parse("myket://application?id=" + getPackageName()));
            it.setPackage(MYKET_PKG);
            startActivity(it);
            return;
        } catch (Exception e) {
            /* مایکت نصب نیست یا Intent حل نشد */
        }
        /* ۲) پشتیبان امن: صفحه‌ی وب برنامه در مایکت — فقط اگر آدرس واقعی تنظیم شده باشد */
        if (MYKET_APP_URL.startsWith("http://") || MYKET_APP_URL.startsWith("https://")) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(MYKET_APP_URL)));
                return;
            } catch (Exception ignored) { }
        }
        /* ۳) هیچ مسیری ممکن نبود → راهنما؛ کاربر هرگز گیر نمی‌افتد */
        toast("برای بروزرسانی، صفحه‌ی World Dominion در مایکت را باز کنید.");
    }

    private void scheduleNext() {
        try {
            if (web != null && !errored) {
                web.postDelayed(new Runnable() {
                    @Override
                    public void run() { checkUpdate(); }
                }, RECHECK_MS);
            }
        } catch (Exception ignored) { }
    }

    private static String faNum(int n) {
        String s = String.valueOf(n);
        StringBuilder b = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (c >= '0' && c <= '9') b.append((char) ('۰' + (c - '0')));
            else b.append(c);
        }
        return b.toString();
    }

    private void toast(String msg) {
        try {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show(); }
            });
        } catch (Exception ignored) { }
    }

    private void showOffline() {
        errored = true;
        web.loadUrl(ERROR_URL);
    }

    private void rebuild() {
        try {
            root.removeAllViews();
            web.destroy();
        } catch (Exception ignored) { }
        web = createWebView();
        root.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        web.loadUrl(GAME_URL);
    }

    private void immersive() {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        immersive();
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack() && !errored) {
            web.goBack();
        } else {
            moveTaskToBack(true);
        }
    }
}
