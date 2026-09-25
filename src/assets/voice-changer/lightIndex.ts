/** Light-theme counterparts of index.ts's icon images. The dark set's character/effect icons
 *  carry a translucent glow baked into the art (by design, for a dark backdrop) — no amount of
 *  alpha-curve tuning turns that into a crisp opaque icon for a white card (verified: even an
 *  aggressive alpha cutoff still left a visible color tint while eating real detail). These are a
 *  separate, properly opaque asset pack made for light backgrounds instead. No hero image here —
 *  the studio-mic photo isn't theme-dependent and keeps using the one in index.ts. */
import effectNormal from './light/effect-normal.webp';
import effectChipmunk from './light/effect-chipmunk.webp';
import effectFast from './light/effect-fast.webp';
import effectSlow from './light/effect-slow.webp';
import effectDeepVoice from './light/effect-deep-voice.webp';
import effectBabyVoice from './light/effect-baby-voice.webp';
import effectRobot from './light/effect-robot.webp';
import effectAlien from './light/effect-alien.webp';
import effectMonster from './light/effect-monster.webp';
import effectEcho from './light/effect-echo.webp';
import effectRadio from './light/effect-radio.webp';
import effectMegaphone from './light/effect-megaphone.webp';
import effectDistorted from './light/effect-distorted.webp';
import effectKaraoke from './light/effect-karaoke.webp';
import effectAutoTune from './light/effect-auto-tune.webp';
import autoTuneNotesLight from './light/auto-tune-notes.webp';
import voiceEffectsJoystick from './light/voice-effects-joystick.webp';
import pitchSpeedSliders from './light/pitch-speed-sliders.webp';
import echoReverbSoundwave from './light/echo-reverb-soundwave.webp';
import voiceMixerSliders from './light/voice-mixer-sliders.webp';
import moreToolsDots from './light/more-tools-dots.webp';
import shareWhatsapp from './light/share-whatsapp.webp';
import shareTelegram from './light/share-telegram.webp';
import shareInstagram from './light/share-instagram.webp';
import shareTiktok from './light/share-tiktok.webp';
import shareYoutube from './light/share-youtube.webp';
import shareGmail from './light/share-gmail.webp';
import shareBluetooth from './light/share-bluetooth.webp';
import shareMore from './light/share-more.webp';

export { autoTuneNotesLight };

export const EFFECT_IMAGES_LIGHT: Record<string, string> = {
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

export const TILE_IMAGES_LIGHT: Record<string, string> = {
  effects: voiceEffectsJoystick,
  autotune: effectAutoTune,
  'pitch-speed': pitchSpeedSliders,
  'echo-reverb': echoReverbSoundwave,
  mixer: voiceMixerSliders,
  tools: moreToolsDots,
};

export const SHARE_TARGET_IMAGES_LIGHT: Record<string, string> = {
  whatsapp: shareWhatsapp,
  telegram: shareTelegram,
  instagram: shareInstagram,
  tiktok: shareTiktok,
  youtube: shareYoutube,
  gmail: shareGmail,
  bluetooth: shareBluetooth,
  more: shareMore,
};
