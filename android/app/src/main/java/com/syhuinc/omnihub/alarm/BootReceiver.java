package com.syhuinc.omnihub.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import java.util.List;

/** Android clears all AlarmManager alarms on reboot — re-arm everything the native store still has enabled. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action) && !"android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            return;
        }
        List<AlarmData> alarms = AlarmStore.loadAll(context);
        for (AlarmData alarm : alarms) {
            if (alarm.enabled) {
                AlarmScheduler.arm(context, alarm);
            }
        }
    }
}
