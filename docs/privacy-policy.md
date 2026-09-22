# Privacy Policy for Omni Hub

**Last updated:** 2026

Omni Hub is an offline utility app. This policy is short because there isn't much to say: **Omni Hub does not collect any data.**

## What we collect

Nothing. Omni Hub:

- Makes **no network requests** of any kind
- Has **no user accounts**, sign-in, or sign-up
- Uses **no analytics, tracking, or advertising SDKs**
- Does **not** share, sell, or transmit any information, because it never leaves your device in the first place

## Where your data lives

Everything you enter into Omni Hub — notes, checklists, expenses, budgets, calculator history, pinned tools, and app settings — is stored **only on your device**, using standard local browser storage (`localStorage`). It is never sent anywhere.

- You can export a backup of this data at any time from **Profile ▸ Export Backup**, which saves a JSON file to your device that only you control.
- You can delete all of it at any time from **Profile ▸ Clear All Data**.
- Uninstalling the app deletes this data along with it.

Notes, photos, and files you save in the **Vault** are additionally encrypted on your device with a key derived from your PIN before being stored — notes alongside your other app data, and photos/files in a separate local database (`IndexedDB`) sized for larger content, still only on your device. Your PIN is never stored — only used to derive that key each time you unlock — so if you forget it, Vault content cannot be recovered and the Vault must be reset. Opening or saving a Vault photo/file decrypts a temporary copy for that action (e.g. to view an image or save it to your Downloads folder); that copy is no longer encrypted once it leaves the Vault. Vault photos and files are not included in the main **Profile ▸ Export Backup** file; use **Vault ▸ Photos & Files ▸ Export** instead, which decrypts them into a plain `.zip` file on your device — that zip is unencrypted, since it needs to be readable outside the app, so store or share it with the same care you'd give the original photos/files. Use **Vault ▸ Photos & Files ▸ Import** to bring that zip back in (e.g. after reinstalling), which re-encrypts everything as it's added.

## Permissions

Omni Hub does not access your camera, microphone, contacts, location, storage beyond its own app sandbox, or any other device feature. It requests these permissions, all used only to make features on-device work, never to collect or transmit data:

- **Vibrate** — haptic feedback (tap and completion vibrations).
- **Alarms, notifications, and background wake permissions** (schedule alarms, post notifications, run in the foreground briefly while an alarm rings, keep the device awake for that, show the ringing screen over the lock screen, and restart alarms after the device reboots) — all used solely by the **Alarm** feature, so an alarm you set still rings even if Omni Hub is closed. None of this involves any network access or leaves your device.

## Alarm

Alarms you create are stored on your device (both in the app's own storage and, separately, in Android's system alarm scheduler so they still fire when the app isn't open) and are used only to ring at the time you set. No alarm data is ever transmitted anywhere. If you pick a custom ringtone, Omni Hub only stores a reference to the sound file already on your device — it doesn't copy or transmit the audio itself.

## Children's privacy

Because Omni Hub collects no data from anyone, it does not knowingly collect data from children, and there is nothing to collect regardless of age.

## Changes to this policy

If this policy ever changes, the "Last updated" date above will change too. Given that the app is offline by design, we don't expect that to happen often.

## Contact

Questions about this policy can be sent to the developer contact listed on the Omni Hub Google Play Store listing.
