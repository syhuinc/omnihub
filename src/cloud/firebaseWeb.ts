import { initializeApp, getApps } from 'firebase/app';

// Required by @capacitor-firebase's web fallback (used when running in a
// browser, e.g. local dev/testing). On a real Android build, Capacitor
// routes plugin calls to the native SDK instead, which initializes itself
// from android/app/google-services.json — this config is not used there.
// These are the same non-secret client values already committed in
// google-services.json.
const firebaseConfig = {
  apiKey: 'AIzaSyCS5ePh8aDpjPPvuQFn71tbuB5YtQwtzNQ',
  authDomain: 'omni-hub-b7396.firebaseapp.com',
  projectId: 'omni-hub-b7396',
  storageBucket: 'omni-hub-b7396.firebasestorage.app',
  messagingSenderId: '354903225183',
  appId: '1:354903225183:android:00a39220eedba252517cea',
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
