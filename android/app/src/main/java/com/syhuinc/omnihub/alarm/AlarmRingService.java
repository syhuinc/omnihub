package com.syhuinc.omnihub.alarm;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

public class AlarmRingService extends Service {
    private static final String CHANNEL_ID = "omnihub_alarm_ring";
    private static final int NOTIFICATION_ID = 991;

    private static AlarmRingService activeInstance;

    private Ringtone ringtone;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private String currentAlarmId;

    public static void stopRinging(Context ctx) {
        ctx.stopService(new Intent(ctx, AlarmRingService.class));
    }

    public static String getRingingAlarmId() {
        return activeInstance != null ? activeInstance.currentAlarmId : null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        activeInstance = this;
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String alarmId = intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) : null;
        currentAlarmId = alarmId;
        AlarmData alarm = alarmId != null ? AlarmStore.find(this, alarmId) : null;

        startForegroundWithNotification(alarm);
        acquireWakeLock();
        startRingtone(alarm);
        startVibration();

        return START_NOT_STICKY;
    }

    private void startForegroundWithNotification(AlarmData alarm) {
        Intent fullScreenIntent = new Intent(this, AlarmRingingActivity.class);
        fullScreenIntent.putExtra(AlarmScheduler.EXTRA_ALARM_ID, currentAlarmId);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent fullScreenPi = PendingIntent.getActivity(this, 0, fullScreenIntent, flags);

        String label = alarm != null && alarm.label != null && !alarm.label.isEmpty() ? alarm.label : "Alarm";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(label)
                .setContentText("Tap to open")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(fullScreenPi, true)
                .setContentIntent(fullScreenPi)
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
                        CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("Omni Hub alarm notifications");
                channel.setSound(null, null); // service plays the ringtone itself, looped
                channel.enableVibration(false); // service handles vibration itself
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null) return;
        wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK, "OmniHub:AlarmRingWakeLock");
        wakeLock.acquire(10 * 60 * 1000L); // safety cap: 10 min
    }

    private void startRingtone(AlarmData alarm) {
        Uri soundUri = null;
        if (alarm != null && alarm.soundUri != null && !alarm.soundUri.isEmpty()) {
            try {
                soundUri = Uri.parse(alarm.soundUri);
            } catch (Exception ignored) {
            }
        }
        if (soundUri == null) {
            soundUri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
        }
        if (soundUri == null) {
            soundUri = RingtoneManager.getValidRingtoneUri(this);
        }
        if (soundUri == null) return;

        try {
            ringtone = RingtoneManager.getRingtone(this, soundUri);
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    ringtone.setAudioAttributes(new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build());
                } else {
                    ringtone.setStreamType(AudioManager.STREAM_ALARM);
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ringtone.setLooping(true);
                }
                ringtone.play();
            }
        } catch (Exception ignored) {
            // some devices/URIs can throw; ringing still shows the full-screen UI even without sound
        }
    }

    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = {0, 500, 500};
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (activeInstance == this) activeInstance = null;
        currentAlarmId = null;
        if (ringtone != null && ringtone.isPlaying()) ringtone.stop();
        ringtone = null;
        if (vibrator != null) vibrator.cancel();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
