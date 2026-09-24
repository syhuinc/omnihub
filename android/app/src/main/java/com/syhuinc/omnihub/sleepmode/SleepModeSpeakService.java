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
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import com.syhuinc.omnihub.R;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    /** One matching cat expression per personality for the notification's banner art. */
    private static final Map<String, Integer> PERSONALITY_BANNER = new HashMap<>();
    static {
        PERSONALITY_BANNER.put("gentle", R.drawable.sleep_notification_banner_gentle);
        PERSONALITY_BANNER.put("friendly", R.drawable.sleep_notification_banner_friendly);
        PERSONALITY_BANNER.put("teasing", R.drawable.sleep_notification_banner_teasing);
        PERSONALITY_BANNER.put("strict", R.drawable.sleep_notification_banner_strict);
        PERSONALITY_BANNER.put("savage", R.drawable.sleep_notification_banner_savage);
    }
    private static final int DEFAULT_BANNER = R.drawable.sleep_notification_banner;

    private static final String CHANNEL_ID = "omnihub_sleep_mode";
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

        startForegroundWithNotification(text, personality);
        acquireWakeLock();
        if (audioResId == 0 || !playClip(audioResId, forceAudible)) {
            speak(text, forceAudible);
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

    /** Splits a MessageBank line into a short headline (first sentence) plus the rest as detail,
     *  matching the card's headline/body split -- e.g. "It's time to sleep. Good night!" becomes
     *  headline "It's time to sleep." and body "Good night!". Falls back to using the whole line
     *  as the headline with no body if there's no natural split point. */
    private String[] splitHeadlineAndBody(String text) {
        Matcher m = Pattern.compile("^(.+?[.!?])\\s+(.+)$").matcher(text);
        if (m.matches()) {
            return new String[] { m.group(1), m.group(2) };
        }
        return new String[] { text, null };
    }

    private void startForegroundWithNotification(String text, String personality) {
        String emoji = PERSONALITY_EMOJI.getOrDefault(personality, DEFAULT_EMOJI);
        String[] parts = splitHeadlineAndBody(text);
        String headline = parts[0];
        String body = parts[1];

        RemoteViews collapsed = new RemoteViews(getPackageName(), R.layout.notification_sleep_mode_collapsed);
        collapsed.setTextViewText(R.id.notif_emoji, emoji);
        collapsed.setTextViewText(R.id.notif_headline, headline);
        if (body != null) {
            collapsed.setTextViewText(R.id.notif_body, body);
            collapsed.setViewVisibility(R.id.notif_body, android.view.View.VISIBLE);
        } else {
            collapsed.setViewVisibility(R.id.notif_body, android.view.View.GONE);
        }

        RemoteViews expanded = new RemoteViews(getPackageName(), R.layout.notification_sleep_mode_expanded);
        expanded.setImageViewResource(R.id.notif_banner, PERSONALITY_BANNER.getOrDefault(personality, DEFAULT_BANNER));
        expanded.setTextViewText(R.id.notif_emoji_big, emoji);
        expanded.setTextViewText(R.id.notif_headline_big, headline);
        if (body != null) {
            expanded.setTextViewText(R.id.notif_body_big, body);
            expanded.setViewVisibility(R.id.notif_body_big, android.view.View.VISIBLE);
        } else {
            expanded.setViewVisibility(R.id.notif_body_big, android.view.View.GONE);
        }
        expanded.setOnClickPendingIntent(R.id.notif_btn_primary, actionPendingIntent(SleepModeReceiver.ACTION_STOP_TONIGHT));
        expanded.setOnClickPendingIntent(R.id.notif_btn_secondary, actionPendingIntent(SleepModeReceiver.ACTION_SNOOZE));

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(emoji + " Sleep Mode")
                .setContentText(headline)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setCustomContentView(collapsed)
                .setCustomBigContentView(expanded)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setOngoing(false)
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
