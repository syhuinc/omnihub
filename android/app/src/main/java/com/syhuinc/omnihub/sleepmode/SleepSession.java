package com.syhuinc.omnihub.sleepmode;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * One completed Sleep Mode night, recorded when a session's wake time is reached. Real, measured
 * data only — Sleep Insights reads these rather than showing anything fabricated.
 */
public class SleepSession {
    public long bedtimeScheduledMillis;
    public long wakeScheduledMillis;
    /** 0 if the screen was never caught on this session — the honest reading is "never nagged." */
    public long lastNagMillis;
    public int nagCount;

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("bedtimeScheduledMillis", bedtimeScheduledMillis);
        o.put("wakeScheduledMillis", wakeScheduledMillis);
        o.put("lastNagMillis", lastNagMillis);
        o.put("nagCount", nagCount);
        return o;
    }

    public static SleepSession fromJson(JSONObject o) throws JSONException {
        SleepSession s = new SleepSession();
        s.bedtimeScheduledMillis = o.optLong("bedtimeScheduledMillis", 0);
        s.wakeScheduledMillis = o.optLong("wakeScheduledMillis", 0);
        s.lastNagMillis = o.optLong("lastNagMillis", 0);
        s.nagCount = o.optInt("nagCount", 0);
        return s;
    }
}
