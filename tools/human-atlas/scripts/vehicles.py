"""Vehicle / mechanical atlas data (real dimensions and component proportions).

Component dimensions from real vehicle specs (wheel sizes, chassis lengths,
rotor spans, hull lengths). Vehicles exploded by system (frame, wheels, engine,
steering, body, etc.). These are TEACHING solids at true proportions.
"""

CATEGORIES = {
    'frame':     {'color': '#5a6a7a', 'name': 'Frame / chassis'},
    'wheel':     {'color': '#2a2a32', 'name': 'Wheels / tires'},
    'engine':    {'color': '#8a4a3a', 'name': 'Engine / motor'},
    'steering':  {'color': '#4a7a9a', 'name': 'Steering / controls'},
    'body':      {'color': '#c8a06a', 'name': 'Body / panels'},
    'wing':      {'color': '#8a8a9a', 'name': 'Wings / rotors'},
    'hull':      {'color': '#4a6a8a', 'name': 'Hull'},
    'sail':      {'color': '#e8e0d0', 'name': 'Sails / rigging'},
    'gear':      {'color': '#7a7a72', 'name': 'Gears / drivetrain'},
    'cabin':     {'color': '#d0c8b8', 'name': 'Cabin / cockpit'},
    'fuel':      {'color': '#c8a020', 'name': 'Fuel / tank'},
    'suspension':{'color': '#6a5a4a', 'name': 'Suspension'},
    'brake':     {'color': '#a85a4a', 'name': 'Brakes'},
    'blade':     {'color': '#9aa0a6', 'name': 'Blades'},
}

# Each vehicle: components list of (category, builder, params)
VEHICLES = {
    'rollerblades': {
        'label': 'Rollerblades',
        'components': [
            ('frame', 'boot', {'l': 0.28, 'w': 0.12, 'h': 0.25}),
            ('blade', 'frame', {'l': 0.28, 'w': 0.02, 'h': 0.02}),
            ('wheel', 'wheels', {'n': 4, 'diameter': 0.08, 'width': 0.02, 'spacing': 0.07}),
            ('brake', 'heel_brake', {'w': 0.03, 'h': 0.03, 'l': 0.05}),
        ],
    },
    'skateboard': {
        'label': 'Skateboard',
        'components': [
            ('body', 'deck', {'l': 0.8, 'w': 0.2, 'h': 0.01}),
            ('frame', 'trucks', {'l': 0.15, 'w': 0.15, 'n': 2}),
            ('wheel', 'wheels', {'n': 4, 'diameter': 0.055, 'width': 0.03, 'spacing': 0.55}),
            ('gear', 'bearings', {'n': 8, 'diameter': 0.01}),
        ],
    },
    'bicycle': {
        'label': 'Bicycle',
        'components': [
            ('frame', 'frame', {'l': 1.8, 'h': 1.0}),
            ('wheel', 'wheels', {'n': 2, 'diameter': 0.7, 'width': 0.03, 'spacing': 1.1}),
            ('gear', 'crankset', {'diameter': 0.2, 'x': 0.4}),
            ('gear', 'chain', {'l': 0.8, 'y': 0.4}),
            ('steering', 'handlebars', {'l': 0.5, 'y': 1.0, 'x': 0.9}),
            ('cabin', 'saddle', {'w': 0.15, 'l': 0.25, 'y': 0.95, 'x': -0.3}),
            ('brake', 'brakes', {'n': 2}),
        ],
    },
    'motorcycle': {
        'label': 'Motorcycle',
        'components': [
            ('frame', 'frame', {'l': 2.0, 'h': 0.8}),
            ('wheel', 'wheels', {'n': 2, 'diameter': 0.6, 'width': 0.1, 'spacing': 1.4}),
            ('engine', 'engine', {'w': 0.4, 'h': 0.4, 'l': 0.5, 'x': 0.3}),
            ('steering', 'handlebars', {'l': 0.6, 'y': 0.9, 'x': 0.9}),
            ('cabin', 'seat', {'w': 0.3, 'l': 0.5, 'y': 0.75, 'x': -0.2}),
            ('fuel', 'tank', {'w': 0.3, 'h': 0.25, 'l': 0.4, 'x': 0.5}),
        ],
    },
    'car': {
        'label': 'Car (sedan)',
        'components': [
            ('frame', 'chassis', {'l': 4.5, 'w': 1.8, 'h': 0.4}),
            ('wheel', 'wheels', {'n': 4, 'diameter': 0.65, 'width': 0.2, 'spacing': 2.7, 'track': 1.5}),
            ('engine', 'engine', {'w': 0.8, 'h': 0.6, 'l': 0.9, 'x': 1.2}),
            ('body', 'body', {'l': 4.5, 'w': 1.8, 'h': 1.4}),
            ('cabin', 'cabin', {'l': 2.2, 'w': 1.6, 'h': 1.2, 'x': -0.3}),
            ('steering', 'steering_wheel', {'diameter': 0.35, 'x': 0.6, 'y': 0.9}),
            ('suspension', 'suspension', {'n': 4, 'h': 0.3}),
            ('brake', 'brakes', {'n': 4}),
            ('fuel', 'tank', {'w': 0.6, 'h': 0.3, 'l': 0.8, 'x': -1.5}),
        ],
    },
    'truck': {
        'label': 'Truck (semi)',
        'components': [
            ('frame', 'chassis', {'l': 7.0, 'w': 2.5, 'h': 0.8}),
            ('wheel', 'wheels', {'n': 6, 'diameter': 1.0, 'width': 0.3, 'spacing': 4.5, 'track': 2.0}),
            ('engine', 'engine', {'w': 1.0, 'h': 1.0, 'l': 1.2, 'x': 2.5}),
            ('cabin', 'cab', {'l': 2.0, 'w': 2.2, 'h': 2.8, 'x': 2.5}),
            ('body', 'trailer', {'l': 8.0, 'w': 2.5, 'h': 3.0, 'x': -1.0}),
            ('fuel', 'tank', {'w': 0.8, 'h': 0.6, 'l': 1.0, 'x': 1.0}),
        ],
    },
    'hot_air_balloon': {
        'label': 'Hot air balloon',
        'components': [
            ('body', 'envelope', {'diameter': 15.0, 'h': 20.0}),
            ('cabin', 'basket', {'w': 1.2, 'd': 1.2, 'h': 1.0, 'y': -12.0}),
            ('frame', 'burner', {'w': 0.5, 'h': 0.5, 'y': -8.0}),
            ('cable', 'ropes', {'n': 4, 'h': 12.0}),
        ],
    },
    'prop_plane': {
        'label': 'Propeller plane (Cessna)',
        'components': [
            ('frame', 'fuselage', {'l': 8.0, 'diameter': 1.5}),
            ('wing', 'wings', {'span': 11.0, 'chord': 1.5, 'y': 0.5}),
            ('wing', 'tail', {'span': 3.0, 'chord': 1.0, 'x': -3.5, 'y': 0.5}),
            ('engine', 'engine', {'diameter': 0.8, 'l': 1.0, 'h': 0.8, 'x': 4.0}),
            ('blade', 'propeller', {'diameter': 2.0, 'x': 4.5}),
            ('wheel', 'landing_gear', {'n': 3, 'diameter': 0.4, 'width': 0.2}),
            ('cabin', 'cockpit', {'l': 2.0, 'w': 1.2, 'h': 1.2, 'x': 1.5}),
        ],
    },
    'jet_airliner': {
        'label': 'Jet airliner (A320)',
        'components': [
            ('frame', 'fuselage', {'l': 37.0, 'diameter': 4.0}),
            ('wing', 'wings', {'span': 34.0, 'chord': 5.0, 'y': 0.0}),
            ('wing', 'tail', {'span': 12.0, 'chord': 4.0, 'x': -16.0}),
            ('engine', 'engines_jet', {'n': 2, 'diameter': 2.0, 'l': 4.0, 'x': 5.0, 'y': -1.5}),
            ('cabin', 'cockpit', {'l': 4.0, 'w': 3.5, 'h': 2.5, 'x': 15.0}),
            ('cabin', 'cabin_jet', {'l': 25.0, 'diameter': 3.5, 'x': -2.0}),
            ('wheel', 'landing_gear', {'n': 3, 'diameter': 1.0}),
        ],
    },
    'fighter_jet': {
        'label': 'Fighter jet (F-16)',
        'components': [
            ('frame', 'fuselage', {'l': 15.0, 'diameter': 1.5}),
            ('wing', 'wings', {'span': 10.0, 'chord': 4.0, 'y': 0.0, 'sweep': 0.6}),
            ('wing', 'tail', {'span': 5.0, 'chord': 2.0, 'x': -6.0}),
            ('wing', 'vertical_tail', {'span': 0, 'chord': 0, 'x': -6.0, 'h': 3.0}),
            ('engine', 'engine', {'diameter': 1.0, 'l': 4.0, 'x': -2.0}),
            ('blade', 'afterburner', {'diameter': 1.0, 'x': -4.0}),
            ('cabin', 'cockpit', {'l': 3.0, 'w': 1.0, 'h': 1.2, 'x': 4.0}),
        ],
    },
    'helicopter': {
        'label': 'Helicopter',
        'components': [
            ('frame', 'fuselage', {'l': 12.0, 'diameter': 2.0}),
            ('blade', 'main_rotor', {'diameter': 14.0, 'y': 1.5}),
            ('blade', 'tail_rotor', {'diameter': 2.5, 'x': -6.0, 'y': 1.0}),
            ('engine', 'engine', {'w': 0.8, 'h': 0.8, 'l': 1.5, 'x': 0}),
            ('cabin', 'cockpit', {'l': 3.0, 'w': 1.5, 'h': 1.5, 'x': 3.0}),
            ('wheel', 'skids', {'n': 2, 'l': 3.0, 'spacing': 1.5}),
        ],
    },
    'sailboat': {
        'label': 'Sailboat',
        'components': [
            ('hull', 'hull', {'l': 10.0, 'w': 3.0, 'h': 1.5}),
            ('sail', 'main_sail', {'h': 12.0, 'w': 4.0, 'x': 1.0}),
            ('sail', 'jib', {'h': 10.0, 'w': 3.0, 'x': 4.0}),
            ('frame', 'mast', {'h': 14.0, 'x': 1.0}),
            ('cabin', 'cabin', {'l': 3.0, 'w': 2.0, 'h': 1.0, 'x': -2.0}),
        ],
    },
    'motor_yacht': {
        'label': 'Motor yacht',
        'components': [
            ('hull', 'hull', {'l': 15.0, 'w': 4.0, 'h': 2.0}),
            ('cabin', 'superstructure', {'l': 6.0, 'w': 3.5, 'h': 2.5, 'x': -1.0}),
            ('engine', 'engines', {'n': 2, 'diameter': 0.5, 'x': -4.0}),
            ('cabin', 'flybridge', {'l': 4.0, 'w': 3.0, 'h': 1.0, 'x': -1.0, 'y': 2.5}),
        ],
    },
    'cargo_ship': {
        'label': 'Container ship',
        'components': [
            ('hull', 'hull', {'l': 200.0, 'w': 30.0, 'h': 15.0}),
            ('cabin', 'superstructure', {'l': 20.0, 'w': 20.0, 'h': 15.0, 'x': -60.0}),
            ('body', 'containers', {'n': 12, 'w': 6.0, 'h': 2.5, 'l': 12.0}),
            ('engine', 'engine', {'diameter': 3.0, 'l': 8.0, 'x': -80.0}),
        ],
    },
    'submarine': {
        'label': 'Submarine',
        'components': [
            ('hull', 'pressure_hull', {'l': 60.0, 'diameter': 8.0}),
            ('cabin', 'sail', {'l': 8.0, 'w': 3.0, 'h': 6.0, 'x': 10.0}),
            ('engine', 'reactor', {'diameter': 4.0, 'x': -10.0}),
            ('blade', 'propeller', {'diameter': 5.0, 'x': -30.0}),
            ('wing', 'diving_planes', {'span': 8.0, 'x': 15.0}),
        ],
    },
    'rocket': {
        'label': 'Rocket (Falcon 9)',
        'components': [
            ('frame', 'first_stage', {'l': 40.0, 'diameter': 3.7}),
            ('frame', 'second_stage', {'l': 12.0, 'diameter': 3.7, 'y': 45.0}),
            ('engine', 'engines', {'n': 9, 'diameter': 0.9, 'x': -20.0}),
            ('cabin', 'fairing', {'diameter': 5.0, 'h': 8.0, 'y': 55.0}),
            ('fuel', 'tanks', {'l': 30.0, 'diameter': 3.0}),
        ],
    },
    'space_shuttle': {
        'label': 'Space Shuttle',
        'components': [
            ('frame', 'orbiter', {'l': 37.0, 'diameter': 5.0}),
            ('wing', 'wings', {'span': 24.0, 'chord': 8.0, 'y': -2.0, 'sweep': 0.7}),
            ('wing', 'vertical_tail', {'span': 0, 'chord': 0, 'x': -15.0, 'h': 8.0}),
            ('engine', 'main_engines', {'n': 3, 'diameter': 2.0, 'x': -18.0}),
            ('cabin', 'cockpit', {'l': 6.0, 'w': 4.0, 'h': 3.0, 'x': 12.0}),
            ('body', 'payload_bay', {'l': 18.0, 'w': 4.5, 'h': 4.0, 'x': -2.0}),
        ],
    },
}

# Groupings for the selector
VEHICLE_GROUPS = {
    'personal': ['rollerblades', 'skateboard', 'bicycle', 'motorcycle'],
    'road': ['car', 'truck'],
    'air': ['hot_air_balloon', 'prop_plane', 'jet_airliner', 'fighter_jet', 'helicopter'],
    'water': ['sailboat', 'motor_yacht', 'cargo_ship', 'submarine'],
    'space': ['rocket', 'space_shuttle'],
}
