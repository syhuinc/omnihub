"""
Generates Sleep Mode's 5 "Hear a sample" preview voice clips using the Gemini API's
native TTS models (gemini-2.5-flash-preview-tts by default). Output generated through
a paid/billed Gemini API key is yours to use commercially, unlike the old ElevenLabs
free-tier key these replace.

Each personality gets its own voice + style prompt so the tone matches the character art:
  gentle   -> calm, warm, soothing
  friendly -> upbeat, casual, cheerful
  teasing  -> playful, mischievous, sarcastic
  strict   -> firm, no-nonsense, commanding
  savage   -> sharp, smug, sarcastic

Uses only the Python standard library (urllib + wave) -- no pip install needed.

Setup:
    Set the OMNI_HUB_GEMINI_API_KEY environment variable (from https://aistudio.google.com/apikey).

Run:
    python3 gemini-tts-generate.py

Output: ./output/sample-<personality>.wav (5 files). Safe to re-run -- skips files
that already exist. Send the output/ folder back and I'll wire it into the app.

Voice picks below are a first guess at tone/gender fit from Gemini's prebuilt voice
list -- listen to the output and tell me if any personality should use a different
voice; swap the name in VOICE_MAP and re-run (delete the old .wav first, since the
script skips existing files).
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

# Gemini TTS output is raw 16-bit PCM, mono, 24kHz.
SAMPLE_RATE = 24000
SAMPLE_WIDTH = 2
CHANNELS = 1

VOICE_MAP = {
    "gentle": "Vindemiatrix",   # described as a gentle tone in Google's voice list
    "friendly": "Vindemiatrix", # same voice as Gentle -- matches the real reminder-line audio
    "teasing": "Puck",          # described as upbeat/playful
    "strict": "Kore",           # described as firm
    "savage": "Fenrir",         # described as excitable/sharp
}

SAMPLES = [
    {
        "name": "sample-gentle",
        "personality": "gentle",
        "style": "Say this in a calm, warm, soothing whisper, speaking slowly and softly:",
        "text": "Hey, it's getting late. Let's get some rest. You did great today.",
    },
    {
        "name": "sample-friendly",
        "personality": "friendly",
        "style": "Say this in an upbeat, warm, casual and cheerful tone, at a natural pace:",
        "text": "Still awake, mate? Let's get some sleep! Your pillow is waiting.",
    },
    {
        "name": "sample-teasing",
        "personality": "teasing",
        "style": "Say this in a playful, teasing, mischievous and slightly sarcastic tone:",
        "text": "Still on your phone? Interesting strategy for being a morning person.",
    },
    {
        "name": "sample-strict",
        "personality": "strict",
        "style": "Say this in a firm, serious, no-nonsense and commanding tone, slowly and deliberately:",
        "text": "It's your bedtime. No more scrolling. Phone down. Now.",
    },
    {
        "name": "sample-savage",
        "personality": "savage",
        "style": "Say this in a confident, sharp, sarcastic and smirking tone:",
        "text": "It's 12:45 AM and you're still scrolling? At this point, your pillow has given up on you.",
    },
]


def generate(name: str, personality: str, style: str, text: str, out_dir: str) -> None:
    out_path = os.path.join(out_dir, f"{name}.wav")
    if os.path.exists(out_path):
        print(f"  skip {out_path} (already exists)")
        return

    voice = VOICE_MAP[personality]
    prompt = f"{style} {text}"
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
        raise SystemExit("Set OMNI_HUB_GEMINI_API_KEY first (get one at https://aistudio.google.com/apikey)")

    out_dir = "output"
    os.makedirs(out_dir, exist_ok=True)

    print(f"Generating {len(SAMPLES)} sample-preview lines with model {MODEL}...")
    for sample in SAMPLES:
        generate(sample["name"], sample["personality"], sample["style"], sample["text"], out_dir)

    print("\nDone. Listen to ./output/*.wav -- if a voice doesn't fit, change it in VOICE_MAP,")
    print("delete that .wav, and re-run.")


if __name__ == "__main__":
    main()
