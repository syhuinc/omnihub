package com.syhuinc.omnihub.sleepmode;

import android.content.Context;

import java.io.File;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Looks up a real-voice (Gemini TTS) clip downloaded for an AI-pool line, when one exists.
 * Mirrors SleepModeClipBank's job for the hand-recorded pools, but the clips here are written at
 * runtime (SleepModeStore.saveAiAudioClip) rather than baked into the APK as res/raw, so the
 * lookup is a file path rather than a resource id. Only line 0 of each tier's AI pool is ever
 * synthesized (see generateSleepReminders) — every other AI-pool key, or a personality/tier
 * nothing has been generated for yet, returns null, which the caller treats as "fall back to
 * on-device TTS", same as SleepModeClipBank.
 */
public class SleepModeAiClipBank {
    private static final Pattern AI_KEY = Pattern.compile("^(gentle|friendly):ai(\\d):0$");

    public static String filePathFor(Context context, String key) {
        if (key == null) return null;
        Matcher m = AI_KEY.matcher(key);
        if (!m.matches()) return null;

        String personality = m.group(1);
        String tier = m.group(2);
        File file = new File(context.getFilesDir(), "sleep_ai_audio/" + personality + "_tier" + tier + ".wav");
        return file.exists() ? file.getAbsolutePath() : null;
    }
}
