package com.syhuinc.omnihub.flashalert;

import android.Manifest;
import android.content.Intent;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.Set;

@CapacitorPlugin(
        name = "FlashAlertPlugin",
        permissions = {
                @Permission(strings = { Manifest.permission.READ_PHONE_STATE }, alias = "phoneState")
        }
)
public class FlashAlertPlugin extends Plugin {

    @PluginMethod
    public void getSettings(PluginCall call) {
        call.resolve(buildSettings());
    }

    private JSObject buildSettings() {
        JSObject ret = new JSObject();
        ret.put("notificationEnabled", FlashAlertPrefs.isNotificationEnabled(getContext()));
        ret.put("callEnabled", FlashAlertPrefs.isCallEnabled(getContext()));
        ret.put("alarmEnabled", FlashAlertPrefs.isAlarmEnabled(getContext()));
        ret.put("notificationAccessGranted", isNotificationAccessGranted());
        ret.put("callPermissionGranted", getPermissionState("phoneState").toString().equals("granted"));
        return ret;
    }

    private boolean isNotificationAccessGranted() {
        Set<String> enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(getContext());
        return enabledPackages.contains(getContext().getPackageName());
    }

    @PluginMethod
    public void setNotificationEnabled(PluginCall call) {
        FlashAlertPrefs.setNotificationEnabled(getContext(), call.getBoolean("enabled", false));
        call.resolve(buildSettings());
    }

    @PluginMethod
    public void setCallEnabled(PluginCall call) {
        FlashAlertPrefs.setCallEnabled(getContext(), call.getBoolean("enabled", false));
        call.resolve(buildSettings());
    }

    @PluginMethod
    public void setAlarmEnabled(PluginCall call) {
        FlashAlertPrefs.setAlarmEnabled(getContext(), call.getBoolean("enabled", false));
        call.resolve(buildSettings());
    }

    @PluginMethod
    public void openNotificationAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void requestCallPermission(PluginCall call) {
        if (getPermissionState("phoneState").toString().equals("granted")) {
            call.resolve(buildSettings());
            return;
        }
        requestPermissionForAlias("phoneState", call, "onCallPermissionResult");
    }

    @PermissionCallback
    private void onCallPermissionResult(PluginCall call) {
        call.resolve(buildSettings());
    }
}
