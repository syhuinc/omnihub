package com.syhuinc.omnihub;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/**
 * A standalone launcher entry, independent of MainActivity/Capacitor/the WebView, so the crash
 * log can still be retrieved even if whatever is crashing MainActivity prevents it from ever
 * opening. Plain views only, no Capacitor dependency, so nothing here can be broken by the same
 * bug that's crashing the main app.
 */
public class CrashLogActivity extends Activity {

    private TextView logView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildLayout());
        refresh();
    }

    private View buildLayout() {
        int pad = dp(20);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);
        root.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.setBackgroundColor(0xFF0A0E16);

        TextView title = new TextView(this);
        title.setText("Omni Hub Crash Log");
        title.setTextColor(0xFFFFFFFF);
        title.setTextSize(20);
        title.setPadding(0, 0, 0, dp(16));
        root.addView(title);

        ScrollView scroll = new ScrollView(this);
        LinearLayout.LayoutParams scrollParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f);
        scroll.setLayoutParams(scrollParams);

        logView = new TextView(this);
        logView.setTextColor(0xFFB8C0D0);
        logView.setTextSize(12);
        logView.setTypeface(android.graphics.Typeface.MONOSPACE);
        scroll.addView(logView);
        root.addView(scroll);

        LinearLayout buttonRow = new LinearLayout(this);
        buttonRow.setOrientation(LinearLayout.HORIZONTAL);
        buttonRow.setPadding(0, dp(16), 0, 0);
        LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        buttonRow.setLayoutParams(rowParams);

        Button copyBtn = new Button(this);
        copyBtn.setText("Copy");
        copyBtn.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        copyBtn.setOnClickListener(v -> copyLog());
        buttonRow.addView(copyBtn);

        Button refreshBtn = new Button(this);
        refreshBtn.setText("Refresh");
        refreshBtn.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        refreshBtn.setOnClickListener(v -> refresh());
        buttonRow.addView(refreshBtn);

        Button clearBtn = new Button(this);
        clearBtn.setText("Clear");
        clearBtn.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        clearBtn.setOnClickListener(v -> clearLog());
        buttonRow.addView(clearBtn);

        root.addView(buttonRow);
        return root;
    }

    private void refresh() {
        String log = CrashLogger.read(this);
        logView.setText(log.isEmpty() ? "No crashes recorded." : log);
    }

    private void copyLog() {
        String log = CrashLogger.read(this);
        ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        if (clipboard != null) {
            clipboard.setPrimaryClip(ClipData.newPlainText("Omni Hub crash log", log));
        }
        Toast.makeText(this, "Copied", Toast.LENGTH_SHORT).show();
    }

    private void clearLog() {
        CrashLogger.clear(this);
        refresh();
        Toast.makeText(this, "Cleared", Toast.LENGTH_SHORT).show();
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
    }
}
