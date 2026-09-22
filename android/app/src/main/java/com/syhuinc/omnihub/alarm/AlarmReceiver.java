package com.syhuinc.omnihub.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID);
        if (alarmId == null) return;

        AlarmData alarm = AlarmStore.find(context, alarmId);
        if (alarm == null) return;

        // One-shot "today" alarms disable themselves; repeating ones re-arm their next occurrence.
        if ("today".equals(alarm.repeatMode)) {
            alarm.enabled = false;
            AlarmStore.upsert(context, alarm);
        } else {
            AlarmStore.upsert(context, alarm);
            AlarmScheduler.arm(context, alarm);
        }

        Intent serviceIntent = new Intent(context, AlarmRingService.class);
        serviceIntent.putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
