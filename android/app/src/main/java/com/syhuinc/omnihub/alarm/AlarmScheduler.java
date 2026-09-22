package com.syhuinc.omnihub.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;

/**
 * Computes next-fire timestamps for each repeat mode and arms/disarms the OS alarm.
 *
 * Uses AlarmManager.setAlarmClock() rather than setExact() or setExactAndAllowWhileIdle():
 * it's the API meant for user-facing alarm clocks specifically, is exempt from the
 * exact-alarm permission requirement added in Android 12+, and gets top-priority
 * wake behavior (shows the status-bar alarm icon too).
 */
public class AlarmScheduler {

    public static final String EXTRA_ALARM_ID = "alarm_id";

    public static void arm(Context ctx, AlarmData alarm) {
        long triggerAt = nextTriggerMillis(alarm);
        if (triggerAt <= 0) return;

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(ctx, AlarmReceiver.class);
        intent.putExtra(EXTRA_ALARM_ID, alarm.id);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getBroadcast(ctx, alarm.id.hashCode(), intent, flags);

        Intent showIntent = new Intent(ctx, com.syhuinc.omnihub.MainActivity.class);
        PendingIntent showPi = PendingIntent.getActivity(ctx, alarm.id.hashCode(), showIntent, flags);

        am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAt, showPi), pi);
    }

    public static void disarm(Context ctx, String alarmId) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent intent = new Intent(ctx, AlarmReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getBroadcast(ctx, alarmId.hashCode(), intent, flags);
        am.cancel(pi);
    }

    /** Returns the next epoch-millis this alarm should fire at, or -1 if it shouldn't be armed. */
    public static long nextTriggerMillis(AlarmData alarm) {
        if (!alarm.enabled) return -1;

        Calendar now = Calendar.getInstance();
        Calendar candidate = (Calendar) now.clone();
        candidate.set(Calendar.HOUR_OF_DAY, alarm.hour);
        candidate.set(Calendar.MINUTE, alarm.minute);
        candidate.set(Calendar.SECOND, 0);
        candidate.set(Calendar.MILLISECOND, 0);

        if (candidate.before(now) || candidate.equals(now)) {
            candidate.add(Calendar.DAY_OF_YEAR, 1);
        }

        switch (alarm.repeatMode) {
            case "today":
            case "daily":
                return candidate.getTimeInMillis();
            case "weekend":
                while (!isWeekend(candidate)) {
                    candidate.add(Calendar.DAY_OF_YEAR, 1);
                }
                return candidate.getTimeInMillis();
            case "weekdays":
                while (isWeekend(candidate)) {
                    candidate.add(Calendar.DAY_OF_YEAR, 1);
                }
                return candidate.getTimeInMillis();
            default:
                return candidate.getTimeInMillis();
        }
    }

    private static boolean isWeekend(Calendar c) {
        int day = c.get(Calendar.DAY_OF_WEEK);
        return day == Calendar.SATURDAY || day == Calendar.SUNDAY;
    }
}
