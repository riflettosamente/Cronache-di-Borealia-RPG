// Modulo Audio procedurale basato su Web Audio API nativa
// Genera effetti sonori RPG immediati senza dipendenze o file esterni

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Riproduce un effetto sonoro sintetizzato specifico per la professione di raccolta
 */
export function playGatherSound(professione: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (professione) {
      case "Estrazione": {
        // Rintocco cristallino/metallico di piccone e gemma
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(1174.66, now); // D6
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.04);
        osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(2349.32, now); // D7 (armonica brillante)
        osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.2);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
        break;
      }

      case "Taglialegna": {
        // Colpo secco e corposo di taglio legno (colpo sordo + schiocco)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        // Aggiungi un secondo click di rimbalzo rapido
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(320, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(0.2, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.25);
        break;
      }

      case "Erboristeria": {
        // Arpeggio delicato e ascendente naturale (raccolta erbe/funghi)
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.06;

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, start);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + 0.25);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.setValueAtTime(0.18, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.38);
        });
        break;
      }

      case "Caccia": {
        // Scatto d'aria e presa rapida (whoosh + snap)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        // Click di cattura
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(600, now + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(900, now + 0.18);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(0.25, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.25);
        break;
      }

      case "Pesca": {
        // Goccia d'acqua limpida e sciabordio (water plop)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(860, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.22);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      default: {
        // Effetto generico di raccolta
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
    }
  } catch {
    // Gestione silenziosa in caso di restrizioni audio del browser
  }
}
