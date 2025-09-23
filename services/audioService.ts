// services/audioService.ts

let audioContext: AudioContext | null = null;
let ambianceNodes: { oscillator: OscillatorNode, gain: GainNode } | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined' && !audioContext) {
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
        console.error("Web Audio API is not supported in this browser");
        return null;
    }
  }
  return audioContext;
};

// Generic function to play a sound with specific parameters
const playSound = (type: OscillatorType, frequency: number, duration: number, volume: number = 0.5) => {
    const context = getAudioContext();
    if (!context || context.state === 'suspended') return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gainNode.gain.setValueAtTime(volume, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
};

export const playFootstep = () => {
    playSound('sine', 100, 0.1, 0.1);
};

export const playEnemyAttack = (type: 'minion' | 'boss' | 'bat') => {
    switch(type) {
        case 'boss':
            playSound('sawtooth', 150, 0.3, 0.4); // Deep slash
            playSound('square', 100, 0.3, 0.3);   // Heavy feel
            break;
        case 'bat':
            playSound('square', 1500, 0.1, 0.2); // Swoop
            break;
        case 'minion':
        default:
            playSound('triangle', 440, 0.2, 0.25); // Swoosh
            break;
    }
};

export const playBossProjectile = () => {
    playSound('sawtooth', 300, 0.2, 0.3);
};

export const playAmbiance = (level: number) => {
  // All background sound effects have been removed as per user request.
};

export const stopAmbiance = () => {
  // All background sound effects have been removed as per user request.
};


export const playPlayerAttack = () => {
    playSound('triangle', 880, 0.15, 0.2);
    playSound('sine', 1200, 0.1, 0.15);
};

export const playCloneSpell = () => {
    playSound('sine', 600, 0.3, 0.3);
    setTimeout(() => playSound('sine', 900, 0.2, 0.3), 80);
};

export const playCloneAttack = () => {
    playSound('triangle', 880, 0.15, 0.1); // Softer than player attack
};

export const playManaShockwave = () => {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.4, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.4);
};

export const playEnemyHit = () => {
    playSound('square', 220, 0.1, 0.3);
};

export const playPlayerHit = () => {
    const context = getAudioContext();
    if (!context || context.state === 'suspended') return;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(220, context.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.5, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
};

export const playEnemyDefeat = () => {
    playSound('sine', 110, 0.3, 0.5);
};

export const playLightningStrike = () => {
    const context = getAudioContext();
    if (!context) return;
    playSound('square', 1000, 0.1, 0.3);
    playSound('sawtooth', 500, 0.2, 0.2);
};

export const playChargeStart = () => {
    playSound('sine', 100, 0.3, 0.2);
};

export const playAzureChargeStart = () => {
    playSound('sawtooth', 80, 0.4, 0.15);
};

export const playChargedAttack = () => {
    const context = getAudioContext();
    if (!context) return;
    playSound('sawtooth', 50, 0.8, 0.6);
    playSound('square', 100, 0.7, 0.5);
};

export const playAzureLightningFire = () => {
    const context = getAudioContext();
    if (!context) return;
    playSound('square', 1200, 0.2, 0.4);
    playSound('sawtooth', 600, 0.3, 0.3);
};


export const playManaRecovery = () => {
    playSound('sine', 800, 0.2, 0.3);
    setTimeout(() => playSound('sine', 1200, 0.2, 0.3), 50);
};

export const playHealthRecovery = () => {
    playSound('sine', 600, 0.2, 0.35);
    setTimeout(() => playSound('sine', 900, 0.2, 0.35), 70);
};

export const playVictory = () => {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((note, i) => {
        setTimeout(() => playSound('triangle', note, 0.15, 0.4), i * 100);
    });
};

export const playGameOver = () => {
    const notes = [440, 330, 220, 110];
    notes.forEach((note, i) => {
        setTimeout(() => playSound('sawtooth', note, 0.2, 0.4), i * 150);
    });
};

export const playStartGame = () => {
    playSound('sine', 440, 0.1, 0.3);
    setTimeout(() => playSound('sine', 660, 0.1, 0.3), 100);
};

export const initAudio = () => {
    const context = getAudioContext();
    if (context && context.state === 'suspended') {
        context.resume().catch(err => console.error("Could not resume audio context:", err));
    }
};