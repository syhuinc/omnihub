package com.syhuinc.omnihub.sleepmode;

import android.content.Context;

import java.io.File;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Looks up a real-voice (Gemini TTS) clip downloaded for an AI-pool line, when one exists.
 * Mirrors SleepModeClipBank's job for the hand-recorded pools, but the clips here are written at
 * runtime (SleepModeStore.saveAiAudioClip) rather than baked into the APK as res/raw, so the
 * lookup is a file path rather than a resource id. Only line 0 of each AI list (bedtime tiers,
 * snooze replies, morning tiers) is ever synthesized (see generateSleepReminders) — every other
 * AI-pool key, or anything not generated yet, returns null, which the caller treats as "fall
 * back to on-device TTS", same as SleepModeClipBank.
 */
public class SleepModeAiClipBank {
    private static final String P = "(gentle|friendly|teasing|strict|savage)";
    private static final Pattern TIER_KEY = Pattern.compile("^" + P + ":ai(\\d):0$");
    private static final Pattern MORNING_KEY = Pattern.compile("^" + P + ":aim(\\d):0$");
    private static final Pattern SNOOZE_KEY = Pattern.compile("^" + P + ":ai(s|ms):0$");

    public static String filePathFor(Context context, String key) {
        if (key == null) return null;
        String name = null;
        Matcher m = TIER_KEY.matcher(key);
        if (m.matches()) name = m.group(1) + "_tier" + m.group(2);
        m = MORNING_KEY.matcher(key);
        if (name == null && m.matches()) name = m.group(1) + "_morning" + m.group(2);
        m = SNOOZE_KEY.matcher(key);
        if (name == null && m.matches()) name = m.group(1) + ("s".equals(m.group(2)) ? "_snooze" : "_morningsnooze");
        if (name == null) return null;

        File file = new File(context.getFilesDir(), "sleep_ai_audio/" + name + ".wav");
        return file.exists() ? file.getAbsolutePath() : null;
    }
}
