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
 * Uses AlarmManager.setAlarmClock() rather than setExact() or setExactAndAllowWhileIdle()
 * since it's the API meant for user-facing alarm clocks and gets top-priority wake behavior
 * (shows the status-bar alarm icon too). It still requires SCHEDULE_EXACT_ALARM to be granted
 * on API 31+ (not auto-granted for apps targeting API 33+) - the system throws a
 * SecurityException otherwise, so callers must check canScheduleExactAlarms() first.
 */
public class AlarmScheduler {

    public static final String EXTRA_ALARM_ID = "alarm_id";
    public static final String EXTRA_IS_BACKUP = "is_backup";
    public static final String EXTRA_BACKUP_INDEX = "backup_index";

    /** Cascading backup offsets from the moment the main alarm fires: +5, +10, +30 min. */
    private static final long[] BACKUP_OFFSETS_MS = { 5 * 60_000L, 10 * 60_000L, 30 * 60_000L };

    public static boolean canScheduleExactAlarms(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    /** Returns true if the alarm was armed, false if it couldn't be (missing permission, etc). */
    public static boolean arm(Context ctx, AlarmData alarm) {
        long triggerAt = nextTriggerMillis(alarm);
        if (triggerAt <= 0) return false;

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;

        Intent intent = new Intent(ctx, AlarmReceiver.class);
        intent.putExtra(EXTRA_ALARM_ID, alarm.id);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getBroadcast(ctx, alarm.id.hashCode(), intent, flags);

        Intent showIntent = new Intent(ctx, com.syhuinc.omnihub.MainActivity.class);
        PendingIntent showPi = PendingIntent.getActivity(ctx, alarm.id.hashCode(), showIntent, flags);

        try {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAt, showPi), pi);
            return true;
        } catch (SecurityException e) {
            // Missing SCHEDULE_EXACT_ALARM (denied, or revoked after being granted). Never let
            // this crash the caller - it can run on a receiver/service thread where an uncaught
            // exception kills the whole app process, not just this one alarm.
            return false;
        }
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
        cancelBackups(ctx, alarmId);
    }

    /**
     * Arms the three cascading backup rings at fixed offsets from the moment the main alarm
     * just fired. Called from AlarmReceiver right when the main alarm goes off - if the user
     * dismisses or snoozes (main or any backup) before one of these fires, cancelBackups()
     * cancels the rest. Silently does nothing if the alarm doesn't have backups enabled.
     */
    public static void scheduleBackups(Context ctx, AlarmData alarm, long firedAtMillis) {
        if (!alarm.backupEnabled) return;
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        for (int i = 0; i < BACKUP_OFFSETS_MS.length; i++) {
            int backupIndex = i + 1;
            long triggerAt = firedAtMillis + BACKUP_OFFSETS_MS[i];

            Intent showIntent = new Intent(ctx, com.syhuinc.omnihub.MainActivity.class);
            PendingIntent showPi = PendingIntent.getActivity(
                    ctx, backupRequestCode(alarm.id, backupIndex, "show"), showIntent, flags);

            try {
                am.setAlarmClock(
                        new AlarmManager.AlarmClockInfo(triggerAt, showPi),
                        backupPendingIntent(ctx, alarm.id, backupIndex, flags));
            } catch (SecurityException ignored) {
                // Missing SCHEDULE_EXACT_ALARM - skip remaining backups too, nothing more we can do.
                return;
            }
        }
    }

    /** Cancels any pending backup rings for this alarm. Safe to call even if none are armed. */
    public static void cancelBackups(Context ctx, String alarmId) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        for (int backupIndex = 1; backupIndex <= BACKUP_OFFSETS_MS.length; backupIndex++) {
            am.cancel(backupPendingIntent(ctx, alarmId, backupIndex, flags));
        }
    }

    private static PendingIntent backupPendingIntent(Context ctx, String alarmId, int backupIndex, int flags) {
        Intent intent = new Intent(ctx, AlarmReceiver.class);
        intent.putExtra(EXTRA_ALARM_ID, alarmId);
        intent.putExtra(EXTRA_IS_BACKUP, true);
        intent.putExtra(EXTRA_BACKUP_INDEX, backupIndex);
        return PendingIntent.getBroadcast(ctx, backupRequestCode(alarmId, backupIndex, "fire"), intent, flags);
    }

    private static int backupRequestCode(String alarmId, int backupIndex, String kind) {
        return (alarmId + "::backup" + backupIndex + "::" + kind).hashCode();
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
