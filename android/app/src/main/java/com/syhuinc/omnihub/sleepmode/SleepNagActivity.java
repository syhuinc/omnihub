package com.syhuinc.omnihub.sleepmode;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;

import com.syhuinc.omnihub.R;

/**
 * The full-screen "nag card" shown on top of whatever's on screen for a Sleep Mode reminder -
 * the richer, illustrated companion to the always-on heads-up notification SleepModeSpeakService
 * already posts (which stays as the reliable fallback: this activity is reached either
 * automatically, via the notification's full-screen intent, when the OS allows it, or by tapping
 * that notification when it doesn't).
 *
 * Deliberately NOT a RemoteViews-based notification like the version that used to crash the app
 * (see SleepModeSpeakService's notification history) - a real Activity can inflate any layout
 * complexity fine, since RemoteViews' cross-process view/bitmap restrictions never apply here.
 *
 * Auto-dismisses on its own after a few seconds so a nudge never gets stuck on screen, but any
 * tap (a button, or the close X) - or the back gesture - ends it immediately instead.
 */
public class SleepNagActivity extends Activity {
    public static final String EXTRA_TEXT = "text";
    public static final String EXTRA_PERSONALITY = "personality";

    /** Long enough to read a short reminder line, short enough to never feel stuck. */
    private static final long AUTO_DISMISS_MS = 8_000L;

    private final Handler autoDismissHandler = new Handler(Looper.getMainLooper());
    private final Runnable autoDismiss = this::finish;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showOverLockScreen();
        setContentView(R.layout.activity_sleep_nag);

        String text = getIntent().getStringExtra(EXTRA_TEXT);
        String personality = getIntent().getStringExtra(EXTRA_PERSONALITY);

        TextView bodyText = findViewById(R.id.nag_body);
        if (text != null && !text.isEmpty()) bodyText.setText(text);

        ImageView illustration = findViewById(R.id.nag_illustration);
        illustration.setImageResource(bannerResFor(personality));

        TextView closeButton = findViewById(R.id.nag_close);
        TextView primaryButton = findViewById(R.id.nag_btn_primary);
        TextView secondaryButton = findViewById(R.id.nag_btn_secondary);

        closeButton.setOnClickListener(v -> finish());
        primaryButton.setOnClickListener(v -> {
            sendToReceiver(SleepModeReceiver.ACTION_STOP_TONIGHT);
            finish();
        });
        secondaryButton.setOnClickListener(v -> {
            sendToReceiver(SleepModeReceiver.ACTION_SNOOZE);
            finish();
        });

        autoDismissHandler.postDelayed(autoDismiss, AUTO_DISMISS_MS);
    }

    private int bannerResFor(String personality) {
        String name = "friendly".equals(personality)
                ? "sleep_notification_banner_friendly"
                : "sleep_notification_banner_gentle";
        int resId = getResources().getIdentifier(name, "drawable", getPackageName());
        return resId != 0 ? resId : android.R.drawable.ic_menu_myplaces;
    }

    private void sendToReceiver(String action) {
        Intent intent = new Intent(this, SleepModeReceiver.class).setAction(action);
        sendBroadcast(intent);
    }

    private void showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }

    @Override
    public void onBackPressed() {
        // Unlike the alarm ringer, this is a gentle nudge, not a mandatory wake-up - dismissing
        // it should feel exactly like swiping the notification away, not be blocked.
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        autoDismissHandler.removeCallbacks(autoDismiss);
    }
}
