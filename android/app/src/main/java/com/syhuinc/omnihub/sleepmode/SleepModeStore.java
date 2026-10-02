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

    /**
     * Stores a freshly-generated AI reminder pool for one personality, as raw JSON in the shape
     * {"tiers": [[...4 arrays of strings...]], "generatedAt": <millis>} — exactly what the
     * generateSleepReminders Cloud Function returns (plus generatedAt attached by the caller).
     * Stored as-is; only parsed back out (and validated) by loadAiMessages, so a malformed write
     * here just means loadAiMessages returns null later rather than crashing anything.
     */
    public static synchronized void saveAiMessages(Context ctx, String personality, String tiersJson) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(aiMessagesKey(personality), tiersJson).apply();
    }

    /**
     * Returns the cached AI-generated pool for this personality as [tier][line], or null if
     * nothing is cached or the cached JSON doesn't parse into exactly MessageBank.TIER_COUNT
     * tiers. Never throws — a corrupted/unexpected cache just means "no AI pool right now",
     * same as if generation had never run.
     */
    public static synchronized String[][] loadAiMessages(Context ctx, String personality) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(aiMessagesKey(personality), null);
        if (raw == null) return null;
        try {
            JSONObject obj = new JSONObject(raw);
            JSONArray tiersArr = obj.getJSONArray("tiers");
            if (tiersArr.length() != MessageBank.TIER_COUNT) return null;
            String[][] result = new String[MessageBank.TIER_COUNT][];
            for (int t = 0; t < MessageBank.TIER_COUNT; t++) {
                JSONArray lineArr = tiersArr.getJSONArray(t);
                String[] lines = new String[lineArr.length()];
                for (int i = 0; i < lineArr.length(); i++) lines[i] = lineArr.getString(i);
                result[t] = lines;
            }
            return result;
        } catch (JSONException e) {
            return null;
        }
    }

    /** millis the AI pool for this personality was generated, or 0 if none is cached. */
    public static synchronized long loadAiMessagesGeneratedAt(Context ctx, String personality) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(aiMessagesKey(personality), null);
        if (raw == null) return 0;
        try {
            return new JSONObject(raw).optLong("generatedAt", 0);
        } catch (JSONException e) {
            return 0;
        }
    }

    private static String aiMessagesKey(String personality) {
        return "ai_messages_" + personality;
    }

    /**
     * Writes one real-voice (Gemini TTS) WAV clip for a personality/tier's AI-pool line 0 — the
     * only line in the pool actually synthesized server-side (see generateSleepReminders).
     * Overwrites any previous clip for this personality/tier. Internal app storage, not res/raw,
     * since this is downloaded at runtime rather than baked into the APK — see
     * SleepModeAiClipBank for the read side.
     */
    public static synchronized void saveAiAudioClip(Context ctx, String personality, int tier, byte[] wavBytes) {
        java.io.File dir = new java.io.File(ctx.getFilesDir(), "sleep_ai_audio");
        if (!dir.exists() && !dir.mkdirs()) return;
        java.io.File out = new java.io.File(dir, personality + "_tier" + tier + ".wav");
        try (java.io.FileOutputStream fos = new java.io.FileOutputStream(out)) {
            fos.write(wavBytes);
        } catch (java.io.IOException ignored) {
            // best-effort — a missing clip just means this tier falls back to on-device TTS
        }
    }
}
