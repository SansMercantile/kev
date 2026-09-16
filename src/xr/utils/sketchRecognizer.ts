/**
 * Deterministic lab-sketch recognition (Smart Lab Sketch-to-Simulation).
 *
 * Runs entirely in the browser: the lab bench sends the stroke geometry here
 * and gets back a recognised science diagram plus the concrete action the lab
 * can take (molecule preset, optics configuration, orbit focus, cell view).
 * No network, no ML runtime - stroke features (closed shapes, circles,
 * straight lines, corners) matched against diagram archetypes. That keeps it
 * instant, explainable ("I saw a triangle crossed by a line") and testable,
 * which matters more than generality on a school bench.
 */

export interface SketchPoint {
  x: number;
  y: number;
}

export interface SketchStroke {
  points: SketchPoint[];
}

export interface SketchRecognition {
  kind:
    | 'bent-molecule'
    | 'linear-molecule'
    | 'ring-molecule'
    | 'prism-ray'
    | 'triangle'
    | 'orbit'
    | 'cell'
    | 'circuit'
    | 'music-staff'
    | 'body-outline'
    | 'vehicle-profile'
    | 'unknown';
  label: string;
  /** Bench the recogniser can drive: the four science labs plus the
   *  immersive Human Atlas (anatomy) and EV Systems (vehicle) benches. */
  lab: 'chemistry' | 'optics' | 'astrophysics' | 'biology' | 'anatomy' | 'vehicle' | null;
  /** Payload for window.dispatchEvent(new CustomEvent('kev:lab-load', { detail })). */
  action: Record<string, unknown> | null;
  /** Notebook symbol class (for the digital science notebook). */
  symbol: string;
  confidence: number;
  notes: string[];
}

interface StrokeFeatures {
  pointCount: number;
  bbox: { w: number; h: number; area: number };
  closed: boolean;
  straightness: number; // 1 = perfectly straight
  circularity: number; // 1 = perfect circle
  corners: number;
  length: number;
  center: SketchPoint;
}

function features(stroke: SketchStroke): StrokeFeatures {
  const pts = stroke.points;
  if (pts.length < 2) {
    return {
      pointCount: pts.length,
      bbox: { w: 0, h: 0, area: 0 },
      closed: false,
      straightness: 1,
      circularity: 0,
      corners: 0,
      length: 0,
      center: pts[0] || { x: 0, y: 0 },
    };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let length = 0;
  let cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    cx += p.x; cy += p.y;
    if (i > 0) {
      const dx = p.x - pts[i - 1].x;
      const dy = p.y - pts[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
  }
  cx /= pts.length; cy /= pts.length;
  const w = maxX - minX;
  const h = maxY - minY;

  const first = pts[0];
  const last = pts[pts.length - 1];
  const gap = Math.hypot(last.x - first.x, last.y - first.y);
  const diag = Math.hypot(w, h) || 1;
  const closed = pts.length >= 8 && gap < 0.25 * diag;

  // Straightness: mean deviation from the chord, normalised by chord length.
  const chord = Math.hypot(last.x - first.x, last.y - first.y) || 1;
  let maxDev = 0;
  for (const p of pts) {
    const t = ((p.x - first.x) * (last.x - first.x) + (p.y - first.y) * (last.y - first.y)) / (chord * chord);
    const px = first.x + t * (last.x - first.x);
    const py = first.y + t * (last.y - first.y);
    maxDev = Math.max(maxDev, Math.hypot(p.x - px, p.y - py));
  }
  const straightness = Math.max(0, 1 - (maxDev / chord) * 3);

  // Circularity (isoperimetric): 4πA / P² on a polygonised stroke.
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  area = Math.abs(area / 2);
  const circularity = Math.min(1, (4 * Math.PI * area) / (length * length || 1));

  // Corners: direction reversals above 40°, sampled sparsely.
  let corners = 0;
  const step = Math.max(1, Math.floor(pts.length / 40));
  for (let i = step; i < pts.length - step; i += step) {
    const a = pts[i - step], b = pts[i], c = pts[i + step];
    const v1 = Math.atan2(b.y - a.y, b.x - a.x);
    const v2 = Math.atan2(c.y - b.y, c.x - b.x);
    let d = Math.abs(v2 - v1);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d > 0.7) corners++;
  }

  return { pointCount: pts.length, bbox: { w, h, area }, closed, straightness, circularity, corners, length, center: { x: cx, y: cy } };
}

function inside(small: SketchStroke, big: StrokeFeatures): boolean {
  for (const p of small.points) {
    if (Math.hypot(p.x - big.center.x, p.y - big.center.y) > Math.max(big.bbox.w, big.bbox.h)) return false;
  }
  return true;
}

function unknown(notes: string[]): SketchRecognition {
  return {
    kind: 'unknown',
    label: 'Unrecognised sketch',
    lab: null,
    action: null,
    symbol: 'freehand',
    confidence: 0,
    notes,
  };
}

export function recogniseSketch(strokes: SketchStroke[]): SketchRecognition {
  const usable = strokes.filter((s) => s.points.length >= 3);
  if (!usable.length) return unknown(['Nothing drawn yet.']);
  const feats = usable.map(features);
  const notes: string[] = [];
  const biggest = feats.slice().sort((a, b) => b.bbox.area - a.bbox.area);
  const main = biggest[0];
  const round = main.closed && main.circularity > 0.55;
  const triangular = main.closed && main.corners >= 2 && main.circularity < 0.5;

  // --- Body outline: tall closed torso + a head circle above it -----------
  // Anatomy grammar (M3 remainder): a standing figure for the Human Atlas
  // bench. Checked BEFORE the round branch - a tall torso ellipse is round
  // enough to be mistaken for a cell/orbit otherwise.
  if (main.closed && main.bbox.h >= 1.5 * main.bbox.w) {
    const torsoTop = main.center.y - main.bbox.h / 2;
    const head = feats.find((f) =>
      f !== main && f.closed && f.circularity > 0.5 &&
      f.bbox.area < 0.5 * main.bbox.area &&
      f.center.y < main.center.y - 0.1 * main.bbox.h &&
      f.center.y > torsoTop - 1.2 * f.bbox.h &&
      Math.abs(f.center.x - main.center.x) < 0.7 * main.bbox.w);
    if (head) {
      notes.push('A tall closed figure with a round head on top: a body outline. Opening the Human Atlas at the skeletal system.');
      return {
        kind: 'body-outline',
        label: 'Human body outline',
        lab: 'anatomy',
        action: { lab: 'anatomy', action: 'system-view', systemId: 'skeletal' },
        symbol: 'anatomy-figure',
        confidence: 76,
        notes,
      };
    }
  }

  // --- Vehicle profile: wide closed body + wheel circles below ------------
  // Side elevation for the EV Systems bench (Model X Studio). Checked before
  // the molecule/circuit rules: two wheels are non-touching circles that the
  // diatomic rule would otherwise drop through.
  if (main.closed && main.bbox.w >= 1.7 * main.bbox.h) {
    const wheels = feats.filter((f) =>
      f !== main && f.closed && f.circularity > 0.5 &&
      f.bbox.area < 0.4 * main.bbox.area &&
      f.center.y > main.center.y &&
      Math.abs(f.center.x - main.center.x) < main.bbox.w / 2 + f.bbox.w);
    if (wheels.length >= 2) {
      const xs = wheels.map((f) => f.center.x);
      const spread = Math.max(...xs) - Math.min(...xs);
      if (spread > 0.35 * main.bbox.w) {
        notes.push(`A wide closed body with ${wheels.length} wheels below it: a vehicle side elevation. Opening the EV Systems bench exploded.`);
        return {
          kind: 'vehicle-profile',
          label: 'Vehicle side profile',
          lab: 'vehicle',
          action: { lab: 'vehicle', action: 'vehicle-view', explode: 35 },
          symbol: 'vehicle-diagram',
          confidence: 78,
          notes,
        };
      }
    }
  }

  // --- One big circle: cell (biology) or orbit (astrophysics) -------------
  if (round) {
    const inner = usable.filter((s, i) => feats[i] !== main && inside(s, main));
    if (inner.length >= 2) {
      notes.push(`Large circle containing ${inner.length} smaller strokes: reads as a cell with organelles.`);
      return {
        kind: 'cell',
        label: 'Cell cross-section',
        lab: 'biology',
        action: { lab: 'biology', action: 'cell-view', xray: true },
        symbol: 'cell-diagram',
        confidence: Math.min(95, 70 + inner.length * 5),
        notes,
      };
    }
    if (inner.length === 1) {
      notes.push('A circle with one smaller stroke inside reads as an orbit around a central body.');
      return {
        kind: 'orbit',
        label: 'Orbit around a central body',
        lab: 'astrophysics',
        action: { lab: 'astrophysics', action: 'orbit', bodyId: 'earth', playing: true },
        symbol: 'orbit-diagram',
        confidence: 80,
        notes,
      };
    }
    notes.push('A lone circle: could be a cell, a planet or an atom. Draw one more detail (a nucleus, a moon, bonds) so I can be sure.');
    return {
      kind: 'orbit',
      label: 'Circle (ambiguous: cell or orbit)',
      lab: 'astrophysics',
      action: { lab: 'astrophysics', action: 'orbit', bodyId: 'earth', playing: true },
      symbol: 'circle',
      confidence: 55,
      notes,
    };
  }

  // --- Triangle with a crossing line: prism + light ray (optics) ----------
  const straight = feats.findIndex((f) => f !== main && f.straightness > 0.6 && f.length > 40);
  if (triangular) {
    if (straight >= 0) {
      notes.push('Triangle crossed by a straight line: a prism refracting a light ray.');
      return {
        kind: 'prism-ray',
        label: 'Prism with incident ray',
        lab: 'optics',
        action: { lab: 'optics', action: 'prism', prism: 'triangular', incidence: 55, index: 1.52 },
        symbol: 'ray-diagram',
        confidence: 88,
        notes,
      };
    }
    notes.push('Closed three-corner shape: reads as a prism (or a trigonal molecule).');
    return {
      kind: 'triangle',
      label: 'Triangular prism',
      lab: 'optics',
      action: { lab: 'optics', action: 'prism', prism: 'triangular', incidence: 45, index: 1.52 },
      symbol: 'ray-diagram',
      confidence: 70,
      notes,
    };
  }

  // --- Rectangle + zigzag: circuit schematic -------------------------------
  const rectLike = main.closed && main.corners >= 3 && main.circularity < 0.45;
  const zigzag = feats.some((f) => f !== main && f.corners >= 3 && !f.closed && f.straightness < 0.7);
  if (rectLike && zigzag) {
    notes.push('Rectangle with a zigzag lead: a battery-and-resistor circuit schematic (physics notebook symbol).');
    return {
      kind: 'circuit',
      label: 'Circuit schematic',
      lab: null,
      action: null,
      symbol: 'circuit-schematic',
      confidence: 75,
      notes,
    };
  }

  // --- Molecule doodles: ring, hub-and-bonds or line of circles ------------
  const circles = feats.filter((f) => f.closed && f.circularity > 0.6 && f.bbox.area > 900);
  if (circles.length >= 5) {
    // Ring check first: an aromatic doodle is a cluster of circles too.
    const centers = circles.map((c) => c.center);
    const spreadX = Math.max(...centers.map((c) => c.x)) - Math.min(...centers.map((c) => c.x));
    const spreadY = Math.max(...centers.map((c) => c.y)) - Math.min(...centers.map((c) => c.y));
    if (Math.min(spreadX, spreadY) > 0.4 * Math.max(spreadX, spreadY)) {
      notes.push('A ring of atoms: an aromatic ring (benzene family).');
      return {
        kind: 'ring-molecule',
        label: 'Aromatic ring',
        lab: 'chemistry',
        action: { lab: 'chemistry', presetId: 'c6h6' },
        symbol: 'lewis-structure',
        confidence: 70,
        notes,
      };
    }
  }
  if (circles.length >= 3) {
    // Collinear centres => linear molecule (CO2 family); clustered => bent (H2O family).
    const centers = circles.map((c) => c.center);
    const spreadX = Math.max(...centers.map((c) => c.x)) - Math.min(...centers.map((c) => c.x));
    const spreadY = Math.max(...centers.map((c) => c.y)) - Math.min(...centers.map((c) => c.y));
    const flat = Math.min(spreadX, spreadY) < 0.22 * Math.max(spreadX, spreadY);
    if (flat) {
      notes.push(`${circles.length} circles in a line: a linear molecule such as CO2 (bond angle ~180 degrees).`);
      return {
        kind: 'linear-molecule',
        label: 'Linear molecule',
        lab: 'chemistry',
        action: { lab: 'chemistry', presetId: 'co2' },
        symbol: 'lewis-structure',
        confidence: 78,
        notes,
      };
    }
    notes.push(`${circles.length} circles clustered off-axis: a bent molecule such as H2O or SO2 (lone pairs push the bonds down).`);
    return {
      kind: 'bent-molecule',
      label: 'Bent molecule',
      lab: 'chemistry',
      action: { lab: 'chemistry', presetId: 'so2' },
      symbol: 'lewis-structure',
      confidence: 72,
      notes,
    };
  }
  if (circles.length === 2) {
    const [a, b] = circles;
    const touch = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y) < (Math.hypot(a.bbox.w, a.bbox.h) + Math.hypot(b.bbox.w, b.bbox.h)) * 0.6;
    if (touch) {
      notes.push('Two touching circles: reads as a diatomic bond (chemistry).');
      return {
        kind: 'linear-molecule',
        label: 'Two-atom molecule',
        lab: 'chemistry',
        action: { lab: 'chemistry', presetId: 'co2' },
        symbol: 'lewis-structure',
        confidence: 60,
        notes,
      };
    }
  }

  // --- Music staff: 4+ long, roughly parallel horizontal lines -------------
  // First declarative grammar outside the science set (T2/M3): the same
  // stroke-feature pipeline, a new archetype. No lab drives it yet - it lands
  // in the digital science notebook as music notation.
  const horizontal = feats.filter((f) => f.straightness > 0.7 && f.bbox.w > 60 && f.bbox.h < 0.18 * f.bbox.w);
  if (horizontal.length >= 4) {
    const ys = horizontal.map((f) => f.center.y).sort((a, b) => a - b);
    const gaps = ys.slice(1).map((y, i) => y - ys[i]);
    const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const even = gaps.every((g) => Math.abs(g - meanGap) < 0.6 * meanGap + 4);
    if (even) {
      notes.push(`${horizontal.length} evenly spaced horizontal lines: a music staff. Noteheads would sit on the lines and spaces between them.`);
      return {
        kind: 'music-staff',
        label: 'Music staff',
        lab: null,
        action: null,
        symbol: 'music-notation',
        confidence: 68 + Math.min(12, horizontal.length * 2),
        notes,
      };
    }
  }

  notes.push(`Saw ${usable.length} stroke(s); main shape closed=${String(main.closed)}, circularity=${main.circularity.toFixed(2)}, corners=${String(main.corners)}. Try a circle (cell/orbit), a triangle crossed by a line (prism ray), circles joined like atoms (molecule), four parallel lines (music staff), a tall figure with a round head (body outline), or a wide body on two wheels (vehicle profile).`);
  return unknown(notes);
}
