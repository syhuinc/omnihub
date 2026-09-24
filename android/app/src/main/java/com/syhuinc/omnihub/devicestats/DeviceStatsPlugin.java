package com.syhuinc.omnihub.devicestats;

import android.Manifest;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.os.SystemClock;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.WindowManager;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.Enumeration;

/** Real, on-device battery/storage/RAM/WiFi/device-spec readings for the "My Phone" card and Phone Center. */
@CapacitorPlugin(name = "DeviceStatsPlugin")
public class DeviceStatsPlugin extends Plugin {

    @PluginMethod
    public void getStats(PluginCall call) {
        Context context = getContext();
        JSObject ret = new JSObject();

        ret.put("deviceModel", Build.MODEL);
        ret.put("manufacturer", Build.MANUFACTURER);

        Intent batteryStatus = context.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        int batteryPercent = -1;
        boolean isCharging = false;
        double batteryTempC = 0;
        if (batteryStatus != null) {
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            if (level >= 0 && scale > 0) {
                batteryPercent = Math.round(100f * level / scale);
            }
            int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
            // EXTRA_TEMPERATURE is tenths of a degree Celsius (e.g. 340 == 34.0C).
            batteryTempC = batteryStatus.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) / 10.0;
        }
        ret.put("batteryPercent", batteryPercent);
        ret.put("isCharging", isCharging);
        ret.put("batteryTempC", batteryTempC);

        try {
            StatFs stat = new StatFs(Environment.getExternalStorageDirectory().getPath());
            long total = (long) stat.getBlockCountLong() * stat.getBlockSizeLong();
            long free = (long) stat.getAvailableBlocksLong() * stat.getBlockSizeLong();
            ret.put("storageTotalBytes", total);
            ret.put("storageFreeBytes", free);
        } catch (Exception e) {
            ret.put("storageTotalBytes", 0);
            ret.put("storageFreeBytes", 0);
        }

        ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        if (am != null) {
            ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(memInfo);
            ret.put("ramTotalBytes", memInfo.totalMem);
            ret.put("ramAvailBytes", memInfo.availMem);
        } else {
            ret.put("ramTotalBytes", 0);
            ret.put("ramAvailBytes", 0);
        }

        boolean wifiConnected = isWifiConnected(context);
        ret.put("wifiConnected", wifiConnected);
        ret.put("ipAddress", getIpAddress());

        // Link speed needs ACCESS_FINE_LOCATION on modern Android — only read it if that's
        // already granted (e.g. from barcode scanning) rather than prompting for it here just
        // for a "nice to have" number on a phone-info screen.
        if (wifiConnected && hasLocationPermission(context)) {
            int[] speeds = getWifiLinkSpeedMbps(context);
            ret.put("wifiRxMbps", speeds[0]);
            ret.put("wifiTxMbps", speeds[1]);
        } else {
            ret.put("wifiRxMbps", 0);
            ret.put("wifiTxMbps", 0);
        }

        call.resolve(ret);
    }

    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        Context context = getContext();
        JSObject ret = new JSObject();

        ret.put("deviceModel", Build.MODEL);
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("androidVersion", Build.VERSION.RELEASE);
        ret.put("buildNumber", Build.DISPLAY);

        // SOC_MANUFACTURER/SOC_MODEL are the honest, non-reflection way to read chip info —
        // only available from Android 12 (API 31) onward.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ret.put("socManufacturer", Build.SOC_MANUFACTURER);
            ret.put("socModel", Build.SOC_MODEL);
        } else {
            ret.put("socManufacturer", "");
            ret.put("socModel", "");
        }

        WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        if (wm != null) {
            Display display = wm.getDefaultDisplay();
            DisplayMetrics metrics = new DisplayMetrics();
            display.getRealMetrics(metrics);
            ret.put("screenWidthPx", metrics.widthPixels);
            ret.put("screenHeightPx", metrics.heightPixels);
            ret.put("refreshRateHz", Math.round(display.getRefreshRate()));

            double widthInches = metrics.widthPixels / metrics.xdpi;
            double heightInches = metrics.heightPixels / metrics.ydpi;
            double diagonalInches = Math.sqrt(widthInches * widthInches + heightInches * heightInches);
            ret.put("screenSizeInches", Math.round(diagonalInches * 10.0) / 10.0);
        }

        ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        if (am != null) {
            ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(memInfo);
            ret.put("ramTotalBytes", memInfo.totalMem);
        } else {
            ret.put("ramTotalBytes", 0);
        }

        try {
            StatFs stat = new StatFs(Environment.getExternalStorageDirectory().getPath());
            ret.put("storageTotalBytes", (long) stat.getBlockCountLong() * stat.getBlockSizeLong());
        } catch (Exception e) {
            ret.put("storageTotalBytes", 0);
        }

        ret.put("uptimeMillis", SystemClock.elapsedRealtime());

        call.resolve(ret);
    }

    private boolean hasLocationPermission(Context context) {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    /** [rxMbps, txMbps] — 0 if unavailable (older Android, or link speed not reported). */
    private int[] getWifiLinkSpeedMbps(Context context) {
        try {
            WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm == null) return new int[]{0, 0};
            WifiInfo info = wm.getConnectionInfo();
            if (info == null) return new int[]{0, 0};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                return new int[]{Math.max(0, info.getRxLinkSpeedMbps()), Math.max(0, info.getTxLinkSpeedMbps())};
            }
            int linkSpeed = Math.max(0, info.getLinkSpeed());
            return new int[]{linkSpeed, linkSpeed};
        } catch (Exception e) {
            return new int[]{0, 0};
        }
    }

    private String getIpAddress() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (!iface.isUp() || iface.isLoopback()) continue;
                for (InetAddress addr : Collections.list(iface.getInetAddresses())) {
                    if (!addr.isLoopbackAddress() && addr.getHostAddress() != null && addr.getHostAddress().indexOf(':') < 0) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            // fall through
        }
        return "";
    }

    private boolean isWifiConnected(Context context) {
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            Network network = cm.getActiveNetwork();
            if (network == null) return false;
            NetworkCapabilities caps = cm.getNetworkCapabilities(network);
            return caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
        } catch (Exception e) {
            return false;
        }
    }
}
