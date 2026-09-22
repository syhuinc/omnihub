package com.syhuinc.omnihub;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.syhuinc.omnihub.alarm.AlarmPlugin;
import com.syhuinc.omnihub.flashalert.FlashAlertPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        registerPlugin(FlashAlertPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
