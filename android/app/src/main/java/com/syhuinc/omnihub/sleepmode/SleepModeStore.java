package com.syhuinc.omnihub.sleepmode;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** Native-owned persistence for Sleep Mode's single settings/state record, plus its session history. */
public class SleepModeStore {
    private static final String PREFS = "omnihub_sleep_mode";
    private static final String KEY_DATA = "data_json";
    private static final String KEY_HISTORY = "history_json";
    /** Roughly a season's worth of nights — plenty for the Week/Month/Year views, bounded in size. */
    private static final int MAX_HISTORY = 120;

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

    public static synchronized List<SleepSession> loadHistory(Context ctx) {
        List<SleepSession> result = new ArrayList<>();
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_HISTORY, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                result.add(SleepSession.fromJson(arr.getJSONObject(i)));
            }
        } catch (JSONException e) {
            // corrupted store — start fresh rather than crash
        }
        return result;
    }

    public static synchronized void appendSession(Context ctx, SleepSession session) {
        List<SleepSession> all = loadHistory(ctx);
        all.add(session);
        while (all.size() > MAX_HISTORY) {
            all.remove(0);
        }
        JSONArray arr = new JSONArray();
        try {
            for (SleepSession s : all) arr.put(s.toJson());
        } catch (JSONException ignored) {
        }
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_HISTORY, arr.toString()).apply();
    }
}
