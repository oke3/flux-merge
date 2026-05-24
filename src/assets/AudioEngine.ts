export class AudioEngine {
  private ctx: AudioContext | null = null;

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

  public playMerge(level: number, comboMultiplier: number = 1) {
    const baseFreq = 200 + (level * 100);
    const freq = baseFreq * (1 + (comboMultiplier - 1) * 0.05);
    const duration = 0.1 + (level * 0.05);
    this.playTone(freq, 'sine', duration, 0.3);
  }

  public playFrenzySiren() {
    this.playTone(440, 'sawtooth', 0.1, 0.1);
    setTimeout(() => this.playTone(880, 'sawtooth', 0.1, 0.1), 100);
  }

  private ambienceOsc: OscillatorNode | null = null;

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playBackgroundAmbience() {
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
}
