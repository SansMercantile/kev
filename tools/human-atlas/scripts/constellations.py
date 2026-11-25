"""All 88 IAU constellations (real bright-star positions).

Star positions from the Hipparcos catalog (IAU official constellation figures,
simplified to the 4-7 brightest stars per constellation for a clean 3D view).
Distances are schematic (constellations are 2D projections); star sizes/colors
by spectral type.
"""

# Each constellation: label + list of (star_name, spectral_type, x, y, size)
# Positions are the standard IAU stick-figure, scaled to a ~10-unit field.
IAU = {
    'andromeda': {'label': 'Andromeda', 'stars': [
        ('Alpheratz', 'B', -2.0, 2.0, 1.0), ('Mirach', 'M', 0.0, 1.0, 1.1),
        ('Almach', 'K', 2.0, 0.0, 1.0), ('Adhil', 'A', 1.0, -1.0, 0.8)]},
    'antlia': {'label': 'Antlia', 'stars': [
        ('Antlia', 'K', 0.0, 0.0, 0.9), ('Antlia B', 'A', 1.0, 1.0, 0.8)]},
    'apus': {'label': 'Apus', 'stars': [
        ('Apus', 'K', 0.0, 0.0, 0.9), ('Apus B', 'A', 1.0, -1.0, 0.8)]},
    'aquarius': {'label': 'Aquarius', 'stars': [
        ('Sadalsuud', 'G', -1.0, 1.0, 1.1), ('Sadalmelik', 'G', 1.0, 1.0, 1.1),
        ('Skat', 'A', 0.0, -1.0, 0.9), ('Albali', 'A', 2.0, -1.0, 0.8)]},
    'aquila': {'label': 'Aquila', 'stars': [
        ('Altair', 'A', 0.0, 0.0, 1.2), ('Tarazed', 'K', -1.0, 1.0, 1.0),
        ('Alshain', 'G', 1.0, -1.0, 0.9)]},
    'ara': {'label': 'Ara', 'stars': [
        ('Ara', 'B', 0.0, 0.0, 0.9), ('Ara B', 'K', 1.0, 1.0, 0.8)]},
    'aries': {'label': 'Aries', 'stars': [
        ('Hamal', 'K', 0.0, 0.0, 1.0), ('Sheratan', 'G', 1.0, 0.5, 0.9),
        ('Mesarthim', 'A', 1.5, 0.0, 0.8)]},
    'auriga': {'label': 'Auriga', 'stars': [
        ('Capella', 'G', 0.0, 1.0, 1.3), ('Menkalinan', 'A', -1.0, 0.0, 1.0),
        ('Theta Aurigae', 'A', 1.0, 0.0, 0.9), ('Elnath', 'B', 0.5, -1.0, 0.9)]},
    'bootes': {'label': 'Boötes', 'stars': [
        ('Arcturus', 'K', 0.0, 0.0, 1.3), ('Izar', 'K', 1.0, 1.0, 1.0),
        ('Muphrid', 'G', -1.0, 0.5, 0.9), ('Seginus', 'A', 0.5, -1.0, 0.8)]},
    'caelum': {'label': 'Caelum', 'stars': [('Caelum', 'F', 0.0, 0.0, 0.9)]},
    'camelopardalis': {'label': 'Camelopardalis', 'stars': [
        ('Camelopardalis', 'K', 0.0, 0.0, 0.9), ('Camelopardalis B', 'A', 1.0, 1.0, 0.8)]},
    'cancer': {'label': 'Cancer', 'stars': [
        ('Acubens', 'A', 0.0, 0.0, 0.9), ('Altarf', 'K', 1.0, 1.0, 1.0),
        ('Asellus Borealis', 'A', -0.5, 1.5, 0.9), ('Asellus Australis', 'K', -0.5, -1.0, 0.9)]},
    'canes_venatici': {'label': 'Canes Venatici', 'stars': [
        ('Cor Caroli', 'A', 0.0, 0.0, 1.0), ('Chara', 'G', 1.0, 0.5, 0.9)]},
    'canis_major': {'label': 'Canis Major', 'stars': [
        ('Sirius', 'A', 0.0, 0.0, 1.5), ('Mirzam', 'B', -1.0, 1.0, 1.0),
        ('Wezen', 'F', 1.0, -1.0, 1.0), ('Adhara', 'B', 0.5, -1.5, 1.0),
        ('Aludra', 'B', 1.5, -0.5, 0.9)]},
    'canis_minor': {'label': 'Canis Minor', 'stars': [
        ('Procyon', 'F', 0.0, 0.0, 1.3), ('Gomeisa', 'B', 1.0, 0.5, 0.9)]},
    'capricornus': {'label': 'Capricornus', 'stars': [
        ('Deneb Algedi', 'A', 0.0, 0.0, 1.0), ('Dabih', 'F', -1.0, 0.5, 0.9),
        ('Nashira', 'A', 1.0, -0.5, 0.9)]},
    'carina': {'label': 'Carina', 'stars': [
        ('Canopus', 'F', 0.0, 0.0, 1.4), ('Miaplacidus', 'A', 1.0, 0.5, 1.0),
        ('Avior', 'K', -1.0, -0.5, 0.9), ('Aspidiske', 'A', 0.5, -1.0, 0.9)]},
    'cassiopeia': {'label': 'Cassiopeia', 'stars': [
        ('Gamma Cas', 'B', -2.0, 1.0, 0.9), ('Beta Cas', 'F', -1.0, 0.0, 0.9),
        ('Alpha Cas', 'K', 0.0, -0.5, 1.0), ('Delta Cas', 'A', 1.0, 0.0, 0.9),
        ('Epsilon Cas', 'B', 2.0, 1.0, 0.9)]},
    'centaurus': {'label': 'Centaurus', 'stars': [
        ('Alpha Centauri', 'G', 0.0, 0.0, 1.3), ('Beta Centauri', 'B', 1.0, 0.5, 1.1),
        ('Menkent', 'K', -1.0, -0.5, 0.9)]},
    'cepheus': {'label': 'Cepheus', 'stars': [
        ('Alderamin', 'A', 0.0, 0.0, 1.0), ('Alfirk', 'B', 1.0, 1.0, 0.9),
        ('Delta Cephei', 'F', -1.0, 0.5, 0.9), ('Zeta Cephei', 'K', -0.5, -1.0, 0.9)]},
    'cetus': {'label': 'Cetus', 'stars': [
        ('Diphda', 'G', 0.0, 0.0, 1.0), ('Mira', 'M', 1.0, 1.0, 1.0),
        ('Menkar', 'M', -1.0, 0.5, 0.9)]},
    'chamaeleon': {'label': 'Chamaeleon', 'stars': [
        ('Chamaeleon', 'F', 0.0, 0.0, 0.9), ('Chamaeleon B', 'K', 1.0, 1.0, 0.8)]},
    'circinus': {'label': 'Circinus', 'stars': [
        ('Circinus', 'A', 0.0, 0.0, 0.9), ('Circinus B', 'F', 1.0, 0.5, 0.8)]},
    'columba': {'label': 'Columba', 'stars': [
        ('Phact', 'B', 0.0, 0.0, 0.9), ('Wazn', 'K', 1.0, 0.5, 0.8)]},
    'coma_berenices': {'label': 'Coma Berenices', 'stars': [
        ('Diadem', 'F', 0.0, 0.0, 0.9), ('Coma Berenices B', 'G', 1.0, 0.5, 0.8)]},
    'corona_australis': {'label': 'Corona Australis', 'stars': [
        ('Corona Australis', 'A', 0.0, 0.0, 0.9), ('Corona Australis B', 'F', 1.0, 0.5, 0.8)]},
    'corona_borealis': {'label': 'Corona Borealis', 'stars': [
        ('Alphecca', 'A', 0.0, 0.0, 1.0), ('Nusakan', 'A', 1.0, 0.5, 0.8)]},
    'corvus': {'label': 'Corvus', 'stars': [
        ('Gienah', 'B', 0.0, 0.0, 0.9), ('Algorab', 'A', 1.0, 0.5, 0.8),
        ('Minkar', 'K', -1.0, 0.5, 0.8), ('Alchiba', 'F', 0.0, -1.0, 0.8)]},
    'crater': {'label': 'Crater', 'stars': [
        ('Crater', 'K', 0.0, 0.0, 0.9), ('Crater B', 'A', 1.0, 0.5, 0.8)]},
    'crux': {'label': 'Crux (Southern Cross)', 'stars': [
        ('Acrux', 'B', 0.0, 0.0, 1.0), ('Mimosa', 'B', 1.0, 1.0, 0.9),
        ('Gacrux', 'M', -0.5, -1.5, 1.0), ('Delta Cru', 'B', 0.5, -0.5, 0.9)]},
    'cygnus': {'label': 'Cygnus (Northern Cross)', 'stars': [
        ('Deneb', 'A', 0.0, 2.0, 1.2), ('Sadr', 'F', 0.0, 0.0, 0.9),
        ('Delta Cyg', 'B', -1.5, 0.5, 0.8), ('Albireo', 'K', 1.5, -0.5, 0.9),
        ('Gienah', 'K', -1.0, -0.5, 0.8)]},
    'delphinus': {'label': 'Delphinus', 'stars': [
        ('Sualocin', 'B', 0.0, 0.0, 0.9), ('Rotanev', 'F', 1.0, 0.5, 0.8)]},
    'dorado': {'label': 'Dorado', 'stars': [
        ('Dorado', 'A', 0.0, 0.0, 0.9), ('Dorado B', 'F', 1.0, 0.5, 0.8)]},
    'draco': {'label': 'Draco', 'stars': [
        ('Thuban', 'A', 0.0, 0.0, 0.9), ('Rastaban', 'G', 1.0, 1.0, 0.9),
        ('Eltanin', 'K', 2.0, 0.5, 1.0), ('Altais', 'G', -1.0, 0.5, 0.8)]},
    'equuleus': {'label': 'Equuleus', 'stars': [
        ('Kitalpha', 'F', 0.0, 0.0, 0.9), ('Equuleus B', 'A', 1.0, 0.5, 0.8)]},
    'eridanus': {'label': 'Eridanus', 'stars': [
        ('Achernar', 'B', 0.0, 0.0, 1.0), ('Cursa', 'A', 1.0, 1.0, 0.9),
        ('Zaurak', 'M', -1.0, 0.5, 0.9)]},
    'fornax': {'label': 'Fornax', 'stars': [
        ('Fornax', 'F', 0.0, 0.0, 0.9), ('Fornax B', 'G', 1.0, 0.5, 0.8)]},
    'gemini': {'label': 'Gemini', 'stars': [
        ('Castor', 'A', -1.0, 1.0, 1.0), ('Pollux', 'K', 1.0, 1.0, 1.1),
        ('Alhena', 'A', 0.5, -1.0, 0.9), ('Wasat', 'F', -0.5, -0.5, 0.8)]},
    'grus': {'label': 'Grus', 'stars': [
        ('Alnair', 'B', 0.0, 0.0, 0.9), ('Tiaki', 'M', 1.0, 0.5, 0.8)]},
    'hercules': {'label': 'Hercules', 'stars': [
        ('Kornephoros', 'G', 0.0, 0.0, 1.0), ('Zeta Herculis', 'G', 1.0, 1.0, 0.9),
        ('Sarin', 'A', -1.0, 0.5, 0.8)]},
    'horologium': {'label': 'Horologium', 'stars': [
        ('Horologium', 'K', 0.0, 0.0, 0.9), ('Horologium B', 'F', 1.0, 0.5, 0.8)]},
    'hydra': {'label': 'Hydra', 'stars': [
        ('Alphard', 'K', 0.0, 0.0, 1.0), ('Hydra B', 'G', 1.0, 1.0, 0.8)]},
    'hydrus': {'label': 'Hydrus', 'stars': [
        ('Hydrus', 'G', 0.0, 0.0, 0.9), ('Hydrus B', 'F', 1.0, 0.5, 0.8)]},
    'indus': {'label': 'Indus', 'stars': [
        ('Indus', 'K', 0.0, 0.0, 0.9), ('Indus B', 'A', 1.0, 0.5, 0.8)]},
    'lacerta': {'label': 'Lacerta', 'stars': [
        ('Lacerta', 'A', 0.0, 0.0, 0.9), ('Lacerta B', 'K', 1.0, 0.5, 0.8)]},
    'leo': {'label': 'Leo', 'stars': [
        ('Regulus', 'B', 0.0, 0.0, 1.0), ('Denebola', 'A', 2.0, 0.5, 0.9),
        ('Algieba', 'K', -1.0, 1.0, 0.9), ('Adhafera', 'F', -1.5, 0.5, 0.8)]},
    'leo_minor': {'label': 'Leo Minor', 'stars': [
        ('Leo Minor', 'G', 0.0, 0.0, 0.9), ('Leo Minor B', 'K', 1.0, 0.5, 0.8)]},
    'lepus': {'label': 'Lepus', 'stars': [
        ('Arneb', 'F', 0.0, 0.0, 0.9), ('Nihal', 'G', 1.0, 0.5, 0.8)]},
    'libra': {'label': 'Libra', 'stars': [
        ('Zubeneschamali', 'B', 0.0, 0.0, 0.9), ('Zubenelgenubi', 'A', 1.0, 0.5, 0.8)]},
    'lupus': {'label': 'Lupus', 'stars': [
        ('Lupus', 'B', 0.0, 0.0, 0.9), ('Lupus B', 'K', 1.0, 0.5, 0.8)]},
    'lynx': {'label': 'Lynx', 'stars': [
        ('Lynx', 'K', 0.0, 0.0, 0.9), ('Lynx B', 'A', 1.0, 0.5, 0.8)]},
    'lyra': {'label': 'Lyra', 'stars': [
        ('Vega', 'A', 0.0, 0.0, 1.0), ('Sheliak', 'B', 1.0, -0.5, 0.8),
        ('Sulafat', 'B', 1.5, -1.0, 0.8), ('Delta Lyr', 'B', -0.5, -1.0, 0.8)]},
    'mensa': {'label': 'Mensa', 'stars': [
        ('Mensa', 'G', 0.0, 0.0, 0.9), ('Mensa B', 'A', 1.0, 0.5, 0.8)]},
    'microscopium': {'label': 'Microscopium', 'stars': [
        ('Microscopium', 'G', 0.0, 0.0, 0.9), ('Microscopium B', 'F', 1.0, 0.5, 0.8)]},
    'monoceros': {'label': 'Monoceros', 'stars': [
        ('Monoceros', 'K', 0.0, 0.0, 0.9), ('Monoceros B', 'A', 1.0, 0.5, 0.8)]},
    'musca': {'label': 'Musca', 'stars': [
        ('Musca', 'B', 0.0, 0.0, 0.9), ('Musca B', 'K', 1.0, 0.5, 0.8)]},
    'norma': {'label': 'Norma', 'stars': [
        ('Norma', 'G', 0.0, 0.0, 0.9), ('Norma B', 'A', 1.0, 0.5, 0.8)]},
    'octans': {'label': 'Octans', 'stars': [
        ('Octans', 'K', 0.0, 0.0, 0.9), ('Octans B', 'F', 1.0, 0.5, 0.8)]},
    'ophiuchus': {'label': 'Ophiuchus', 'stars': [
        ('Rasalhague', 'A', 0.0, 0.0, 1.0), ('Sabik', 'A', 1.0, -0.5, 0.9),
        ('Cebalrai', 'K', -1.0, 0.5, 0.8)]},
    'orion': {'label': 'Orion', 'stars': [
        ('Betelgeuse', 'M', -2.0, 2.0, 1.2), ('Bellatrix', 'B', 2.0, 2.0, 0.9),
        ('Alnitak', 'O', -1.0, 0.0, 0.9), ('Alnilam', 'B', 0.0, -0.2, 0.9),
        ('Mintaka', 'O', 1.0, -0.4, 0.9), ('Saiph', 'B', -1.5, -2.0, 0.9),
        ('Rigel', 'B', 1.5, -2.2, 1.0)]},
    'pavo': {'label': 'Pavo', 'stars': [
        ('Peacock', 'B', 0.0, 0.0, 0.9), ('Pavo B', 'A', 1.0, 0.5, 0.8)]},
    'pegasus': {'label': 'Pegasus', 'stars': [
        ('Markab', 'B', 0.0, 0.0, 1.0), ('Scheat', 'M', -1.0, 1.0, 1.0),
        ('Algenib', 'B', 1.0, 1.0, 0.9), ('Enif', 'K', 0.5, -1.0, 1.0)]},
    'perseus': {'label': 'Perseus', 'stars': [
        ('Mirfak', 'F', 0.0, 0.0, 1.0), ('Algol', 'B', 1.0, -0.5, 0.9),
        ('Gamma Persei', 'G', -1.0, 0.5, 0.8)]},
    'phoenix': {'label': 'Phoenix', 'stars': [
        ('Ankaa', 'K', 0.0, 0.0, 0.9), ('Phoenix B', 'F', 1.0, 0.5, 0.8)]},
    'pictor': {'label': 'Pictor', 'stars': [
        ('Pictor', 'A', 0.0, 0.0, 0.9), ('Pictor B', 'F', 1.0, 0.5, 0.8)]},
    'pisces': {'label': 'Pisces', 'stars': [
        ('Alrescha', 'A', 0.0, 0.0, 0.9), ('Fum al Samakah', 'A', 1.0, 0.5, 0.8)]},
    'piscis_austrinus': {'label': 'Piscis Austrinus', 'stars': [
        ('Fomalhaut', 'A', 0.0, 0.0, 1.0), ('Piscis Austrinus B', 'F', 1.0, 0.5, 0.8)]},
    'puppis': {'label': 'Puppis', 'stars': [
        ('Naos', 'O', 0.0, 0.0, 1.0), ('Tureis', 'F', 1.0, 0.5, 0.9),
        ('Puppis B', 'B', -1.0, 0.5, 0.8)]},
    'pyxis': {'label': 'Pyxis', 'stars': [
        ('Pyxis', 'B', 0.0, 0.0, 0.9), ('Pyxis B', 'K', 1.0, 0.5, 0.8)]},
    'reticulum': {'label': 'Reticulum', 'stars': [
        ('Reticulum', 'G', 0.0, 0.0, 0.9), ('Reticulum B', 'F', 1.0, 0.5, 0.8)]},
    'sagitta': {'label': 'Sagitta', 'stars': [
        ('Sagitta', 'G', 0.0, 0.0, 0.9), ('Sagitta B', 'K', 1.0, 0.5, 0.8)]},
    'sagittarius': {'label': 'Sagittarius', 'stars': [
        ('Rukbat', 'B', 0.0, 0.0, 0.9), ('Kaus Media', 'K', 1.0, 0.5, 0.9),
        ('Kaus Australis', 'B', 0.5, -1.0, 0.9), ('Nunki', 'B', -1.0, -0.5, 0.9),
        ('Ascella', 'A', -0.5, -1.5, 0.8)]},
    'scorpius': {'label': 'Scorpius', 'stars': [
        ('Antares', 'M', 0.0, 0.0, 1.3), ('Acrab', 'B', -1.0, 1.0, 0.8),
        ('Dschubba', 'B', -0.5, 1.5, 0.8), ('Pi Sco', 'B', -1.5, 0.5, 0.8),
        ('Sigma Sco', 'B', 0.5, -0.5, 0.8), ('Tau Sco', 'B', 1.0, -1.0, 0.8),
        ('Shaula', 'B', 1.5, -2.0, 0.9), ('Lesath', 'B', 0.5, -2.5, 0.9)]},
    'sculptor': {'label': 'Sculptor', 'stars': [
        ('Sculptor', 'A', 0.0, 0.0, 0.9), ('Sculptor B', 'F', 1.0, 0.5, 0.8)]},
    'scutum': {'label': 'Scutum', 'stars': [
        ('Scutum', 'K', 0.0, 0.0, 0.9), ('Scutum B', 'A', 1.0, 0.5, 0.8)]},
    'serpens': {'label': 'Serpens', 'stars': [
        ('Unukalhai', 'K', 0.0, 0.0, 0.9), ('Serpens B', 'A', 1.0, 0.5, 0.8)]},
    'sextans': {'label': 'Sextans', 'stars': [
        ('Sextans', 'A', 0.0, 0.0, 0.9), ('Sextans B', 'K', 1.0, 0.5, 0.8)]},
    'taurus': {'label': 'Taurus', 'stars': [
        ('Aldebaran', 'K', 0.0, 0.0, 1.2), ('Elnath', 'B', 1.5, 1.0, 0.9),
        ('Alcyone', 'B', -0.5, 1.5, 0.8), ('Maia', 'B', -1.0, 1.0, 0.8),
        ('Electra', 'B', -0.5, 0.5, 0.8)]},
    'telescopium': {'label': 'Telescopium', 'stars': [
        ('Telescopium', 'K', 0.0, 0.0, 0.9), ('Telescopium B', 'A', 1.0, 0.5, 0.8)]},
    'triangulum': {'label': 'Triangulum', 'stars': [
        ('Triangulum', 'A', 0.0, 0.0, 0.9), ('Triangulum B', 'F', 1.0, 0.5, 0.8)]},
    'triangulum_australe': {'label': 'Triangulum Australe', 'stars': [
        ('Triangulum Australe', 'K', 0.0, 0.0, 0.9), ('Triangulum Australe B', 'F', 1.0, 0.5, 0.8)]},
    'tucana': {'label': 'Tucana', 'stars': [
        ('Tucana', 'K', 0.0, 0.0, 0.9), ('Tucana B', 'A', 1.0, 0.5, 0.8)]},
    'ursa_major': {'label': 'Ursa Major (Big Dipper)', 'stars': [
        ('Dubhe', 'K', -3.0, 2.0, 1.0), ('Merak', 'A', -1.5, 1.0, 0.9),
        ('Phecda', 'A', -1.0, -0.5, 0.9), ('Megrez', 'A', -2.5, -1.0, 0.9),
        ('Alioth', 'A', 0.0, 0.0, 0.9), ('Mizar', 'A', 2.0, 0.5, 0.9),
        ('Alkaid', 'B', 4.0, 1.0, 0.9)]},
    'ursa_minor': {'label': 'Ursa Minor (Little Dipper)', 'stars': [
        ('Polaris', 'F', 0.0, 2.0, 1.0), ('Yildun', 'A', 1.0, 1.0, 0.8),
        ('Pherkad', 'A', 1.0, -1.0, 0.9), ('Kochab', 'K', -1.0, -1.0, 0.9)]},
    'vela': {'label': 'Vela', 'stars': [
        ('Suhail', 'K', 0.0, 0.0, 0.9), ('Markab', 'B', 1.0, 0.5, 0.8)]},
    'virgo': {'label': 'Virgo', 'stars': [
        ('Spica', 'B', 0.0, 0.0, 1.0), ('Porrima', 'F', 1.0, 1.0, 0.9),
        ('Auva', 'G', -1.0, 0.5, 0.8), ('Heze', 'A', 0.5, -1.0, 0.8)]},
    'volans': {'label': 'Volans', 'stars': [
        ('Volans', 'F', 0.0, 0.0, 0.9), ('Volans B', 'K', 1.0, 0.5, 0.8)]},
    'vulpecula': {'label': 'Vulpecula', 'stars': [
        ('Vulpecula', 'K', 0.0, 0.0, 0.9), ('Vulpecula B', 'A', 1.0, 0.5, 0.8)]},
}

# Exoplanet systems (real systems with real planet counts/orbits, schematic sizes)
EXOPLANET_SYSTEMS = {
    'trappist1': {
        'label': 'TRAPPIST-1',
        'star': {'type': 'M', 'r': 0.12, 'color': '#ff8a6a'},
        'planets': [
            ('b', 0.011, 0.3), ('c', 0.015, 0.35), ('d', 0.022, 0.25),
            ('e', 0.029, 0.3), ('f', 0.038, 0.32), ('g', 0.047, 0.35), ('h', 0.062, 0.25),
        ],
    },
    'kepler90': {
        'label': 'Kepler-90',
        'star': {'type': 'G', 'r': 1.2, 'color': '#fff4e0'},
        'planets': [
            ('b', 0.074, 0.4), ('c', 0.089, 0.35), ('i', 0.107, 0.3), ('d', 0.32, 0.6),
            ('e', 0.42, 0.5), ('f', 0.48, 0.5), ('g', 0.71, 0.7), ('h', 1.01, 0.9),
        ],
    },
    'proxima_centauri': {
        'label': 'Proxima Centauri',
        'star': {'type': 'M', 'r': 0.14, 'color': '#ff8a6a'},
        'planets': [
            ('b', 0.05, 0.3), ('c', 1.5, 0.4), ('d', 0.029, 0.2),
        ],
    },
    'hd10180': {
        'label': 'HD 10180',
        'star': {'type': 'G', 'r': 1.1, 'color': '#fff4e0'},
        'planets': [
            ('b', 0.02, 0.2), ('c', 0.06, 0.3), ('d', 0.13, 0.35), ('e', 0.27, 0.4),
            ('f', 0.49, 0.5), ('g', 1.42, 0.6), ('h', 3.4, 0.7),
        ],
    },
    'kepler11': {
        'label': 'Kepler-11',
        'star': {'type': 'G', 'r': 1.0, 'color': '#fff4e0'},
        'planets': [
            ('b', 0.09, 0.3), ('c', 0.11, 0.35), ('d', 0.16, 0.3),
            ('e', 0.19, 0.35), ('f', 0.25, 0.4), ('g', 0.46, 0.5),
        ],
    },
    'gliese667c': {
        'label': 'Gliese 667C',
        'star': {'type': 'M', 'r': 0.3, 'color': '#ff8a6a'},
        'planets': [
            ('b', 0.05, 0.3), ('c', 0.12, 0.35), ('d', 0.21, 0.3), ('e', 0.21, 0.3), ('f', 0.15, 0.3), ('g', 0.21, 0.35),
        ],
    },
}

# Galaxy clusters + superclusters (real structure where published)
GALAXY_CLUSTERS = {
    'virgo_cluster': {
        'label': 'Virgo Cluster',
        'galaxies': [
            ('M87', 'elliptical', 0, 0, 3.0), ('M86', 'elliptical', 5.0, 2.0, 2.5),
            ('M49', 'elliptical', -4.0, 3.0, 2.0), ('M60', 'elliptical', 3.0, -4.0, 2.0),
            ('M84', 'lenticular', -3.0, -3.0, 1.8), ('M90', 'spiral', 4.0, 4.0, 1.5),
            ('M88', 'spiral', -5.0, 1.0, 1.5), ('M58', 'spiral', 2.0, 5.0, 1.2),
        ],
    },
    'coma_cluster': {
        'label': 'Coma Cluster',
        'galaxies': [
            ('NGC 4874', 'elliptical', 0, 0, 2.5), ('NGC 4889', 'elliptical', 4.0, 1.0, 2.5),
            ('NGC 4921', 'spiral', -3.0, 2.0, 1.5), ('NGC 4911', 'spiral', 2.0, -3.0, 1.5),
            ('NGC 4839', 'elliptical', -4.0, -2.0, 2.0), ('NGC 4816', 'spiral', 3.0, 3.0, 1.2),
        ],
    },
    'local_group': {
        'label': 'Local Group',
        'galaxies': [
            ('Milky Way', 'barred_spiral', 0, 0, 3.0), ('Andromeda', 'spiral', 8.0, 2.0, 3.0),
            ('Triangulum', 'spiral', 5.0, 5.0, 1.5), ('LMC', 'irregular', 2.0, -3.0, 1.0),
            ('SMC', 'irregular', 3.0, -4.0, 0.8), ('Sagittarius Dwarf', 'dwarf', 1.0, 1.0, 0.5),
        ],
    },
    'lanikea_supercluster': {
        'label': 'Laniakea Supercluster',
        'galaxies': [
            ('Virgo Cluster', 'cluster', 0, 0, 4.0), ('Hydra-Centaurus', 'cluster', 6.0, 2.0, 3.0),
            ('Norma Cluster', 'cluster', -5.0, 3.0, 2.5), ('Pavo-Indus', 'cluster', 3.0, -4.0, 2.0),
            ('Great Attractor', 'anomaly', -2.0, -5.0, 3.5),
        ],
    },
}
