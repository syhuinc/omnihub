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
    // one of MessageBank.PERSONALITIES
    public String personality = "friendly";
    // "normal" | "personal"
    public String mode = "normal";

    // Personal Mode fields — all optional, only read when mode == "personal"
    public String callName; // what Sleep Mode should call the user
    public boolean hasWorkTomorrow;
    // "single" | "relationship" | "married" | "prefer-not"
    public String relationshipStatus;

    // Nightly runtime state — reset each time a fresh bedtime session starts
    public long sessionStartMillis;
    public int nagCount;
    public String recentKeysCsv = ""; // last few MessageBank pick keys, comma-joined, for anti-repeat

    public SleepModeData() {}

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("enabled", enabled);
        o.put("bedtimeHour", bedtimeHour);
        o.put("bedtimeMinute", bedtimeMinute);
        o.put("wakeHour", wakeHour);
        o.put("wakeMinute", wakeMinute);
        o.put("intervalMin", intervalMin);
        o.put("personality", personality);
        o.put("mode", mode);
        o.put("callName", callName == null ? JSONObject.NULL : callName);
        o.put("hasWorkTomorrow", hasWorkTomorrow);
        o.put("relationshipStatus", relationshipStatus == null ? JSONObject.NULL : relationshipStatus);
        o.put("sessionStartMillis", sessionStartMillis);
        o.put("nagCount", nagCount);
        o.put("recentKeysCsv", recentKeysCsv);
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
        d.personality = o.optString("personality", "friendly");
        d.mode = o.optString("mode", "normal");
        d.callName = o.isNull("callName") ? null : o.optString("callName", null);
        d.hasWorkTomorrow = o.optBoolean("hasWorkTomorrow", false);
        d.relationshipStatus = o.isNull("relationshipStatus") ? null : o.optString("relationshipStatus", null);
        d.sessionStartMillis = o.optLong("sessionStartMillis", 0);
        d.nagCount = o.optInt("nagCount", 0);
        d.recentKeysCsv = o.optString("recentKeysCsv", "");
        return d;
    }

    /** Personal Mode fields are only meaningful (and only ever read by the scheduler) in that mode. */
    public String effectiveCallName() {
        return "personal".equals(mode) ? callName : null;
    }

    public boolean effectiveHasWorkTomorrow() {
        return "personal".equals(mode) && hasWorkTomorrow;
    }
}
