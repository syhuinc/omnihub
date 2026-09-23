package com.syhuinc.omnihub.sleepmode;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

/** Native-owned persistence for Sleep Mode's single settings/state record. */
public class SleepModeStore {
    private static final String PREFS = "omnihub_sleep_mode";
    private static final String KEY_DATA = "data_json";

    public static synchronized SleepModeData load(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_DATA, null);
        if (raw == null) return new SleepModeData();
        try {
            return SleepModeData.fromJson(new JSONObject(raw));
        } catch (JSONException e) {
            return new SleepModeData();
        }
    }

    public static synchronized void save(Context ctx, SleepModeData data) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        try {
            prefs.edit().putString(KEY_DATA, data.toJson().toString()).apply();
        } catch (JSONException ignored) {
            // shouldn't happen — toJson() never throws for well-formed data
        }
    }
}
