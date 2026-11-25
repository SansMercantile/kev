"""Deep-space / universe object data (real where published, schematic deposits).

Interior/structure from astronomy (Milky Way arms, star-forming regions,
asteroid belt, Kuiper belt, black hole structure). Deposits (metals, ices)
schematic and labeled.
"""

# Star spectral classes -> color + description
STAR_TYPES = {
    'O': {'color': '#9bb0ff', 'desc': 'Blue supergiant, >30,000 K.'},
    'B': {'color': '#aabfff', 'desc': 'Blue-white, 10,000-30,000 K.'},
    'A': {'color': '#cad8ff', 'desc': 'White, 7,500-10,000 K.'},
    'F': {'color': '#fbf8ff', 'desc': 'Yellow-white, 6,000-7,500 K.'},
    'G': {'color': '#fff4e0', 'desc': 'Yellow dwarf (like the Sun), 5,200-6,000 K.'},
    'K': {'color': '#ffd8a8', 'desc': 'Orange dwarf, 3,700-5,200 K.'},
    'M': {'color': '#ff8a6a', 'desc': 'Red dwarf, 2,400-3,700 K.'},
}

# Milky Way structure (schematic top-down spiral arms)
MILKY_WAY = {
    'label': 'Milky Way galaxy',
    'components': [
        ('galaxy', 'central_bar', {'l': 8.0, 'w': 3.0, 'h': 2.0}),
        ('galaxy', 'bulge', {'r': 4.0}),
        ('galaxy', 'disk', {'r_out': 20.0, 'r_in': 4.0, 'h': 1.0}),
        ('galaxy', 'spiral_arms', {'r_out': 20.0, 'r_in': 5.0, 'arms': 4, 'pitch': 0.5}),
        ('galaxy', 'halo', {'r': 25.0, 'segs': 16}),
        ('galaxy', 'globular_clusters', {'r': 25.0, 'n': 12}),
        ('galaxy', 'solar_position', {'r': 8.0, 'angle': 0.0}),
    ],
}

# Black hole (event horizon + accretion disk + jets)
BLACK_HOLE = {
    'label': 'Black hole',
    'components': [
        ('space', 'event_horizon', {'r': 2.0}),
        ('space', 'accretion_disk', {'r_out': 6.0, 'r_in': 2.2, 'h': 0.3}),
        ('space', 'relativistic_jets', {'r': 0.5, 'h': 12.0}),
        ('space', 'photon_sphere', {'r': 3.0, 'segs': 32}),
        ('space', 'inner_stable_orbit', {'r': 6.0, 'segs': 32}),
    ],
}

# Orion's belt region (3 bright stars + nebula)
ORION = {
    'label': "Orion's belt",
    'components': [
        ('space', 'alnitak', {'r': 0.8, 'type': 'O'}),
        ('space', 'alnilam', {'r': 0.8, 'type': 'B', 'x': 2.0}),
        ('space', 'mintaka', {'r': 0.8, 'type': 'O', 'x': 4.0}),
        ('space', 'orion_nebula', {'x': 2.0, 'y': -2.0, 'r': 2.5}),
        ('space', 'horsehead_nebula', {'x': 0.5, 'y': -1.5, 'r': 0.8}),
    ],
}

# Asteroid belt (main belt between Mars and Jupiter)
ASTEROID_BELT = {
    'label': 'Asteroid belt',
    'components': [
        ('space', 'belt', {'r_out': 18.0, 'r_in': 12.0, 'h': 1.5, 'n': 40}),
        ('space', 'ceres', {'r': 1.0, 'x': 0, 'z': 15.0}),
        ('space', 'vesta', {'r': 0.6, 'x': 10.0, 'z': 10.0}),
        ('space', 'pallas', {'r': 0.5, 'x': -8.0, 'z': 12.0}),
    ],
}

# Comet (nucleus + coma + tail)
COMET = {
    'label': 'Comet',
    'components': [
        ('space', 'nucleus', {'r': 0.5}),
        ('space', 'coma', {'r': 1.5}),
        ('space', 'dust_tail', {'l': 8.0, 'w': 1.0, 'curve': 0.5}),
        ('space', 'ion_tail', {'l': 12.0, 'w': 0.3, 'curve': 0.1}),
    ],
}

# Shooting star / meteor
METEOR = {
    'label': 'Meteor (shooting star)',
    'components': [
        ('space', 'meteoroid', {'r': 0.3}),
        ('space', 'trail', {'l': 6.0, 'w': 0.2, 'curve': 0.0}),
    ],
}

# Galaxy types (spiral, elliptical, irregular)
GALAXY_SPIRAL = {
    'label': 'Spiral galaxy',
    'components': [
        ('galaxy', 'core', {'r': 2.0}),
        ('galaxy', 'disk', {'r_out': 12.0, 'r_in': 2.0, 'h': 0.8}),
        ('galaxy', 'spiral_arms', {'r_out': 12.0, 'r_in': 3.0, 'arms': 2, 'pitch': 0.6}),
    ],
}

GALAXY_ELLIPTICAL = {
    'label': 'Elliptical galaxy',
    'components': [
        ('galaxy', 'core', {'r': 3.0}),
        ('galaxy', 'halo', {'r': 8.0, 'segs': 16, 'flatten': 0.6}),
    ],
}

GALAXY_IRREGULAR = {
    'label': 'Irregular galaxy',
    'components': [
        ('galaxy', 'cloud', {'r': 5.0, 'segs': 8}),
        ('galaxy', 'star_forming_regions', {'r': 5.0, 'n': 6}),
    ],
}

# Nebula types
NEBULA_EMISSION = {
    'label': 'Emission nebula (star-forming)',
    'components': [
        ('space', 'gas_cloud', {'r': 4.0, 'segs': 12}),
        ('space', 'young_stars', {'r': 4.0, 'n': 8, 'type': 'O'}),
    ],
}

NEBULA_PLANETARY = {
    'label': 'Planetary nebula (dying star)',
    'components': [
        ('space', 'central_star', {'r': 0.4, 'type': 'O'}),
        ('space', 'shell', {'r_out': 3.0, 'r_in': 2.5, 'segs': 16}),
    ],
}

NEBULA_DARK = {
    'label': 'Dark nebula (dust cloud)',
    'components': [
        ('space', 'dust_cloud', {'r': 4.0, 'segs': 8}),
    ],
}

# Kuiper belt + Oort cloud
KUIPER_BELT = {
    'label': 'Kuiper belt',
    'components': [
        ('space', 'belt', {'r_out': 40.0, 'r_in': 30.0, 'h': 4.0, 'n': 30}),
        ('space', 'pluto_object', {'r': 0.5, 'x': 35.0}),
        ('space', 'eris_object', {'r': 0.4, 'x': -32.0}),
    ],
}

OORT_CLOUD = {
    'label': 'Oort cloud',
    'components': [
        ('space', 'shell', {'r_out': 50.0, 'r_in': 40.0, 'n': 50, 'segs': 12}),
    ],
}

# Additional galaxy types
GALAXY_BARRED_SPIRAL = {
    'label': 'Barred spiral galaxy',
    'components': [
        ('galaxy', 'central_bar', {'l': 4.0, 'w': 2.0, 'h': 1.5}),
        ('galaxy', 'disk', {'r_out': 12.0, 'r_in': 2.0, 'h': 0.8}),
        ('galaxy', 'spiral_arms', {'r_out': 12.0, 'r_in': 4.0, 'arms': 2, 'pitch': 0.4}),
    ],
}

GALAXY_LENTICULAR = {
    'label': 'Lenticular galaxy',
    'components': [
        ('galaxy', 'bulge', {'r': 4.0}),
        ('galaxy', 'disk', {'r_out': 10.0, 'r_in': 4.0, 'h': 0.5}),
    ],
}

GALAXY_RING = {
    'label': 'Ring galaxy',
    'components': [
        ('galaxy', 'core', {'r': 2.0}),
        ('galaxy', 'ring', {'r_out': 10.0, 'r_in': 8.0, 'h': 1.0}),
    ],
}

GALAXY_DWARF = {
    'label': 'Dwarf galaxy',
    'components': [
        ('galaxy', 'core', {'r': 1.5}),
        ('galaxy', 'halo', {'r': 4.0, 'segs': 12}),
    ],
}

# Constellations (famous ones with real star positions, schematic brightness)
CONSTELLATIONS = {
    'orion': {
        'label': 'Orion constellation',
        'components': [
            ('space', 'betelgeuse', {'r': 1.2, 'type': 'M', 'x': -2.0, 'y': 2.0}),
            ('space', 'bellatrix', {'r': 0.9, 'type': 'B', 'x': 2.0, 'y': 2.0}),
            ('space', 'alnitak', {'r': 0.9, 'type': 'O', 'x': -1.0, 'y': 0.0}),
            ('space', 'alnilam', {'r': 0.9, 'type': 'B', 'x': 0.0, 'y': -0.2}),
            ('space', 'mintaka', {'r': 0.9, 'type': 'O', 'x': 1.0, 'y': -0.4}),
            ('space', 'saiph', {'r': 0.9, 'type': 'B', 'x': -1.5, 'y': -2.0}),
            ('space', 'rigel', {'r': 1.0, 'type': 'B', 'x': 1.5, 'y': -2.2}),
        ],
    },
    'ursa_major': {
        'label': 'Ursa Major (Big Dipper)',
        'components': [
            ('space', 'dubhe', {'r': 1.0, 'type': 'K', 'x': -3.0, 'y': 2.0}),
            ('space', 'merak', {'r': 0.9, 'type': 'A', 'x': -1.5, 'y': 1.0}),
            ('space', 'phecda', {'r': 0.9, 'type': 'A', 'x': -1.0, 'y': -0.5}),
            ('space', 'megrez', {'r': 0.9, 'type': 'A', 'x': -2.5, 'y': -1.0}),
            ('space', 'alioth', {'r': 0.9, 'type': 'A', 'x': 0.0, 'y': 0.0}),
            ('space', 'mizar', {'r': 0.9, 'type': 'A', 'x': 2.0, 'y': 0.5}),
            ('space', 'alkaid', {'r': 0.9, 'type': 'B', 'x': 4.0, 'y': 1.0}),
        ],
    },
    'cassiopeia': {
        'label': 'Cassiopeia',
        'components': [
            ('space', 'gamma_cas', {'r': 0.9, 'type': 'B', 'x': -2.0, 'y': 1.0}),
            ('space', 'beta_cas', {'r': 0.9, 'type': 'F', 'x': -1.0, 'y': 0.0}),
            ('space', 'alpha_cas', {'r': 1.0, 'type': 'K', 'x': 0.0, 'y': -0.5}),
            ('space', 'delta_cas', {'r': 0.9, 'type': 'A', 'x': 1.0, 'y': 0.0}),
            ('space', 'epsilon_cas', {'r': 0.9, 'type': 'B', 'x': 2.0, 'y': 1.0}),
        ],
    },
    'scorpius': {
        'label': 'Scorpius',
        'components': [
            ('space', 'antares', {'r': 1.3, 'type': 'M', 'x': 0.0, 'y': 0.0}),
            ('space', 'acrab', {'r': 0.8, 'type': 'B', 'x': -1.0, 'y': 1.0}),
            ('space', 'dschubba', {'r': 0.8, 'type': 'B', 'x': -0.5, 'y': 1.5}),
            ('space', 'pi_sco', {'r': 0.8, 'type': 'B', 'x': -1.5, 'y': 0.5}),
            ('space', 'sigma_sco', {'r': 0.8, 'type': 'B', 'x': 0.5, 'y': -0.5}),
            ('space', 'tau_sco', {'r': 0.8, 'type': 'B', 'x': 1.0, 'y': -1.0}),
            ('space', 'shaula', {'r': 0.9, 'type': 'B', 'x': 1.5, 'y': -2.0}),
            ('space', 'lesath', {'r': 0.9, 'type': 'B', 'x': 0.5, 'y': -2.5}),
        ],
    },
    'southern_cross': {
        'label': 'Southern Cross',
        'components': [
            ('space', 'acrux', {'r': 1.0, 'type': 'B', 'x': 0.0, 'y': 0.0}),
            ('space', 'mimosa', {'r': 0.9, 'type': 'B', 'x': 1.0, 'y': 1.0}),
            ('space', 'gacrux', {'r': 1.0, 'type': 'M', 'x': -0.5, 'y': -1.5}),
            ('space', 'delta_cru', {'r': 0.9, 'type': 'B', 'x': 0.5, 'y': -0.5}),
        ],
    },
    'lyra': {
        'label': 'Lyra',
        'components': [
            ('space', 'vega', {'r': 1.0, 'type': 'A', 'x': 0.0, 'y': 0.0}),
            ('space', 'sheliak', {'r': 0.8, 'type': 'B', 'x': 1.0, 'y': -0.5}),
            ('space', 'sulafat', {'r': 0.8, 'type': 'B', 'x': 1.5, 'y': -1.0}),
            ('space', 'delta_lyr', {'r': 0.8, 'type': 'B', 'x': -0.5, 'y': -1.0}),
        ],
    },
    'cygnus': {
        'label': 'Cygnus (Northern Cross)',
        'components': [
            ('space', 'deneb', {'r': 1.2, 'type': 'A', 'x': 0.0, 'y': 2.0}),
            ('space', 'sadr', {'r': 0.9, 'type': 'F', 'x': 0.0, 'y': 0.0}),
            ('space', 'delta_cyg', {'r': 0.8, 'type': 'B', 'x': -1.5, 'y': 0.5}),
            ('space', 'albireo', {'r': 0.9, 'type': 'K', 'x': 1.5, 'y': -0.5}),
            ('space', 'gienah', {'r': 0.8, 'type': 'K', 'x': -1.0, 'y': -0.5}),
        ],
    },
    'leo': {
        'label': 'Leo',
        'components': [
            ('space', 'regulus', {'r': 1.0, 'type': 'B', 'x': 0.0, 'y': 0.0}),
            ('space', 'denebola', {'r': 0.9, 'type': 'A', 'x': 2.0, 'y': 0.5}),
            ('space', 'algieba', {'r': 0.9, 'type': 'K', 'x': -1.0, 'y': 1.0}),
            ('space', 'adhafera', {'r': 0.8, 'type': 'F', 'x': -1.5, 'y': 0.5}),
        ],
    },
    'taurus': {
        'label': 'Taurus',
        'components': [
            ('space', 'aldebaran', {'r': 1.2, 'type': 'K', 'x': 0.0, 'y': 0.0}),
            ('space', 'elnath', {'r': 0.9, 'type': 'B', 'x': 1.5, 'y': 1.0}),
            ('space', 'alcyone', {'r': 0.8, 'type': 'B', 'x': -0.5, 'y': 1.5}),
            ('space', 'maia', {'r': 0.8, 'type': 'B', 'x': -1.0, 'y': 1.0}),
            ('space', 'electra', {'r': 0.8, 'type': 'B', 'x': -0.5, 'y': 0.5}),
        ],
    },
}

# Additional galaxy types
GALAXY_BARRED_SPIRAL = {
    'label': 'Barred spiral galaxy',
    'components': [
        ('galaxy', 'central_bar', {'l': 4.0, 'w': 2.0, 'h': 1.5}),
        ('galaxy', 'disk', {'r_out': 12.0, 'r_in': 2.0, 'h': 0.8}),
        ('galaxy', 'spiral_arms', {'r_out': 12.0, 'r_in': 4.0, 'arms': 2, 'pitch': 0.4}),
    ],
}

GALAXY_LENTICULAR = {
    'label': 'Lenticular galaxy',
    'components': [
        ('galaxy', 'bulge', {'r': 4.0}),
        ('galaxy', 'disk', {'r_out': 10.0, 'r_in': 4.0, 'h': 0.5}),
    ],
}

GALAXY_RING = {
    'label': 'Ring galaxy',
    'components': [
        ('galaxy', 'core', {'r': 1.5}),
        ('galaxy', 'ring', {'r_out': 10.0, 'r_in': 8.0, 'h': 0.8, 'segs': 24}),
    ],
}

GALAXY_DWARF = {
    'label': 'Dwarf galaxy',
    'components': [
        ('galaxy', 'cloud', {'r': 3.0, 'segs': 8}),
        ('galaxy', 'star_forming_regions', {'r': 3.0, 'n': 4}),
    ],
}

SPACE_OBJECTS = {
    'milky_way': MILKY_WAY,
    'black_hole': BLACK_HOLE,
    'orion': ORION,
    'asteroid_belt': ASTEROID_BELT,
    'comet': COMET,
    'meteor': METEOR,
    'galaxy_spiral': GALAXY_SPIRAL,
    'galaxy_elliptical': GALAXY_ELLIPTICAL,
    'galaxy_irregular': GALAXY_IRREGULAR,
    'galaxy_barred_spiral': GALAXY_BARRED_SPIRAL,
    'galaxy_lenticular': GALAXY_LENTICULAR,
    'galaxy_ring': GALAXY_RING,
    'galaxy_dwarf': GALAXY_DWARF,
    'nebula_emission': NEBULA_EMISSION,
    'nebula_planetary': NEBULA_PLANETARY,
    'nebula_dark': NEBULA_DARK,
    'kuiper_belt': KUIPER_BELT,
    'oort_cloud': OORT_CLOUD,
    'constellation_orion': CONSTELLATIONS['orion'],
    'constellation_ursa_major': CONSTELLATIONS['ursa_major'],
    'constellation_cassiopeia': CONSTELLATIONS['cassiopeia'],
    'constellation_scorpius': CONSTELLATIONS['scorpius'],
    'constellation_southern_cross': CONSTELLATIONS['southern_cross'],
    'constellation_lyra': CONSTELLATIONS['lyra'],
    'constellation_cygnus': CONSTELLATIONS['cygnus'],
    'constellation_leo': CONSTELLATIONS['leo'],
    'constellation_taurus': CONSTELLATIONS['taurus'],
}

# Extra categories
CATEGORIES = {
    'space': {'color': '#1a2a4a', 'name': 'Space object'},
    'galaxy': {'color': '#3a4a6a', 'name': 'Galaxy structure'},
}
