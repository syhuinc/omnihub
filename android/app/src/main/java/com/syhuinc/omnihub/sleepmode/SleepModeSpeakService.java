package com.syhuinc.omnihub.sleepmode;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
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

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
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
 *
 * When EXTRA_AUDIO_RES_ID is set (a real recorded line exists for this personality/tier/index -
 * see SleepModeClipBank), plays that clip via MediaPlayer instead of synthesizing speech, falling
 * back to TTS if playback fails for any reason so a bad clip never means a silent nag.
 */
public class SleepModeSpeakService extends Service {
    public static final String EXTRA_TEXT = "text";
    public static final String EXTRA_FORCE_AUDIBLE = "forceAudible";
    public static final String EXTRA_AUDIO_RES_ID = "audioResId";
    public static final String EXTRA_PERSONALITY = "personality";

    private static final String TAG = "SleepModeSpeak";

    /** Matches PERSONALITY_META's emoji in the web layer (src/tools/sleep-mode/types.ts), so the
     *  notification's personality reads the same everywhere. */
    private static final Map<String, String> PERSONALITY_EMOJI = new HashMap<>();
    static {
        PERSONALITY_EMOJI.put("gentle", "🍃");
        PERSONALITY_EMOJI.put("friendly", "😊");
        PERSONALITY_EMOJI.put("teasing", "😆");
        PERSONALITY_EMOJI.put("strict", "🛡️");
        PERSONALITY_EMOJI.put("savage", "🔥");
    }
    private static final String DEFAULT_EMOJI = "🌙";

    // v3: channel importance is locked in at creation time and can't be raised by shipping a code
    // change alone -- devices that already have an earlier "omnihub_sleep_mode*" channel are stuck
    // at whatever importance it was first created with, so every importance bump needs a new id.
    // IMPORTANCE_DEFAULT (v2) still only posts silently to the shade/status bar -- it never pops up
    // as a heads-up banner. IMPORTANCE_HIGH is what actually produces the on-screen "pop up" this
    // was supposed to have from the start.
    private static final String CHANNEL_ID = "omnihub_sleep_mode_v3";
    private static final int NOTIFICATION_ID = 992;
    private static final String UTTERANCE_ID = "sleepmode_utterance";
    /** Safety net in case the TTS engine never reports completion for some reason. */
    private static final long MAX_SPEAK_MS = 20_000L;

    private TextToSpeech tts;
    private MediaPlayer mediaPlayer;
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
        int audioResId = intent != null ? intent.getIntExtra(EXTRA_AUDIO_RES_ID, 0) : 0;
        String personality = intent != null ? intent.getStringExtra(EXTRA_PERSONALITY) : null;
        if (text == null || text.isEmpty()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        try {
            startForegroundWithNotification(text, personality);
            acquireWakeLock();
        } catch (Throwable t) {
            Log.e(TAG, "Failed to start foreground notification, stopping", t);
            stopSelf();
            return START_NOT_STICKY;
        }

        try {
            if (audioResId == 0 || !playClip(audioResId, forceAudible)) {
                speak(text, forceAudible);
            }
        } catch (Throwable t) {
            // Whatever this is, the notification is already up -- never let a problem in audio
            // playback take the whole service (and app) down with it. Worst case: a silent nag.
            Log.e(TAG, "Speaking/playback failed", t);
        }

        safetyHandler.removeCallbacks(safetyStop);
        safetyHandler.postDelayed(safetyStop, MAX_SPEAK_MS);

        return START_NOT_STICKY;
    }

    /** Returns false (nothing started) if the clip couldn't be created/played, so the caller can
     *  fall back to on-device TTS instead of the nag silently doing nothing. */
    private boolean playClip(int resId, boolean forceAudible) {
        try {
            mediaPlayer = MediaPlayer.create(this, resId);
            if (mediaPlayer == null) return false;
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(forceAudible ? AudioAttributes.USAGE_MEDIA : AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
            mediaPlayer.setOnCompletionListener(mp -> stopSelf());
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                stopSelf();
                return true;
            });
            mediaPlayer.start();
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Clip playback failed, falling back to TTS", e);
            releaseMediaPlayer();
            return false;
        }
    }

    private void releaseMediaPlayer() {
        if (mediaPlayer == null) return;
        try {
            mediaPlayer.release();
        } catch (Exception ignored) {
        }
        mediaPlayer = null;
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

    private void startForegroundWithNotification(String text, String personality) {
        String emoji = PERSONALITY_EMOJI.getOrDefault(personality, DEFAULT_EMOJI);
        String title = emoji + " Sleep Mode";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(text).setBigContentTitle(title))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setOngoing(false)
                .setAutoCancel(false)
                .addAction(android.R.drawable.ic_popup_reminder, "5 more minutes", actionPendingIntent(SleepModeReceiver.ACTION_SNOOZE))
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "I'm going to sleep", actionPendingIntent(SleepModeReceiver.ACTION_STOP_TONIGHT));

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
                        CHANNEL_ID, "Sleep Mode", NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("Sleep Mode's spoken bedtime reminders");
                // No channel sound -- the reminder's own recorded voice clip/TTS is the audio.
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
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
            } catch (Exception ignored) {
            }
            releaseMediaPlayer();
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
