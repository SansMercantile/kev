/**
 * Step-by-step lab guides (LabGuideOverlay).
 *
 * Each step names a real bench control with a CSS selector, and the lab
 * components carry matching `data-guide="..."` attributes on those controls.
 * The overlay highlights the element in place (outline + pulse, scrolled into
 * view) and explains what to do - it never reaches into the lab's internals
 * or changes any value itself, so the student still performs every action.
 */

export interface LabGuideStep {
  label: string;
  hint: string;
  /** CSS selector; steps whose selector matches nothing are skipped politely. */
  selector: string;
}

export interface LabGuide {
  labId: 'chemistry' | 'optics' | 'astrophysics' | 'biology';
  title: string;
  steps: LabGuideStep[];
}

export const LAB_GUIDES: LabGuide[] = [
  {
    labId: 'chemistry',
    title: 'Chemistry bench: build a molecule',
    steps: [
      {
        label: 'Pick a molecule preset',
        hint: 'Choose the molecule you are studying (for example SO2 or H2O). The bench rebuilds the 3D structure from the real bond data.',
        selector: '[data-guide="chem-preset"]',
      },
      {
        label: 'Watch the geometry',
        hint: 'Read the bond angle and shape in the info panel - lone pairs squeeze angles below the ideal tetrahedral 109.5 degrees (VSEPR).',
        selector: '[data-guide="chem-info"]',
      },
      {
        label: 'Set the temperature',
        hint: 'Drag the temperature slider and watch the atoms vibrate. Temperature is average kinetic energy - hotter means faster, wider motion.',
        selector: '[data-guide="chem-temperature"]',
      },
      {
        label: 'Toggle the dipole',
        hint: 'Switch the dipole vector on to see whether the bond polarities cancel. Bent molecules stay polar; symmetric ones go nonpolar.',
        selector: '[data-guide="chem-dipole"]',
      },
      {
        label: 'Capture your result',
        hint: 'Use the snapshot button to save the current state to your notebook evidence.',
        selector: '[data-guide="chem-capture"]',
      },
    ],
  },
  {
    labId: 'optics',
    title: 'Optics bench: trace a ray',
    steps: [
      {
        label: 'Aim the incident ray',
        hint: 'Drag the angle of incidence. Snell\'s law says n1 sin(theta1) = n2 sin(theta2) - steeper angles bend more. Push past the critical angle and total internal reflection kicks in.',
        selector: '[data-guide="optics-angle"]',
      },
      {
        label: 'Change the glass',
        hint: 'Raise the refractive index of the medium. Denser glass slows the light more and bends the ray harder.',
        selector: '[data-guide="optics-index"]',
      },
      {
        label: 'Sweep the wavelength',
        hint: 'Try red, then violet. Index depends slightly on wavelength, so colours separate - that is dispersion, the reason prisms make rainbows.',
        selector: '[data-guide="optics-wavelength"]',
      },
      {
        label: 'Record the trace',
        hint: 'Snapshot the ray path with the current numbers visible.',
        selector: '[data-guide="optics-capture"]',
      },
    ],
  },
  {
    labId: 'astrophysics',
    title: 'Planetarium: run an orbit',
    steps: [
      {
        label: 'Select a body',
        hint: 'Choose which planet or moon to focus. Its semi-major axis and eccentricity come from real ephemeris data.',
        selector: '[data-guide="astro-body"]',
      },
      {
        label: 'Change the time scale',
        hint: 'Speed time up to watch whole orbital periods, or slow down to study one pass closely. Notice the body speeds up near periapsis - Kepler\'s second law (equal areas in equal times).',
        selector: '[data-guide="astro-timescale"]',
      },
      {
        label: 'Tune gravity',
        hint: 'Adjust the gravity multiplier and see how strongly the star holds the orbit. Orbits are a balance of inertia and gravity.',
        selector: '[data-guide="astro-gravity"]',
      },
      {
        label: 'Read the telemetry',
        hint: 'Speed, distance and period update live - compare the period with Kepler\'s third law (T^2 proportional to a^3).',
        selector: '[data-guide="astro-telemetry"]',
      },
    ],
  },
  {
    labId: 'biology',
    title: 'Cell lab: explore and transcribe',
    steps: [
      {
        label: 'Open the cell view',
        hint: 'Switch to the cell tab to load the 3D organelle model.',
        selector: '[data-guide="bio-cell-tab"]',
      },
      {
        label: 'Select an organelle',
        hint: 'Pick an organelle to see its function - mitochondria make ATP, the nucleus stores DNA, ribosomes build proteins.',
        selector: '[data-guide="bio-organelle"]',
      },
      {
        label: 'X-ray the cell',
        hint: 'Turn on x-ray mode to see internal structures through the membrane at once.',
        selector: '[data-guide="bio-xray"]',
      },
      {
        label: 'Transcribe the DNA',
        hint: 'Switch to the DNA tab and run transcription: the template strand becomes mRNA (A-U, T-A, C-G, G-C).',
        selector: '[data-guide="bio-dna-tab"]',
      },
      {
        label: 'Capture the model',
        hint: 'Snapshot whatever stage you are explaining for your notebook.',
        selector: '[data-guide="bio-capture"]',
      },
    ],
  },
];

export function labGuideFor(labId: string): LabGuide | undefined {
  return LAB_GUIDES.find((g) => g.labId === labId);
}
