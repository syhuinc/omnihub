package com.syhuinc.omnihub.sleepmode;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import java.util.Locale;
import java.util.Set;

/**
 * Speaks one short Sleep Mode reminder line through Android's built-in TextToSpeech engine, as a
 * brief foreground service (required to reliably play audio from a background-triggered
 * receiver), then stops itself.
 *
 * The real, automatic nightly nag plays on USAGE_NOTIFICATION_EVENT rather than USAGE_ALARM:
 * it's a nudge, not an emergency wake-up, so it respects the phone's notification volume and Do
 * Not Disturb like any other notification sound would. EXTRA_FORCE_AUDIBLE is the one exception -
 * the settings screen's "Hear a sample" button sets it so a reminder you explicitly asked to hear
 * right now, while looking at the app, always plays on the media stream instead. Otherwise a
 * muted notification channel or DND would make the preview silently do nothing, which looks like
 * a bug rather than the DND-respecting behavior working as intended.
 */
public class SleepModeSpeakService extends Service {
    public static final String EXTRA_TEXT = "text";
    public static final String EXTRA_FORCE_AUDIBLE = "forceAudible";

    private static final String TAG = "SleepModeSpeak";

    private static final String CHANNEL_ID = "omnihub_sleep_mode";
    private static final int NOTIFICATION_ID = 992;
    private static final String UTTERANCE_ID = "sleepmode_utterance";
    /** Safety net in case the TTS engine never reports completion for some reason. */
    private static final long MAX_SPEAK_MS = 20_000L;

    private TextToSpeech tts;
    private PowerManager.WakeLock wakeLock;
    private final Handler safetyHandler = new Handler(Looper.getMainLooper());
    private final Runnable safetyStop = this::stopSelf;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String text = intent != null ? intent.getStringExtra(EXTRA_TEXT) : null;
        boolean forceAudible = intent != null && intent.getBooleanExtra(EXTRA_FORCE_AUDIBLE, false);
        if (text == null || text.isEmpty()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        startForegroundWithNotification();
        acquireWakeLock();
        speak(text, forceAudible);

        safetyHandler.removeCallbacks(safetyStop);
        safetyHandler.postDelayed(safetyStop, MAX_SPEAK_MS);

        return START_NOT_STICKY;
    }

    private void speak(String text, boolean forceAudible) {
        tts = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS || tts == null) {
                Log.w(TAG, "TextToSpeech init failed (status=" + status + ")");
                stopSelf();
                return;
            }

            Locale activeLocale = Locale.getDefault();
            int langResult = tts.setLanguage(activeLocale);
            if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                // Fall back to US English before giving up entirely - most devices have this
                // voice installed even when the device's own locale's voice data isn't.
                activeLocale = Locale.US;
                langResult = tts.setLanguage(activeLocale);
            }
            if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.w(TAG, "No usable TTS voice/language available (result=" + langResult + ")");
                stopSelf();
                return;
            }

            selectBestOfflineVoice(activeLocale);
            // A hair slower than the engine default so lines land more like a spoken nudge than a
            // screen reader rattling off text - most complaints about TTS "sounding robotic" are
            // really about the default rate being a little too brisk and flat.
            tts.setSpeechRate(0.92f);

            tts.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(forceAudible ? AudioAttributes.USAGE_MEDIA : AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {}

                @Override
                public void onDone(String utteranceId) {
                    stopSelf();
                }

                @Override
                public void onError(String utteranceId) {
                    stopSelf();
                }

                @Override
                public void onError(String utteranceId, int errorCode) {
                    stopSelf();
                }
            });
            Bundle params = new Bundle();
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, UTTERANCE_ID);
        });
    }

    /**
     * setLanguage() alone often lands on the engine's lowest-latency voice rather than its best
     * one, which is the biggest reason TTS output can sound flat/robotic. Pick the
     * highest-quality voice for the active language that doesn't require a network connection -
     * reminders fire on a schedule with no guarantee of connectivity, so an offline voice that
     * always works beats a nicer one that might silently fail to speak at all.
     */
    private void selectBestOfflineVoice(Locale locale) {
        if (tts == null) return;
        try {
            Set<Voice> voices = tts.getVoices();
            if (voices == null) return;
            Voice best = null;
            for (Voice v : voices) {
                if (v.isNetworkConnectionRequired()) continue;
                if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                if (!v.getLocale().getLanguage().equals(locale.getLanguage())) continue;
                if (best == null || v.getQuality() > best.getQuality()) best = v;
            }
            if (best != null) tts.setVoice(best);
        } catch (Exception e) {
            // Some engines throw on getVoices()/setVoice() in odd states - the language-only
            // selection from setLanguage() is a perfectly fine fallback if this fails.
            Log.w(TAG, "Voice selection failed, keeping engine default", e);
        }
    }

    private void startForegroundWithNotification() {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Sleep Mode")
                .setContentText("Reminding you it's time to sleep")
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setOngoing(false)
                .setAutoCancel(false)
                .addAction(android.R.drawable.ic_popup_reminder, "Snooze 1h", actionPendingIntent(SleepModeReceiver.ACTION_SNOOZE))
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop for tonight", actionPendingIntent(SleepModeReceiver.ACTION_STOP_TONIGHT));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceCompat.startForeground(
                    this,
                    NOTIFICATION_ID,
                    builder.build(),
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, builder.build());
        }
    }

    private PendingIntent actionPendingIntent(String action) {
        Intent intent = new Intent(this, SleepModeReceiver.class).setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(this, action.hashCode(), intent, flags);
    }

    /** Dismisses the lingering reminder notification once Snooze/Stop for tonight has been tapped. */
    public static void clearNotification(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIFICATION_ID);
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID, "Sleep Mode", NotificationManager.IMPORTANCE_LOW);
                channel.setDescription("Sleep Mode's spoken bedtime reminders");
                channel.setSound(null, null);
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null) return;
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "OmniHub:SleepModeSpeakWakeLock");
        wakeLock.acquire(MAX_SPEAK_MS + 5_000L);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        safetyHandler.removeCallbacks(safetyStop);
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception ignored) {
            }
            tts = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        // DETACH, not REMOVE: leaves the notification (with its Snooze / Stop for tonight actions)
        // up after speaking finishes, since that's the only realistic window to tap them in.
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_DETACH);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
