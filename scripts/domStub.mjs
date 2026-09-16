/**
 * Minimal DOM + Canvas 2D stub for headless scene verification.
 *
 * The campus draws all of its signage and every procedural PBR texture (albedo,
 * normal, roughness, AO) into `<canvas>` elements, then derives normal maps by
 * reading pixels back out. Three.js needs no WebGL to *build* a scene graph, but
 * it does need `document.createElement('canvas')` to return something a
 * `CanvasTexture` can hold, and the texture generators need a 2D context whose
 * `getImageData` reflects what was drawn — otherwise height-to-normal conversion
 * runs on an empty buffer and proves nothing.
 *
 * So this implements a small software 2D context over a real pixel buffer:
 * solid and linear-gradient fills, rectangle fills, polygon and ellipse fills,
 * polyline/ellipse strokes, and faithful `getImageData` / `putImageData` /
 * `createImageData`. It is deliberately not a complete Canvas implementation —
 * there is no clipping, compositing beyond source-over alpha, transforms, text
 * rasterisation, or image decoding. Text is measured with a proportional
 * approximation so layout code exercises its real wrapping and centring paths.
 *
 * Nothing here asserts pixel output. The point is that the drawing code runs
 * against real data and produces finite values, which is what the harness checks.
 */

/** Parse the colour syntaxes the campus actually uses. */
function parseColor(value) {
  if (typeof value !== 'string') return { r: 0, g: 0, b: 0, a: 1 };
  const text = value.trim().toLowerCase();

  let m = /^#([0-9a-f]{3})$/.exec(text);
  if (m) {
    const [r, g, b] = [...m[1]].map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  m = /^#([0-9a-f]{6})$/.exec(text);
  if (m) {
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
      a: 1,
    };
  }
  m = /^#([0-9a-f]{8})$/.exec(text);
  if (m) {
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
      a: parseInt(m[1].slice(6, 8), 16) / 255,
    };
  }
  m = /^rgba?\(([^)]+)\)$/.exec(text);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return {
      r: parts[0] ?? 0,
      g: parts[1] ?? 0,
      b: parts[2] ?? 0,
      a: parts.length > 3 ? parts[3] : 1,
    };
  }
  // Named colours used by the campus textures; a rough grey is fine for the rest.
  const named = { white: [255, 255, 255], black: [0, 0, 0], transparent: [0, 0, 0, 0] };
  if (named[text]) {
    const [r, g, b, a = 1] = named[text];
    return { r, g, b, a };
  }
  return { r: 128, g: 128, b: 128, a: 1 };
}

class LinearGradient {
  constructor(x0, y0, x1, y1) {
    this.x0 = x0; this.y0 = y0; this.x1 = x1; this.y1 = y1;
    this.stops = [];
  }

  addColorStop(offset, color) {
    this.stops.push({ offset: Number(offset) || 0, color: parseColor(color) });
  }

  /** Sample the ramp at a point, projected onto the gradient axis. */
  sample(x, y) {
    if (!this.stops.length) return { r: 0, g: 0, b: 0, a: 1 };
    const dx = this.x1 - this.x0;
    const dy = this.y1 - this.y0;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 1e-9 ? ((x - this.x0) * dx + (y - this.y0) * dy) / len2 : 0;
    const clamped = Math.min(1, Math.max(0, t));

    const sorted = [...this.stops].sort((a, b) => a.offset - b.offset);
    if (clamped <= sorted[0].offset) return sorted[0].color;
    if (clamped >= sorted[sorted.length - 1].offset) return sorted[sorted.length - 1].color;
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (clamped >= a.offset && clamped <= b.offset) {
        const span = b.offset - a.offset || 1;
        const k = (clamped - a.offset) / span;
        return {
          r: a.color.r + (b.color.r - a.color.r) * k,
          g: a.color.g + (b.color.g - a.color.g) * k,
          b: a.color.b + (b.color.b - a.color.b) * k,
          a: a.color.a + (b.color.a - a.color.a) * k,
        };
      }
    }
    return sorted[sorted.length - 1].color;
  }
}

class Canvas2DStub {
  constructor(canvas) {
    this.canvas = canvas;
    this._pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    this._path = [];
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.globalAlpha = 1;
    this.font = '10px sans-serif';
    this.textAlign = 'left';
    this.textBaseline = 'alphabetic';
  }

  /** Resize the backing buffer when the canvas dimensions change. */
  _ensureSize() {
    const expected = this.canvas.width * this.canvas.height * 4;
    if (this._pixels.length !== expected) {
      const next = new Uint8ClampedArray(expected);
      next.set(this._pixels.subarray(0, Math.min(expected, this._pixels.length)));
      this._pixels = next;
    }
  }

  _resolveStyle(style, x, y) {
    return style instanceof LinearGradient ? style.sample(x, y) : parseColor(style);
  }

  _blend(x, y, color) {
    this._ensureSize();
    const { width } = this.canvas;
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= width || py >= this.canvas.height) return;
    const alpha = Math.min(1, Math.max(0, color.a * this.globalAlpha));
    if (alpha <= 0) return;
    const i = (py * width + px) * 4;
    const dst = this._pixels;
    dst[i] = dst[i] * (1 - alpha) + color.r * alpha;
    dst[i + 1] = dst[i + 1] * (1 - alpha) + color.g * alpha;
    dst[i + 2] = dst[i + 2] * (1 - alpha) + color.b * alpha;
    dst[i + 3] = Math.min(255, dst[i + 3] + alpha * 255);
  }

  _fillBox(x, y, w, h, style) {
    const x0 = Math.max(0, Math.floor(Math.min(x, x + w)));
    const y0 = Math.max(0, Math.floor(Math.min(y, y + h)));
    const x1 = Math.min(this.canvas.width - 1, Math.ceil(Math.max(x, x + w)));
    const y1 = Math.min(this.canvas.height - 1, Math.ceil(Math.max(y, y + h)));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        this._blend(px, py, this._resolveStyle(style, px, py));
      }
    }
  }

  fillRect(x, y, w, h) { this._fillBox(x, y, w, h, this.fillStyle); }
  strokeRect(x, y, w, h) {
    const t = Math.max(1, this.lineWidth);
    this._fillBox(x, y, w, t, this.strokeStyle);
    this._fillBox(x, y + h - t, w, t, this.strokeStyle);
    this._fillBox(x, y, t, h, this.strokeStyle);
    this._fillBox(x + w - t, y, t, h, this.strokeStyle);
  }
  clearRect(x, y, w, h) {
    this._ensureSize();
    const { width } = this.canvas;
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(width - 1, Math.ceil(x + w));
    const y1 = Math.min(this.canvas.height - 1, Math.ceil(y + h));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const i = (py * width + px) * 4;
        this._pixels[i] = this._pixels[i + 1] = this._pixels[i + 2] = this._pixels[i + 3] = 0;
      }
    }
  }

  // --- paths ---
  beginPath() { this._path = []; }
  closePath() {
    const last = this._path[this._path.length - 1];
    if (last && last.kind === 'polyline') last.closed = true;
  }
  moveTo(x, y) { this._path.push({ kind: 'polyline', points: [[x, y]], closed: false }); }
  lineTo(x, y) {
    let last = this._path[this._path.length - 1];
    if (!last || last.kind !== 'polyline') {
      last = { kind: 'polyline', points: [], closed: false };
      this._path.push(last);
    }
    last.points.push([x, y]);
  }
  quadraticCurveTo(cx, cy, x, y) {
    let last = this._path[this._path.length - 1];
    if (!last || last.kind !== 'polyline') {
      last = { kind: 'polyline', points: [[cx, cy]], closed: false };
      this._path.push(last);
      return;
    }
    const [sx, sy] = last.points[last.points.length - 1] ?? [cx, cy];
    // Flatten to a short polyline — plenty for the chip shapes drawn here.
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      const mt = 1 - t;
      last.points.push([
        mt * mt * sx + 2 * mt * t * cx + t * t * x,
        mt * mt * sy + 2 * mt * t * cy + t * t * y,
      ]);
    }
  }
  bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
    let last = this._path[this._path.length - 1];
    if (!last || last.kind !== 'polyline') {
      last = { kind: 'polyline', points: [[c1x, c1y]], closed: false };
      this._path.push(last);
      return;
    }
    const [sx, sy] = last.points[last.points.length - 1] ?? [c1x, c1y];
    for (let i = 1; i <= 10; i++) {
      const t = i / 10;
      const mt = 1 - t;
      last.points.push([
        mt ** 3 * sx + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t ** 3 * x,
        mt ** 3 * sy + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t ** 3 * y,
      ]);
    }
  }
  arc(x, y, r, start = 0, end = Math.PI * 2, ccw = false) {
    this._pushEllipse(x, y, r, r, 0, start, end, ccw);
  }
  ellipse(x, y, rx, ry, rotation = 0, start = 0, end = Math.PI * 2, ccw = false) {
    this._pushEllipse(x, y, rx, ry, rotation, start, end, ccw);
  }
  _pushEllipse(x, y, rx, ry, rotation, start, end, ccw) {
    if (end - start >= Math.PI * 2 - 1e-6) {
      this._path.push({ kind: 'ellipse', x, y, rx, ry, rotation });
      return;
    }
    // Partial arc: flatten into a polyline so strokes follow the arc.
    const steps = Math.max(4, Math.ceil(Math.abs(end - start) / 0.2));
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const a = ccw ? end + (start - end) * (i / steps) : start + (end - start) * (i / steps);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      points.push([
        x + rx * cos * Math.cos(rotation) - ry * sin * Math.sin(rotation),
        y + rx * cos * Math.sin(rotation) + ry * sin * Math.cos(rotation),
      ]);
    }
    this._path.push({ kind: 'polyline', points, closed: false });
  }

  fill() {
    for (const sub of this._path) {
      if (sub.kind === 'ellipse') this._fillEllipse(sub);
      else this._fillPolygon(sub);
    }
  }

  _fillEllipse({ x, y, rx, ry, rotation }) {
    if (!(rx > 0) || !(ry > 0)) return;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const rad = Math.ceil(Math.max(rx, ry));
    for (let py = Math.floor(y - rad); py <= Math.ceil(y + rad); py++) {
      for (let px = Math.floor(x - rad); px <= Math.ceil(x + rad); px++) {
        const dx = px - x;
        const dy = py - y;
        const ux = dx * cos - dy * sin;
        const uy = dx * sin + dy * cos;
        if ((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry) <= 1) {
          this._blend(px, py, this._resolveStyle(this.fillStyle, px, py));
        }
      }
    }
  }

  /** Scanline polygon fill over the canvas bounding box of the subpath. */
  _fillPolygon({ points, closed }) {
    if (!points || points.length < 3) return;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const y0 = Math.max(0, Math.floor(Math.min(...ys)));
    const y1 = Math.min(this.canvas.height - 1, Math.ceil(Math.max(...ys)));
    const x0 = Math.max(0, Math.floor(Math.min(...xs)));
    const x1 = Math.min(this.canvas.width - 1, Math.ceil(Math.max(...xs)));
    if (!(x0 <= x1) || !(y0 <= y1)) return;

    const edges = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (!closed && i === points.length - 1) break;
      if (a[1] !== b[1]) edges.push([a, b]);
    }
    for (let py = y0; py <= y1; py++) {
      const y = py + 0.5;
      const crossings = [];
      for (const [a, b] of edges) {
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          crossings.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
      }
      if (crossings.length < 2) continue;
      crossings.sort((p, q) => p - q);
      for (let i = 0; i < crossings.length - 1; i += 2) {
        const sx = Math.max(x0, Math.ceil(crossings[i]));
        const ex = Math.min(x1, Math.floor(crossings[i + 1]));
        for (let px = sx; px <= ex; px++) {
          this._blend(px, py, this._resolveStyle(this.fillStyle, px, py));
        }
      }
    }
  }

  stroke() {
    const t = Math.max(0.5, this.lineWidth);
    for (const sub of this._path) {
      if (sub.kind === 'ellipse') {
        const steps = Math.max(24, Math.ceil(Math.max(sub.rx, sub.ry)));
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          this._stamp(
            sub.x + sub.rx * cos * Math.cos(sub.rotation) - sub.ry * sin * Math.sin(sub.rotation),
            sub.y + sub.rx * cos * Math.sin(sub.rotation) + sub.ry * sin * Math.cos(sub.rotation),
            t
          );
        }
        continue;
      }
      const pts = sub.points ?? [];
      for (let i = 0; i < pts.length - 1; i++) {
        this._stampSegment(pts[i], pts[i + 1], t);
      }
      if (sub.closed && pts.length > 2) this._stampSegment(pts[pts.length - 1], pts[0], t);
    }
  }

  _stampSegment([ax, ay], [bx, by], t) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(len / Math.max(0.5, t / 2)));
    for (let i = 0; i <= steps; i++) {
      this._stamp(ax + (dx * i) / steps, ay + (dy * i) / steps, t);
    }
  }

  _stamp(x, y, t) {
    const r = t / 2;
    for (let py = Math.floor(y - r); py <= Math.ceil(y + r); py++) {
      for (let px = Math.floor(x - r); px <= Math.ceil(x + r); px++) {
        if ((px - x) ** 2 + (py - y) ** 2 <= r * r) {
          this._blend(px, py, this._resolveStyle(this.strokeStyle, px, py));
        }
      }
    }
  }

  clip() { /* not needed by the campus textures */ }

  // --- pixel access ---
  createImageData(w, h) {
    return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  }
  getImageData(x, y, w, h) {
    this._ensureSize();
    const out = new Uint8ClampedArray(w * h * 4);
    const { width } = this.canvas;
    for (let row = 0; row < h; row++) {
      const sy = y + row;
      if (sy < 0 || sy >= this.canvas.height) continue;
      for (let col = 0; col < w; col++) {
        const sx = x + col;
        if (sx < 0 || sx >= width) continue;
        const src = (sy * width + sx) * 4;
        const dst = (row * w + col) * 4;
        out[dst] = this._pixels[src];
        out[dst + 1] = this._pixels[src + 1];
        out[dst + 2] = this._pixels[src + 2];
        out[dst + 3] = this._pixels[src + 3];
      }
    }
    return { width: w, height: h, data: out };
  }
  putImageData(image, dx, dy) {
    this._ensureSize();
    if (!image?.data) return;
    const { width } = this.canvas;
    for (let row = 0; row < image.height; row++) {
      const ty = dy + row;
      if (ty < 0 || ty >= this.canvas.height) continue;
      for (let col = 0; col < image.width; col++) {
        const tx = dx + col;
        if (tx < 0 || tx >= width) continue;
        const src = (row * image.width + col) * 4;
        const dst = (ty * width + tx) * 4;
        this._pixels[dst] = image.data[src];
        this._pixels[dst + 1] = image.data[src + 1];
        this._pixels[dst + 2] = image.data[src + 2];
        this._pixels[dst + 3] = image.data[src + 3];
      }
    }
  }

  // --- gradients, patterns, text ---
  createLinearGradient(x0, y0, x1, y1) { return new LinearGradient(x0, y0, x1, y1); }
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    // Approximated as a linear ramp between the two circle centres, which is
    // close enough for the vignettes the campus draws.
    return new LinearGradient(x0, y0, x1, y1);
  }
  createPattern() { return null; }

  /**
   * Text is not rasterised, but layout code depends on measured width, so
   * approximate it from the current font size.
   */
  measureText(text) {
    const size = /(\d+(?:\.\d+)?)px/.exec(this.font)?.[1];
    const px = size ? Number(size) : 10;
    return { width: String(text ?? '').length * px * 0.55 };
  }
  fillText(text, x, y) {
    // Stamp a thin bar so text regions are non-empty in the backing buffer.
    const w = this.measureText(text).width;
    this._fillBox(x, y - 4, w, 8, this.fillStyle);
  }
  strokeText(text, x, y) { this.fillText(text, x, y); }

  // --- state stack ---
  save() { this._stack = this._stack ?? []; this._stack.push({ fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, globalAlpha: this.globalAlpha, font: this.font, textAlign: this.textAlign, textBaseline: this.textBaseline }); }
  restore() {
    const s = this._stack?.pop();
    if (!s) return;
    Object.assign(this, s);
  }
  translate() {}
  rotate() {}
  scale() {}
  setTransform() {}
  resetTransform() {}
  drawImage() {}
}

function createCanvasElement() {
  let context = null;
  const canvas = {
    width: 300,
    height: 150,
    style: {},
    nodeName: 'CANVAS',
    nodeType: 1,
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: canvas.width, height: canvas.height, top: 0, left: 0, right: canvas.width, bottom: canvas.height }),
    getContext(kind) {
      if (kind !== '2d') return null;
      if (!context) context = new Canvas2DStub(canvas);
      return context;
    },
    toDataURL: () => 'data:image/png;base64,',
  };
  return canvas;
}

/** Install the stub on globalThis. Call before importing the bundle. */
export function installDomStub() {
  const document = {
    createElement: (tag) =>
      String(tag).toLowerCase() === 'canvas' ? createCanvasElement() : { style: {}, appendChild() {} },
    createElementNS: (_ns, tag) =>
      String(tag).toLowerCase() === 'canvas' ? createCanvasElement() : { style: {}, appendChild() {} },
    documentElement: { style: {} },
    body: { appendChild() {}, removeChild() {}, style: {} },
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
  };

  const window = {
    devicePixelRatio: 1,
    innerWidth: 1280,
    innerHeight: 720,
    document,
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
  };

  globalThis.document = document;
  globalThis.window = window;
  globalThis.self = window;
  globalThis.HTMLCanvasElement = function HTMLCanvasElement() {};
  globalThis.Image = function Image() { this.addEventListener = () => {}; };
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Node 22 exposes a getter-only `navigator`, so it cannot simply be assigned.
  if (!globalThis.navigator || !globalThis.navigator.userAgent) {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'node-smoke-test', hardwareConcurrency: 8 },
      configurable: true,
      writable: true,
    });
  }
}
