"""Fetch real OpenStreetMap data (buildings + roads) for a given bounding box.

OSM is open-license (ODbL). Fetches building footprints and road networks,
converts to the atlas format for the geography layer.

Run: python fetch_osm.py <min_lat> <min_lon> <max_lat> <max_lon> <output_name>
Example: python fetch_osm.py 40.7 -74.0 40.8 -73.9 manhattan
"""
import urllib.request, urllib.parse, json, sys, math
from pathlib import Path
from atlaswriter import Mesh, write_atlas

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'public' / 'models'

OVERPASS_URL = 'https://overpass-api.de/api/interpreter'


def fetch_osm_bbox(min_lat, min_lon, max_lat, max_lon):
    """Fetch buildings + roads for a bounding box from Overpass API."""
    query = f"""
    [out:json];
    (
      way["building"]({min_lat},{min_lon},{max_lat},{max_lon});
      way["highway"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out geom;
    """
    data = urllib.parse.urlencode({'data': query}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data, headers={'User-Agent': 'KEV-Education/1.0'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def build_mesh_from_way(way, min_lat, min_lon, scale=10000):
    """Convert an OSM way to a mesh (footprint extruded to height, or road surface)."""
    nodes = way.get('geometry', [])
    if len(nodes) < 2:
        return None, None
    # convert lat/lon to local meters
    verts = []
    for node in nodes:
        lat_m = (node['lat'] - min_lat) * 111320  # meters per degree latitude
        lon_m = (node['lon'] - min_lon) * 111320 * math.cos(math.radians(min_lat))
        verts.extend([lon_m * scale / 1000, 0, lat_m * scale / 1000])
    # triangulate as a simple strip (footprint outline)
    idx = []
    for i in range(len(nodes) - 1):
        idx.extend([i, i + 1])
    return verts, idx


def extrude_footprint(nodes, min_lat, min_lon, height, scale=10000):
    """Extrude a building footprint to a height."""
    if len(nodes) < 3:
        return None, None
    # convert to local meters
    pts = []
    for node in nodes:
        lat_m = (node['lat'] - min_lat) * 111320
        lon_m = (node['lon'] - min_lon) * 111320 * math.cos(math.radians(min_lat))
        pts.append((lon_m * scale / 1000, lat_m * scale / 1000))
    # center the footprint
    cx = sum(p[0] for p in pts) / len(pts)
    cz = sum(p[1] for p in pts) / len(pts)
    pts = [(p[0] - cx, p[1] - cz) for p in pts]
    # build walls (each edge extruded to height)
    verts = []
    idx = []
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        base = len(verts) // 3
        verts.extend([pts[i][0], 0, pts[i][1], pts[j][0], 0, pts[j][1],
                      pts[i][0], height, pts[i][1], pts[j][0], height, pts[j][1]])
        idx.extend([base, base + 1, base + 2, base + 1, base + 3, base + 2])
    # roof (fan triangulation)
    base = len(verts) // 3
    for p in pts:
        verts.extend([p[0], height, p[1]])
    for i in range(1, len(pts) - 1):
        idx.extend([base, base + i, base + i + 1])
    return verts, idx


def combine(parts):
    v, idx = [], []
    for (pv, pi) in parts:
        base = len(v) // 3
        v.extend(pv)
        idx.extend([base + i for i in pi])
    return v, idx


def main():
    if len(sys.argv) < 6:
        print('Usage: python fetch_osm.py <min_lat> <min_lon> <max_lat> <max_lon> <output_name>')
        sys.exit(1)
    min_lat, min_lon, max_lat, max_lon, name = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
    print(f'Fetching OSM data for {name} ({min_lat},{min_lon} to {max_lat},{max_lon})...')
    data = fetch_osm_bbox(min_lat, min_lon, max_lat, max_lon)

    buildings = []
    roads = []
    for elem in data.get('elements', []):
        if elem['type'] != 'way':
            continue
        tags = elem.get('tags', {})
        if 'building' in tags:
            height = float(tags.get('height', tags.get('building:levels', '3')) * 3 if isinstance(tags.get('building:levels'), str) and tags['building:levels'].isdigit() else 10)
            verts, idx = extrude_footprint(elem.get('geometry', []), min_lat, min_lon, height)
            if verts:
                buildings.append((verts, idx))
        elif 'highway' in tags:
            verts, idx = build_mesh_from_way(elem, min_lat, min_lon)
            if verts:
                roads.append((verts, idx))

    print(f'  {len(buildings)} buildings, {len(roads)} road segments')

    meshes = []
    if buildings:
        v, idx = combine(buildings)
        meshes.append(Mesh(f'{name}_buildings', 'Buildings', 'building', v, idx))
    if roads:
        v, idx = combine(roads)
        meshes.append(Mesh(f'{name}_roads', 'Roads', 'road', v, idx))

    if meshes:
        write_atlas(name, meshes, version='KEV-Geo 1.0', out_species=f'geo-{name}',
                    source='OpenStreetMap (ODbL) - real building footprints and roads',
                    scope=f'{name} - {len(buildings)} buildings, {len(roads)} road segments',
                    center=True, floor_y=True)
        print(f'  -> atlas-geo-{name}.json')


if __name__ == '__main__':
    main()
