package com.syhuinc.omnihub.alarm;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

/** Native-owned persistence for alarms (SharedPreferences JSON array), independent of the webview's localStorage. */
public class AlarmStore {
    private static final String PREFS = "omnihub_alarms";
    private static final String KEY_ALARMS = "alarms_json";

    public static synchronized List<AlarmData> loadAll(Context ctx) {
        List<AlarmData> result = new ArrayList<>();
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_ALARMS, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                result.add(AlarmData.fromJson(arr.getJSONObject(i)));
            }
        } catch (JSONException e) {
            // corrupted store — start fresh rather than crash
        }
        return result;
    }

    public static synchronized void saveAll(Context ctx, List<AlarmData> alarms) {
        JSONArray arr = new JSONArray();
        try {
            for (AlarmData a : alarms) {
                arr.put(a.toJson());
            }
        } catch (JSONException e) {
            // ignore malformed entry
        }
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_ALARMS, arr.toString()).apply();
    }

    public static synchronized AlarmData find(Context ctx, String id) {
        for (AlarmData a : loadAll(ctx)) {
            if (a.id.equals(id)) return a;
        }
        return null;
    }

    public static synchronized void upsert(Context ctx, AlarmData alarm) {
        List<AlarmData> all = loadAll(ctx);
        boolean found = false;
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).id.equals(alarm.id)) {
                all.set(i, alarm);
                found = true;
                break;
            }
        }
        if (!found) all.add(alarm);
        saveAll(ctx, all);
    }

    public static synchronized void remove(Context ctx, String id) {
        List<AlarmData> all = loadAll(ctx);
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).id.equals(id)) {
                all.remove(i);
                break;
            }
        }
        saveAll(ctx, all);
    }
}
