package com.worlddominion.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
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
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

public class MainActivity extends Activity {

    /* V49: پارامتر نسخه → WebView هرگز HTML قدیمی کش‌شده را سرو نمی‌کند */
    private static final int GAME_VER = 51;
    private static final String GAME_URL = "https://world-dominion7.vercel.app/game/index.html?v=" + GAME_VER;
    private static final String GAME_HOST = "world-dominion7.vercel.app";
    private static final String ERROR_URL = "file:///android_asset/error.html";

    /* V49: آپدیت خودکار مستقیم — versionCode دیگر هاردکد نیست، از خود پکیج خوانده می‌شود */
    private static final String UPDATE_JSON = "https://world-dominion7.vercel.app/apk/latest.json";
    private static final String ACTION_INSTALL_STATUS = "com.worlddominion.game.INSTALL_STATUS";
    private static final long RECHECK_MS = 15 * 60 * 1000; /* هر ۱۵ دقیقه دوباره چک */

    private WebView web;
    private FrameLayout root;
    private boolean errored = false;

    /* V49: وضعیت آپدیت‌کننده */
    private boolean checking = false;
    private boolean downloading = false;
    private boolean progressCanceled = false;
    private File pendingApk = null;      /* فقط برای ادامه‌ی نصب بعد از گرفتن اجازه */
    private File lastDownloadedApk = null;
    private String lastUpdateUrl = null;
    private int lastUpdateVc = 0;

    private AlertDialog progressDlg = null;
    private ProgressBar progressPb = null;
    private TextView progressTv = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        handleInstallStatus(getIntent());

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

    /* ============ V49: آپدیت خودکار مستقیم روی APK ============
       ۱) latest.json چک می‌شود (versionCode از خودِ پکیج نصب‌شده خوانده می‌شود — دیگر هرگز جعلی نیست)
       ۲) اگر نسخه‌ی جدید باشد: بدون هیچ سؤالی، APK در پس‌زمینه دانلود می‌شود (با درصد پیشرفت فارسی)
       ۳) تمام‌شدن دانلود → نصب با PackageInstaller (فقط تایید سیستم اندروید، بدون مرورگر)
       ۴) اگر کاربر پنجره‌ی پیشرفت را ببندد، دانلود بی‌صدا ادامه می‌یابد و آخرش پرسش کوچک نصب می‌آید
       ۵) sha256 از latest.json اعتبارسنجی می‌شود تا APK خراب نصب نشود                       */

    private int currentVc() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    private void checkUpdate() {
        if (errored || checking || downloading) { scheduleNext(); return; }
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
                    if (code != 200) { checking = false; scheduleNext(); return; }
                    BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = r.readLine()) != null) sb.append(line);
                    r.close();
                    JSONObject o = new JSONObject(sb.toString());
                    final int vc = o.optInt("versionCode", 0);
                    final String url = o.optString("url", "");
                    final String sha = o.optString("sha256", "");
                    checking = false;
                    if (vc <= curVc || url.length() == 0) { scheduleNext(); return; }

                    lastUpdateUrl = url;
                    lastUpdateVc = vc;

                    /* اگر APK همین نسخه قبلاً دانلود شده → مستقیم برو سراغ نصب */
                    File ready = updateFile(vc);
                    if (ready != null && ready.exists() && ready.length() > 1024) {
                        lastDownloadedApk = ready;
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() { installApk(); }
                        });
                        return;
                    }

                    /* آپدیت جدید → بدون سؤال، دانلود خودکار */
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                if (isFinishing()) return;
                                progressCanceled = false;
                                LinearLayout box = new LinearLayout(MainActivity.this);
                                box.setOrientation(LinearLayout.VERTICAL);
                                int p = (int) (18 * getResources().getDisplayMetrics().density);
                                box.setPadding(p, p, p, p);
                                progressPb = new ProgressBar(MainActivity.this, null, android.R.attr.progressBarStyleHorizontal);
                                progressPb.setMax(100);
                                progressTv = new TextView(MainActivity.this);
                                progressTv.setText("در حال آماده‌سازی… " + faNum(0) + "٪");
                                box.addView(progressPb, new LinearLayout.LayoutParams(
                                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
                                box.addView(progressTv);
                                progressDlg = new AlertDialog.Builder(MainActivity.this)
                                        .setTitle("⬆️ به‌روزرسانی خودکار")
                                        .setMessage("نسخه‌ی جدید بازی (v" + lastUpdateVc + ") در حال دریافت است — بعد از دانلود، خودش نصب می‌شود.")
                                        .setView(box)
                                        .setCancelable(true)
                                        .create();
                                progressDlg.setOnCancelListener(new DialogInterface.OnCancelListener() {
                                    @Override
                                    public void onCancel(DialogInterface d) {
                                        progressCanceled = true; /* دانلود بی‌صدا ادامه می‌یابد */
                                    }
                                });
                                progressDlg.show();
                            } catch (Exception ignored) { }
                        }
                    });
                    downloadApk(url, vc, sha);
                } catch (Exception e) {
                    checking = false;
                    scheduleNext();
                }
            }
        }).start();
    }

    private void downloadApk(final String url, final int vc, final String sha) {
        downloading = true;
        new Thread(new Runnable() {
            @Override
            public void run() {
                boolean ok = false;
                try {
                    File dir = getExternalFilesDir(null);
                    if (dir == null) dir = getFilesDir();
                    File[] olds = dir.listFiles();
                    if (olds != null) {
                        for (File f2 : olds) {
                            if (f2.getName().startsWith("wd_update_")) f2.delete();
                        }
                    }
                    final File out = new File(dir, "wd_update_" + vc + ".apk");
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(15000);
                    c.setReadTimeout(30000);
                    c.setRequestProperty("Cache-Control", "no-cache");
                    c.connect();
                    int len = c.getContentLength();
                    InputStream in = c.getInputStream();
                    FileOutputStream fo = new FileOutputStream(out);
                    byte[] b = new byte[65536];
                    int n;
                    long tot = 0;
                    int lastP = -10;
                    while ((n = in.read(b)) > 0) {
                        fo.write(b, 0, n);
                        tot += n;
                        if (len > 0) {
                            final int pct = (int) (tot * 100 / len);
                            if (pct - lastP >= 5) {
                                lastP = pct;
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() { uiProgress(pct); }
                                });
                            }
                        }
                    }
                    fo.close();
                    in.close();
                    if (len > 0 && out.length() != len) throw new Exception("incomplete");
                    if (sha != null && sha.length() == 64 && !sha.equalsIgnoreCase(sha256(out))) {
                        out.delete();
                        throw new Exception("hash mismatch");
                    }
                    ok = true;
                    lastDownloadedApk = out;
                } catch (Exception e) {
                    ok = false;
                }
                downloading = false;
                final boolean ok2 = ok;
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        dismissProgress();
                        if (!isFinishing() && ok2) {
                            if (progressCanceled) {
                                /* کاربر پنجره را بسته بود → فقط یک پرسش کوچک نصب */
                                try {
                                    new AlertDialog.Builder(MainActivity.this)
                                            .setTitle("⬆️ آپدیت آماده است")
                                            .setMessage("نسخه‌ی جدید (v" + lastUpdateVc + ") دانلود شد. نصب کنم؟")
                                            .setPositiveButton(" نصب ", new DialogInterface.OnClickListener() {
                                                @Override
                                                public void onClick(DialogInterface d, int w) { installApk(); }
                                            })
                                            .setNegativeButton("بعداً", null)
                                            .show();
                                } catch (Exception ignored) { }
                            } else {
                                installApk(); /* مستقیم — بدون سؤال */
                            }
                        } else if (!isFinishing() && !ok2) {
                            toast("⚠️ دانلود آپدیت ناموفق بود — دفعه‌ی بعد دوباره تلاش می‌شود");
                        }
                    }
                });
            }
        }).start();
    }

    private void installApk() {
        File apk = (pendingApk != null) ? pendingApk : lastDownloadedApk;
        if (apk == null || !apk.exists() || apk.length() < 1024) return;
        pendingApk = null;
        try {
            /* اندروید ۸+: اگر اجازه‌ی «نصب از منبع ناشناس» برای بازی نیست، اول همان صفحه باز می‌شود */
            if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
                pendingApk = apk; /* بعد از گرفتن اجازه، onResume ادامه می‌دهد */
                try {
                    startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:" + getPackageName())));
                } catch (Exception e) {
                    try { startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)); } catch (Exception ig) { }
                }
                return; /* بعد از برگشت، onResume دوباره نصب را ادامه می‌دهد */
            }
            PackageInstaller pi = getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams sp =
                    new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
            int id = pi.createSession(sp);
            PackageInstaller.Session ss = pi.openSession(id);
            OutputStream os = ss.openWrite("wd_update", 0, apk.length());
            FileInputStream fi = new FileInputStream(apk);
            byte[] b = new byte[65536];
            int n;
            while ((n = fi.read(b)) > 0) os.write(b, 0, n);
            fi.close();
            ss.fsync(os);
            os.close();
            Intent it = new Intent(this, MainActivity.class);
            it.setAction(ACTION_INSTALL_STATUS);
            int pflags = PendingIntent_FLAG_UPDATE_MUTABLE();
            android.app.PendingIntent ppt = android.app.PendingIntent.getActivity(this, 1001, it, pflags);
            ss.commit(ppt.getIntentSender());
            ss.close();
            toast("📦 در حال نصب نسخه‌ی جدید…");
        } catch (Exception e) {
            /* fallback: باز کردن لینک در مرورگر مثل قبل */
            if (lastUpdateUrl != null) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(lastUpdateUrl))); } catch (Exception ignored) { }
            }
        }
    }

    private static int PendingIntent_FLAG_UPDATE_MUTABLE() {
        int f = android.app.PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 31) f |= 0x02000000; /* FLAG_MUTABLE — برای PackageInstaller لازم است */
        return f;
    }

    private void handleInstallStatus(Intent i) {
        try {
            if (i == null || !ACTION_INSTALL_STATUS.equals(i.getAction())) return;
            int st = i.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
            if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                Intent conf = (Intent) i.getParcelableExtra(Intent.EXTRA_INTENT);
                if (conf != null) {
                    conf.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    try { startActivity(conf); } catch (Exception ignored) { }
                }
            } else if (st == PackageInstaller.STATUS_SUCCESS) {
                toast("✅ آپدیت نصب شد — بازی به‌روز است");
                if (lastDownloadedApk != null) try { lastDownloadedApk.delete(); } catch (Exception ignored) { }
                lastDownloadedApk = null;
                pendingApk = null;
            }
        } catch (Exception ignored) { }
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

    private File updateFile(int vc) {
        try {
            File dir = getExternalFilesDir(null);
            if (dir == null) dir = getFilesDir();
            return new File(dir, "wd_update_" + vc + ".apk");
        } catch (Exception e) {
            return null;
        }
    }

    private void uiProgress(int pct) {
        try {
            if (progressPb != null) progressPb.setProgress(pct);
            if (progressTv != null) progressTv.setText("در حال دانلود… " + faNum(pct) + "٪");
        } catch (Exception ignored) { }
    }

    private void dismissProgress() {
        try {
            if (progressDlg != null && progressDlg.isShowing()) progressDlg.dismiss();
        } catch (Exception ignored) { }
        progressDlg = null;
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

    private static String sha256(File f) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        FileInputStream in = new FileInputStream(f);
        byte[] b = new byte[65536];
        int n;
        while ((n = in.read(b)) > 0) md.update(b, 0, n);
        in.close();
        StringBuilder sb = new StringBuilder();
        for (byte x : md.digest()) sb.append(String.format("%02x", x));
        return sb.toString();
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
        maybeResumeInstall();
    }

    /* اگر کاربر اجازه‌ی «نصب از منبع ناشناس» را در تنظیمات داد، نصبِ معلق را ادامه بده */
    private void maybeResumeInstall() {
        if (Build.VERSION.SDK_INT < 26 || pendingApk == null) return;
        try {
            if (getPackageManager().canRequestPackageInstalls()) {
                final File f = pendingApk;
                pendingApk = null;
                web.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        pendingApk = f;
                        installApk();
                        pendingApk = null; /* فقط یک تلاش در هر برگشت — بدون حلقه */
                    }
                }, 800);
            }
        } catch (Exception ignored) { pendingApk = null; }
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
