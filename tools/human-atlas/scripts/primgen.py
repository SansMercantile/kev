"""Procedural primitive builders for anatomical geometry.

Builds smooth, organic-looking meshes (ellipsoids, tapered tubes, curved
forms) as numpy-free pure Python so the generators stay dependency-light.
Every builder returns (vertices, indices) with vertices as flat [x,y,z,...].

These are TEACHING geometry: recognizable organ/bone shapes at anatomically
correct positions, not patient-specific scans. Honest labeling lives in the
manifest source/scope fields written by atlaswriter callers.
"""
import math


def ellipsoid(center, radii, seg=20, rings=14):
    """UV-sphere scaled to radii (rx,ry,rz) at center."""
    cx, cy, cz = center
    rx, ry, rz = radii
    v, idx = [], []
    for r in range(rings + 1):
        phi = math.pi * r / rings
        sp, cp = math.sin(phi), math.cos(phi)
        for s in range(seg):
            th = 2 * math.pi * s / seg
            st, ct = math.sin(th), math.cos(th)
            v.extend([cx + rx * sp * ct, cy + ry * cp, cz + rz * sp * st])
    for r in range(rings):
        for s in range(seg):
            a = r * seg + s
            b = r * seg + (s + 1) % seg
            c = a + seg
            d = b + seg
            idx.extend([a, c, b, b, c, d])
    return v, idx


def tube(path_pts, radii, seg=12):
    """A generalized cylinder along a path of points with per-point radius."""
    v, idx = [], []
    n = len(path_pts)
    for i in range(n):
        p = path_pts[i]
        # tangent
        if i == 0:
            t = [path_pts[1][j] - p[j] for j in range(3)]
        elif i == n - 1:
            t = [p[j] - path_pts[i - 1][j] for j in range(3)]
        else:
            t = [path_pts[i + 1][j] - path_pts[i - 1][j] for j in range(3)]
        tl = math.sqrt(sum(x * x for x in t)) or 1.0
        t = [x / tl for x in t]
        # build orthonormal frame
        up = [0, 1, 0] if abs(t[1]) < 0.9 else [1, 0, 0]
        u = _cross(t, up); _norm(u)
        w = _cross(t, u); _norm(w)
        r = radii[i] if isinstance(radii, (list, tuple)) else radii
        for s in range(seg):
            a = 2 * math.pi * s / seg
            ca, sa = math.cos(a), math.sin(a)
            off = [u[j] * ca * r + w[j] * sa * r for j in range(3)]
            v.extend([p[j] + off[j] for j in range(3)])
    for i in range(n - 1):
        for s in range(seg):
            a = i * seg + s
            b = i * seg + (s + 1) % seg
            c = a + seg
            d = b + seg
            idx.extend([a, c, b, b, c, d])
    return v, idx


def bone_shaft(center, length, r_top, r_bottom, seg=14, rings=6):
    """A long-bone: tapered cylinder with flared (condyle) ends, along Y."""
    cx, cy, cz = center
    v, idx = [], []
    for r in range(rings + 1):
        t = r / rings
        y = cy - length / 2 + t * length
        # radius profile: flare at both ends
        base = r_bottom + (r_top - r_bottom) * t
        flare = 1.0 + 0.45 * math.exp(-((t - 0) / 0.12) ** 2) + 0.45 * math.exp(-((t - 1) / 0.12) ** 2)
        rad = base * flare
        for s in range(seg):
            a = 2 * math.pi * s / seg
            v.extend([cx + rad * math.cos(a), y, cz + rad * math.sin(a)])
    for r in range(rings):
        for s in range(seg):
            a = r * seg + s
            b = r * seg + (s + 1) % seg
            c = a + seg
            d = b + seg
            idx.extend([a, c, b, b, c, d])
    return v, idx


def crescent(center, size, seg=18):
    """A curved crescent/meniscus-like shell (flat-ish disc bent along Y)."""
    cx, cy, cz = center
    rx, ry, rz = size
    v, idx = [], []
    rings = 8
    for r in range(rings + 1):
        phi = math.pi * r / rings
        sp, cp = math.sin(phi), math.cos(phi)
        for s in range(seg):
            th = 2 * math.pi * s / seg
            st, ct = math.sin(th), math.cos(th)
            # bend the sphere into a crescent
            bend = 0.4 * math.sin(th)
            v.extend([cx + rx * sp * ct, cy + ry * cp + bend * rz * sp, cz + rz * sp * st])
    for r in range(rings):
        for s in range(seg):
            a = r * seg + s
            b = r * seg + (s + 1) % seg
            c = a + seg
            d = b + seg
            idx.extend([a, c, b, b, c, d])
    return v, idx


def transform(vertices, translate=(0, 0, 0), rotate_y=0.0, scale=1.0):
    """Rotate about Y then translate (and uniform scale). Returns new flat list."""
    c = math.cos(rotate_y); s = math.sin(rotate_y)
    out = []
    for i in range(0, len(vertices), 3):
        x, y, z = vertices[i] * scale, vertices[i + 1] * scale, vertices[i + 2] * scale
        rx = x * c + z * s
        rz = -x * s + z * c
        out.extend([rx + translate[0], y + translate[1], rz + translate[2]])
    return out


def _cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def _norm(v):
    l = math.sqrt(sum(x * x for x in v)) or 1.0
    v[0] /= l; v[1] /= l; v[2] /= l
    return v
