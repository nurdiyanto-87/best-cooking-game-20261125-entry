// Sizzle & Serve — sound effects, synthesized in code.
// No audio files: every sound is a short WebAudio oscillator or a
// burst of filtered noise built at runtime. The context is created
// lazily on the first user gesture, so autoplay rules never block it.

export class SoundFX {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // One short tone: frequency, length in seconds, wave shape, volume.
  blip(frequency, seconds, type = 'sine', volume = 0.12) {
    if (this.muted || !this.ensure()) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + seconds + 0.02);
  }

  // A burst of white noise through a low-pass filter: chopping,
  // sizzling and the serve bell's shimmer all start here.
  noise(seconds, filterFrequency, volume = 0.15) {
    if (this.muted || !this.ensure()) return;
    const now = this.context.currentTime;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start(now);
  }

  grab() { this.blip(520, 0.07, 'triangle', 0.1); }
  chop() { this.noise(0.08, 900, 0.22); this.blip(180, 0.06, 'square', 0.08); }
  chopped() { this.blip(660, 0.09, 'triangle', 0.12); this.blip(880, 0.12, 'triangle', 0.1); }
  grillOn() { this.noise(0.5, 2400, 0.05); }
  grilled() { this.blip(740, 0.1, 'triangle', 0.12); this.blip(990, 0.14, 'triangle', 0.1); }
  plated() { this.blip(440, 0.08, 'sine', 0.12); }
  served() {
    this.blip(523, 0.12, 'triangle', 0.14);
    setTimeout(() => this.blip(659, 0.12, 'triangle', 0.14), 90);
    setTimeout(() => this.blip(784, 0.2, 'triangle', 0.14), 180);
    this.noise(0.25, 5200, 0.05);
  }
  wrong() { this.blip(220, 0.18, 'sawtooth', 0.08); this.blip(174, 0.24, 'sawtooth', 0.08); }
  // Two quick high blips when a ticket is about to run out.
  warn() { this.blip(880, 0.07, 'square', 0.07); setTimeout(() => this.blip(880, 0.07, 'square', 0.07), 110); }
  expired() { this.blip(330, 0.2, 'sine', 0.1); this.blip(247, 0.3, 'sine', 0.1); }
  newOrder() { this.blip(587, 0.08, 'triangle', 0.08); this.blip(698, 0.1, 'triangle', 0.08); }
  levelUp() {
    [523, 659, 784, 1047].forEach((note, i) => {
      setTimeout(() => this.blip(note, 0.14, 'triangle', 0.12), i * 80);
    });
  }
  gameOver() {
    [392, 330, 262].forEach((note, i) => {
      setTimeout(() => this.blip(note, 0.25, 'triangle', 0.12), i * 160);
    });
  }
}
