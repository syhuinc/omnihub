"""
Generates Sleep Mode's 5 personality sample lines locally using Parler-TTS Mini-Expresso
(Apache 2.0, free for commercial use, no ElevenLabs-style restrictions).

Run this on your M4 Mac. It uses the GPU via PyTorch's Metal (MPS) backend, so it's fast
even without a dedicated GPU.

Setup (one-time):
    python3 -m venv venv
    source venv/bin/activate
    pip install torch --index-url https://download.pytorch.org/whl/cpu
    pip install git+https://github.com/huggingface/parler-tts.git
    pip install soundfile

Run:
    python3 parler-tts-generate.py

Output: 5 .wav files in ./output/, one per personality. Send them all back and I'll
convert + wire them into the app the same way as the ElevenLabs samples.
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

# One line per personality, matched to the character voice already established in the app.
# Style descriptions are what Parler-TTS uses to control emotion/delivery/gender — tweak these
# and re-run for any personality if the first take doesn't land.
LINES = [
    {
        "name": "gentle",
        "text": "Hey, it's getting late. Let's get some rest. You did great today.",
        "description": "A calm, warm female speaker with a gentle, soothing tone speaks slowly and softly, very close-sounding recording with no background noise.",
    },
    {
        "name": "friendly",
        "text": "Still awake, mate? Let's get some sleep! Your pillow is waiting.",
        "description": "An upbeat, warm, casual female speaker with a friendly and cheerful tone speaks at a natural pace, very close-sounding recording with no background noise.",
    },
    {
        "name": "teasing",
        "text": "Still on your phone? Interesting strategy for being a morning person.",
        "description": "A playful, teasing male speaker with a mischievous, slightly sarcastic tone speaks at a natural pace, very close-sounding recording with no background noise.",
    },
    {
        "name": "strict",
        "text": "It's your bedtime. No more scrolling. Phone down. Now.",
        "description": "A firm, serious male speaker with a no-nonsense, commanding tone speaks slowly and deliberately, very close-sounding recording with no background noise.",
    },
    {
        "name": "savage",
        "text": "It's 12:45 AM and you're still scrolling? At this point, your pillow has given up on you.",
        "description": "A confident, sharp male speaker with a sarcastic, smirking tone speaks at a natural pace, very close-sounding recording with no background noise.",
    },
]

for line in LINES:
    print(f"Generating: {line['name']}...")
    input_ids = tokenizer(line["description"], return_tensors="pt").input_ids.to(device)
    prompt_input_ids = tokenizer(line["text"], return_tensors="pt").input_ids.to(device)
    generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_input_ids)
    audio_arr = generation.cpu().numpy().squeeze()
    out_path = f"output/sample-{line['name']}.wav"
    sf.write(out_path, audio_arr, model.config.sampling_rate)
    print(f"  saved {out_path}")

print("\nDone. Send the 5 files in ./output/ back and I'll wire them in.")
