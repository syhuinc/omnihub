package com.syhuinc.omnihub;

import android.os.Bundle;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import com.syhuinc.omnihub.alarm.AlarmPlugin;
import com.syhuinc.omnihub.devicestats.DeviceStatsPlugin;
import com.syhuinc.omnihub.flashalert.FlashAlertPlugin;
import com.syhuinc.omnihub.ringtone.RingtonePlugin;
import com.syhuinc.omnihub.sleepmode.SleepModePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        registerPlugin(FlashAlertPlugin.class);
        registerPlugin(SleepModePlugin.class);
        registerPlugin(DeviceStatsPlugin.class);
        registerPlugin(RingtonePlugin.class);
        super.onCreate(savedInstanceState);

        // Capacitor's own BridgeWebViewClient.onRenderProcessGone() returns false (meaning "not
        // handled") whenever nothing here overrides it - and per the WebViewClient contract,
        // returning false tells Android the app hasn't recovered, so the system kills the whole
        // app process outright rather than just the dead renderer. That's exactly the fatal,
        // unrecoverable crash automated testing caught: WebView renderer dies -> blank white ->
        // whole app aborts. Recreating the activity gives it a fresh WebView and keeps the app
        // alive through what would otherwise always be a hard, unrecoverable crash.
        this.bridge.addWebViewListener(new WebViewListener() {
            @Override
            public boolean onRenderProcessGone(WebView webView, RenderProcessGoneDetail detail) {
                runOnUiThread(MainActivity.this::recreate);
                return true;
            }
        });
    }
}
