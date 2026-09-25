import heroMicrophone from './home-hero-microphone.webp';
import effectNormal from './effect-normal.webp';
import effectChipmunk from './effect-chipmunk.webp';
import effectFast from './effect-fast.webp';
import effectSlow from './effect-slow.webp';
import effectDeepVoice from './effect-deep-voice.webp';
import effectBabyVoice from './effect-baby-voice.webp';
import effectRobot from './effect-robot.webp';
import effectAlien from './effect-alien.webp';
import effectMonster from './effect-monster.webp';
import effectEcho from './effect-echo.webp';
import effectRadio from './effect-radio.webp';
import effectMegaphone from './effect-megaphone.webp';
import effectDistorted from './effect-distorted.webp';
import effectKaraoke from './effect-karaoke.webp';
import effectAutoTune from './effect-auto-tune.webp';
import autoTuneNotes from './auto-tune-notes.webp';
import voiceEffectsJoystick from './voice-effects-joystick.webp';
import pitchSpeedSliders from './pitch-speed-sliders.webp';
import echoReverbSoundwave from './echo-reverb-soundwave.webp';
import voiceMixerSliders from './voice-mixer-sliders.webp';
import moreToolsDots from './more-tools-dots.webp';
import shareWhatsapp from './share-whatsapp.webp';
import shareTelegram from './share-telegram.webp';
import shareInstagram from './share-instagram.webp';
import shareTiktok from './share-tiktok.webp';
import shareYoutube from './share-youtube.webp';
import shareGmail from './share-gmail.webp';
import shareBluetooth from './share-bluetooth.webp';
import shareMore from './share-more.webp';

export { heroMicrophone, autoTuneNotes };

/** Keyed by the same effect ids used in audioEffects.ts's EFFECTS list. */
export const EFFECT_IMAGES: Record<string, string> = {
  normal: effectNormal,
  chipmunk: effectChipmunk,
  fast: effectFast,
  slow: effectSlow,
  deep: effectDeepVoice,
  baby: effectBabyVoice,
  robot: effectRobot,
  alien: effectAlien,
  monster: effectMonster,
  echo: effectEcho,
  radio: effectRadio,
  megaphone: effectMegaphone,
  distorted: effectDistorted,
  karaoke: effectKaraoke,
};

/** Keyed by the VcScreenName each Home/Tools tile navigates to. */
export const TILE_IMAGES: Record<string, string> = {
  effects: voiceEffectsJoystick,
  autotune: effectAutoTune,
  'pitch-speed': pitchSpeedSliders,
  'echo-reverb': echoReverbSoundwave,
  mixer: voiceMixerSliders,
  tools: moreToolsDots,
};

/** Keyed by the same target ids used in ShareScreen.tsx's SHARE_TARGETS list. */
export const SHARE_TARGET_IMAGES: Record<string, string> = {
  whatsapp: shareWhatsapp,
  telegram: shareTelegram,
  instagram: shareInstagram,
  tiktok: shareTiktok,
  youtube: shareYoutube,
  gmail: shareGmail,
  bluetooth: shareBluetooth,
  more: shareMore,
};
