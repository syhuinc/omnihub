package com.syhuinc.omnihub;

import android.app.Application;

public class OmniHubApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        try {
            CrashLogger.install(this);
        } catch (Exception ignored) {
            // installing the crash logger must never itself prevent the app from starting
        }
    }
}
