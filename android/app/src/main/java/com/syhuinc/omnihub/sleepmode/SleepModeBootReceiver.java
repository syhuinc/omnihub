package com.syhuinc.omnihub.sleepmode;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Android clears all AlarmManager alarms on reboot — re-arm tonight's bedtime if Sleep Mode is on. */
public class SleepModeBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action) && !"android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            return;
        }
        SleepModeData data = SleepModeStore.load(context);
        if (data.enabled) {
            SleepModeScheduler.armBedtime(context, data);
        }
    }
}
