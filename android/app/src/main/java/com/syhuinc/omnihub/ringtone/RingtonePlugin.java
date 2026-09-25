package com.syhuinc.omnihub.ringtone;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;

/**
 * Sets a saved Voice Changer clip as the device's default ringtone. Two things this needs that
 * ordinary storage access doesn't cover:
 *   1. WRITE_SETTINGS — a special permission (like SYSTEM_ALERT_WINDOW, granted from a system
 *      Settings screen, not a runtime dialog) required to actually change the default ringtone via
 *      RingtoneManager.setActualDefaultRingtoneUri. Without it the call throws SecurityException.
 *   2. Registering the file with MediaStore's ringtones collection (IS_RINGTONE=1) rather than just
 *      writing bytes somewhere — RingtoneManager and the system Sound settings picker both work off
 *      that collection, not arbitrary files.
 *
 * Only the MediaStore (API 29+) path is implemented — this app's minSdk is 24, but writing into
 * the public Ringtones directory pre-Q needs WRITE_EXTERNAL_STORAGE, a second runtime permission
 * with its own request flow, for an increasingly small slice of real devices. setAsRingtone
 * resolves an honest "not supported on this Android version" error on those rather than adding
 * that whole second path for it.
 */
@CapacitorPlugin(name = "RingtonePlugin")
public class RingtonePlugin extends Plugin {

    @PluginMethod
    public void checkWriteSettingsPermission(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", Settings.System.canWrite(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestWriteSettingsPermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS);
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void setAsRingtone(PluginCall call) {
        String base64 = call.getString("base64");
        String fileName = call.getString("fileName", "voice-changer-ringtone");
        String mimeType = call.getString("mimeType", "audio/mpeg");

        if (base64 == null) {
            call.reject("Missing audio data");
            return;
        }

        if (!Settings.System.canWrite(getContext())) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("needsPermission", true);
            call.resolve(ret);
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Setting a ringtone directly needs Android 10 or newer on this app — you can still share the file and set it manually from your Sound settings.");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            Context context = getContext();
            ContentResolver resolver = context.getContentResolver();

            ContentValues values = new ContentValues();
            values.put(MediaStore.Audio.Media.DISPLAY_NAME, fileName);
            values.put(MediaStore.Audio.Media.MIME_TYPE, mimeType);
            values.put(MediaStore.Audio.Media.RELATIVE_PATH, android.os.Environment.DIRECTORY_RINGTONES);
            values.put(MediaStore.Audio.Media.IS_RINGTONE, true);
            values.put(MediaStore.Audio.Media.IS_MUSIC, false);
            values.put(MediaStore.Audio.Media.IS_PENDING, 1);

            Uri collection = MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
            Uri itemUri = resolver.insert(collection, values);
            if (itemUri == null) {
                call.reject("Couldn't create the ringtone file");
                return;
            }

            try (OutputStream out = resolver.openOutputStream(itemUri)) {
                if (out == null) {
                    call.reject("Couldn't write the ringtone file");
                    return;
                }
                out.write(bytes);
            }

            values.clear();
            values.put(MediaStore.Audio.Media.IS_PENDING, 0);
            resolver.update(itemUri, values, null, null);

            RingtoneManager.setActualDefaultRingtoneUri(context, RingtoneManager.TYPE_RINGTONE, itemUri);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Couldn't set the ringtone: " + e.getMessage(), e);
        }
    }
}
