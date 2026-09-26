import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Sets the status bar's icon/text color for the background it's currently sitting over.
 *  `light` = a light background beneath it (dark icons); `false` = a dark background (light icons).
 *  No-ops on web or if the plugin isn't available. */
export function setStatusBarStyle(light: boolean) {
  if (!Capacitor.isNativePlatform()) return;
  StatusBar.setStyle({ style: light ? Style.Light : Style.Dark }).catch(() => {});
}

/** The app's CSS already reserves safe-area-inset-top space on every screen, which only makes
 *  sense if the WebView draws edge-to-edge behind the status bar — make sure that's actually
 *  configured rather than relying on the platform default. Call once at startup. */
export function initStatusBarOverlay() {
  if (!Capacitor.isNativePlatform()) return;
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
}
