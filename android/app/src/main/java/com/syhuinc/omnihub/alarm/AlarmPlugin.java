package com.syhuinc.omnihub.alarm;

import android.Manifest;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONException;

import java.util.List;
import java.util.UUID;

import com.syhuinc.omnihub.CrashLogger;

@CapacitorPlugin(
        name = "AlarmPlugin",
        permissions = {
                @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
        }
)
public class AlarmPlugin extends Plugin {

    @PluginMethod
    public void schedule(PluginCall call) {
        String id = call.getString("id");
        Integer hour = call.getInt("hour");
        Integer minute = call.getInt("minute");
        String repeatMode = call.getString("repeatMode", "today");
        boolean enabled = call.getBoolean("enabled", true);

        if (hour == null || minute == null) {
            call.reject("hour and minute are required");
            return;
        }

        AlarmData alarm = new AlarmData();
        alarm.id = (id == null || id.isEmpty()) ? UUID.randomUUID().toString() : id;
        alarm.hour = hour;
        alarm.minute = minute;
        alarm.label = call.getString("label", "");
        alarm.repeatMode = repeatMode;
        alarm.enabled = enabled;
        alarm.soundUri = call.getString("soundUri", null);
        alarm.soundName = call.getString("soundName", null);
        alarm.createdAt = System.currentTimeMillis();

        AlarmStore.upsert(getContext(), alarm);
        if (enabled) {
            AlarmScheduler.arm(getContext(), alarm);
        } else {
            AlarmScheduler.disarm(getContext(), alarm.id);
        }

        JSObject ret = new JSObject();
        ret.put("id", alarm.id);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        AlarmScheduler.disarm(getContext(), id);
        AlarmStore.remove(getContext(), id);
        call.resolve();
    }

    @PluginMethod
    public void list(PluginCall call) {
        List<AlarmData> alarms = AlarmStore.loadAll(getContext());
        JSArray arr = new JSArray();
        try {
            for (AlarmData a : alarms) {
                arr.put(new JSObject(a.toJson().toString()));
            }
        } catch (JSONException e) {
            call.reject("Failed to read alarms", e);
            return;
        }
        JSObject ret = new JSObject();
        ret.put("alarms", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            ret.put("granted", true);
        } else {
            ret.put("granted", getPermissionState("notifications").toString().equals("granted"));
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        requestPermissionForAlias("notifications", call, "onNotificationPermissionResult");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void onNotificationPermissionResult(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", getPermissionState("notifications").toString().equals("granted"));
        call.resolve(ret);
    }

    @PluginMethod
    public void pickRingtone(PluginCall call) {
        Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false);
        Uri defaultUri = RingtoneManager.getActualDefaultRingtoneUri(getContext(), RingtoneManager.TYPE_ALARM);
        if (defaultUri != null) {
            intent.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, defaultUri);
        }
        startActivityForResult(call, intent, "onRingtonePicked");
    }

    @ActivityCallback
    private void onRingtonePicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        Uri uri = data != null ? data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI) : null;
        JSObject ret = new JSObject();
        if (uri == null) {
            ret.put("cancelled", true);
        } else {
            ret.put("cancelled", false);
            ret.put("uri", uri.toString());
            android.media.Ringtone ringtone = RingtoneManager.getRingtone(getContext(), uri);
            ret.put("name", ringtone != null ? ringtone.getTitle(getContext()) : "Custom");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void getCrashLog(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("log", CrashLogger.read(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void clearCrashLog(PluginCall call) {
        CrashLogger.clear(getContext());
        call.resolve();
    }
}
