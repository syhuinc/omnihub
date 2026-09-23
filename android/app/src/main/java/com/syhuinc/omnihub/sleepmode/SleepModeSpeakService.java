package com.syhuinc.omnihub.sleepmode;

import android.app.NotificationChannel;
import android.app.NotificationManager;
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

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/**
 * Speaks one short Sleep Mode reminder line through Android's built-in TextToSpeech engine, as a
 * brief foreground service (required to reliably play audio from a background-triggered
 * receiver), then stops itself. Deliberately uses USAGE_NOTIFICATION_EVENT rather than
 * USAGE_ALARM: this is a nudge, not an emergency wake-up, so it plays at the phone's normal
 * notification volume and is silenced by Do Not Disturb like any other notification sound would be.
 */
public class SleepModeSpeakService extends Service {
    public static final String EXTRA_TEXT = "text";

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
        if (text == null || text.isEmpty()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        startForegroundWithNotification();
        acquireWakeLock();
        speak(text);

        safetyHandler.removeCallbacks(safetyStop);
        safetyHandler.postDelayed(safetyStop, MAX_SPEAK_MS);

        return START_NOT_STICKY;
    }

    private void speak(String text) {
        tts = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS || tts == null) {
                stopSelf();
                return;
            }
            tts.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
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

    private void startForegroundWithNotification() {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Sleep Mode")
                .setContentText("Reminding you it's time to sleep")
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setOngoing(true)
                .setAutoCancel(false);

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
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
