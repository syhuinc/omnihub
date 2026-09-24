package com.syhuinc.omnihub;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.syhuinc.omnihub.alarm.AlarmPlugin;
import com.syhuinc.omnihub.devicestats.DeviceStatsPlugin;
import com.syhuinc.omnihub.flashalert.FlashAlertPlugin;
import com.syhuinc.omnihub.sleepmode.SleepModePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        registerPlugin(FlashAlertPlugin.class);
        registerPlugin(SleepModePlugin.class);
        registerPlugin(DeviceStatsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
