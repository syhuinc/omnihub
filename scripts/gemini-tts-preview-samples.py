"""
Generates the new 3-per-personality "Hear a Preview" clips (bedtime nudge, snooze
reaction, wake-up greeting) for Gentle/Friendly/Teasing/Strict/Savage -- 15 clips total,
replacing the old single-sample-per-personality set.

Uses only the Python standard library (urllib + wave) -- no pip install needed.

Setup:
    Set the OMNI_HUB_GEMINI_API_KEY environment variable.

Run:
    python3 gemini-tts-preview-samples-v2.py

Output: ./output-preview-v2/<personality>-<phase>.wav (15 files). Safe to re-run --
skips files that already exist.
"""

import base64
import json
import os
import urllib.request
import urllib.error
import wave

API_KEY = os.environ.get("OMNI_HUB_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
MODEL = os.environ.get("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

SAMPLE_RATE = 24000
SAMPLE_WIDTH = 2
CHANNELS = 1

VOICE_MAP = {
    "gentle": "Vindemiatrix",
    "friendly": "Vindemiatrix",
    "teasing": "Puck",
    "strict": "Kore",
    "savage": "Fenrir",
}

STYLE_MAP = {
    "gentle": "Say this in a calm, warm, caring tone, speaking gently and slowly, like a close friend checking in:",
    "friendly": "Say this in an upbeat, warm, casual tone, like a close friend texting you, at a natural pace:",
    "teasing": "Say this in a playful, teasing, slightly mischievous and a little annoying tone:",
    "strict": "Say this in a firm, serious, no-nonsense tone -- direct and commanding, but never insulting or cruel:",
    "savage": "Say this in a confident, sharp, sarcastic, comedically roasting tone -- genuinely funny, not mean-spirited:",
}

SAMPLES = [
    {"personality": "gentle", "phase": "bedtime", "text": "Hey... you've had a long day. Come on, let's call it a night."},
    {"personality": "gentle", "phase": "snooze", "text": "You can have your five minutes. Then we're going to bed, okay?"},
    {"personality": "gentle", "phase": "wake", "text": "Good morning. No rush. Just sit up first. We'll take it from there."},

    {"personality": "friendly", "phase": "bedtime", "text": "Hey mate, bedtime. Come on, let's get you off that phone."},
    {"personality": "friendly", "phase": "snooze", "text": "You really want another five minutes? Fine. I'll be back."},
    {"personality": "friendly", "phase": "wake", "text": "Morning! You're up! Come on, let's get this day started."},

    {"personality": "teasing", "phase": "bedtime", "text": "Ohhh, look who's still awake. Weren't you supposed to be sleeping?"},
    {"personality": "teasing", "phase": "snooze", "text": "Snooze? Of course. I totally saw that coming."},
    {"personality": "teasing", "phase": "wake", "text": "Good morning, sleepyhead. Did you actually sleep, or were you negotiating with me all night?"},

    {"personality": "strict", "phase": "bedtime", "text": "It's bedtime. Phone down. We're done for tonight."},
    {"personality": "strict", "phase": "snooze", "text": "You chose snooze. Five minutes. After that, you're getting up."},
    {"personality": "strict", "phase": "wake", "text": "Alarm dismissed. Feet on the floor. Start your morning."},

    {"personality": "savage", "phase": "bedtime", "text": "You're still awake? At this point, sleep isn't the problem. You are."},
    {"personality": "savage", "phase": "snooze", "text": "Snooze again? Incredible. Your commitment to avoiding responsibility is impressive."},
    {"personality": "savage", "phase": "wake", "text": "My job is done. If you crawl back into that bed, that's between you and tomorrow."},
]


def generate(personality: str, phase: str, text: str, out_dir: str) -> None:
    name = f"{personality}-{phase}"
    out_path = os.path.join(out_dir, f"{name}.wav")
    if os.path.exists(out_path):
        print(f"  skip {out_path} (already exists)")
        return

    voice = VOICE_MAP[personality]
    prompt = f"{STYLE_MAP[personality]} {text}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}
            },
        },
    }
    req = urllib.request.Request(
        f"{ENDPOINT}?key={API_KEY}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  FAILED {name}: HTTP {e.code} - {e.read().decode('utf-8', 'replace')}")
        return

    try:
        b64_audio = payload["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    except (KeyError, IndexError):
        print(f"  FAILED {name}: unexpected response shape: {json.dumps(payload)[:500]}")
        return

    pcm = base64.b64decode(b64_audio)
    with wave.open(out_path, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)
    print(f"  saved {out_path} (voice: {voice})")


def main() -> None:
    if not API_KEY:
        raise SystemExit("Set OMNI_HUB_GEMINI_API_KEY first")

    out_dir = "output-preview-v2"
    os.makedirs(out_dir, exist_ok=True)

    print(f"Generating {len(SAMPLES)} preview clips with model {MODEL}...")
    for sample in SAMPLES:
        generate(sample["personality"], sample["phase"], sample["text"], out_dir)

    print("\nDone.")


if __name__ == "__main__":
    main()
