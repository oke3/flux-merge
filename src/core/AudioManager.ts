// SPDX-License-Identifier: Proprietary
import { ProfileManager, type UserProfile } from './ProfileManager';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private ambienceOsc: OscillatorNode | null = null;
  private profile: UserProfile;

  constructor() {
    this.profile = ProfileManager.loadProfile();
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public updateProfile(profile: UserProfile) {
    this.profile = profile;
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(mute: boolean) {
    this.profile.settings.muteSfx = mute;
  }

  public startAmbience() {
    this.init();
    if (!this.ctx) return;

    this.ambienceOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    this.ambienceOsc.type = 'sine';
    this.ambienceOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    this.ambienceOsc.connect(gain);
    gain.connect(this.ctx.destination);
    this.ambienceOsc.start();
  }

  public setAmbiencePitch(multiplier: number) {
    if (!this.ambienceOsc || !this.ctx) return;
    this.ambienceOsc.frequency.exponentialRampToValueAtTime(80 * multiplier, this.ctx.currentTime + 0.5);
  }

  public playMerge(level: number, comboMultiplier: number = 1) {
    if (this.profile.settings.muteSfx) return;
    const baseFreq = 200 + (level * 100);
    const freq = baseFreq * (1 + (comboMultiplier - 1) * 0.05);
    const duration = 0.1 + (level * 0.05);
    this.playTone(freq, 'sine', duration, 0.3);
  }

  public playFrenzySiren() {
    this.playTone(440, 'sawtooth', 0.1, 0.1);
    setTimeout(() => this.playTone(880, 'sawtooth', 0.1, 0.1), 100);
  }

  public triggerFrenzyAudio() {
    if (this.profile.settings.muteSfx) return;
    this.setAmbiencePitch(1.5);
    this.playFrenzySiren();
  }

  public stopFrenzyAudio() {
    this.setAmbiencePitch(1);
  }

  public playUI() {
    if (this.profile.settings.muteSfx) return;
    this.playTone(600, 'square', 0.04, 0.06);
  }

  public playNotification() {
    if (this.profile.settings.muteSfx) return;
    this.playTone(880, 'sine', 0.15, 0.12);
    setTimeout(() => this.playTone(1100, 'sine', 0.15, 0.08), 80);
  }

  public playGameOver() {
    if (this.profile.settings.muteSfx) return;
    this.playTone(400, 'sawtooth', 0.3, 0.12);
    setTimeout(() => this.playTone(300, 'sawtooth', 0.3, 0.10), 150);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.5, 0.08), 300);
  }

  public playWin() {
    if (this.profile.settings.muteSfx) return;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.4, 0.10), i * 120);
    });
  }
}
