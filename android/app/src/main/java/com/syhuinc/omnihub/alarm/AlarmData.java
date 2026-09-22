package com.syhuinc.omnihub.alarm;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Plain data holder for one alarm, persisted natively so it survives reboot without the webview running. */
public class AlarmData {
    public static final int[] DEFAULT_BACKUP_OFFSETS_MIN = { 5, 10, 30 };

    public String id;
    public int hour;
    public int minute;
    public String label;
    // "today" | "daily" | "weekend" | "weekdays"
    public String repeatMode;
    public boolean enabled;
    public String soundUri; // null/empty = device default alarm sound
    public String soundName;
    public boolean backupEnabled; // if true, un-dismissed alarms re-ring at the offsets below
    public int[] backupOffsetsMin = DEFAULT_BACKUP_OFFSETS_MIN; // minutes after the main alarm fires
    public long createdAt;

    public AlarmData() {}

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("hour", hour);
        o.put("minute", minute);
        o.put("label", label == null ? "" : label);
        o.put("repeatMode", repeatMode);
        o.put("enabled", enabled);
        o.put("soundUri", soundUri == null ? JSONObject.NULL : soundUri);
        o.put("soundName", soundName == null ? JSONObject.NULL : soundName);
        o.put("backupEnabled", backupEnabled);
        JSONArray offsets = new JSONArray();
        for (int m : backupOffsetsMin) offsets.put(m);
        o.put("backupOffsetsMin", offsets);
        o.put("createdAt", createdAt);
        return o;
    }

    public static AlarmData fromJson(JSONObject o) throws JSONException {
        AlarmData a = new AlarmData();
        a.id = o.getString("id");
        a.hour = o.getInt("hour");
        a.minute = o.getInt("minute");
        a.label = o.optString("label", "");
        a.repeatMode = o.optString("repeatMode", "today");
        a.enabled = o.optBoolean("enabled", true);
        a.soundUri = o.isNull("soundUri") ? null : o.optString("soundUri", null);
        a.soundName = o.isNull("soundName") ? null : o.optString("soundName", null);
        a.backupEnabled = o.optBoolean("backupEnabled", false);
        JSONArray offsets = o.optJSONArray("backupOffsetsMin");
        if (offsets != null && offsets.length() > 0) {
            int[] parsed = new int[offsets.length()];
            for (int i = 0; i < offsets.length(); i++) parsed[i] = offsets.optInt(i, 0);
            a.backupOffsetsMin = parsed;
        } else {
            a.backupOffsetsMin = DEFAULT_BACKUP_OFFSETS_MIN;
        }
        a.createdAt = o.optLong("createdAt", System.currentTimeMillis());
        return a;
    }
}
