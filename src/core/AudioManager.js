/**
 * AudioManager
 * 
 * Handles:
 * 1. Custom audio file loading from `public/audio/` (bgm.mp3, dance.mp3, fire.mp3, water.mp3, chime.mp3).
 * 2. Elegant synthesized Web Audio API fallbacks when custom files are not present.
 * 3. Proximity/Zone based volume fading (fireplace at cottage, water at koi pond, dance at gazebo).
 * 4. User-gesture unlocking and mute/unmute toggling.
 */
export class AudioManager {
  constructor() {
    this.isMuted = false;
    this.audioUnlocked = false;
    this.masterGain = null;
    this.audioCtx = null;

    // Track audio elements for files
    this.tracks = {};
    this.zones = [];

    // Synthesizer state
    this.synthInterval = null;
    this.ambientGain = null;

    this.worldAudioActive = false;
    this._initAudioContext();
    this._loadAudioTracks();
  }

  startWorldAudio() {
    this.worldAudioActive = true;
    if (!this.audioUnlocked) {
      this._unlock();
    } else {
      if (this.tracks.bgm && !this.isMuted) {
        this.tracks.bgm.play().catch(() => {});
      }
    }
  }

  _initAudioContext() {
    this._unlock = () => {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
          this.masterGain = this.audioCtx.createGain();
          this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
          this.masterGain.connect(this.audioCtx.destination);
          this._setupAmbientSynth();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.audioUnlocked = true;

      // Start BGM only if world has been entered and not muted
      if (this.worldAudioActive && this.tracks.bgm && !this.isMuted) {
        this.tracks.bgm.play().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', this._unlock, { once: true });
    window.addEventListener('keydown', this._unlock, { once: true });
  }

  _loadAudioTracks() {
    const candidates = [
      { id: 'bgm', file: '/audio/bgm.mp3', loop: true, volume: 0.35 },
      { id: 'dance', file: '/audio/dance.mp3', loop: true, volume: 0.6 },
      { id: 'fire', file: '/audio/fire.mp3', loop: true, volume: 0.3 },
      { id: 'water', file: '/audio/water.mp3', loop: true, volume: 0.25 },
      { id: 'chime', file: '/audio/chime.mp3', loop: false, volume: 0.5 }
    ];

    candidates.forEach(({ id, file, loop, volume }) => {
      const audio = new Audio();
      audio.src = file;
      audio.loop = loop;
      audio.volume = volume;
      audio.preload = 'auto';
      this.tracks[id] = audio;

      audio.addEventListener('canplaythrough', () => {
        if (id === 'bgm' && this.audioUnlocked && !this.isMuted) {
          audio.play().catch(() => {});
        }
      });

      audio.addEventListener('error', (e) => {
        console.log(`Audio track ${id} not loaded from ${file}`);
      });
    });
  }

  _setupAmbientSynth() {
    if (!this.audioCtx || !this.masterGain) return;

    this.ambientGain = this.audioCtx.createGain();
    this.ambientGain.gain.value = 0.08;
    this.ambientGain.connect(this.masterGain);

    // Warm, peaceful pentatonic notes (E-flat major / G / B-flat / C)
    const notes = [155.56, 196.00, 233.08, 261.63, 311.13, 392.00];

    const playHarmonic = () => {
      if (!this.worldAudioActive || this.isMuted || !this.audioUnlocked || this.tracks.bgm) return;
      if (!this.audioCtx || this.audioCtx.state !== 'running') return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const freq = notes[Math.floor(Math.random() * notes.length)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(now);
      osc.stop(now + 4.6);
    };

    // Trigger gentle notes every few seconds
    this.synthInterval = setInterval(playHarmonic, 3400);
  }

  playChime() {
    if (this.isMuted) return;

    if (this.tracks.chime) {
      this.tracks.chime.currentTime = 0;
      this.tracks.chime.play().catch(() => {});
      return;
    }

    if (!this.audioCtx || !this.masterGain) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    // Sweet multi-note chime chord: C6 - E6 - G6 - B6
    const chord = [1046.50, 1318.51, 1567.98, 1975.53];
    chord.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime + i * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  playDanceMusic() {
    if (this.isMuted) return;

    if (!this.tracks.dance) {
      const audio = new Audio('/audio/dance.mp3');
      audio.loop = true;
      audio.volume = 0.75;
      this.tracks.dance = audio;
    }

    if (this.tracks.dance) {
      if (this.tracks.bgm) this.tracks.bgm.pause();
      this.tracks.dance.currentTime = 0;
      this.tracks.dance.play().catch((err) => {
        console.warn('Dance music play error:', err);
      });
      return;
    }

    // Play richer celebration synth if custom music file is not yet dropped
    if (!this.audioCtx || !this.masterGain) return;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    notes.forEach((f, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime + i * 0.15;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 2.6);
    });
  }

  stopDanceMusic() {
    if (this.tracks.dance) {
      this.tracks.dance.pause();
    }
    if (this.tracks.bgm && !this.isMuted && this.audioUnlocked) {
      this.tracks.bgm.play().catch(() => {});
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.7,
        this.audioCtx.currentTime
      );
    }

    Object.values(this.tracks).forEach((t) => {
      t.muted = this.isMuted;
    });

    return this.isMuted;
  }

  update(playerPos) {
    if (!playerPos || this.isMuted) return;

    // Positional sound updates for fire/water if files present
    if (this.tracks.fire) {
      const distFire = Math.hypot(playerPos.x - (-10.5), playerPos.z - (-4.5));
      const fireVol = Math.max(0, Math.min(0.4, 1 - distFire / 12));
      this.tracks.fire.volume = fireVol;
      if (fireVol > 0.02 && this.tracks.fire.paused && this.audioUnlocked) {
        this.tracks.fire.play().catch(() => {});
      }
    }

    if (this.tracks.water) {
      const distWater = Math.hypot(playerPos.x - 11, playerPos.z - (-21));
      const waterVol = Math.max(0, Math.min(0.35, 1 - distWater / 16));
      this.tracks.water.volume = waterVol;
      if (waterVol > 0.02 && this.tracks.water.paused && this.audioUnlocked) {
        this.tracks.water.play().catch(() => {});
      }
    }
  }
}
