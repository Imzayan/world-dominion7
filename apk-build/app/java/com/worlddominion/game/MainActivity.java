package com.worlddominion.game;

import android.app.Activity;
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

public class MainActivity extends Activity {

    /* V122: به‌روزرسانی بازی فقط از طریق فروشگاه (بازار/مایکت/گوگل‌پلی) —
       چک‌کننده‌ی نسخه و دیالوگ «به‌روزرسانی» طبق قوانین انتشار فروشگاه‌ها به‌کلی حذف شد؛
       هیچ پیام یا مسیر به‌روزرسانی خارج از فروشگاه در برنامه وجود ندارد.
       WebView هرگز HTML قدیمی کش‌شده را سرو نمی‌کند (پارامتر نسخه) */
    private static final int GAME_VER = 121;
    private static final String GAME_URL = "https://world-dominion7.vercel.app/game/index.html?v=" + GAME_VER;
    private static final String GAME_HOST = "world-dominion7.vercel.app";
    private static final String ERROR_URL = "file:///android_asset/error.html";

    private WebView web;
    private FrameLayout root;
    private boolean errored = false;

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

        /* V118: اتصال به سرویس پرداخت مایکت (IAB v3) — در شروع، بدون مزاحمت */
        WDIab.setup(this);
    }

    /* V118: تحویل نتیجه‌ی خرید به جاوااسکریپت بازی (همیشه روی UI thread) */
    public void deliverPurchaseResult(String json) {
        try {
            if (json == null) json = "{\"status\":\"fail\"}";
            Log.i("WD-PAY", "GEM_CREDIT bridge->js " + json.substring(0, Math.min(120, json.length())));
            web.evaluateJavascript("window.__wdOnPurchase && window.__wdOnPurchase(" + json + ");", null);
        } catch (Exception e) {
            Log.w("WD-PAY", "deliver error " + e.getClass().getSimpleName());
        } finally {
            WDIab.clearRequest();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == WDIab.REQ_BUY) {
            WDIab.onResult(resultCode, data);
        }
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

        /* V118: پل پرداخت مایکت — فقط شروع خرید و نتیجه‌ی خام؛ جم فقط از سمت سرور گرنت می‌شود */
        try { w.addJavascriptInterface(new WDBridge(this), "WDAndroid"); } catch (Exception ignored) { }

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
        WDIab.unbind(this);
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
