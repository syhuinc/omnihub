package com.syhuinc.omnihub.sleepmode;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Sleep Mode's settings plus its in-progress nightly state, persisted natively so the scheduler
 * and receiver can read/update it without the webview running. There is exactly one of these per
 * install (unlike alarms, Sleep Mode isn't a list) so it's stored as a single record.
 */
public class SleepModeData {
    public boolean enabled;
    public int bedtimeHour;
    public int bedtimeMinute;
    public int wakeHour;
    public int wakeMinute;
    public int intervalMin = 30;
    /** 0-100. Reminders always play on the alarm audio stream (bypasses ringer/silent/DND, same
     *  as any alarm clock) at this app-controlled level, rather than the phone's current
     *  notification/media volume — so Sleep Mode is reliably audible regardless of how the rest
     *  of the phone is set, and the user tunes it here instead of in system settings. */
    public int volumePercent = 85;
    // one of MessageBank.PERSONALITIES
    public String personality = "friendly";
    // "normal" | "personal"
    public String mode = "normal";

    // Personal Mode fields — all optional, only read when mode == "personal"
    public String callName; // what Sleep Mode should call the user
    public String workSchoolRoutine; // free text, e.g. "Morning shift (5AM - 3PM)"; non-empty = "has somewhere to be tomorrow"
    // "single" | "relationship" | "married" | "prefer-not"
    public String relationshipStatus;
    public String interests; // free text, e.g. "Manga, Music, Games"
    public String customNotes; // free text; stored for a future Sleep Mode AI pass, not yet used to alter messages

    // Nightly runtime state — reset each time a fresh bedtime session starts
    public long sessionStartMillis;
    public int nagCount;
    public long lastNagMillis; // 0 if never nagged this session
    public String recentKeysCsv = ""; // last few MessageBank pick keys, comma-joined, for anti-repeat
    /** Beats before this timestamp are skipped silently — set by the "Snooze"/"Stop for tonight" notification actions. 0 = not muted. */
    public long mutedUntilMillis;

    public SleepModeData() {}

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("enabled", enabled);
        o.put("bedtimeHour", bedtimeHour);
        o.put("bedtimeMinute", bedtimeMinute);
        o.put("wakeHour", wakeHour);
        o.put("wakeMinute", wakeMinute);
        o.put("intervalMin", intervalMin);
        o.put("volumePercent", volumePercent);
        o.put("personality", personality);
        o.put("mode", mode);
        o.put("callName", callName == null ? JSONObject.NULL : callName);
        o.put("workSchoolRoutine", workSchoolRoutine == null ? JSONObject.NULL : workSchoolRoutine);
        o.put("relationshipStatus", relationshipStatus == null ? JSONObject.NULL : relationshipStatus);
        o.put("interests", interests == null ? JSONObject.NULL : interests);
        o.put("customNotes", customNotes == null ? JSONObject.NULL : customNotes);
        o.put("sessionStartMillis", sessionStartMillis);
        o.put("nagCount", nagCount);
        o.put("lastNagMillis", lastNagMillis);
        o.put("recentKeysCsv", recentKeysCsv);
        o.put("mutedUntilMillis", mutedUntilMillis);
        return o;
    }

    public static SleepModeData fromJson(JSONObject o) throws JSONException {
        SleepModeData d = new SleepModeData();
        d.enabled = o.optBoolean("enabled", false);
        d.bedtimeHour = o.optInt("bedtimeHour", 22);
        d.bedtimeMinute = o.optInt("bedtimeMinute", 30);
        d.wakeHour = o.optInt("wakeHour", 7);
        d.wakeMinute = o.optInt("wakeMinute", 0);
        d.intervalMin = o.optInt("intervalMin", 30);
        d.volumePercent = o.optInt("volumePercent", 85);
        d.personality = o.optString("personality", "friendly");
        d.mode = o.optString("mode", "normal");
        d.callName = o.isNull("callName") ? null : o.optString("callName", null);
        d.workSchoolRoutine = o.isNull("workSchoolRoutine") ? null : o.optString("workSchoolRoutine", null);
        d.relationshipStatus = o.isNull("relationshipStatus") ? null : o.optString("relationshipStatus", null);
        d.interests = o.isNull("interests") ? null : o.optString("interests", null);
        d.customNotes = o.isNull("customNotes") ? null : o.optString("customNotes", null);
        d.sessionStartMillis = o.optLong("sessionStartMillis", 0);
        d.nagCount = o.optInt("nagCount", 0);
        d.lastNagMillis = o.optLong("lastNagMillis", 0);
        d.recentKeysCsv = o.optString("recentKeysCsv", "");
        d.mutedUntilMillis = o.optLong("mutedUntilMillis", 0);
        return d;
    }

    /** Personal Mode fields are only meaningful (and only ever read by the scheduler) in that mode. */
    public String effectiveCallName() {
        return "personal".equals(mode) ? callName : null;
    }

    public String effectiveWorkSchoolRoutine() {
        return "personal".equals(mode) && workSchoolRoutine != null && !workSchoolRoutine.trim().isEmpty()
                ? workSchoolRoutine.trim()
                : null;
    }

    public String effectiveInterests() {
        return "personal".equals(mode) && interests != null && !interests.trim().isEmpty()
                ? interests.trim()
                : null;
    }
}
