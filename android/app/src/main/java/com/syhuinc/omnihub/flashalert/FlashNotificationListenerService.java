package com.syhuinc.omnihub.flashalert;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

public class FlashNotificationListenerService extends NotificationListenerService {
    private static final int BLINK_TIMES = 3;
    private static final long ON_MS = 250;
    private static final long OFF_MS = 200;

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);
        if (sbn == null) return;
        // Ignore our own notifications (e.g. the alarm-ringing one, already handled separately).
        if (getPackageName().equals(sbn.getPackageName())) return;
        if (!FlashAlertPrefs.isNotificationEnabled(this)) return;
        TorchBlinker.blink(this, TorchBlinker.SOURCE_NOTIFICATION, BLINK_TIMES, ON_MS, OFF_MS);
    }
}
