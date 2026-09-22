package com.syhuinc.omnihub;

import android.app.Application;

public class OmniHubApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        CrashLogger.install(this);
    }
}
