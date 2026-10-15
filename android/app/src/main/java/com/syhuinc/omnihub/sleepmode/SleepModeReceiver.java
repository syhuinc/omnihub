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

    public static final String ACTION_SNOOZE = "com.syhuinc.omnihub.sleepmode.SNOOZE";
    public static final String ACTION_STOP_TONIGHT = "com.syhuinc.omnihub.sleepmode.STOP_TONIGHT";
    /** "I'm up" on the morning wake-up: ends this morning's nudges and arms tomorrow's. */
    public static final String ACTION_IM_UP = "com.syhuinc.omnihub.sleepmode.IM_UP";
    /** Plays one morning wake-up line right now, from the app's "Try wake-up" button. */
    public static final String ACTION_TEST_MORNING = "com.syhuinc.omnihub.sleepmode.TEST_MORNING";
    /** Matches the notification's "5 more minutes" button label. */
    private static final long SNOOZE_MS = 5 * 60_000L;
    /** Morning nudges repeat this often until "I'm up", up to MORNING_MAX_NUDGES (~16 minutes). */
    private static final long MORNING_REPEAT_MS = 2 * 60_000L;
    private static final int MORNING_MAX_NUDGES = 8;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (ACTION_SNOOZE.equals(action)) {
            snooze(context);
            return;
        }
        if (ACTION_IM_UP.equals(action)) {
            SleepModeData data = SleepModeStore.load(context);
            data.morningActive = false;
            data.morningCount = 0;
            SleepModeStore.save(context, data);
            SleepModeSpeakService.clearNotification(context);
            context.stopService(new Intent(context, SleepModeSpeakService.class));
            SleepModeScheduler.armMorning(context, data);
            return;
        }
        if (ACTION_TEST_MORNING.equals(action)) {
            SleepModeData data = SleepModeStore.load(context);
            speakMorning(context, data, 0);
            SleepModeStore.save(context, data);
            return;
        }
        if (ACTION_STOP_TONIGHT.equals(action)) {
            SleepModeData data = SleepModeStore.load(context);
            mute(context, SleepModeScheduler.wakeMillisForSession(data));
            return;
        }

        SleepModeData data = SleepModeStore.load(context);
        if (!data.enabled) return;

        String kind = intent.getStringExtra(SleepModeScheduler.EXTRA_KIND);
        long now = System.currentTimeMillis();

        if (SleepModeScheduler.KIND_MORNING.equals(kind) || SleepModeScheduler.KIND_MORNING_BEAT.equals(kind)) {
            onMorning(context, data, SleepModeScheduler.KIND_MORNING.equals(kind));
            return;
        }

        if (SleepModeScheduler.KIND_BEDTIME.equals(kind)) {
            data.sessionStartMillis = now;
            data.nagCount = 0;
            data.recentKeysCsv = "";
            data.mutedUntilMillis = 0;
        }

        long wakeMillis = SleepModeScheduler.wakeMillisForSession(data);
        if (now >= wakeMillis) {
            // Session's over — record it for Sleep Insights, then re-arm tomorrow's bedtime.
            if (data.sessionStartMillis > 0) {
                SleepSession session = new SleepSession();
                session.bedtimeScheduledMillis = data.sessionStartMillis;
                session.wakeScheduledMillis = wakeMillis;
                session.lastNagMillis = data.lastNagMillis;
                session.nagCount = data.nagCount;
                SleepModeStore.appendSession(context, session);
            }
            SleepModeStore.save(context, data);
            SleepModeScheduler.armBedtime(context, data);
            return;
        }

        if (now >= data.mutedUntilMillis && isScreenOn(context)) {
            speak(context, data);
        }

        SleepModeStore.save(context, data);
        long nextBeat = now + Math.max(1, data.intervalMin) * 60_000L;
        SleepModeScheduler.scheduleBeat(context, nextBeat);
    }

    /**
     * Morning wake-up: the first firing (at wake time) starts it; each beat speaks the next nudge,
     * escalating through the three morning tiers, until "I'm up" or the last nudge. Speaks whether
     * or not the screen is on — unlike bedtime, the whole point here is to wake a sleeping person.
     */
    private void onMorning(Context context, SleepModeData data, boolean first) {
        if (!data.wakeUpEnabled) return;
        if (first) {
            data.morningActive = true;
            data.morningCount = 0;
        } else if (!data.morningActive) {
            return;
        }

        if (data.morningCount >= MORNING_MAX_NUDGES) {
            data.morningActive = false;
            data.morningCount = 0;
            SleepModeStore.save(context, data);
            SleepModeScheduler.armMorning(context, data);
            return;
        }

        int tier = data.morningCount < 2 ? 0 : data.morningCount < 5 ? 1 : 2;
        speakMorning(context, data, tier);
        data.morningCount += 1;
        SleepModeStore.save(context, data);
        SleepModeScheduler.scheduleMorningBeat(context, System.currentTimeMillis() + MORNING_REPEAT_MS);
    }

    private void speakMorning(Context context, SleepModeData data, int tier) {
        MessageBank.Pick pick = MessageBank.pickPhase(
                data.personality,
                MessageBank.Phase.MORNING,
                tier,
                SleepModeStore.loadAiMorning(context, data.personality, tier),
                recentKeys(data));
        startSpeaking(context, data, pick, SleepModeSpeakService.STYLE_MORNING);
        rememberKey(data, pick.key);
    }

    /**
     * "5 more minutes": replies in character right away, then brings the next nudge back exactly
     * when the five minutes are up (rather than at the next regular interval). Bedtime nudges keep
     * escalating since nagCount keeps climbing; a morning snooze resumes the morning sequence.
     */
    private void snooze(Context context) {
        SleepModeData data = SleepModeStore.load(context);
        long now = System.currentTimeMillis();
        long until = now + SNOOZE_MS;

        if (data.enabled && data.morningActive) {
            MessageBank.Pick pick = MessageBank.pickPhase(
                    data.personality, MessageBank.Phase.SNOOZE_MORNING, 0,
                    SleepModeStore.loadAiList(context, data.personality, "morningSnooze"), recentKeys(data));
            SleepModeSpeakService.clearNotification(context);
            startSpeaking(context, data, pick, SleepModeSpeakService.STYLE_REACTION);
            rememberKey(data, pick.key);
            SleepModeStore.save(context, data);
            SleepModeScheduler.scheduleMorningBeat(context, until);
            return;
        }

        boolean inSession = data.enabled && data.sessionStartMillis > 0
                && now < SleepModeScheduler.wakeMillisForSession(data);
        if (!inSession) {
            // A preview/test notification, or a session that already ended — just quiet it.
            mute(context, until);
            return;
        }

        MessageBank.Pick pick = MessageBank.pickPhase(
                data.personality, MessageBank.Phase.SNOOZE_NIGHT, 0,
                SleepModeStore.loadAiList(context, data.personality, "snooze"), recentKeys(data));
        SleepModeSpeakService.clearNotification(context);
        startSpeaking(context, data, pick, SleepModeSpeakService.STYLE_REACTION);
        rememberKey(data, pick.key);
        data.mutedUntilMillis = until;
        SleepModeStore.save(context, data);
        SleepModeScheduler.scheduleBeat(context, until);
    }

    private Set<String> recentKeys(SleepModeData data) {
        return new LinkedHashSet<>(Arrays.asList(data.recentKeysCsv.split(",")));
    }

    private void rememberKey(SleepModeData data, String key) {
        Set<String> recent = recentKeys(data);
        recent.add(key);
        while (recent.size() > MAX_RECENT_KEYS) {
            recent.remove(recent.iterator().next());
        }
        data.recentKeysCsv = String.join(",", recent);
    }

    /** Hands one picked line to the speaking service: a recorded clip if one exists, else on-device TTS. */
    private void startSpeaking(Context context, SleepModeData data, MessageBank.Pick pick, String style) {
        int clipResId = SleepModeClipBank.resIdFor(context, pick.key);
        String aiClipPath = clipResId == 0 ? SleepModeAiClipBank.filePathFor(context, pick.key) : null;

        Intent serviceIntent = new Intent(context, SleepModeSpeakService.class);
        serviceIntent.putExtra(SleepModeSpeakService.EXTRA_TEXT, pick.text);
        serviceIntent.putExtra(SleepModeSpeakService.EXTRA_PERSONALITY, data.personality);
        serviceIntent.putExtra(SleepModeSpeakService.EXTRA_STYLE, style);
        if (clipResId != 0) {
            serviceIntent.putExtra(SleepModeSpeakService.EXTRA_AUDIO_RES_ID, clipResId);
        } else if (aiClipPath != null) {
            serviceIntent.putExtra(SleepModeSpeakService.EXTRA_AUDIO_FILE_PATH, aiClipPath);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    /** Silences remaining beats until `untilMillis` and clears the reminder notification right away. */
    private void mute(Context context, long untilMillis) {
        SleepModeData data = SleepModeStore.load(context);
        data.mutedUntilMillis = untilMillis;
        SleepModeStore.save(context, data);
        SleepModeSpeakService.clearNotification(context);
    }

    private boolean isScreenOn(Context context) {
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isInteractive();
    }

    private void speak(Context context, SleepModeData data) {
        int tier = Math.min(data.nagCount, MessageBank.TIER_COUNT - 1);
        String[][] aiPool = SleepModeStore.loadAiMessages(context, data.personality);

        MessageBank.Pick pick = MessageBank.pick(
                data.personality,
                tier,
                data.effectiveCallName(),
                data.effectiveWorkSchoolRoutine() != null,
                data.effectiveInterests(),
                formatWakeTime(data),
                recentKeys(data),
                aiPool
        );
        startSpeaking(context, data, pick, SleepModeSpeakService.STYLE_NAG);

        data.nagCount += 1;
        data.lastNagMillis = System.currentTimeMillis();
        rememberKey(data, pick.key);
    }

    private String formatWakeTime(SleepModeData data) {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, data.wakeHour);
        c.set(Calendar.MINUTE, data.wakeMinute);
        return new SimpleDateFormat("h:mm a", Locale.US).format(c.getTime());
    }
}
