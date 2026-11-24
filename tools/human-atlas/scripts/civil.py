"""Civil engineering component + structure data (dimensionally accurate).

Component dimensions come from real standards and historical practice:
  - lumber: nominal vs actual US sizes (2x4 = 38x89 mm), metric softwood
  - masonry: standard brick 215x102.5x65 mm (UK) / 194x92x57 (US), Roman brick
  - steel: I-beam (IPE/HEA/W-section) flange+web proportions
  - concrete: slab/foundation thickness, rebar grid spacing
  - pipe: DN/NPS nominal bores, copper/PVC/iron
  - wire: conductor gauges, conduit, breaker panel
  - roofing: rafter pitch, tile/thatch/slate
These are TEACHING solids at true proportions, labeled per material.

Each component: id, name, category, dims (m), color, and a builder hint.
"""

# Lumber actual sizes (mm -> m). name, [w,h], typical length
LUMBER = {
    '2x4':    {'w': 0.089, 'h': 0.038},
    '2x6':    {'w': 0.140, 'h': 0.038},
    '2x8':    {'w': 0.184, 'h': 0.038},
    '4x4':    {'w': 0.089, 'h': 0.089},
    'beam':   {'w': 0.140, 'h': 0.240},
}

BRICK = {
    'standard': {'l': 0.215, 'h': 0.065, 'w': 0.1025},
    'roman':    {'l': 0.400, 'h': 0.040, 'w': 0.100},
}

CATEGORIES = {
    'foundation': {'color': '#7a7a72', 'name': 'Foundation'},
    'concrete':   {'color': '#9a9a92', 'name': 'Concrete'},
    'steel':      {'color': '#5a6a7a', 'name': 'Structural steel'},
    'lumber':     {'color': '#b08a5a', 'name': 'Timber framing'},
    'masonry':    {'color': '#a85a4a', 'name': 'Masonry'},
    'drywall':    {'color': '#e8e0d0', 'name': 'Drywall / lining'},
    'roofing':    {'color': '#8a4a3a', 'name': 'Roofing'},
    'plumbing':   {'color': '#4a7a9a', 'name': 'Plumbing'},
    'wiring':     {'color': '#c8a020', 'name': 'Electrical'},
    'insulation': {'color': '#e8c860', 'name': 'Insulation'},
    'finish':     {'color': '#d0c8b8', 'name': 'Finishes'},
    'arch':       {'color': '#b0a090', 'name': 'Arch / vault'},
    'cable':      {'color': '#3a3a42', 'name': 'Cables'},
    'deck':       {'color': '#8a8078', 'name': 'Deck / roadway'},
    'pier':       {'color': '#9a9288', 'name': 'Piers / towers'},
    'earthwork':  {'color': '#7a6a4a', 'name': 'Earthworks'},
}

# --- House: light timber frame, exploded by system ---
# Each entry: (category, builder, params)
HOUSE = {
    'label': 'House (timber frame)',
    'components': [
        # foundation
        ('foundation', 'slab', {'w': 8.0, 'd': 6.0, 't': 0.25}),
        ('concrete', 'footing', {'w': 8.4, 'd': 6.4, 't': 0.3, 'recess': 0.4}),
        # wall framing: studs around perimeter
        ('lumber', 'wall_frame', {'w': 8.0, 'd': 6.0, 'h': 2.7, 'stud': '2x4', 'spacing': 0.4}),
        ('lumber', 'top_plate', {'w': 8.0, 'd': 6.0, 'h': 2.7, 'sec': '2x4'}),
        ('lumber', 'floor_joists', {'w': 8.0, 'd': 6.0, 'y': 0.0, 'sec': '2x8', 'spacing': 0.4}),
        ('lumber', 'ceiling_joists', {'w': 8.0, 'd': 6.0, 'y': 2.7, 'sec': '2x6', 'spacing': 0.4}),
        ('lumber', 'rafters', {'w': 8.0, 'd': 6.0, 'y': 2.7, 'rise': 1.5, 'sec': '2x6', 'spacing': 0.6}),
        # masonry chimney + hearth
        ('masonry', 'chimney', {'w': 0.6, 'd': 0.6, 'h': 4.5, 'brick': 'standard'}),
        # drywall interior lining
        ('drywall', 'walls_inner', {'w': 7.8, 'd': 5.8, 'h': 2.7, 't': 0.0125}),
        # insulation between studs
        ('insulation', 'wall_batts', {'w': 8.0, 'd': 6.0, 'h': 2.7, 't': 0.089}),
        # roofing
        ('roofing', 'roof_deck', {'w': 8.4, 'd': 6.4, 'y': 2.7, 'rise': 1.5}),
        # plumbing: supply + drain runs
        ('plumbing', 'pipes', {'w': 8.0, 'd': 6.0, 'h': 2.7, 'diameter': 0.022}),
        # wiring: circuits + panel
        ('wiring', 'circuits', {'w': 8.0, 'd': 6.0, 'h': 2.7}),
        ('wiring', 'panel', {'w': 0.3, 'h': 0.5, 'd': 0.1, 'x': 3.5, 'y': 1.4, 'z': -2.9}),
    ],
}

# --- Skyscraper: steel frame with curtain wall ---
SKYSCRAPER = {
    'label': 'Skyscraper (steel frame)',
    'components': [
        ('concrete', 'core', {'w': 6.0, 'd': 6.0, 'h': 30.0}),
        ('steel', 'columns', {'w': 18.0, 'd': 12.0, 'h': 30.0, 'sec': 'beam'}),
        ('steel', 'beams', {'w': 18.0, 'd': 12.0, 'floors': 10, 'sec': 'beam'}),
        ('concrete', 'floor_slabs', {'w': 18.0, 'd': 12.0, 'floors': 10, 't': 0.15}),
        ('finish', 'curtain_wall', {'w': 18.0, 'd': 12.0, 'h': 30.0}),
        ('foundation', 'raft', {'w': 20.0, 'd': 14.0, 't': 1.0}),
        ('plumbing', 'risers', {'w': 6.0, 'd': 6.0, 'h': 30.0}),
        ('wiring', 'risers', {'w': 6.0, 'd': 6.0, 'h': 30.0}),
    ],
}

# --- Bridges: the structural archetypes ---
BRIDGES = {
    'beam_bridge': {
        'label': 'Beam bridge',
        'components': [
            ('deck', 'deck', {'l': 20.0, 'w': 4.0, 't': 0.4}),
            ('steel', 'girders', {'l': 20.0, 'w': 4.0, 'n': 4, 'h': 1.0}),
            ('pier', 'piers', {'l': 20.0, 'w': 4.0, 'n': 3, 'h': 4.0}),
        ],
    },
    'arch_bridge': {
        'label': 'Arch bridge',
        'components': [
            ('arch', 'arch', {'span': 20.0, 'rise': 5.0, 'w': 3.0, 't': 1.0}),
            ('deck', 'deck', {'l': 24.0, 'w': 3.5, 't': 0.3, 'y': 5.0}),
            ('masonry', 'spandrel', {'span': 20.0, 'rise': 5.0, 'w': 3.0}),
            ('pier', 'abutments', {'l': 24.0, 'w': 3.5, 'h': 5.0, 'n': 2}),
        ],
    },
    'suspension_bridge': {
        'label': 'Suspension bridge',
        'components': [
            ('pier', 'towers', {'l': 40.0, 'h': 15.0, 'w': 2.0, 'n': 2}),
            ('cable', 'main_cables', {'l': 40.0, 'h': 15.0, 'sag': 4.0, 'n': 2}),
            ('cable', 'hangers', {'l': 40.0, 'h': 15.0, 'sag': 4.0, 'n': 20}),
            ('deck', 'deck', {'l': 40.0, 'w': 5.0, 't': 0.4}),
        ],
    },
    'cable_stayed_bridge': {
        'label': 'Cable-stayed bridge',
        'components': [
            ('pier', 'pylon', {'l': 30.0, 'h': 18.0, 'w': 1.5}),
            ('cable', 'stays', {'l': 30.0, 'h': 18.0, 'n': 8}),
            ('deck', 'deck', {'l': 30.0, 'w': 5.0, 't': 0.4}),
        ],
    },
    'truss_bridge': {
        'label': 'Truss bridge',
        'components': [
            ('steel', 'truss', {'l': 24.0, 'h': 4.0, 'w': 4.0, 'panels': 8}),
            ('deck', 'deck', {'l': 24.0, 'w': 4.0, 't': 0.3}),
            ('pier', 'piers', {'l': 24.0, 'w': 4.0, 'n': 2, 'h': 5.0}),
        ],
    },
    'cantilever_bridge': {
        'label': 'Cantilever bridge',
        'components': [
            ('steel', 'cantilever', {'l': 30.0, 'h': 5.0, 'w': 4.0}),
            ('deck', 'deck', {'l': 30.0, 'w': 4.0, 't': 0.4}),
            ('pier', 'piers', {'l': 30.0, 'w': 4.0, 'n': 3, 'h': 6.0}),
        ],
    },
}

# --- Road cross-section layers (asphalt / tar / base) ---
ROAD = {
    'label': 'Road cross-section',
    'components': [
        ('deck', 'asphalt_wearing', {'l': 12.0, 'w': 7.0, 't': 0.05}),
        ('concrete', 'base_course', {'l': 12.0, 'w': 7.0, 't': 0.15, 'y': -0.05}),
        ('earthwork', 'subbase', {'l': 12.0, 'w': 7.0, 't': 0.25, 'y': -0.2}),
        ('earthwork', 'subgrade', {'l': 12.0, 'w': 7.0, 't': 0.4, 'y': -0.45}),
        ('plumbing', 'drainage', {'l': 12.0, 'w': 7.0, 'y': -0.6, 'diameter': 0.3}),
    ],
}

# --- Deep MEP: detailed plumbing tree (mains -> branches -> fixtures) ---
PLUMBING_DETAIL = {
    'label': 'Plumbing system (house)',
    'components': [
        ('plumbing', 'water_main', {'l': 8.0, 'y': -0.5, 'diameter': 0.025}),
        ('plumbing', 'riser', {'x': -2.0, 'y': 1.35, 'h': 2.7, 'diameter': 0.022}),
        ('plumbing', 'branches', {'w': 8.0, 'd': 6.0, 'y': 1.5, 'diameter': 0.015}),
        ('plumbing', 'fixtures', {'points': [(-2.0, 0.9, -2.0), (-2.0, 0.9, 2.0), (2.0, 0.9, -2.0), (2.0, 2.0, 2.0)], 'diameter': 0.05}),
        ('plumbing', 'drain_stack', {'x': 2.0, 'y': 1.35, 'h': 3.4, 'diameter': 0.075}),
        ('plumbing', 'drain_branches', {'w': 8.0, 'd': 6.0, 'y': 0.2, 'diameter': 0.05}),
        ('plumbing', 'vent', {'x': 2.0, 'y': 3.0, 'h': 1.0, 'diameter': 0.04}),
    ],
}

# --- Deep MEP: electrical tree (service -> panel -> circuits -> outlets) ---
WIRING_DETAIL = {
    'label': 'Electrical system (house)',
    'components': [
        ('wiring', 'service_drop', {'l': 8.0, 'y': 3.0, 'diameter': 0.012}),
        ('wiring', 'panel', {'w': 0.3, 'h': 0.5, 'd': 0.1, 'x': 3.5, 'y': 1.4, 'z': -2.9}),
        ('wiring', 'main_bus', {'x': 3.5, 'y': 1.4, 'l': 2.0, 'diameter': 0.01, 'axis': 'x'}),
        ('wiring', 'circuits', {'w': 8.0, 'd': 6.0, 'h': 2.7}),
        ('wiring', 'outlets', {'points': [(-3.0, 0.3, -2.0), (-1.0, 0.3, 2.0), (1.0, 0.3, -2.0), (3.0, 0.3, 2.0), (-2.0, 2.0, 0)], 'w': 0.12, 'h': 0.12, 'd': 0.06}),
        ('wiring', 'lighting', {'points': [(-2.0, 2.6, -1.0), (0.0, 2.6, 1.0), (2.0, 2.6, -1.0)], 'diameter': 0.008}),
    ],
}

# --- Roman aqueduct (arcade + channel, real ~1:200 gradient) ---
AQUEDUCT = {
    'label': 'Roman aqueduct',
    'components': [
        ('masonry', 'arcade', {'span': 5.0, 'rise': 2.5, 'w': 2.0, 't': 0.8, 'arches': 6}),
        ('concrete', 'channel', {'l': 34.0, 'w': 1.0, 't': 0.4, 'y': 2.6}),
        ('earthwork', 'piers', {'span': 5.0, 'w': 2.0, 'arches': 6, 'h': 3.0}),
        ('masonry', 'specus', {'l': 34.0, 'w': 0.6, 't': 0.3, 'y': 3.1}),
    ],
}

# --- Gravity dam (triangular profile, base ~2/3 height) ---
DAM = {
    'label': 'Gravity dam',
    'components': [
        ('concrete', 'dam_body', {'h': 20.0, 'crest_w': 4.0, 'base_w': 14.0, 'length': 30.0}),
        ('concrete', 'spillway', {'h': 20.0, 'w': 6.0, 'length': 30.0}),
        ('earthwork', 'foundation', {'h': 3.0, 'w': 16.0, 'length': 30.0}),
        ('plumbing', 'penstock', {'diameter': 1.5, 'h': 18.0, 'x': 0, 'z': 0}),
    ],
}

# --- Tunnel (bored, segmental lining) ---
TUNNEL = {
    'label': 'Bored tunnel',
    'components': [
        ('concrete', 'lining', {'l': 40.0, 'diameter': 6.0, 't': 0.3, 'segments': 12}),
        ('earthwork', 'ground', {'l': 40.0, 'w': 12.0, 'h': 12.0}),
        ('deck', 'road_deck', {'l': 40.0, 'w': 4.0, 't': 0.3, 'y': -1.5}),
        ('plumbing', 'drainage', {'l': 40.0, 'y': -2.0, 'diameter': 0.3}),
    ],
}

# --- Gothic cathedral (nave + rib vault + flying buttresses) ---
CATHEDRAL = {
    'label': 'Gothic cathedral',
    'components': [
        ('masonry', 'nave_walls', {'l': 40.0, 'w': 12.0, 'h': 15.0, 't': 1.0}),
        ('masonry', 'nave_piers', {'l': 40.0, 'w': 12.0, 'n': 6, 'h': 18.0}),
        ('arch', 'rib_vault', {'l': 40.0, 'w': 12.0, 'rise': 4.0, 'y': 15.0}),
        ('masonry', 'flying_buttresses', {'l': 40.0, 'w': 12.0, 'h': 12.0, 'n': 6}),
        ('masonry', 'tower', {'w': 6.0, 'd': 6.0, 'h': 30.0}),
        ('roofing', 'roof', {'l': 40.0, 'w': 12.0, 'y': 19.0, 'rise': 3.0}),
        ('finish', 'windows', {'l': 40.0, 'w': 12.0, 'h': 8.0, 'n': 6}),
    ],
}

# --- East Asian pagoda (tiered, bracket sets) ---
PAGODA = {
    'label': 'East Asian pagoda',
    'components': [
        ('concrete', 'base', {'w': 12.0, 'd': 12.0, 't': 1.0}),
        ('lumber', 'columns', {'w': 8.0, 'd': 8.0, 'h': 4.0, 'n': 8, 'sec': 'beam'}),
        ('lumber', 'brackets', {'w': 9.0, 'd': 9.0, 'y': 4.0, 'sec': 'beam'}),
        ('lumber', 'tiers', {'w': 8.0, 'd': 8.0, 'n': 5, 'h': 3.5, 'sec': 'beam'}),
        ('roofing', 'eaves', {'w': 10.0, 'd': 10.0, 'n': 5, 'y': 4.0, 'sec': 'beam'}),
        ('masonry', 'finial', {'w': 0.5, 'h': 3.0}),
    ],
}

# --- Stadium (bowl + roof ring) ---
STADIUM = {
    'label': 'Stadium',
    'components': [
        ('concrete', 'bowl', {'r_out': 40.0, 'r_in': 25.0, 'h': 15.0, 'segs': 24}),
        ('steel', 'roof_ring', {'r': 40.0, 'w': 3.0, 'y': 15.0}),
        ('deck', 'pitch', {'l': 50.0, 'w': 30.0, 't': 0.2}),
        ('concrete', 'foundation', {'r_out': 42.0, 'r_in': 23.0, 'h': 3.0, 'segs': 24}),
        ('finish', 'facade', {'r_out': 41.0, 'r_in': 40.0, 'h': 15.0, 'segs': 24}),
    ],
}

# --- Airport runway + taxiway ---
RUNWAY = {
    'label': 'Airport runway',
    'components': [
        ('deck', 'runway_surface', {'l': 100.0, 'w': 20.0, 't': 0.4}),
        ('concrete', 'pavement', {'l': 100.0, 'w': 20.0, 't': 0.6, 'y': -0.4}),
        ('earthwork', 'subgrade', {'l': 100.0, 'w': 22.0, 't': 1.0, 'y': -1.0}),
        ('deck', 'taxiway', {'l': 60.0, 'w': 12.0, 't': 0.3, 'y': 0, 'x': 0, 'z': 20.0}),
        ('wiring', 'runway_lights', {'l': 100.0, 'y': 0.1, 'n': 20}),
    ],
}

STRUCTURES = {
    'house': HOUSE,
    'skyscraper': SKYSCRAPER,
    'road': ROAD,
    'plumbing_detail': PLUMBING_DETAIL,
    'wiring_detail': WIRING_DETAIL,
    'aqueduct': AQUEDUCT,
    'dam': DAM,
    'tunnel': TUNNEL,
    'cathedral': CATHEDRAL,
    'pagoda': PAGODA,
    'stadium': STADIUM,
    'runway': RUNWAY,
    **BRIDGES,
}

# extra categories for the new structures
CATEGORIES.setdefault('stone', {'color': '#a8a098', 'name': 'Stone'})
