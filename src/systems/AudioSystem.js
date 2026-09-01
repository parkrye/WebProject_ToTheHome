/**
 * 오디오 관리 — BGM 크로스페이드, 앰비언스, SFX.
 *
 * 실제 오디오 파일이 없으면 SFX 는 WebAudio 로 간단히 합성해 대체하고,
 * BGM/앰비언스는 조용히 건너뛴다. 소리가 없어도 게임 진행에는 지장이 없다.
 */

import { MIX } from '../config.js';

/** 합성 폴백 프로필. type: tone | noise | chirp */
const SYNTH = {
  sfx_step_soft: { type: 'noise', dur: 0.07, gain: 0.12, cutoff: 900 },
  sfx_step_hard: { type: 'noise', dur: 0.05, gain: 0.16, cutoff: 2600 },
  sfx_step_water: { type: 'noise', dur: 0.12, gain: 0.14, cutoff: 1600 },
  sfx_jump: { type: 'chirp', from: 340, to: 720, dur: 0.16, gain: 0.16, wave: 'sine' },
  sfx_land: { type: 'noise', dur: 0.12, gain: 0.2, cutoff: 700 },
  sfx_dispel: { type: 'chirp', from: 880, to: 220, dur: 1.1, gain: 0.14, wave: 'sine' },
  sfx_respawn: { type: 'chirp', from: 220, to: 880, dur: 1.1, gain: 0.14, wave: 'sine' },
  sfx_dig: { type: 'noise', dur: 0.22, gain: 0.16, cutoff: 1200 },
  sfx_splash: { type: 'noise', dur: 0.3, gain: 0.18, cutoff: 2200 },
  sfx_ball: { type: 'chirp', from: 520, to: 300, dur: 0.14, gain: 0.16, wave: 'triangle' },
  sfx_sniff: { type: 'noise', dur: 0.3, gain: 0.09, cutoff: 600 },
  sfx_bark_soft: { type: 'chirp', from: 620, to: 360, dur: 0.16, gain: 0.2, wave: 'sawtooth' },
  sfx_whine: { type: 'chirp', from: 700, to: 520, dur: 0.8, gain: 0.12, wave: 'sine' },
  sfx_scratch_door: { type: 'noise', dur: 0.5, gain: 0.12, cutoff: 3200 },
  sfx_car_pass: { type: 'noise', dur: 1.2, gain: 0.14, cutoff: 500 },
  sfx_rock_fall: { type: 'noise', dur: 0.6, gain: 0.18, cutoff: 800 },
  sfx_crumble: { type: 'noise', dur: 0.5, gain: 0.16, cutoff: 1000 },
  sfx_boar_snort: { type: 'chirp', from: 180, to: 120, dur: 0.35, gain: 0.2, wave: 'sawtooth' },
  sfx_wave_rush: { type: 'noise', dur: 1.4, gain: 0.15, cutoff: 1400 },
  sfx_steam: { type: 'noise', dur: 0.7, gain: 0.12, cutoff: 4000 },
  sfx_ui_select: { type: 'tone', freq: 660, dur: 0.1, gain: 0.16, wave: 'triangle' },
  sfx_page_turn: { type: 'noise', dur: 0.25, gain: 0.1, cutoff: 3000 },
  jingle_save: { type: 'arp', notes: [523, 659, 784], dur: 0.5, gain: 0.16, wave: 'triangle' },
  jingle_stage_clear: { type: 'arp', notes: [523, 440, 349, 392], dur: 1.1, gain: 0.16, wave: 'sine' },
};

export class AudioSystem {
  constructor(game) {
    this.game = game;
    this.muted = false;
    this.bgm = null;
    this.bgmKey = null;
    this.ambience = null;
    this.ambienceKey = null;
    this._noiseBuffer = null;
  }

  get sound() {
    return this.game.sound;
  }

  get ctx() {
    return this.sound && this.sound.context ? this.sound.context : null;
  }

  setMuted(muted) {
    this.muted = muted;
    this.sound.mute = muted;
  }

  /** 브라우저 자동재생 정책 — 첫 입력에서 호출 */
  unlock() {
    const ctx = this.ctx;
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  has(key) {
    return this.game.cache.audio.exists(key);
  }

  /** BGM 전환. 같은 곡이면 아무것도 하지 않는다 */
  playBgm(scene, key, { volume = MIX.bgm, fade = MIX.crossfade } = {}) {
    if (this.bgmKey === key && this.bgm && this.bgm.isPlaying) return;

    const previous = this.bgm;
    if (previous) {
      scene.tweens.add({
        targets: previous,
        volume: 0,
        duration: fade,
        onComplete: () => previous.destroy(),
      });
    }

    this.bgmKey = key;
    if (!this.has(key)) {
      this.bgm = null;
      return;
    }

    const next = this.sound.add(key, { loop: true, volume: 0 });
    next.play();
    scene.tweens.add({ targets: next, volume, duration: fade });
    this.bgm = next;
  }

  stopBgm(scene, fade = MIX.crossfade) {
    if (!this.bgm) {
      this.bgmKey = null;
      return;
    }
    const current = this.bgm;
    this.bgm = null;
    this.bgmKey = null;
    scene.tweens.add({ targets: current, volume: 0, duration: fade, onComplete: () => current.destroy() });
  }

  /** 세이브 모션 등에서 BGM 을 잠깐 낮췄다가 되돌린다 */
  duck(scene, duration = 1600) {
    if (!this.bgm) return;
    const target = this.bgm;
    scene.tweens.add({ targets: target, volume: MIX.duckedBgm, duration: 250 });
    scene.time.delayedCall(duration, () => {
      if (target.isPlaying) scene.tweens.add({ targets: target, volume: MIX.bgm, duration: 600 });
    });
  }

  playAmbience(scene, key, volume = MIX.ambience) {
    if (this.ambienceKey === key && this.ambience && this.ambience.isPlaying) return;
    if (this.ambience) {
      const previous = this.ambience;
      scene.tweens.add({ targets: previous, volume: 0, duration: 600, onComplete: () => previous.destroy() });
    }
    this.ambienceKey = key;
    if (!this.has(key)) {
      this.ambience = null;
      return;
    }
    const next = this.sound.add(key, { loop: true, volume: 0 });
    next.play();
    scene.tweens.add({ targets: next, volume, duration: 900 });
    this.ambience = next;
  }

  stopAmbience(scene) {
    if (!this.ambience) {
      this.ambienceKey = null;
      return;
    }
    const current = this.ambience;
    this.ambience = null;
    this.ambienceKey = null;
    scene.tweens.add({ targets: current, volume: 0, duration: 500, onComplete: () => current.destroy() });
  }

  play(key, { volume = MIX.sfx, rate = 1 } = {}) {
    if (this.muted) return;
    if (this.has(key)) {
      this.sound.play(key, { volume, rate });
      return;
    }
    this.synth(key, volume);
  }

  /* --------------------------------------------------------------- */
  /* WebAudio 합성 폴백                                                */
  /* --------------------------------------------------------------- */

  noiseBuffer(ctx) {
    if (this._noiseBuffer) return this._noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 1.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuffer = buffer;
    return buffer;
  }

  synth(key, volume) {
    const profile = SYNTH[key];
    const ctx = this.ctx;
    if (!profile || !ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = (profile.gain || 0.15) * volume;
    master.connect(ctx.destination);

    if (profile.type === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = profile.cutoff || 1200;
      src.connect(filter);
      filter.connect(master);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + profile.dur);
      src.start(now);
      src.stop(now + profile.dur + 0.02);
      return;
    }

    if (profile.type === 'arp') {
      profile.notes.forEach((freq, i) => {
        const step = profile.dur / profile.notes.length;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = profile.wave || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * step);
        gain.gain.exponentialRampToValueAtTime((profile.gain || 0.15) * volume, now + i * step + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * step + step * 1.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * step);
        osc.stop(now + i * step + step * 1.8);
      });
      return;
    }

    const osc = ctx.createOscillator();
    osc.type = profile.wave || 'sine';
    if (profile.type === 'chirp') {
      osc.frequency.setValueAtTime(profile.from, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, profile.to), now + profile.dur);
    } else {
      osc.frequency.value = profile.freq || 440;
    }
    osc.connect(master);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + profile.dur);
    osc.start(now);
    osc.stop(now + profile.dur + 0.02);
  }
}
