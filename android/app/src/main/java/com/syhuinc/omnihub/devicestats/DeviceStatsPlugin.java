package com.syhuinc.omnihub.devicestats;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Real, on-device battery/storage/RAM/WiFi readings for the Home screen's "My Phone" card. */
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
        if (batteryStatus != null) {
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            if (level >= 0 && scale > 0) {
                batteryPercent = Math.round(100f * level / scale);
            }
            int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
        }
        ret.put("batteryPercent", batteryPercent);
        ret.put("isCharging", isCharging);

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

        ret.put("wifiConnected", isWifiConnected(context));

        call.resolve(ret);
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
