"""
Generates Sleep Mode's Gentle + Friendly voice pools locally using Parler-TTS Mini-Expresso
(Apache 2.0, free for commercial use, no ElevenLabs-style restrictions).

Produces:
  - 5 "Hear a sample" preview lines (one per personality, incl. the locked AI-tier ones as a teaser)
  - 50 Gentle + 50 Friendly real reminder lines, pulled directly from MessageBank.java's GENERIC
    pools, so the audio matches the live nightly nag text exactly (tier-organized, ready to map
    back into the app as real recorded audio instead of on-device TTS for Normal-mode users).

Run this on your M4 Mac. Uses PyTorch's Metal (MPS) backend, so it's fast without a dedicated GPU.

Setup (one-time):
    python3 -m venv venv
    source venv/bin/activate
    pip install torch --index-url https://download.pytorch.org/whl/cpu
    pip install git+https://github.com/huggingface/parler-tts.git
    pip install soundfile

Run:
    python3 parler-tts-generate.py

Output: everything in ./output/ — send the whole folder back and I'll wire it in.
This will take a while (105 lines total); it prints progress as it goes and is safe to
re-run (skips files that already exist), so you can stop and resume anytime.
"""

import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf
import os

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Using device: {device}")

print("Loading model (first run downloads ~1.5GB, then it's cached)...")
model = ParlerTTSForConditionalGeneration.from_pretrained("parler-tts/parler-tts-mini-expresso").to(device)
tokenizer = AutoTokenizer.from_pretrained("parler-tts/parler-tts-mini-expresso")

os.makedirs("output", exist_ok=True)

GENTLE_DESC = "A calm, warm female speaker with a gentle, soothing tone speaks slowly and softly, very close-sounding recording with no background noise."
FRIENDLY_DESC = "An upbeat, warm, casual female speaker with a friendly and cheerful tone speaks at a natural pace, very close-sounding recording with no background noise."

# The 5 "Hear a sample" preview lines (unchanged from before, now regenerated on a properly
# licensed model instead of the free-tier ElevenLabs key).
SAMPLE_LINES = [
    {"name": "sample-gentle", "text": "Hey, it's getting late. Let's get some rest. You did great today.", "description": GENTLE_DESC},
    {"name": "sample-friendly", "text": "Still awake, mate? Let's get some sleep! Your pillow is waiting.", "description": FRIENDLY_DESC},
    {"name": "sample-teasing", "text": "Still on your phone? Interesting strategy for being a morning person.", "description": "A playful, teasing male speaker with a mischievous, slightly sarcastic tone speaks at a natural pace, very close-sounding recording with no background noise."},
    {"name": "sample-strict", "text": "It's your bedtime. No more scrolling. Phone down. Now.", "description": "A firm, serious male speaker with a no-nonsense, commanding tone speaks slowly and deliberately, very close-sounding recording with no background noise."},
    {"name": "sample-savage", "text": "It's 12:45 AM and you're still scrolling? At this point, your pillow has given up on you.", "description": "A confident, sharp male speaker with a sarcastic, smirking tone speaks at a natural pace, very close-sounding recording with no background noise."},
]

GENTLE_LINES = [
    {'tier': 0, 'idx': 0, 'text': 'It\'s about time to rest. Good night.'},
    {'tier': 0, 'idx': 1, 'text': 'Bedtime is here. Sweet dreams whenever you\'re ready.'},
    {'tier': 0, 'idx': 2, 'text': 'It\'s late now. Maybe it\'s time to close your eyes.'},
    {'tier': 0, 'idx': 3, 'text': 'The day is done. Let yourself rest now.'},
    {'tier': 0, 'idx': 4, 'text': 'It\'s okay to stop here. Sleep is calling gently.'},
    {'tier': 0, 'idx': 5, 'text': 'Nighttime is here. Your body could use the rest.'},
    {'tier': 0, 'idx': 6, 'text': 'Softly now — it\'s time to wind down.'},
    {'tier': 0, 'idx': 7, 'text': 'You\'ve done enough today. Time to rest.'},
    {'tier': 0, 'idx': 8, 'text': 'The stars are out. Maybe you should be resting too.'},
    {'tier': 0, 'idx': 9, 'text': 'It\'s a good time to let your eyes close.'},
    {'tier': 0, 'idx': 10, 'text': 'Rest is waiting for you, whenever you\'re ready.'},
    {'tier': 0, 'idx': 11, 'text': 'A peaceful night starts with putting the phone down.'},
    {'tier': 1, 'idx': 12, 'text': 'It\'s getting later. Your rest matters.'},
    {'tier': 1, 'idx': 13, 'text': 'A little more sleep would feel better than a little more scrolling.'},
    {'tier': 1, 'idx': 14, 'text': 'Whenever you\'re ready, bed is right there for you.'},
    {'tier': 1, 'idx': 15, 'text': 'It\'s later than it feels. Maybe it\'s time.'},
    {'tier': 1, 'idx': 16, 'text': 'Your body\'s probably ready for sleep, even if your mind isn\'t.'},
    {'tier': 1, 'idx': 17, 'text': 'A few more minutes always turns into a few more hours.'},
    {'tier': 1, 'idx': 18, 'text': 'I know it\'s hard to put down, but rest would feel nice.'},
    {'tier': 1, 'idx': 19, 'text': 'The night is getting long. Let\'s ease into sleep.'},
    {'tier': 1, 'idx': 20, 'text': 'You\'ll feel so much better with a little more sleep.'},
    {'tier': 1, 'idx': 21, 'text': 'It\'s alright to stop scrolling now.'},
    {'tier': 1, 'idx': 22, 'text': 'Sleep is patient, but it\'s still waiting.'},
    {'tier': 1, 'idx': 23, 'text': 'This is a gentle reminder that bed exists.'},
    {'tier': 2, 'idx': 24, 'text': 'I really think it\'s time to put the phone down now.'},
    {'tier': 2, 'idx': 25, 'text': 'You\'ll thank yourself tomorrow if you sleep now.'},
    {'tier': 2, 'idx': 26, 'text': 'It\'s been a while. Let\'s get you some rest.'},
    {'tier': 2, 'idx': 27, 'text': 'I care about you, so I\'m asking again — please rest.'},
    {'tier': 2, 'idx': 28, 'text': 'Your eyes need a break more than your feed does.'},
    {'tier': 2, 'idx': 29, 'text': 'Let\'s be kind to tomorrow-you and sleep now.'},
    {'tier': 2, 'idx': 30, 'text': 'It\'s really time now. I promise it\'ll feel good.'},
    {'tier': 2, 'idx': 31, 'text': 'Just set it down. That\'s all I\'m asking.'},
    {'tier': 2, 'idx': 32, 'text': 'You deserve real rest tonight.'},
    {'tier': 2, 'idx': 33, 'text': 'This has gone on a while — let\'s close it out gently.'},
    {'tier': 2, 'idx': 34, 'text': 'I won\'t stop caring, so I won\'t stop asking. Please sleep.'},
    {'tier': 2, 'idx': 35, 'text': 'Your rest is worth more than one more scroll.'},
    {'tier': 2, 'idx': 36, 'text': 'Let\'s make tonight a good night\'s sleep.'},
    {'tier': 3, 'idx': 37, 'text': 'Please, just put it down and rest now.'},
    {'tier': 3, 'idx': 38, 'text': 'Tomorrow-you is quietly hoping you\'ll sleep soon.'},
    {'tier': 3, 'idx': 39, 'text': 'One last gentle nudge — go to sleep.'},
    {'tier': 3, 'idx': 40, 'text': 'I\'m still here, still gently asking — please sleep.'},
    {'tier': 3, 'idx': 41, 'text': 'This is me, softly insisting. Time for bed.'},
    {'tier': 3, 'idx': 42, 'text': 'I promise I\'ll stop once you close your eyes.'},
    {'tier': 3, 'idx': 43, 'text': 'Just this once, listen to the gentle voice. Sleep now.'},
    {'tier': 3, 'idx': 44, 'text': 'You\'re allowed to stop. Let\'s rest, together.'},
    {'tier': 3, 'idx': 45, 'text': 'I\'ll keep whispering until you finally rest.'},
    {'tier': 3, 'idx': 46, 'text': 'Okay, one more nudge — the softest one yet. Sleep.'},
    {'tier': 3, 'idx': 47, 'text': 'This is my last gentle ask tonight. Please rest.'},
    {'tier': 3, 'idx': 48, 'text': 'Even gentle reminders wear thin — let\'s sleep now.'},
    {'tier': 3, 'idx': 49, 'text': 'I\'m not upset, just worried. Please get some rest.'},
]

FRIENDLY_LINES = [
    {'tier': 0, 'idx': 0, 'text': 'It\'s time to sleep. Good night!'},
    {'tier': 0, 'idx': 1, 'text': 'Bedtime\'s here — catch you in the morning.'},
    {'tier': 0, 'idx': 2, 'text': 'Alright, that\'s the signal. Time for bed.'},
    {'tier': 0, 'idx': 3, 'text': 'That\'s a wrap for today! Time to sleep.'},
    {'tier': 0, 'idx': 4, 'text': 'Okay, bedtime\'s officially here. Night!'},
    {'tier': 0, 'idx': 5, 'text': 'Cue the bedtime music — let\'s go!'},
    {'tier': 0, 'idx': 6, 'text': 'Time to call it a night, friend.'},
    {'tier': 0, 'idx': 7, 'text': 'Alright, phone down, eyes closed. Let\'s do this.'},
    {'tier': 0, 'idx': 8, 'text': 'That\'s your cue — sleep mode, engage!'},
    {'tier': 0, 'idx': 9, 'text': 'Bedtime\'s knocking. Better answer it.'},
    {'tier': 0, 'idx': 10, 'text': 'Time flies, and so should you — off to bed!'},
    {'tier': 0, 'idx': 11, 'text': 'Okay, that\'s a wrap. See you in dreamland!'},
    {'tier': 1, 'idx': 12, 'text': 'It\'s getting late. Maybe you should sleep.'},
    {'tier': 1, 'idx': 13, 'text': 'Your bed\'s getting a little lonely over there.'},
    {'tier': 1, 'idx': 14, 'text': 'You said one more minute about an hour ago.'},
    {'tier': 1, 'idx': 15, 'text': 'Still scrolling, huh? Classic you.'},
    {'tier': 1, 'idx': 16, 'text': 'Your bed called. It says it misses you.'},
    {'tier': 1, 'idx': 17, 'text': 'One more minute, right? Sure it is.'},
    {'tier': 1, 'idx': 18, 'text': 'You know it\'s later than you think.'},
    {'tier': 1, 'idx': 19, 'text': 'Tick tock — sleep o\'clock\'s not far off.'},
    {'tier': 1, 'idx': 20, 'text': 'This is your friendly nudge before it gets weird.'},
    {'tier': 1, 'idx': 21, 'text': 'Not gonna lie, it\'s getting pretty late.'},
    {'tier': 1, 'idx': 22, 'text': 'Your future self is side-eyeing you right now.'},
    {'tier': 1, 'idx': 23, 'text': 'Come on, you know the drill by now.'},
    {'tier': 2, 'idx': 24, 'text': 'Still using your phone? Come on, go to sleep.'},
    {'tier': 2, 'idx': 25, 'text': 'Even your battery wants you to go to sleep at this point.'},
    {'tier': 2, 'idx': 26, 'text': 'Whatever it is, it\'ll still be there tomorrow.'},
    {'tier': 2, 'idx': 27, 'text': 'Okay but seriously, put the phone down.'},
    {'tier': 2, 'idx': 28, 'text': 'We\'re way past \'just a bit longer\' territory.'},
    {'tier': 2, 'idx': 29, 'text': 'Your thumbs need a break. Sleep time.'},
    {'tier': 2, 'idx': 30, 'text': 'I\'m gonna keep bugging you, you know that right?'},
    {'tier': 2, 'idx': 31, 'text': 'This is your friendly-but-firm reminder. Sleep.'},
    {'tier': 2, 'idx': 32, 'text': 'You\'re really testing my patience here, buddy.'},
    {'tier': 2, 'idx': 33, 'text': 'Alright, no more excuses. Bed. Now-ish.'},
    {'tier': 2, 'idx': 34, 'text': 'Your screen time report is judging you.'},
    {'tier': 2, 'idx': 35, 'text': 'Come on, we both know you should sleep.'},
    {'tier': 2, 'idx': 36, 'text': 'This isn\'t a drill anymore. Sleep time.'},
    {'tier': 3, 'idx': 37, 'text': 'I\'m not stopping until you put this thing down.'},
    {'tier': 3, 'idx': 38, 'text': 'This is nag number who-knows-what. Sleep. Now.'},
    {'tier': 3, 'idx': 39, 'text': 'Put. The phone. Down. Please.'},
    {'tier': 3, 'idx': 40, 'text': 'Okay, I\'m basically a broken record at this point. Sleep!'},
    {'tier': 3, 'idx': 41, 'text': 'I will keep buzzing you all night if I have to.'},
    {'tier': 3, 'idx': 42, 'text': 'This is peak stubbornness. Please just sleep.'},
    {'tier': 3, 'idx': 43, 'text': 'You versus sleep, round infinity. Just sleep already.'},
    {'tier': 3, 'idx': 44, 'text': 'I\'m one nag away from staging an intervention.'},
    {'tier': 3, 'idx': 45, 'text': 'Seriously, put it down. I\'m not joking anymore.'},
    {'tier': 3, 'idx': 46, 'text': 'Seriously — phone down, sleep now.'},
    {'tier': 3, 'idx': 47, 'text': 'This is the last straw, buddy. Sleep. Please.'},
    {'tier': 3, 'idx': 48, 'text': 'You win the award for most ignored bedtime reminder.'},
    {'tier': 3, 'idx': 49, 'text': 'Okay I give up being subtle. Go. To. Sleep.'},
]

def generate(name, text, description):
    out_path = f"output/{name}.wav"
    if os.path.exists(out_path):
        print(f"  skip {out_path} (already exists)")
        return
    input_ids = tokenizer(description, return_tensors="pt").input_ids.to(device)
    prompt_input_ids = tokenizer(text, return_tensors="pt").input_ids.to(device)
    generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_input_ids)
    audio_arr = generation.cpu().numpy().squeeze()
    sf.write(out_path, audio_arr, model.config.sampling_rate)
    print(f"  saved {out_path}")

print(f"\nGenerating {len(SAMPLE_LINES)} sample-preview lines...")
for line in SAMPLE_LINES:
    generate(line["name"], line["text"], line["description"])

print(f"\nGenerating {len(GENTLE_LINES)} Gentle reminder lines...")
for line in GENTLE_LINES:
    name = f"gentle_t{line['tier']}_{line['idx']:02d}"
    generate(name, line["text"], GENTLE_DESC)

print(f"\nGenerating {len(FRIENDLY_LINES)} Friendly reminder lines...")
for line in FRIENDLY_LINES:
    name = f"friendly_t{line['tier']}_{line['idx']:02d}"
    generate(name, line["text"], FRIENDLY_DESC)

print("\nDone. Zip up ./output/ and send it back — 105 files total.")
