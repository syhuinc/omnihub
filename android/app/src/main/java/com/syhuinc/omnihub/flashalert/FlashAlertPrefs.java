package com.syhuinc.omnihub.flashalert;

import android.content.Context;
import android.content.SharedPreferences;

public final class FlashAlertPrefs {
    private static final String PREFS_NAME = "flash_alert_prefs";
    private static final String KEY_NOTIFICATION = "notification_enabled";
    private static final String KEY_CALL = "call_enabled";
    private static final String KEY_ALARM = "alarm_enabled";

    private FlashAlertPrefs() {}

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static boolean isNotificationEnabled(Context context) {
        return prefs(context).getBoolean(KEY_NOTIFICATION, false);
    }

    public static boolean isCallEnabled(Context context) {
        return prefs(context).getBoolean(KEY_CALL, false);
    }

    public static boolean isAlarmEnabled(Context context) {
        return prefs(context).getBoolean(KEY_ALARM, false);
    }

    public static void setNotificationEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_NOTIFICATION, enabled).apply();
    }

    public static void setCallEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_CALL, enabled).apply();
    }

    public static void setAlarmEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_ALARM, enabled).apply();
    }
}
