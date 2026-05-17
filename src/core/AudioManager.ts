/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { AudioEngine } from '../assets/AudioEngine';
import { ProfileManager, type UserProfile } from './ProfileManager';

/**
 * AudioManager handles high-level audio orchestration for the game.

 * It wraps the low-level AudioEngine to provide semantic audio triggers
 * and manage audio-related state transitions.
 */
export class AudioManager {
  private engine: AudioEngine;
  private profile: UserProfile;

  constructor() {
    this.engine = new AudioEngine();
    this.profile = ProfileManager.loadProfile();
  }

  public updateProfile(profile: UserProfile) {
    this.profile = profile;
  }

  /**
   * Starts the background ambient loop.
   */
  public startAmbience() {
    this.engine.playBackgroundAmbience();
  }

  /**
   * Triggers the audio feedback for a node merge.
   * @param level The level of the newly merged node.
   */
  public playMerge(level: number) {
    if (this.profile.settings.muteSfx) return;
    this.engine.playMerge(level);
  }

  /**
   * Triggers the high-intensity audio for Frenzy mode.
   */
  public triggerFrenzyAudio() {
    if (this.profile.settings.muteSfx) return;
    this.engine.setAmbiencePitch(1.5);
    this.engine.playFrenzySiren();
  }

  /**
   * Resets the audio state after Frenzy mode ends.
   */
  public stopFrenzyAudio() {
    this.engine.setAmbiencePitch(1);
  }

  /**
   * Triggers the unique audio for a Singularity/Supernova event.
   */
  public playSingularity() {
    if (this.profile.settings.muteSfx) return;
    this.engine.playSingularity();
  }
}
