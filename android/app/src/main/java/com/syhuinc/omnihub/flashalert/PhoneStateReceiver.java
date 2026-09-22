package com.syhuinc.omnihub.flashalert;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;

public class PhoneStateReceiver extends BroadcastReceiver {
    private static final long ON_MS = 400;
    private static final long OFF_MS = 400;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(intent.getAction())) return;
        if (!FlashAlertPrefs.isCallEnabled(context)) return;

        String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
        if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
            TorchBlinker.startContinuous(context, TorchBlinker.SOURCE_CALL, ON_MS, OFF_MS);
        } else {
            // OFFHOOK (answered) or IDLE (missed, ended or declined) - either way, stop blinking.
            TorchBlinker.stop(context, TorchBlinker.SOURCE_CALL);
        }
    }
}
