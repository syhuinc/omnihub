package com.syhuinc.omnihub.flashalert;

import android.content.Context;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.os.Handler;
import android.os.Looper;

/**
 * Blinks the rear camera's torch via Camera2's torch-mode API, shared by the notification
 * listener, the phone-state receiver and the alarm ring service so their blink sequences never
 * stack or fight each other over the torch. A higher-priority source (alarm > call >
 * notification) can't be interrupted by a lower one, and stop() only takes effect for whichever
 * source currently owns the blink.
 */
public final class TorchBlinker {
    public static final int SOURCE_NOTIFICATION = 1;
    public static final int SOURCE_CALL = 2;
    public static final int SOURCE_ALARM = 3;

    private static final Handler handler = new Handler(Looper.getMainLooper());
    private static String cameraId;
    private static boolean torchOn;
    private static Runnable pendingStep;
    private static int activeSource = 0;
    private static long generation = 0;

    private TorchBlinker() {}

    private static String resolveCameraId(CameraManager manager) {
        if (cameraId != null) return cameraId;
        try {
            for (String id : manager.getCameraIdList()) {
                CameraCharacteristics chars = manager.getCameraCharacteristics(id);
                Boolean hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                Integer facing = chars.get(CameraCharacteristics.LENS_FACING);
                if (Boolean.TRUE.equals(hasFlash) && facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                    cameraId = id;
                    return cameraId;
                }
            }
        } catch (CameraAccessException ignored) {
        }
        return null;
    }

    private static void setTorch(Context context, boolean on) {
        CameraManager manager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
        if (manager == null) return;
        String id = resolveCameraId(manager);
        if (id == null) return;
        try {
            manager.setTorchMode(id, on);
            torchOn = on;
        } catch (CameraAccessException ignored) {
        }
    }

    /** Blinks a fixed number of times, then leaves the torch off. For a single notification pulse. */
    public static void blink(Context context, int source, int times, long onMs, long offMs) {
        if (source < activeSource) return;
        Context appContext = context.getApplicationContext();
        cancelInternal(appContext);
        activeSource = source;
        long myGeneration = ++generation;
        runStep(appContext, myGeneration, times * 2, onMs, offMs);
    }

    private static void runStep(Context context, long myGeneration, int stepsLeft, long onMs, long offMs) {
        if (myGeneration != generation) return;
        if (stepsLeft <= 0) {
            setTorch(context, false);
            activeSource = 0;
            return;
        }
        boolean turnOn = !torchOn;
        setTorch(context, turnOn);
        pendingStep = () -> runStep(context, myGeneration, stepsLeft - 1, onMs, offMs);
        handler.postDelayed(pendingStep, turnOn ? onMs : offMs);
    }

    /** Blinks continuously until stop() is called with a matching source. For a ringing alarm or call. */
    public static void startContinuous(Context context, int source, long onMs, long offMs) {
        if (source < activeSource) return;
        Context appContext = context.getApplicationContext();
        cancelInternal(appContext);
        activeSource = source;
        long myGeneration = ++generation;
        runContinuousStep(appContext, myGeneration, onMs, offMs);
    }

    private static void runContinuousStep(Context context, long myGeneration, long onMs, long offMs) {
        if (myGeneration != generation) return;
        boolean turnOn = !torchOn;
        setTorch(context, turnOn);
        pendingStep = () -> runContinuousStep(context, myGeneration, onMs, offMs);
        handler.postDelayed(pendingStep, turnOn ? onMs : offMs);
    }

    public static void stop(Context context, int source) {
        if (source != activeSource) return;
        cancelInternal(context.getApplicationContext());
        activeSource = 0;
    }

    private static void cancelInternal(Context context) {
        generation++;
        if (pendingStep != null) {
            handler.removeCallbacks(pendingStep);
            pendingStep = null;
        }
        setTorch(context, false);
    }
}
