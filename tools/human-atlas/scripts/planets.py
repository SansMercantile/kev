"""Planetary body data (real interior models + orbital/rotation data).

Layer radii are fractions of body radius from published interior models:
  Earth  - PREM (Dziewonski & Anderson 1981): crust 0.35%, mantle 54.6%,
           outer core 54.6-80.8%, inner core 80.8-100% of radius.
  Moon   - Weber et al. 2011 (GRAIL/Apollo seismic).
  Mars   - InSight (Stahler et al. 2021): crust ~24-72km, mantle, core r~1830km.
  Others - standard published interior models (gas/ice giants: atmosphere,
           molecular H/He, metallic H, ice, rock/ice core).

radii are OUTER radius of each layer as a fraction of the body radius (1.0 =
surface). Layers are listed outside-in.
"""

# Substance palette (schematic deposits). system ids reuse the anatomy viewer's
# material colors where sensible; otherwise new ids (the viewer falls back to a
# default material color).
SUBSTANCES = {
    'ocean_water':   {'name': 'Ocean water', 'color': '#1a5f9e', 'desc': 'Surface liquid water (schematic volume).'},
    'ice':           {'name': 'Water ice', 'color': '#cfe8f5', 'desc': 'Polar/subsurface ice (schematic).'},
    'crude_oil':     {'name': 'Crude oil', 'color': '#2a2018', 'desc': 'Hydrocarbon reservoirs in sedimentary crust (schematic deposit).'},
    'natural_gas':   {'name': 'Natural gas', 'color': '#6a5a3a', 'desc': 'Gas trapped in crustal reservoirs (schematic).'},
    'coal':          {'name': 'Coal', 'color': '#1a1a1a', 'desc': 'Fossil carbon seams in crust (schematic).'},
    'gold':          {'name': 'Gold', 'color': '#d4af37', 'desc': 'Hydrothermal gold deposits / core metal (schematic).'},
    'iron':          {'name': 'Iron', 'color': '#8a4a3a', 'desc': 'Banded iron / core iron (schematic).'},
    'nickel':        {'name': 'Nickel', 'color': '#7a7a8a', 'desc': 'Core nickel alloy (schematic).'},
    'copper':        {'name': 'Copper', 'color': '#b87333', 'desc': 'Copper ore deposits (schematic).'},
    'silver':        {'name': 'Silver', 'color': '#c0c0c0', 'desc': 'Silver deposits (schematic).'},
    'platinum':      {'name': 'Platinum', 'color': '#9aa0a6', 'desc': 'Platinum-group deposits (schematic).'},
    'diamond':       {'name': 'Diamond', 'color': '#bfe3ef', 'desc': 'Kimberlite-pipe diamonds from the mantle (schematic).'},
    'magma':         {'name': 'Magma', 'color': '#e2562a', 'desc': 'Molten rock (schematic).'},
    'sulfur':        {'name': 'Sulfur', 'color': '#e0c020', 'desc': 'Sulfur deposits / volcanic sulfur (schematic).'},
    'liquid_metal_h':{'name': 'Metallic hydrogen', 'color': '#b0b8c8', 'desc': 'Liquid metallic hydrogen (gas giants).'},
}

# Each body: name, radius_km, rotation_h (sidereal, -=retrograde), orbit_au,
# axial_tilt_deg, texture (or None -> procedural color), layers (outside-in),
# and deposits (substance, layer index, count).
BODIES = {
    'sun': {
        'label': 'Sun', 'radius_km': 696340, 'rotation_h': 609.6, 'orbit_au': 0,
        'axial_tilt_deg': 7.25, 'emissive': True, 'color': '#ffb347',
        'layers': [
            {'name': 'Photosphere', 'outer': 1.0, 'inner': 0.997, 'color': '#ffd27a', 'desc': 'Visible surface, ~5,500 °C.'},
            {'name': 'Convective zone', 'outer': 0.997, 'inner': 0.71, 'color': '#ff9a3a', 'desc': 'Energy carried by convection.'},
            {'name': 'Radiative zone', 'outer': 0.71, 'inner': 0.25, 'color': '#ff7a2a', 'desc': 'Energy carried by radiation.'},
            {'name': 'Core (fusion)', 'outer': 0.25, 'inner': 0.0, 'color': '#fff1c8', 'desc': 'Hydrogen fusion, ~15 million °C.'},
        ],
        'deposits': [],
    },
    'mercury': {
        'label': 'Mercury', 'radius_km': 2439.7, 'rotation_h': 4222.6, 'orbit_au': 0.387,
        'axial_tilt_deg': 0.03, 'color': '#9c8e82',
        'layers': [
            {'name': 'Crust', 'outer': 1.0, 'inner': 0.86, 'color': '#9c8e82', 'desc': 'Thin silicate crust (~35 km).'},
            {'name': 'Mantle', 'outer': 0.86, 'inner': 0.69, 'color': '#8a6a4a', 'desc': 'Silicate mantle (~600 km).'},
            {'name': 'Outer core', 'outer': 0.69, 'inner': 0.42, 'color': '#caa46a', 'desc': 'Liquid iron core.'},
            {'name': 'Inner core', 'outer': 0.42, 'inner': 0.0, 'color': '#e0d0b0', 'desc': 'Solid iron inner core.'},
        ],
        'deposits': [('iron', 3, 6), ('sulfur', 0, 3)],
    },
    'venus': {
        'label': 'Venus', 'radius_km': 6051.8, 'rotation_h': -5832.5, 'orbit_au': 0.723,
        'axial_tilt_deg': 177.4, 'color': '#d8b06a',
        'layers': [
            {'name': 'Crust', 'outer': 1.0, 'inner': 0.995, 'color': '#c8a05a', 'desc': 'Basaltic crust (~20-50 km).'},
            {'name': 'Mantle', 'outer': 0.995, 'inner': 0.55, 'color': '#a8763a', 'desc': 'Silicate mantle (~2,800 km).'},
            {'name': 'Outer core', 'outer': 0.55, 'inner': 0.32, 'color': '#d8b46a', 'desc': 'Liquid iron-nickel outer core.'},
            {'name': 'Inner core', 'outer': 0.32, 'inner': 0.0, 'color': '#e8d8b0', 'desc': 'Solid inner core.'},
        ],
        'deposits': [('sulfur', 0, 4), ('magma', 1, 6), ('iron', 3, 5)],
    },
    'earth': {
        'label': 'Earth', 'radius_km': 6371, 'rotation_h': 23.93, 'orbit_au': 1.0,
        'axial_tilt_deg': 23.44, 'texture': 'earth.jpg', 'color': '#2a6fae',
        'layers': [
            {'name': 'Crust', 'outer': 1.0, 'inner': 0.9965, 'color': '#7a6a4a', 'desc': 'Oceanic 5-10 km / continental 30-50 km (PREM).'},
            {'name': 'Mantle', 'outer': 0.9965, 'inner': 0.546, 'color': '#a8542a', 'desc': 'Silicate rock, to 2,891 km depth (PREM).'},
            {'name': 'Outer core', 'outer': 0.546, 'inner': 0.192, 'color': '#d88a3a', 'desc': 'Liquid iron-nickel, 2,891-5,150 km.'},
            {'name': 'Inner core', 'outer': 0.192, 'inner': 0.0, 'color': '#e8d8a8', 'desc': 'Solid iron-nickel, r=1,220 km (PREM).'},
        ],
        'deposits': [
            ('ocean_water', 0, 1, True),   # surface ocean shell
            ('crude_oil', 0, 8), ('natural_gas', 0, 5), ('coal', 0, 6),
            ('gold', 0, 5), ('silver', 0, 3), ('copper', 0, 5), ('platinum', 0, 2),
            ('diamond', 1, 6), ('magma', 1, 10),
            ('iron', 3, 6), ('nickel', 2, 5), ('gold', 3, 3),
        ],
    },
    'moon': {
        'label': 'Moon', 'radius_km': 1737.4, 'rotation_h': 655.7, 'orbit_au': 1.0,
        'orbit_host': 'earth', 'orbit_km': 384400, 'axial_tilt_deg': 6.68, 'color': '#b8b8b8',
        'layers': [
            {'name': 'Crust', 'outer': 1.0, 'inner': 0.97, 'color': '#b8b0a0', 'desc': 'Anorthositic crust (~50 km, GRAIL).'},
            {'name': 'Mantle', 'outer': 0.97, 'inner': 0.22, 'color': '#8a7a6a', 'desc': 'Silicate mantle (~1,300 km).'},
            {'name': 'Outer core', 'outer': 0.22, 'inner': 0.13, 'color': '#c8a46a', 'desc': 'Small fluid outer core (~330 km).'},
            {'name': 'Inner core', 'outer': 0.13, 'inner': 0.0, 'color': '#e0d0b0', 'desc': 'Solid iron inner core (~240 km).'},
        ],
        'deposits': [('iron', 3, 4), ('ice', 0, 3), ('titanium', 0, 3)],
    },
    'mars': {
        'label': 'Mars', 'radius_km': 3389.5, 'rotation_h': 24.62, 'orbit_au': 1.524,
        'axial_tilt_deg': 25.19, 'texture': 'mars.jpg', 'color': '#b5532a',
        'layers': [
            {'name': 'Crust', 'outer': 1.0, 'inner': 0.988, 'color': '#b5532a', 'desc': 'Basaltic crust ~24-72 km (InSight).'},
            {'name': 'Mantle', 'outer': 0.988, 'inner': 0.54, 'color': '#a8482a', 'desc': 'Silicate mantle ~1,560 km (InSight).'},
            {'name': 'Core', 'outer': 0.54, 'inner': 0.0, 'color': '#d88a3a', 'desc': 'Liquid iron-sulfur core r~1,830 km (InSight).'},
        ],
        'deposits': [('iron', 2, 6), ('ice', 0, 4), ('water', 0, 2), ('olivine', 1, 4)],
    },
    'jupiter': {
        'label': 'Jupiter', 'radius_km': 69911, 'rotation_h': 9.93, 'orbit_au': 5.203,
        'axial_tilt_deg': 3.13, 'texture': 'jupiter.jpg', 'color': '#c8a06a',
        'layers': [
            {'name': 'Cloud tops', 'outer': 1.0, 'inner': 0.995, 'color': '#d8b88a', 'desc': 'Ammonia cloud deck.'},
            {'name': 'Molecular H/He', 'outer': 0.995, 'inner': 0.78, 'color': '#c8a06a', 'desc': 'Gaseous/liquid molecular hydrogen.'},
            {'name': 'Metallic hydrogen', 'outer': 0.78, 'inner': 0.30, 'color': '#b0b8c8', 'desc': 'Liquid metallic hydrogen (magnetic field).'},
            {'name': 'Dilute core', 'outer': 0.30, 'inner': 0.0, 'color': '#a8785a', 'desc': 'Diffuse rock/ice core (Juno).'},
        ],
        'deposits': [('liquid_metal_h', 2, 1, True), ('helium', 1, 3)],
    },
    'saturn': {
        'label': 'Saturn', 'radius_km': 58232, 'rotation_h': 10.66, 'orbit_au': 9.537,
        'axial_tilt_deg': 26.73, 'texture': 'saturn.jpg', 'color': '#d8c88a', 'rings': True,
        'layers': [
            {'name': 'Cloud tops', 'outer': 1.0, 'inner': 0.995, 'color': '#d8c88a', 'desc': 'Ammonia cloud deck.'},
            {'name': 'Molecular H/He', 'outer': 0.995, 'inner': 0.70, 'color': '#c8b06a', 'desc': 'Molecular hydrogen envelope.'},
            {'name': 'Metallic hydrogen', 'outer': 0.70, 'inner': 0.28, 'color': '#b0b8c8', 'desc': 'Liquid metallic hydrogen.'},
            {'name': 'Core', 'outer': 0.28, 'inner': 0.0, 'color': '#a8785a', 'desc': 'Rock/ice core.'},
        ],
        'deposits': [('liquid_metal_h', 2, 1, True)],
    },
    'uranus': {
        'label': 'Uranus', 'radius_km': 25362, 'rotation_h': -17.24, 'orbit_au': 19.19,
        'axial_tilt_deg': 97.77, 'color': '#8ac8d8',
        'layers': [
            {'name': 'Atmosphere', 'outer': 1.0, 'inner': 0.80, 'color': '#8ac8d8', 'desc': 'H/He/methane atmosphere.'},
            {'name': 'Ice mantle', 'outer': 0.80, 'inner': 0.20, 'color': '#6aa8c8', 'desc': 'Water/ammonia/methane ices (hot, dense fluid).'},
            {'name': 'Core', 'outer': 0.20, 'inner': 0.0, 'color': '#8a7a6a', 'desc': 'Rocky core.'},
        ],
        'deposits': [('methane', 1, 4), ('diamond', 1, 3), ('ice', 1, 1, True)],
    },
    'neptune': {
        'label': 'Neptune', 'radius_km': 24622, 'rotation_h': 16.11, 'orbit_au': 30.07,
        'axial_tilt_deg': 28.32, 'color': '#3a5ac8',
        'layers': [
            {'name': 'Atmosphere', 'outer': 1.0, 'inner': 0.80, 'color': '#3a5ac8', 'desc': 'H/He/methane atmosphere (fastest winds).'},
            {'name': 'Ice mantle', 'outer': 0.80, 'inner': 0.20, 'color': '#2a4ab8', 'desc': 'Water/ammonia/methane ices.'},
            {'name': 'Core', 'outer': 0.20, 'inner': 0.0, 'color': '#8a7a6a', 'desc': 'Rock/ice core.'},
        ],
        'deposits': [('methane', 1, 4), ('diamond', 1, 4), ('ice', 1, 1, True)],
    },
    'pluto': {
        'label': 'Pluto', 'radius_km': 1188.3, 'rotation_h': -153.3, 'orbit_au': 39.48,
        'axial_tilt_deg': 122.5, 'color': '#c8a88a',
        'layers': [
            {'name': 'Nitrogen-ice crust', 'outer': 1.0, 'inner': 0.80, 'color': '#d8c0a8', 'desc': 'Nitrogen/methane ice shell (New Horizons).'},
            {'name': 'Water-ice mantle', 'outer': 0.80, 'inner': 0.40, 'color': '#cfe8f5', 'desc': 'Water-ice bedrock.'},
            {'name': 'Rocky core', 'outer': 0.40, 'inner': 0.0, 'color': '#8a7a6a', 'desc': 'Hydrated rocky core.'},
        ],
        'deposits': [('ice', 1, 1, True), ('nitrogen', 0, 3)],
    },
    # --- additional moons ---
    'io': {
        'label': 'Io (moon of Jupiter)', 'radius_km': 1821.6, 'rotation_h': 42.46,
        'orbit_host': 'jupiter', 'orbit_km': 421700, 'axial_tilt_deg': 0.05, 'color': '#e0c040',
        'layers': [
            {'name': 'Sulfur crust', 'outer': 1.0, 'inner': 0.95, 'color': '#e0c040', 'desc': 'Sulfur/silicate crust, most volcanic body.'},
            {'name': 'Mantle (magma)', 'outer': 0.95, 'inner': 0.40, 'color': '#e2562a', 'desc': 'Partially molten silicate mantle.'},
            {'name': 'Iron core', 'outer': 0.40, 'inner': 0.0, 'color': '#c8a46a', 'desc': 'Iron/iron-sulfide core.'},
        ],
        'deposits': [('sulfur', 0, 8), ('magma', 1, 12), ('iron', 2, 4)],
    },
    'europa': {
        'label': 'Europa (moon of Jupiter)', 'radius_km': 1560.8, 'rotation_h': 85.23,
        'orbit_host': 'jupiter', 'orbit_km': 671034, 'axial_tilt_deg': 0.1, 'color': '#c8b8a8',
        'layers': [
            {'name': 'Ice crust', 'outer': 1.0, 'inner': 0.95, 'color': '#e8f0f5', 'desc': 'Water-ice shell (~15-25 km).'},
            {'name': 'Subsurface ocean', 'outer': 0.95, 'inner': 0.80, 'color': '#1a5f9e', 'desc': 'Global liquid-water ocean (tidal heating).'},
            {'name': 'Rocky mantle', 'outer': 0.80, 'inner': 0.30, 'color': '#8a7a6a', 'desc': 'Silicate mantle.'},
            {'name': 'Iron core', 'outer': 0.30, 'inner': 0.0, 'color': '#c8a46a', 'desc': 'Small iron core.'},
        ],
        'deposits': [('ocean_water', 1, 1, True), ('ice', 0, 1, True)],
    },
    'titan': {
        'label': 'Titan (moon of Saturn)', 'radius_km': 2574.7, 'rotation_h': 382.7,
        'orbit_host': 'saturn', 'orbit_km': 1221870, 'axial_tilt_deg': 0.3, 'color': '#d8a83a',
        'layers': [
            {'name': 'Ice crust', 'outer': 1.0, 'inner': 0.90, 'color': '#c8b8a8', 'desc': 'Water-ice crust with hydrocarbon lakes.'},
            {'name': 'Subsurface ocean', 'outer': 0.90, 'inner': 0.55, 'color': '#1a5f9e', 'desc': 'Ammonia-rich liquid ocean.'},
            {'name': 'High-pressure ice', 'outer': 0.55, 'inner': 0.30, 'color': '#cfe8f5', 'desc': 'Ice VI/VII layer.'},
            {'name': 'Rocky core', 'outer': 0.30, 'inner': 0.0, 'color': '#8a7a6a', 'desc': 'Silicate core.'},
        ],
        'deposits': [('methane', 0, 6), ('ocean_water', 1, 1, True), ('crude_oil', 0, 4)],
    },
    'ganymede': {
        'label': 'Ganymede (moon of Jupiter)', 'radius_km': 2634.1, 'rotation_h': 171.7,
        'orbit_host': 'jupiter', 'orbit_km': 1070412, 'axial_tilt_deg': 0.2, 'color': '#a89888',
        'layers': [
            {'name': 'Ice crust', 'outer': 1.0, 'inner': 0.85, 'color': '#c8d0d8', 'desc': 'Grooved water-ice crust.'},
            {'name': 'Ice/ocean mantle', 'outer': 0.85, 'inner': 0.35, 'color': '#6aa8c8', 'desc': 'Ices + possible salty ocean.'},
            {'name': 'Iron core', 'outer': 0.35, 'inner': 0.0, 'color': '#c8a46a', 'desc': 'Liquid iron core (own magnetic field).'},
        ],
        'deposits': [('ice', 0, 1, True), ('iron', 2, 4)],
    },
    'enceladus': {
        'label': 'Enceladus (moon of Saturn)', 'radius_km': 252.1, 'rotation_h': 32.88,
        'orbit_host': 'saturn', 'orbit_km': 237948, 'axial_tilt_deg': 0.0, 'color': '#f0f4f8',
        'layers': [
            {'name': 'Ice crust', 'outer': 1.0, 'inner': 0.88, 'color': '#f0f4f8', 'desc': 'Bright water-ice shell with geysers.'},
            {'name': 'Global ocean', 'outer': 0.88, 'inner': 0.55, 'color': '#1a5f9e', 'desc': 'Global subsurface ocean (Cassini).'},
            {'name': 'Rocky core', 'outer': 0.55, 'inner': 0.0, 'color': '#8a7a6a', 'desc': 'Porous silicate core.'},
        ],
        'deposits': [('ocean_water', 1, 1, True), ('ice', 0, 1, True)],
    },
}

# Extra substances referenced above but not in the base palette
SUBSTANCES.setdefault('water', {'name': 'Liquid water', 'color': '#2a7fbe', 'desc': 'Liquid water (schematic).'})
SUBSTANCES.setdefault('olivine', {'name': 'Olivine', 'color': '#7a9a4a', 'desc': 'Green mantle mineral (schematic).'})
SUBSTANCES.setdefault('titanium', {'name': 'Titanium', 'color': '#8a8a9a', 'desc': 'Ilmenite-rich lunar basalt (schematic).'})
SUBSTANCES.setdefault('helium', {'name': 'Helium', 'color': '#e8d8f0', 'desc': 'Helium mixed with hydrogen (schematic).'})
SUBSTANCES.setdefault('methane', {'name': 'Methane', 'color': '#6ab8d8', 'desc': 'Methane (ice-giant tint / Titan lakes).'})
SUBSTANCES.setdefault('nitrogen', {'name': 'Nitrogen ice', 'color': '#d0e0f0', 'desc': 'Nitrogen glaciers (Pluto).'})
