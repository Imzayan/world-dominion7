package com.worlddominion.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
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

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {

    /* V46: پارامتر نسخه → WebView هرگز HTML قدیمی کش‌شده را سرو نمی‌کند */
    private static final String GAME_URL = "https://world-dominion7.vercel.app/game/index.html?v=46";
    private static final String GAME_HOST = "world-dominion7.vercel.app";
    private static final String ERROR_URL = "file:///android_asset/error.html";

    /* V46: آپدیت خودکار داخل برنامه — این ثابت باید با هر بیلد جدید دستی به‌روز شود */
    private static final int CURRENT_VC = 3;
    private static final String UPDATE_JSON = "https://world-dominion7.vercel.app/apk/latest.json";

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
            if (u == null || !u.contains("?v=46")) {
                web.loadUrl(GAME_URL);
            }
        } else {
            web.loadUrl(GAME_URL);
        }

        /* V46: بررسی نسخه‌ی جدید ۴ ثانیه بعد از باز شدن بازی (بدون مزاحمت برای لود اولیه) */
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

    /* ============ V46: آپدیت خودکار داخل برنامه ============
       سرور: /apk/latest.json → {versionCode, versionName, url}
       اگر نسخه‌ی جدید بود، دیالوگ فارسی نشان داده می‌شود؛ دکمه‌ی دانلود،
       فایل APK را در مرورگر باز می‌کند (نصب از «منابع ناشناس» توسط خود کاربر تایید می‌شود). */
    private void checkUpdate() {
        if (errored) return;
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    HttpURLConnection c = (HttpURLConnection) new URL(UPDATE_JSON).openConnection();
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(8000);
                    c.setRequestProperty("Cache-Control", "no-cache");
                    int code = c.getResponseCode();
                    if (code != 200) return;
                    BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = r.readLine()) != null) sb.append(line);
                    r.close();
                    JSONObject o = new JSONObject(sb.toString());
                    final int vc = o.optInt("versionCode", 0);
                    final String vn = o.optString("versionName", "");
                    final String url = o.optString("url", "");
                    if (vc > CURRENT_VC && url.length() > 0) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    if (isFinishing()) return;
                                    new AlertDialog.Builder(MainActivity.this)
                                            .setTitle("⬆️ به‌روزرسانی جدید")
                                            .setMessage("نسخه‌ی " + vn + " بازی آماده‌ی دانلود است.\n\nبا نصب نسخه‌ی جدید، آخرین بهینه‌سازی‌های سرعت و رفع باگ‌ها را خواهی داشت. (کد فعلی: " + CURRENT_VC + " ← جدید: " + vc + ")")
                                            .setPositiveButton(" دانلود و نصب ", new DialogInterface.OnClickListener() {
                                                @Override
                                                public void onClick(DialogInterface d, int w) {
                                                    try {
                                                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                                                    } catch (Exception ignored) { }
                                                }
                                            })
                                            .setNegativeButton("بعداً", null)
                                            .show();
                                } catch (Exception ignored) { }
                            }
                        });
                    }
                } catch (Exception ignored) { }
            }
        }).start();
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
