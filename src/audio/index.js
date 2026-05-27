import { getAudioContext } from './audioContext';
import { playTick, playLanding, playFanfare, playTensionRiser, stopTensionRiser } from './wheelAudio';
import { playChestOpen, playCrateLatch, playCrateImpact } from './lootboxAudio';
import { playRaceBell, playHorseNeigh, playHoofbeat } from './raceAudio';
import { playThump, playGlassShatter, playLegendaryChime, playFlameWhoosh } from './uiAudio';

export const audio = {
  get ctx() {
    return getAudioContext();
  },
  init() {
    getAudioContext();
  },
  playTick,
  playLanding,
  playFanfare,
  playTensionRiser,
  stopTensionRiser,
  playChestOpen,
  playCrateLatch,
  playCrateImpact,
  playRaceBell,
  playHorseNeigh,
  playHoofbeat,
  playThump,
  playGlassShatter,
  playLegendaryChime,
  playFlameWhoosh
};
