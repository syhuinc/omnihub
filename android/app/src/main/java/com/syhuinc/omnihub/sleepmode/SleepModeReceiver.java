package com.syhuinc.omnihub.sleepmode;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Fires on every Sleep Mode beat (the nightly bedtime kickoff, then every intervalMin after).
 * Never wakes the webview or JS — reads/writes native state directly so this works with the app
 * fully closed. Speaks only if the screen is currently on (PowerManager#isInteractive), which
 * needs no special permission and is the whole "still using the phone" signal: if the screen's
 * off, the beat is skipped silently and checked again next interval.
 */
public class SleepModeReceiver extends BroadcastReceiver {
    private static final int MAX_RECENT_KEYS = 10;

    @Override
    public void onReceive(Context context, Intent intent) {
        SleepModeData data = SleepModeStore.load(context);
        if (!data.enabled) return;

        String kind = intent.getStringExtra(SleepModeScheduler.EXTRA_KIND);
        long now = System.currentTimeMillis();

        if (SleepModeScheduler.KIND_BEDTIME.equals(kind)) {
            data.sessionStartMillis = now;
            data.nagCount = 0;
            data.recentKeysCsv = "";
        }

        long wakeMillis = SleepModeScheduler.wakeMillisForSession(data);
        if (now >= wakeMillis) {
            // Session's over — don't speak, just re-arm tomorrow's bedtime and stop this loop.
            SleepModeStore.save(context, data);
            SleepModeScheduler.armBedtime(context, data);
            return;
        }

        if (isScreenOn(context)) {
            speak(context, data);
        }

        SleepModeStore.save(context, data);
        long nextBeat = now + Math.max(1, data.intervalMin) * 60_000L;
        SleepModeScheduler.scheduleBeat(context, nextBeat);
    }

    private boolean isScreenOn(Context context) {
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isInteractive();
    }

    private void speak(Context context, SleepModeData data) {
        int tier = Math.min(data.nagCount, MessageBank.TIER_COUNT - 1);
        Set<String> recentKeys = new LinkedHashSet<>(Arrays.asList(data.recentKeysCsv.split(",")));

        MessageBank.Pick pick = MessageBank.pick(
                data.personality,
                tier,
                data.effectiveCallName(),
                data.effectiveHasWorkTomorrow(),
                formatWakeTime(data),
                recentKeys
        );

        Intent serviceIntent = new Intent(context, SleepModeSpeakService.class);
        serviceIntent.putExtra(SleepModeSpeakService.EXTRA_TEXT, pick.text);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        data.nagCount += 1;
        recentKeys.add(pick.key);
        while (recentKeys.size() > MAX_RECENT_KEYS) {
            recentKeys.remove(recentKeys.iterator().next());
        }
        data.recentKeysCsv = String.join(",", recentKeys);
    }

    private String formatWakeTime(SleepModeData data) {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, data.wakeHour);
        c.set(Calendar.MINUTE, data.wakeMinute);
        return new SimpleDateFormat("h:mm a", Locale.US).format(c.getTime());
    }
}
