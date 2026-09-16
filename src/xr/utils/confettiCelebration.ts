import confetti from 'canvas-confetti';

export type LabTheme = 'chemistry' | 'astrophysics' | 'biology' | 'optics' | 'general';

/**
 * Triggers a celebratory confetti animation customized to the scientific discipline.
 */
export function triggerLabConfetti(
  theme: LabTheme = 'general',
  options?: { particleCount?: number; originY?: number; spread?: number }
) {
  try {
    const originY = options?.originY ?? 0.65;
    const particleCount = options?.particleCount ?? 90;
    const spread = options?.spread ?? 75;

    let colors: string[] = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899'];

    if (theme === 'chemistry') {
      // Energetic molecular reaction: flame reds, thermic amber, electron cyan
      colors = ['#ef4444', '#f59e0b', '#38bdf8', '#fbbf24', '#f97316'];
    } else if (theme === 'astrophysics') {
      // Celestial cosmic: nebula purple, starlight gold, deep violet, pulsar cyan
      colors = ['#a855f7', '#8b5cf6', '#eab308', '#38bdf8', '#ec4899'];
    } else if (theme === 'biology') {
      // Bio-luminescence: chlorophyll emerald, cyan, genomic purple, DNA gold
      colors = ['#10b981', '#34d399', '#06b6d4', '#a855f7', '#fbbf24'];
    } else if (theme === 'optics') {
      // Laser spectrum & prism dispersion: rainbow hues
      colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];
    }

    // First burst
    confetti({
      particleCount,
      spread,
      origin: { y: originY, x: 0.5 },
      colors,
      disableForReducedMotion: true,
    });

    // Secondary flanking bursts for grand scientific achievements
    setTimeout(() => {
      confetti({
        particleCount: Math.round(particleCount * 0.4),
        angle: 60,
        spread: 55,
        origin: { x: 0.15, y: originY },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: Math.round(particleCount * 0.4),
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: originY },
        colors,
        disableForReducedMotion: true,
      });
    }, 150);
  } catch (err) {
    console.warn('[Confetti] Failed to launch celebration animation:', err);
  }
}
