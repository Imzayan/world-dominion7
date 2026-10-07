#!/usr/bin/env bash
# V91: خط لوله بیلد APK ورلد دامین — نسخه‌ی Myket-compliant
# aapt2 compile/link → javac 17 (target 8) → d8 --release → zipalign → apksigner (v1+v2)
set -euo pipefail
ROOT=/home/z/my-project
BT=$ROOT/apk-build/tools/android-14
PF=$ROOT/apk-build/tools/android-34/android.jar
JDK=$ROOT/apk-build/tools/jdk-17.0.20.1+1/bin
APP=$ROOT/apk-build/app
B=$ROOT/apk-build/build
KS=$ROOT/download/keystore/world-dominion-release.keystore
KSPASS=$(sed -n 's/^storePassword=//p' $ROOT/download/keystore/keystore.properties)
VC=$(sed -n 's/.*android:versionCode="\([0-9]*\)".*/\1/p' $APP/AndroidManifest.xml | head -1)
VN=$(sed -n 's/.*android:versionName="\([^"]*\)".*/\1/p' $APP/AndroidManifest.xml | head -1)
OUT=$ROOT/public/apk/WorldDominion-v$VN.apk

echo "== World Dominion APK v$VN (vc $VC) =="
rm -rf $B/obj $B/gen $B/dexout $B/res.zip $B/base.apk
mkdir -p $B/obj $B/gen $B/dexout $B/apk

echo "-- 1) resources (aapt2 compile+link)"
"$BT/aapt2" compile --dir $APP/res -o $B/res.zip
"$BT/aapt2" link -o $B/base.apk -I "$PF" --manifest $APP/AndroidManifest.xml \
  --java $B/gen --auto-add-overlay --min-sdk-version 21 --target-sdk-version 34 $B/res.zip

echo "-- 1b) aidl (Myket IAB v3)"
if [ -d $APP/aidl ]; then
  "$BT/aidl" -p "$PF" -o $B/gen $APP/aidl/ir/mservices/market/IInAppBillingService.aidl
fi

echo "-- 2) javac (release, target 8) — همه‌ی کلاس‌های اپ + AIDL تولیدشده"
find $APP/java -name '*.java' > $B/sources.txt
if [ -f $B/gen/ir/mservices/market/IInAppBillingService.java ]; then
  echo $B/gen/ir/mservices/market/IInAppBillingService.java >> $B/sources.txt
fi
"$JDK/javac" -source 1.8 -target 1.8 -encoding UTF-8 -nowarn \
  -bootclasspath "$PF" -classpath "$PF" -d $B/obj \
  $B/gen/com/worlddominion/game/R.java @$B/sources.txt

echo "-- 3) d8 --release"
java -cp "$BT/lib/d8.jar" com.android.tools.r8.D8 --release --lib "$PF" \
  --output $B/dexout $(find $B/obj -name '*.class')

echo "-- 4) pack dex"
(cd $B/dexout && zip -q $B/base.apk classes.dex)

echo "-- 5) zipalign"
"$BT/zipalign" -f 4 $B/base.apk $B/apk/wd-aligned.apk

echo "-- 6) sign (v1+v2)"
java -jar "$BT/lib/apksigner.jar" sign --ks "$KS" --ks-key-alias worlddominion \
  --ks-pass pass:"$KSPASS" --key-pass pass:"$KSPASS" --out "$OUT" $B/apk/wd-aligned.apk

echo "-- 7) verify"
java -jar "$BT/lib/apksigner.jar" verify --print-certs "$OUT" | head -8
"$BT/aapt" dump badging "$OUT" | rg "package:|sdkVersion|application-label:|uses-permission" 
echo "-- sha256:"
sha256sum "$OUT"
ls -la "$OUT"
