package com.syhuinc.omnihub;

import android.app.Application;
import android.content.Context;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Installed as the app's default uncaught-exception handler so a crash anywhere in the
 * process — including the Alarm feature's receivers/services/activity, which can run
 * without MainActivity ever opening if the alarm fires while the app is fully closed —
 * gets written to a plain-text file before Android kills the process, instead of being
 * lost with no way to diagnose it further from outside the device.
 */
public class CrashLogger implements Thread.UncaughtExceptionHandler {
    private static final String LOG_FILE_NAME = "omnihub_crash_log.txt";
    private static final long MAX_LOG_BYTES = 200_000; // trim to keep this from growing forever

    private final Context appContext;
    private final Thread.UncaughtExceptionHandler previousHandler;

    private CrashLogger(Context appContext, Thread.UncaughtExceptionHandler previousHandler) {
        this.appContext = appContext.getApplicationContext();
        this.previousHandler = previousHandler;
    }

    public static void install(Application app) {
        Thread.UncaughtExceptionHandler existing = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(new CrashLogger(app, existing));
    }

    @Override
    public void uncaughtException(Thread thread, Throwable ex) {
        try {
            appendCrash(thread, ex);
        } catch (Exception ignored) {
            // logging must never itself crash or block the real crash handling below
        }
        if (previousHandler != null) {
            previousHandler.uncaughtException(thread, ex);
        } else {
            System.exit(1);
        }
    }

    private void appendCrash(Thread thread, Throwable ex) {
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));

        String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(new Date());
        String entry = "=== " + timestamp + " (thread: " + thread.getName() + ") ===\n" + sw + "\n";

        File file = logFile(appContext);
        String existing = readFileQuietly(file);
        String combined = existing == null ? entry : existing + entry;
        if (combined.length() > MAX_LOG_BYTES) {
            combined = combined.substring(combined.length() - (int) MAX_LOG_BYTES);
        }

        try (FileWriter writer = new FileWriter(file, false)) {
            writer.write(combined);
        } catch (IOException ignored) {
        }
    }

    public static File logFile(Context ctx) {
        return new File(ctx.getApplicationContext().getFilesDir(), LOG_FILE_NAME);
    }

    public static String read(Context ctx) {
        String content = readFileQuietly(logFile(ctx));
        return content == null ? "" : content;
    }

    public static void clear(Context ctx) {
        File f = logFile(ctx);
        if (f.exists()) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
        }
    }

    private static String readFileQuietly(File file) {
        if (!file.exists()) return null;
        try (FileInputStream in = new FileInputStream(file)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return null;
        }
    }
}
