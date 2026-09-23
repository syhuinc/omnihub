package com.syhuinc.omnihub.sleepmode;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONException;

@CapacitorPlugin(
        name = "SleepModePlugin",
        permissions = {
                @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
        }
)
public class SleepModePlugin extends Plugin {

    @PluginMethod
    public void configure(PluginCall call) {
        SleepModeData data = new SleepModeData();
        data.enabled = call.getBoolean("enabled", false);
        data.bedtimeHour = call.getInt("bedtimeHour", 22);
        data.bedtimeMinute = call.getInt("bedtimeMinute", 30);
        data.wakeHour = call.getInt("wakeHour", 7);
        data.wakeMinute = call.getInt("wakeMinute", 0);
        data.intervalMin = call.getInt("intervalMin", 30);
        data.personality = call.getString("personality", "friendly");
        data.mode = call.getString("mode", "normal");
        data.callName = call.getString("callName", null);
        data.hasWorkTomorrow = call.getBoolean("hasWorkTomorrow", false);
        data.relationshipStatus = call.getString("relationshipStatus", null);

        // A settings change always (re)starts scheduling from now, rather than trying to preserve
        // an in-progress nightly session's nag count/anti-repeat state across an edit.
        data.sessionStartMillis = 0;
        data.nagCount = 0;
        data.recentKeysCsv = "";

        SleepModeStore.save(getContext(), data);

        boolean armed = false;
        if (data.enabled) {
            armed = SleepModeScheduler.armBedtime(getContext(), data);
        } else {
            SleepModeScheduler.disarm(getContext());
            // Cut off a reminder that's speaking right now if the user disables mid-utterance.
            getContext().stopService(new Intent(getContext(), SleepModeSpeakService.class));
        }

        JSObject ret = new JSObject();
        ret.put("armed", armed);
        call.resolve(ret);
    }

    @PluginMethod
    public void status(PluginCall call) {
        SleepModeData data = SleepModeStore.load(getContext());
        try {
            call.resolve(new JSObject(data.toJson().toString()));
        } catch (JSONException e) {
            call.reject("Failed to read Sleep Mode status", e);
        }
    }

    /** Returns a sample line for the given personality without touching any persisted anti-repeat state. */
    @PluginMethod
    public void previewMessage(PluginCall call) {
        String personality = call.getString("personality", "friendly");
        int tier = call.getInt("tier", 0);
        String callName = call.getString("callName", null);
        boolean hasWorkTomorrow = call.getBoolean("hasWorkTomorrow", false);

        MessageBank.Pick pick = MessageBank.pick(
                personality, tier, callName, hasWorkTomorrow, null, java.util.Collections.emptySet());

        JSObject ret = new JSObject();
        ret.put("text", pick.text);
        call.resolve(ret);
    }

    /** Speaks a sample line aloud right now, via the same foreground service the nightly loop uses. */
    @PluginMethod
    public void speakTest(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.isEmpty()) {
            call.reject("text is required");
            return;
        }
        Intent serviceIntent = new Intent(getContext(), SleepModeSpeakService.class);
        serviceIntent.putExtra(SleepModeSpeakService.EXTRA_TEXT, text);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        call.resolve();
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
    public void checkExactAlarmPermission(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", SleepModeScheduler.canScheduleExactAlarms(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }
}
