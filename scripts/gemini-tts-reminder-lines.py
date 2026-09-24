"""
Generates the 100 real, pre-recorded Sleep Mode reminder lines (50 Gentle + 50 Friendly)
using the Gemini API's native TTS. Both personalities currently share ONE consistent
female-toned voice across all 100 lines (Friendly's own distinct male voice is on hold
until confirmed separately -- see VOICE_MAP). These replace on-device TTS for the two
"Normal"-tier personalities with real recorded audio; Teasing/Strict/Savage stay
on-device since they're dynamic (AI tier).

Lines are pulled directly from MessageBank.java's GENERIC pools, tier-organized (0-3,
mild to most insistent), so the audio matches the live nightly nag text exactly.

Uses only the Python standard library (urllib + wave) -- no pip install needed.

Setup:
    Set the OMNI_HUB_GEMINI_API_KEY environment variable (from https://aistudio.google.com/apikey).

Run:
    python3 gemini-tts-reminder-lines.py

Output: ./output-reminders/gentle_t<tier>_<idx>.wav and friendly_t<tier>_<idx>.wav
(100 files total). Safe to re-run -- skips files that already exist, so you can stop
and resume anytime. Send the whole output-reminders/ folder back and I'll wire it in.

Voice picks are a first guess -- listen to a couple of each personality and tell me if
either voice should change; swap VOICE_MAP and delete that personality's files to redo.
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

# One voice per personality, used for every one of that personality's 50 lines.
# Both currently share the same female-toned voice -- Friendly's own male voice is on
# hold until confirmed separately.
VOICE_MAP = {
    "gentle": "Vindemiatrix",   # same voice used for the "Hear a sample" gentle clip
    "friendly": "Vindemiatrix",
}

STYLE_MAP = {
    "gentle": "A calm, warm female speaker says this gently and soothingly, at a slow, soft pace:",
    "friendly": "An upbeat, warm female speaker says this in a cheerful, friendly tone, at a natural pace:",
}

GENTLE_LINES = [
    {'tier': 0, 'idx': 0, 'text': "It's about time to rest. Good night."},
    {'tier': 0, 'idx': 1, 'text': "Bedtime is here. Sweet dreams whenever you're ready."},
    {'tier': 0, 'idx': 2, 'text': "It's late now. Maybe it's time to close your eyes."},
    {'tier': 0, 'idx': 3, 'text': 'The day is done. Let yourself rest now.'},
    {'tier': 0, 'idx': 4, 'text': "It's okay to stop here. Sleep is calling gently."},
    {'tier': 0, 'idx': 5, 'text': 'Nighttime is here. Your body could use the rest.'},
    {'tier': 0, 'idx': 6, 'text': "Softly now — it's time to wind down."},
    {'tier': 0, 'idx': 7, 'text': "You've done enough today. Time to rest."},
    {'tier': 0, 'idx': 8, 'text': 'The stars are out. Maybe you should be resting too.'},
    {'tier': 0, 'idx': 9, 'text': "It's a good time to let your eyes close."},
    {'tier': 0, 'idx': 10, 'text': "Rest is waiting for you, whenever you're ready."},
    {'tier': 0, 'idx': 11, 'text': 'A peaceful night starts with putting the phone down.'},
    {'tier': 1, 'idx': 12, 'text': "It's getting later. Your rest matters."},
    {'tier': 1, 'idx': 13, 'text': 'A little more sleep would feel better than a little more scrolling.'},
    {'tier': 1, 'idx': 14, 'text': "Whenever you're ready, bed is right there for you."},
    {'tier': 1, 'idx': 15, 'text': "It's later than it feels. Maybe it's time."},
    {'tier': 1, 'idx': 16, 'text': "Your body's probably ready for sleep, even if your mind isn't."},
    {'tier': 1, 'idx': 17, 'text': 'A few more minutes always turns into a few more hours.'},
    {'tier': 1, 'idx': 18, 'text': "I know it's hard to put down, but rest would feel nice."},
    {'tier': 1, 'idx': 19, 'text': "The night is getting long. Let's ease into sleep."},
    {'tier': 1, 'idx': 20, 'text': "You'll feel so much better with a little more sleep."},
    {'tier': 1, 'idx': 21, 'text': "It's alright to stop scrolling now."},
    {'tier': 1, 'idx': 22, 'text': "Sleep is patient, but it's still waiting."},
    {'tier': 1, 'idx': 23, 'text': 'This is a gentle reminder that bed exists.'},
    {'tier': 2, 'idx': 24, 'text': "I really think it's time to put the phone down now."},
    {'tier': 2, 'idx': 25, 'text': "You'll thank yourself tomorrow if you sleep now."},
    {'tier': 2, 'idx': 26, 'text': "It's been a while. Let's get you some rest."},
    {'tier': 2, 'idx': 27, 'text': "I care about you, so I'm asking again — please rest."},
    {'tier': 2, 'idx': 28, 'text': 'Your eyes need a break more than your feed does.'},
    {'tier': 2, 'idx': 29, 'text': "Let's be kind to tomorrow-you and sleep now."},
    {'tier': 2, 'idx': 30, 'text': "It's really time now. I promise it'll feel good."},
    {'tier': 2, 'idx': 31, 'text': "Just set it down. That's all I'm asking."},
    {'tier': 2, 'idx': 32, 'text': 'You deserve real rest tonight.'},
    {'tier': 2, 'idx': 33, 'text': "This has gone on a while — let's close it out gently."},
    {'tier': 2, 'idx': 34, 'text': "I won't stop caring, so I won't stop asking. Please sleep."},
    {'tier': 2, 'idx': 35, 'text': 'Your rest is worth more than one more scroll.'},
    {'tier': 2, 'idx': 36, 'text': "Let's make tonight a good night's sleep."},
    {'tier': 3, 'idx': 37, 'text': 'Please, just put it down and rest now.'},
    {'tier': 3, 'idx': 38, 'text': "Tomorrow-you is quietly hoping you'll sleep soon."},
    {'tier': 3, 'idx': 39, 'text': 'One last gentle nudge — go to sleep.'},
    {'tier': 3, 'idx': 40, 'text': "I'm still here, still gently asking — please sleep."},
    {'tier': 3, 'idx': 41, 'text': 'This is me, softly insisting. Time for bed.'},
    {'tier': 3, 'idx': 42, 'text': "I promise I'll stop once you close your eyes."},
    {'tier': 3, 'idx': 43, 'text': 'Just this once, listen to the gentle voice. Sleep now.'},
    {'tier': 3, 'idx': 44, 'text': "You're allowed to stop. Let's rest, together."},
    {'tier': 3, 'idx': 45, 'text': "I'll keep whispering until you finally rest."},
    {'tier': 3, 'idx': 46, 'text': 'Okay, one more nudge — the softest one yet. Sleep.'},
    {'tier': 3, 'idx': 47, 'text': 'This is my last gentle ask tonight. Please rest.'},
    {'tier': 3, 'idx': 48, 'text': "Even gentle reminders wear thin — let's sleep now."},
    {'tier': 3, 'idx': 49, 'text': "I'm not upset, just worried. Please get some rest."},
]

FRIENDLY_LINES = [
    {'tier': 0, 'idx': 0, 'text': "It's time to sleep. Good night!"},
    {'tier': 0, 'idx': 1, 'text': "Bedtime's here — catch you in the morning."},
    {'tier': 0, 'idx': 2, 'text': "Alright, that's the signal. Time for bed."},
    {'tier': 0, 'idx': 3, 'text': "That's a wrap for today! Time to sleep."},
    {'tier': 0, 'idx': 4, 'text': "Okay, bedtime's officially here. Night!"},
    {'tier': 0, 'idx': 5, 'text': "Cue the bedtime music — let's go!"},
    {'tier': 0, 'idx': 6, 'text': 'Time to call it a night, friend.'},
    {'tier': 0, 'idx': 7, 'text': "Alright, phone down, eyes closed. Let's do this."},
    {'tier': 0, 'idx': 8, 'text': "That's your cue — sleep mode, engage!"},
    {'tier': 0, 'idx': 9, 'text': "Bedtime's knocking. Better answer it."},
    {'tier': 0, 'idx': 10, 'text': 'Time flies, and so should you — off to bed!'},
    {'tier': 0, 'idx': 11, 'text': "Okay, that's a wrap. See you in dreamland!"},
    {'tier': 1, 'idx': 12, 'text': "It's getting late. Maybe you should sleep."},
    {'tier': 1, 'idx': 13, 'text': "Your bed's getting a little lonely over there."},
    {'tier': 1, 'idx': 14, 'text': 'You said one more minute about an hour ago.'},
    {'tier': 1, 'idx': 15, 'text': 'Still scrolling, huh? Classic you.'},
    {'tier': 1, 'idx': 16, 'text': 'Your bed called. It says it misses you.'},
    {'tier': 1, 'idx': 17, 'text': 'One more minute, right? Sure it is.'},
    {'tier': 1, 'idx': 18, 'text': "You know it's later than you think."},
    {'tier': 1, 'idx': 19, 'text': "Tick tock — sleep o'clock's not far off."},
    {'tier': 1, 'idx': 20, 'text': 'This is your friendly nudge before it gets weird.'},
    {'tier': 1, 'idx': 21, 'text': "Not gonna lie, it's getting pretty late."},
    {'tier': 1, 'idx': 22, 'text': 'Your future self is side-eyeing you right now.'},
    {'tier': 1, 'idx': 23, 'text': 'Come on, you know the drill by now.'},
    {'tier': 2, 'idx': 24, 'text': 'Still using your phone? Come on, go to sleep.'},
    {'tier': 2, 'idx': 25, 'text': 'Even your battery wants you to go to sleep at this point.'},
    {'tier': 2, 'idx': 26, 'text': "Whatever it is, it'll still be there tomorrow."},
    {'tier': 2, 'idx': 27, 'text': 'Okay but seriously, put the phone down.'},
    {'tier': 2, 'idx': 28, 'text': "We're way past 'just a bit longer' territory."},
    {'tier': 2, 'idx': 29, 'text': 'Your thumbs need a break. Sleep time.'},
    {'tier': 2, 'idx': 30, 'text': "I'm gonna keep bugging you, you know that right?"},
    {'tier': 2, 'idx': 31, 'text': 'This is your friendly-but-firm reminder. Sleep.'},
    {'tier': 2, 'idx': 32, 'text': "You're really testing my patience here, buddy."},
    {'tier': 2, 'idx': 33, 'text': 'Alright, no more excuses. Bed. Now-ish.'},
    {'tier': 2, 'idx': 34, 'text': 'Your screen time report is judging you.'},
    {'tier': 2, 'idx': 35, 'text': 'Come on, we both know you should sleep.'},
    {'tier': 2, 'idx': 36, 'text': "This isn't a drill anymore. Sleep time."},
    {'tier': 3, 'idx': 37, 'text': "I'm not stopping until you put this thing down."},
    {'tier': 3, 'idx': 38, 'text': 'This is nag number who-knows-what. Sleep. Now.'},
    {'tier': 3, 'idx': 39, 'text': 'Put. The phone. Down. Please.'},
    {'tier': 3, 'idx': 40, 'text': "Okay, I'm basically a broken record at this point. Sleep!"},
    {'tier': 3, 'idx': 41, 'text': 'I will keep buzzing you all night if I have to.'},
    {'tier': 3, 'idx': 42, 'text': 'This is peak stubbornness. Please just sleep.'},
    {'tier': 3, 'idx': 43, 'text': 'You versus sleep, round infinity. Just sleep already.'},
    {'tier': 3, 'idx': 44, 'text': "I'm one nag away from staging an intervention."},
    {'tier': 3, 'idx': 45, 'text': "Seriously, put it down. I'm not joking anymore."},
    {'tier': 3, 'idx': 46, 'text': 'Seriously — phone down, sleep now.'},
    {'tier': 3, 'idx': 47, 'text': 'This is the last straw, buddy. Sleep. Please.'},
    {'tier': 3, 'idx': 48, 'text': 'You win the award for most ignored bedtime reminder.'},
    {'tier': 3, 'idx': 49, 'text': 'Okay I give up being subtle. Go. To. Sleep.'},
]


def generate(name: str, personality: str, text: str, out_dir: str) -> None:
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


# Both Gentle and Friendly currently generate with the same female voice.
GENERATE_FRIENDLY = True


def main() -> None:
    if not API_KEY:
        raise SystemExit("Set OMNI_HUB_GEMINI_API_KEY first (get one at https://aistudio.google.com/apikey)")

    out_dir = "output-reminders"
    os.makedirs(out_dir, exist_ok=True)

    print(f"Generating {len(GENTLE_LINES)} Gentle lines (voice: {VOICE_MAP['gentle']})...")
    for line in GENTLE_LINES:
        name = f"gentle_t{line['tier']}_{line['idx']:02d}"
        generate(name, "gentle", line["text"], out_dir)

    if GENERATE_FRIENDLY:
        print(f"\nGenerating {len(FRIENDLY_LINES)} Friendly lines (voice: {VOICE_MAP['friendly']})...")
        for line in FRIENDLY_LINES:
            name = f"friendly_t{line['tier']}_{line['idx']:02d}"
            generate(name, "friendly", line["text"], out_dir)
    else:
        print("\nSkipping Friendly (male) set for now -- set GENERATE_FRIENDLY = True to include it.")

    print("\nDone. Files in ./output-reminders/. Zip it up and send it back.")


if __name__ == "__main__":
    main()
