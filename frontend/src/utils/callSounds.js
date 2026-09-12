// Synthesized Web Audio API call ringtones, dial tones, and notification chimes.
// 100% self-contained, no external audio files required.

let audioCtx = null;
let activeLoopTimer = null;
let activeOscillators = [];

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const stopAllCallSounds = () => {
  if (activeLoopTimer) {
    clearInterval(activeLoopTimer);
    clearTimeout(activeLoopTimer);
    activeLoopTimer = null;
  }

  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (e) {
      // Ignore if already stopped
    }
  });
  activeOscillators = [];
};

// Outgoing call dial/ringback tone: dual frequency pulse (440Hz + 480Hz)
export const playOutgoingDialTone = () => {
  stopAllCallSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const playPulse = () => {
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(480, now);

    // Fade in and out gently
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.1);
    gainNode.gain.setValueAtTime(0.08, now + 1.4);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.6);
    osc2.stop(now + 1.6);

    activeOscillators.push(osc1, osc2);
  };

  playPulse();
  activeLoopTimer = setInterval(() => {
    playPulse();
  }, 3500);
};

// Incoming call ringtone: modern melodic marimba chime sequence
export const playIncomingRingtone = () => {
  stopAllCallSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 659.25, time: 0 },     // E5
    { freq: 830.61, time: 0.15 },  // G#5
    { freq: 987.77, time: 0.30 },  // B5
    { freq: 1318.51, time: 0.45 }, // E6
    { freq: 987.77, time: 0.70 },  // B5
    { freq: 1318.51, time: 0.85 }, // E6
  ];

  const playChimeSequence = () => {
    const now = ctx.currentTime;

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gainNode.gain.setValueAtTime(0, now + note.time);
      gainNode.gain.linearRampToValueAtTime(0.12, now + note.time + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.time + 0.35);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + 0.4);

      activeOscillators.push(osc);
    });
  };

  playChimeSequence();
  activeLoopTimer = setInterval(() => {
    playChimeSequence();
  }, 2200);
};

// Call connected chime
export const playCallConnected = () => {
  stopAllCallSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chords = [523.25, 659.25, 783.99]; // C5, E5, G5

  chords.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.08);

    gainNode.gain.setValueAtTime(0, now + index * 0.08);
    gainNode.gain.linearRampToValueAtTime(0.12, now + index * 0.08 + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.28);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now + index * 0.08);
    osc.stop(now + index * 0.08 + 0.3);
  });
};

// Call ended tone
export const playCallEnded = () => {
  stopAllCallSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

  gainNode.gain.setValueAtTime(0.1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.38);
};
