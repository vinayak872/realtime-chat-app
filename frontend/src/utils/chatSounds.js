// Web Audio API synthesized notification chimes
let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Gentle pleasant glass ping for incoming messages (like Telegram/Slack)
export const playIncomingMessageSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First tone (higher glass harmonic)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second resonant tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6

    gain2.gain.setValueAtTime(0.12, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.06);
    osc2.stop(now + 0.4);
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
};

// Subtle soft swoosh/pop for sent message
export const playSentMessageSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (err) {
    console.warn('Audio sent chime error:', err);
  }
};

// HTML5 Desktop Notification Helper
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showDesktopNotification = ({ title, body, icon, onClick }) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/vite.svg',
      tag: 'chat-message',
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  } catch (err) {
    console.warn('Notification error:', err);
  }
};
