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

STRUCTURES = {
    'house': HOUSE,
    'skyscraper': SKYSCRAPER,
    'road': ROAD,
    **BRIDGES,
}
