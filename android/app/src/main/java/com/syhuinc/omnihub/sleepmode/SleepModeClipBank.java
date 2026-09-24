package com.syhuinc.omnihub.sleepmode;

import android.content.Context;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Looks up a pre-recorded audio clip (res/raw) for a MessageBank.Pick key, when one exists. Only
 * GENERIC-pool lines for Gentle/Friendly have real recorded audio right now; every other key
 * (NAMED, the work/wake/interests bonus pools, Teasing/Strict/Savage, or a Gentle/Friendly line
 * that hasn't been recorded yet) returns 0, which the caller treats as "fall back to on-device
 * TTS" - the two are meant to sit side by side, not require every line to be recorded.
 */
public class SleepModeClipBank {
    private static final Pattern GENERIC_KEY = Pattern.compile("^(gentle|friendly):g(\\d):(\\d+)$");

    public static int resIdFor(Context context, String key) {
        if (key == null) return 0;
        Matcher m = GENERIC_KEY.matcher(key);
        if (!m.matches()) return 0;

        String personality = m.group(1);
        String tier = m.group(2);
        int lineIndex = Integer.parseInt(m.group(3));
        String resName = String.format("%s_t%s_%02d", personality, tier, lineIndex);
        return context.getResources().getIdentifier(resName, "raw", context.getPackageName());
    }
}
