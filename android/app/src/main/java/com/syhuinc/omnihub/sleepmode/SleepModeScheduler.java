package com.syhuinc.omnihub.sleepmode;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;

/**
 * Drives Sleep Mode's nightly loop with a single self-rescheduling exact alarm rather than a
 * long-lived service: one "bedtime" firing starts a session, then repeated "beat" firings (every
 * intervalMin) each decide whether to speak and reschedule the next beat, until wake time is
 * reached — at which point the loop stops and tomorrow's bedtime is armed instead. At most one
 * of these is ever pending, since REQUEST_CODE is fixed and every schedule() call replaces it.
 *
 * Uses AlarmManager.setAlarmClock() for the same reason the Alarm feature does: it's the API
 * built for user-facing wake behavior and survives Doze/battery-optimization more reliably
 * across OEMs than setExactAndAllowWhileIdle(), at the cost of showing the status-bar alarm-clock
 * icon while a check is pending — an acceptable, arguably clarifying, side effect here.
 */
public class SleepModeScheduler {
    public static final String EXTRA_KIND = "kind"; // "bedtime" | "beat"
    public static final String KIND_BEDTIME = "bedtime";
    public static final String KIND_BEAT = "beat";
    /** The morning wake-up runs on its own alarm (MORNING_REQUEST_CODE) so it never replaces, or is
     *  replaced by, the bedtime loop's single pending beat. */
    public static final String KIND_MORNING = "morning";
    public static final String KIND_MORNING_BEAT = "morning_beat";

    private static final int REQUEST_CODE = "sleepmode_next".hashCode();
    private static final int MORNING_REQUEST_CODE = "sleepmode_morning".hashCode();

    public static boolean canScheduleExactAlarms(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    /** Arms tonight's (or tomorrow's, if already past) bedtime firing. Cancels any pending beat. */
    public static boolean armBedtime(Context ctx, SleepModeData data) {
        if (!data.enabled) return false;
        return scheduleAt(ctx, nextBedtimeTriggerMillis(data), KIND_BEDTIME);
    }

    public static boolean scheduleBeat(Context ctx, long triggerAtMillis) {
        return scheduleAt(ctx, triggerAtMillis, KIND_BEAT);
    }

    /** Arms the next morning wake-up at the next occurrence of the wake time, if turned on. */
    public static boolean armMorning(Context ctx, SleepModeData data) {
        if (!data.enabled || !data.wakeUpEnabled) {
            disarmMorning(ctx);
            return false;
        }
        return scheduleAt(ctx, nextWakeTriggerMillis(data), KIND_MORNING, MORNING_REQUEST_CODE);
    }

    public static boolean scheduleMorningBeat(Context ctx, long triggerAtMillis) {
        return scheduleAt(ctx, triggerAtMillis, KIND_MORNING_BEAT, MORNING_REQUEST_CODE);
    }

    public static void disarmMorning(Context ctx) {
        cancel(ctx, MORNING_REQUEST_CODE);
    }

    private static boolean scheduleAt(Context ctx, long triggerAtMillis, String kind) {
        return scheduleAt(ctx, triggerAtMillis, kind, REQUEST_CODE);
    }

    private static boolean scheduleAt(Context ctx, long triggerAtMillis, String kind, int requestCode) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;

        Intent intent = new Intent(ctx, SleepModeReceiver.class);
        intent.putExtra(EXTRA_KIND, kind);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(ctx, requestCode, intent, flags);

        Intent showIntent = new Intent(ctx, com.syhuinc.omnihub.MainActivity.class);
        PendingIntent showPi = PendingIntent.getActivity(ctx, requestCode, showIntent, flags);

        try {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAtMillis, showPi), pi);
            return true;
        } catch (SecurityException e) {
            // Missing SCHEDULE_EXACT_ALARM — never let this crash a receiver/service thread.
            return false;
        }
    }

    public static void disarm(Context ctx) {
        cancel(ctx, REQUEST_CODE);
    }

    private static void cancel(Context ctx, int requestCode) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent intent = new Intent(ctx, SleepModeReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        am.cancel(PendingIntent.getBroadcast(ctx, requestCode, intent, flags));
    }

    /** The next wake time strictly after now. */
    public static long nextWakeTriggerMillis(SleepModeData data) {
        Calendar now = Calendar.getInstance();
        Calendar candidate = (Calendar) now.clone();
        candidate.set(Calendar.HOUR_OF_DAY, data.wakeHour);
        candidate.set(Calendar.MINUTE, data.wakeMinute);
        candidate.set(Calendar.SECOND, 0);
        candidate.set(Calendar.MILLISECOND, 0);
        if (!candidate.after(now)) {
            candidate.add(Calendar.DAY_OF_YEAR, 1);
        }
        return candidate.getTimeInMillis();
    }

    public static long nextBedtimeTriggerMillis(SleepModeData data) {
        Calendar now = Calendar.getInstance();
        Calendar candidate = (Calendar) now.clone();
        candidate.set(Calendar.HOUR_OF_DAY, data.bedtimeHour);
        candidate.set(Calendar.MINUTE, data.bedtimeMinute);
        candidate.set(Calendar.SECOND, 0);
        candidate.set(Calendar.MILLISECOND, 0);
        if (!candidate.after(now)) {
            candidate.add(Calendar.DAY_OF_YEAR, 1);
        }
        return candidate.getTimeInMillis();
    }

    /** The wake timestamp for the session that started at data.sessionStartMillis. */
    public static long wakeMillisForSession(SleepModeData data) {
        Calendar wake = Calendar.getInstance();
        wake.setTimeInMillis(data.sessionStartMillis);
        wake.set(Calendar.HOUR_OF_DAY, data.wakeHour);
        wake.set(Calendar.MINUTE, data.wakeMinute);
        wake.set(Calendar.SECOND, 0);
        wake.set(Calendar.MILLISECOND, 0);
        if (wake.getTimeInMillis() <= data.sessionStartMillis) {
            wake.add(Calendar.DAY_OF_YEAR, 1);
        }
        return wake.getTimeInMillis();
    }
}
