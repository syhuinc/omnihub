package com.syhuinc.omnihub.alarm;

import org.json.JSONException;
import org.json.JSONObject;

/** Plain data holder for one alarm, persisted natively so it survives reboot without the webview running. */
public class AlarmData {
    public String id;
    public int hour;
    public int minute;
    public String label;
    // "today" | "daily" | "weekend" | "weekdays"
    public String repeatMode;
    public boolean enabled;
    public String soundUri; // null/empty = device default alarm sound
    public String soundName;
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
        a.createdAt = o.optLong("createdAt", System.currentTimeMillis());
        return a;
    }
}
