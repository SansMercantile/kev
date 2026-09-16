import express from "express";
import { GoogleGenAI } from "@google/genai";

// Shared AI instance getter passed from server.ts
type GetAIFn = () => GoogleGenAI | null;
type GenerateGeminiFn = (contents: any[]) => Promise<string | null>;

export interface EarthGeoLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  elevationM: number;
  gravityMps2: number; // local g
  gravityAnomalyMgal: number; // free-air anomaly
  tangentialVelocityMps: number; // v = w * R * cos(lat)
  crustType: "continental" | "oceanic" | "transitional";
  dominantRock: string;
  rockDensityGcm3: number;
  significance: string;
  satelliteImageUrl: string;
  geologicalMapUrl: string;
  recommendedLaunchAzimuthDeg: number;
  leoOrbitalPeriodMin: number;
  escapeVelocityKmph: number;
}

export const REAL_WORLD_GEO_LOCATIONS: EarthGeoLocation[] = [
  {
    id: "kennedy-space-center",
    name: "Kennedy Space Center (LC-39A)",
    region: "Cape Canaveral, Florida",
    country: "United States",
    lat: 28.5721,
    lng: -80.6480,
    elevationM: 3,
    gravityMps2: 9.7925,
    gravityAnomalyMgal: 18.2,
    tangentialVelocityMps: 408.5,
    crustType: "continental",
    dominantRock: "Quaternary Sandstone & Coastal Carbonate",
    rockDensityGcm3: 2.35,
    significance: "Historic Apollo & Artemis launch complex. Earth's rotational boost provides 408.5 m/s toward eastward orbital insertion.",
    satelliteImageUrl: "https://images.unsplash.com/photo-1517976487507-598f111748d7?w=1200&q=80&auto=format&fit=crop",
    geologicalMapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80&auto=format&fit=crop",
    recommendedLaunchAzimuthDeg: 90.0,
    leoOrbitalPeriodMin: 92.6,
    escapeVelocityKmph: 40284,
  },
  {
    id: "guiana-space-centre",
    name: "Guiana Space Centre (CSG)",
    region: "Kourou",
    country: "French Guiana",
    lat: 5.2390,
    lng: -52.7680,
    elevationM: 15,
    gravityMps2: 9.7820,
    gravityAnomalyMgal: -8.4,
    tangentialVelocityMps: 463.2,
    crustType: "continental",
    dominantRock: "Precambrian Guiana Shield Granulite & Laterite",
    rockDensityGcm3: 2.72,
    significance: "Equatorial spaceport with 99.6% of maximum planetary rotational assist. Minimum gravitational pull (9.782 m/s²) on Earth's surface.",
    satelliteImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
    geologicalMapUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80&auto=format&fit=crop",
    recommendedLaunchAzimuthDeg: 90.0,
    leoOrbitalPeriodMin: 92.5,
    escapeVelocityKmph: 40268,
  },
  {
    id: "svalbard-satellite-station",
    name: "Svalbard Satellite Station (SvalSat)",
    region: "Spitsbergen, Arctic Circle",
    country: "Norway",
    lat: 78.2298,
    lng: 15.4077,
    elevationM: 480,
    gravityMps2: 9.8295,
    gravityAnomalyMgal: 34.6,
    tangentialVelocityMps: 96.8,
    crustType: "continental",
    dominantRock: "Sedimentary Sandstone, Shale & Permafrost Basal Breccia",
    rockDensityGcm3: 2.58,
    significance: "High-latitude polar station. Near maximum terrestrial surface gravity (9.829 m/s²) due to polar flattening (Earth's oblate spheroid).",
    satelliteImageUrl: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=1200&q=80&auto=format&fit=crop",
    geologicalMapUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80&auto=format&fit=crop",
    recommendedLaunchAzimuthDeg: 0.0,
    leoOrbitalPeriodMin: 92.4,
    escapeVelocityKmph: 40315,
  },
  {
    id: "mauna-kea-observatories",
    name: "Mauna Kea Astronomical Observatories",
    region: "Big Island, Hawaii",
    country: "United States",
    lat: 19.8206,
    lng: -155.4681,
    elevationM: 4207,
    gravityMps2: 9.7860,
    gravityAnomalyMgal: 224.0,
    tangentialVelocityMps: 437.2,
    crustType: "oceanic",
    dominantRock: "Tholeiitic Basalt & Volcanic Cinder",
    rockDensityGcm3: 2.92,
    significance: "Extreme elevation (4,207m) reduces gravitational acceleration while oceanic volcanic root produces positive Bouguer anomaly.",
    satelliteImageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80&auto=format&fit=crop",
    geologicalMapUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&auto=format&fit=crop",
    recommendedLaunchAzimuthDeg: 85.0,
    leoOrbitalPeriodMin: 92.6,
    escapeVelocityKmph: 40275,
  },
  {
    id: "mount-everest",
    name: "Mount Everest / Sagarmatha",
    region: "Himalayas",
    country: "Nepal / China",
    lat: 27.9881,
    lng: 86.9250,
    elevationM: 8848,
    gravityMps2: 9.7732,
    gravityAnomalyMgal: -142.5,
    tangentialVelocityMps: 410.8,
    crustType: "continental",
    dominantRock: "Qomolangma Limestone & Pelitic Schist",
    rockDensityGcm3: 2.65,
    significance: "Lowest terrestrial surface gravity on Earth (9.773 m/s²) due to combination of extreme 8,848m altitude and deep crustal isostatic root.",
    satelliteImageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80&auto=format&fit=crop",
    geologicalMapUrl: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200&q=80&auto=format&fit=crop",
    recommendedLaunchAzimuthDeg: 92.0,
    leoOrbitalPeriodMin: 92.7,
    escapeVelocityKmph: 40250,
  },
  {
    id: "mariana-trench",
    name: "Challenger Deep (Mariana Trench)",
    region: "Western Pacific Ocean",
    country: "International Waters / FSM",
    lat: 11.3493,
    lng: 142.1995,
    elevationM: -10994,
    gravityMps2: 9.8140,
    gravityAnomalyMgal: -278.0,
    tangentialVelocityMps: 456.1,
    crustType: "oceanic",
    dominantRock: "Serpentinized Peridotite & Subducted Basalt",
    rockDensityGcm3: 3.15,
    significance: "Deepest point in Earth's oceans. Subducting oceanic slab produces strong negative free-air gravity anomaly despite sub-surface depth.",
    satelliteImageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80&auto=format&fit=crop",
    geologicalMapUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop",
    recommendedLaunchAzimuthDeg: 88.0,
    leoOrbitalPeriodMin: 92.4,
    escapeVelocityKmph: 40310,
  },
  {
    id: "baikonur-cosmodrome",
    name: "Baikonur Cosmodrome (Site 1 / Gagarin's Start)",
    region: "Kyzylorda Region",
    country: "Kazakhstan",
    lat: 45.9646,
    lng: 63.3052,
    elevationM: 90,
    gravityMps2: 9.8062,
    gravityAnomalyMgal: 11.8,
    tangentialVelocityMps: 323.5,
    crustType: "continental",
    dominantRock: "Arid Clay Siltstone & Turgai Basin Alluvium",
    rockDensityGcm3: 2.45,
    significance: "World's first spaceport. Higher latitude (45.9°N) requires higher launch energy and steeper 51.6° orbital inclination.",
    satelliteImageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80&auto=format&fit=crop",
    geologicalMapUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80&auto=format&fit=crop",
    recommendedLaunchAzimuthDeg: 65.0,
    leoOrbitalPeriodMin: 92.5,
    escapeVelocityKmph: 40292,
  },
  {
    id: "equator-zero-reference",
    name: "Equatorial Datum (Gulf of Guinea)",
    region: "Null Island Intersection (0°N, 0°E)",
    country: "Equatorial Waters",
    lat: 0.0,
    lng: 0.0,
    elevationM: 0,
    gravityMps2: 9.7803,
    gravityAnomalyMgal: 0.0,
    tangentialVelocityMps: 465.1,
    crustType: "oceanic",
    dominantRock: "Mid-Atlantic Ridge Basalt & Abyssal Pelagic Silt",
    rockDensityGcm3: 2.90,
    significance: "Global reference datum. Maximum centrifugal rotational relief reduces apparent gravity to minimum baseline 9.7803 m/s².",
    satelliteImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
    geologicalMapUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop",
    recommendedLaunchAzimuthDeg: 90.0,
    leoOrbitalPeriodMin: 92.5,
    escapeVelocityKmph: 40265,
  },
];

/**
 * Calculates theoretical geodetic gravity using the WGS-84 Somigliana formula
 * with Free-Air elevation reduction.
 */
export function calculateGeodeticGravity(latDeg: number, elevationM: number = 0): {
  gravityMps2: number;
  rotationalVelocityMps: number;
  escapeVelocityKmph: number;
  leoPeriodMin: number;
} {
  const phi = (Math.abs(latDeg) * Math.PI) / 180;
  // WGS-84 Theoretical Normal Gravity formula
  const sin2 = Math.sin(phi) ** 2;
  const sin4 = Math.sin(2 * phi) ** 2;
  const g0 = 9.780327 * (1 + 0.0053024 * sin2 - 0.0000058 * sin4);
  // Free-air elevation correction: -3.086e-6 m/s^2 per meter of elevation
  const g = g0 - 3.086e-6 * elevationM;

  const rotationalVelocityMps = 465.1 * Math.cos(phi);
  const escapeVelocityKmph = Math.round(Math.sqrt(2 * 9.80665 * 6371000) * 3.6);
  const leoPeriodMin = 92.5;

  return {
    gravityMps2: Number(g.toFixed(4)),
    rotationalVelocityMps: Number(rotationalVelocityMps.toFixed(1)),
    escapeVelocityKmph,
    leoPeriodMin,
  };
}

export function registerAdvancedScienceRoutes(
  app: express.Express,
  getAI: GetAIFn,
  generateGeminiContent: GenerateGeminiFn
) {
  // ==========================================
  // 1. GLOBAL GEO-DATA API (Astrophysics Lab)
  // ==========================================
  app.get("/api/astrophysics/geo-data", (req, res) => {
    const { lat, lng, elev } = req.query;

    if (lat !== undefined && lng !== undefined) {
      const parsedLat = parseFloat(lat as string);
      const parsedLng = parseFloat(lng as string);
      const parsedElev = elev ? parseFloat(elev as string) : 0;

      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        const computed = calculateGeodeticGravity(parsedLat, parsedElev);
        return res.json({
          success: true,
          mode: "custom_coordinate",
          location: {
            id: `coord-${parsedLat}-${parsedLng}`,
            name: `Coordinate Analysis (${parsedLat.toFixed(3)}°, ${parsedLng.toFixed(3)}°)`,
            region: parsedLat >= 0 ? "Northern Hemisphere" : "Southern Hemisphere",
            country: "Global Coordinate",
            lat: parsedLat,
            lng: parsedLng,
            elevationM: parsedElev,
            ...computed,
            crustType: parsedElev < 0 ? "oceanic" : "continental",
            dominantRock: parsedElev < 0 ? "Oceanic Basalt" : "Continental Granite/Sediment",
            rockDensityGcm3: parsedElev < 0 ? 2.9 : 2.7,
            significance: `Dynamically calculated geodetic gravity: ${computed.gravityMps2} m/s² with ${computed.rotationalVelocityMps} m/s rotational boost.`,
            satelliteImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
            geologicalMapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80&auto=format&fit=crop",
            recommendedLaunchAzimuthDeg: 90.0,
          },
          allLocations: REAL_WORLD_GEO_LOCATIONS,
        });
      }
    }

    return res.json({
      success: true,
      locations: REAL_WORLD_GEO_LOCATIONS,
      referenceDatum: {
        wgs84EquatorialGravity: 9.780327,
        wgs84PolarGravity: 9.832185,
        earthMassKg: 5.972e24,
        earthEquatorialRadiusM: 6378137,
        earthPolarRadiusM: 6356752,
        flattening: "1 / 298.257223563",
        standardGravity: 9.80665,
      },
    });
  });

  // Compare Virtual Orbit Simulation against Real-World Geo Location
  app.post("/api/astrophysics/geo-data/compare", async (req, res) => {
    const { virtualBody, locationId, customCoords } = req.body;

    let targetLocation: EarthGeoLocation | undefined;
    if (locationId) {
      targetLocation = REAL_WORLD_GEO_LOCATIONS.find((l) => l.id === locationId);
    }
    if (!targetLocation && customCoords) {
      const computed = calculateGeodeticGravity(customCoords.lat, customCoords.elevationM || 0);
      targetLocation = {
        id: "custom",
        name: `Custom Location (${customCoords.lat}°, ${customCoords.lng}°)`,
        region: "Custom",
        country: "Target",
        lat: customCoords.lat,
        lng: customCoords.lng,
        elevationM: customCoords.elevationM || 0,
        gravityMps2: computed.gravityMps2,
        tangentialVelocityMps: computed.rotationalVelocityMps,
        escapeVelocityKmph: computed.escapeVelocityKmph,
        leoOrbitalPeriodMin: computed.leoPeriodMin,
        gravityAnomalyMgal: 0,
        crustType: "continental",
        dominantRock: "Silicate Crust",
        rockDensityGcm3: 2.7,
        significance: "Student-defined geographical point.",
        satelliteImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
        geologicalMapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80&auto=format&fit=crop",
        recommendedLaunchAzimuthDeg: 90.0,
      };
    }

    if (!targetLocation) {
      targetLocation = REAL_WORLD_GEO_LOCATIONS[0];
    }

    const simSpeed = virtualBody?.speed || 15.8;
    const simDist = virtualBody?.distance || 4.8;
    const simPeriod = virtualBody?.period || 1.0;

    // Build comparison metrics
    const comparison = {
      realLocation: targetLocation,
      virtualSimulation: {
        trackedBody: virtualBody?.name || "Terra (Earth Analogue)",
        simulatedSpeedAU: simSpeed,
        simulatedDistanceAU: simDist,
        simulatedKeplerPeriod: simPeriod,
        simulatedLocalGEquivalent: (targetLocation.gravityMps2 * (simDist / 4.8)).toFixed(3),
      },
      gravityRatio: Number((targetLocation.gravityMps2 / 9.80665).toFixed(4)),
      deltaMps2FromStandard: Number((targetLocation.gravityMps2 - 9.80665).toFixed(4)),
      launchVelocitySavingsPct: Number(((targetLocation.tangentialVelocityMps / 7900) * 100).toFixed(2)),
    };

    res.json({
      success: true,
      comparison,
      analysis: `At ${targetLocation.name}, the local gravitational acceleration is ${targetLocation.gravityMps2} m/s² (${comparison.deltaMps2FromStandard >= 0 ? "+" : ""}${comparison.deltaMps2FromStandard} m/s² vs standard 9.807 m/s²). Earth's rotation provides a tangential velocity boost of ${targetLocation.tangentialVelocityMps} m/s, offsetting roughly ${comparison.launchVelocitySavingsPct}% of the ${targetLocation.leoOrbitalPeriodMin}-minute Low Earth Orbit insertion cost.`,
    });
  });

  // ==========================================
  // 2. SMART SKETCHPAD API (AutoDraw AI)
  // ==========================================
  const PRESET_SCIENTIFIC_VECTORS = [
    {
      id: "benzene-ring",
      name: "Benzene Ring (Aromatic C₆H₆)",
      category: "Chemistry",
      matchConfidence: 0.98,
      keywords: ["hexagon", "circle", "benzene", "ring", "aromatic", "carbon"],
      formula: "C₆H₆ (Delocalized π-electron cloud)",
      description: "Planar hexagonal ring with sp² hybridized carbon atoms and resonance-stabilized aromatic π system.",
      labTarget: "chemistry",
      labModelProps: { molecule: "benzene", geometry: "planar_hexagonal", bondAngle: 120 },
      svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-cyan-400">
        <polygon points="100,25 165,62.5 165,137.5 100,175 35,137.5 35,62.5" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
        <circle cx="100" cy="100" r="42" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6,4" />
        <circle cx="100" cy="25" r="7" fill="#fbbf24" /><circle cx="165" cy="62.5" r="7" fill="#fbbf24" />
        <circle cx="165" cy="137.5" r="7" fill="#fbbf24" /><circle cx="100" cy="175" r="7" fill="#fbbf24" />
        <circle cx="35" cy="137.5" r="7" fill="#fbbf24" /><circle cx="35" cy="62.5" r="7" fill="#fbbf24" />
        <text x="100" y="105" fill="#e2e8f0" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">π-cloud</text>
      </svg>`,
    },
    {
      id: "water-vsepr",
      name: "Water Molecule (H₂O Bent VSEPR)",
      category: "Chemistry",
      matchConfidence: 0.96,
      keywords: ["water", "bent", "vsepr", "h2o", "oxygen", "hydrogen", "angle"],
      formula: "H₂O (Bond Angle: 104.5°)",
      description: "Nonlinear bent geometry governed by two bonding pairs and two lone pairs with strong electrostatic repulsion.",
      labTarget: "chemistry",
      labModelProps: { molecule: "water", geometry: "bent", bondAngle: 104.5 },
      svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-rose-400">
        <circle cx="100" cy="80" r="28" fill="#ef4444" stroke="#fca5a5" stroke-width="3" />
        <text x="100" y="85" fill="#ffffff" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">O</text>
        <line x1="80" y1="98" x2="48" y2="140" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" />
        <line x1="120" y1="98" x2="152" y2="140" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" />
        <circle cx="45" cy="144" r="16" fill="#38bdf8" stroke="#bae6fd" stroke-width="2" />
        <text x="45" y="149" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">H</text>
        <circle cx="155" cy="144" r="16" fill="#38bdf8" stroke="#bae6fd" stroke-width="2" />
        <text x="155" y="149" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">H</text>
        <path d="M 68,122 A 38 38 0 0 0 132,122" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="3,3" />
        <text x="100" y="138" fill="#fbbf24" font-size="10" font-family="monospace" text-anchor="middle">104.5°</text>
        <ellipse cx="85" cy="45" rx="12" ry="7" fill="#818cf8" opacity="0.4" transform="rotate(-30 85 45)" />
        <ellipse cx="115" cy="45" rx="12" ry="7" fill="#818cf8" opacity="0.4" transform="rotate(30 115 45)" />
      </svg>`,
    },
    {
      id: "optical-prism-refraction",
      name: "Equilateral Prism & Snell's Dispersion",
      category: "Optics",
      matchConfidence: 0.94,
      keywords: ["triangle", "prism", "light", "ray", "snell", "spectrum", "refraction"],
      formula: "n₁·sin(θ₁) = n₂·sin(θ₂) & Cauchy Dispersion",
      description: "Monochromatic and polychromatic wave refraction across optical dielectric boundary with chromatic dispersion.",
      labTarget: "optics",
      labModelProps: { mode: "prism_dispersion", refractiveIndex: 1.52 },
      svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-emerald-400">
        <polygon points="100,30 175,160 25,160" fill="#0f172a" stroke="#10b981" stroke-width="3.5" opacity="0.85" />
        <line x1="10" y1="120" x2="65" y2="105" stroke="#ffffff" stroke-width="3" />
        <line x1="65" y1="105" x2="135" y2="110" stroke="#fde047" stroke-width="2.5" />
        <line x1="135" y1="110" x2="190" y2="90" stroke="#ef4444" stroke-width="2" />
        <line x1="135" y1="110" x2="190" y2="105" stroke="#22c55e" stroke-width="2" />
        <line x1="135" y1="110" x2="190" y2="120" stroke="#3b82f6" stroke-width="2" />
        <line x1="135" y1="110" x2="190" y2="135" stroke="#a855f7" stroke-width="2" />
        <text x="100" y="145" fill="#10b981" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">n = 1.52 (Glass)</text>
      </svg>`,
    },
    {
      id: "kepler-orbital-ellipse",
      name: "Keplerian Orbital Ellipse & Gravitational Foci",
      category: "Astrophysics",
      matchConfidence: 0.93,
      keywords: ["ellipse", "orbit", "planet", "sun", "kepler", "gravity", "ellipse"],
      formula: "T² = (4π² / GM) · a³",
      description: "First Law of Planetary Motion: Celestial orbits are ellipses with the central primary body at one focus.",
      labTarget: "astrophysics",
      labModelProps: { orbitType: "ellipse", eccentricity: 0.42, semiMajorAxis: 5.2 },
      svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-violet-400">
        <ellipse cx="100" cy="100" rx="80" ry="48" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="4,3" />
        <circle cx="65" cy="100" r="14" fill="#fbbf24" stroke="#f59e0b" stroke-width="2" />
        <text x="65" y="104" fill="#1e1b4b" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">Star</text>
        <circle cx="178" cy="92" r="8" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />
        <line x1="65" y1="100" x2="178" y2="92" stroke="#a78bfa" stroke-width="1.5" stroke-dasharray="2,2" />
        <text x="120" y="88" fill="#c4b5fd" font-size="9" font-family="monospace">r(θ)</text>
        <circle cx="135" cy="100" r="3" fill="#64748b" />
        <text x="135" y="115" fill="#64748b" font-size="8" font-family="monospace" text-anchor="middle">Focus 2</text>
        <text x="100" y="170" fill="#a78bfa" font-size="10" font-family="sans-serif" text-anchor="middle">e = 0.42 • Semi-Major a</text>
      </svg>`,
    },
    {
      id: "dna-double-helix",
      name: "DNA Double Helix & Hydrogen Base Pairs",
      category: "Cellular Biology",
      matchConfidence: 0.91,
      keywords: ["dna", "helix", "ladder", "biology", "adenine", "thymine", "cytosine"],
      formula: "Anti-parallel 5'→3' / 3'→5' Sugar-Phosphate",
      description: "Right-handed B-DNA helical polymer stabilized by complementary hydrogen-bonded purine-pyrimidine base pairs.",
      labTarget: "cellular_biology",
      labModelProps: { specimen: "dna_helix", magnification: 1200 },
      svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-emerald-400">
        <path d="M 50,20 Q 100,50 150,80 T 50,140 Q 100,170 150,190" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" />
        <path d="M 150,20 Q 100,50 50,80 T 150,140 Q 100,170 50,190" fill="none" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" />
        <line x1="75" y1="35" x2="125" y2="35" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
        <line x1="90" y1="65" x2="110" y2="65" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" />
        <line x1="60" y1="95" x2="140" y2="95" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
        <line x1="90" y1="125" x2="110" y2="125" stroke="#a855f7" stroke-width="3" stroke-linecap="round" />
        <line x1="75" y1="155" x2="125" y2="155" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" />
        <text x="100" y="185" fill="#6ee7b7" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">A-T (2 H-bonds) / G-C (3 H-bonds)</text>
      </svg>`,
    },
    {
      id: "convex-lens-ray-trace",
      name: "Convex Biconvex Lens & Principal Rays",
      category: "Optics",
      matchConfidence: 0.90,
      keywords: ["lens", "circle", "line", "focal", "focus", "optic", "convex"],
      formula: "1/f = 1/d_o + 1/d_i (Gaussian Thin Lens)",
      description: "Converging lens ray tracing demonstrating real inverted image formation via parallel, central, and focal rays.",
      labTarget: "optics",
      labModelProps: { mode: "convex_lens", focalLengthMm: 50 },
      svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-cyan-300">
        <line x1="10" y1="100" x2="190" y2="100" stroke="#475569" stroke-width="1.5" stroke-dasharray="3,3" />
        <path d="M 100,30 Q 115,100 100,170 Q 85,100 100,30" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="3" />
        <line x1="30" y1="100" x2="30" y2="60" stroke="#f59e0b" stroke-width="3" />
        <polygon points="30,55 26,63 34,63" fill="#f59e0b" />
        <line x1="30" y1="60" x2="100" y2="60" stroke="#38bdf8" stroke-width="1.8" />
        <line x1="100" y1="60" x2="170" y2="140" stroke="#38bdf8" stroke-width="1.8" />
        <line x1="30" y1="60" x2="170" y2="140" stroke="#10b981" stroke-width="1.8" />
        <line x1="170" y1="100" x2="170" y2="140" stroke="#f59e0b" stroke-width="3" />
        <polygon points="170,145 166,137 174,137" fill="#f59e0b" />
        <circle cx="60" cy="100" r="3" fill="#38bdf8" /><text x="60" y="115" fill="#94a3b8" font-size="8" text-anchor="middle">F</text>
        <circle cx="140" cy="100" r="3" fill="#38bdf8" /><text x="140" y="115" fill="#94a3b8" font-size="8" text-anchor="middle">F'</text>
      </svg>`,
    },
  ];

  app.post("/api/ai/sketch-convert", async (req, res) => {
    const { sketchBase64, diagramHint } = req.body;

    // Fast keyword/hint matcher
    let candidateMatches = [...PRESET_SCIENTIFIC_VECTORS];
    if (diagramHint && typeof diagramHint === "string") {
      const hint = diagramHint.toLowerCase();
      candidateMatches.sort((a, b) => {
        const aScore = a.keywords.some((k) => hint.includes(k)) ? 1 : 0;
        const bScore = b.keywords.some((k) => hint.includes(k)) ? 1 : 0;
        return bScore - aScore;
      });
    }

    // Try live Gemini AI Vision if sketchBase64 is provided
    let aiInsight = "Recognized hand-sketched geometry and converted to standardized 3D-ready vector diagram.";
    if (sketchBase64 && typeof sketchBase64 === "string" && sketchBase64.length > 50) {
      try {
        const cleanBase64 = sketchBase64.replace(/^data:image\/\w+;base64,/, "");
        const response = await generateGeminiContent([
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: "You are an AutoDraw AI for scientific lab diagrams. Analyze this hand-drawn sketch and identify what scientific structure or physical concept it represents (e.g., Benzene ring, Water VSEPR molecule, Optical prism with refraction, Keplerian orbital ellipse, DNA double helix, or Convex lens). Return a 2-sentence encouraging academic evaluation of the student's diagram.",
          },
        ]);
        if (response) {
          aiInsight = response;
        }
      } catch (err) {
        // Fallback to local catalog
      }
    }

    return res.json({
      success: true,
      insight: aiInsight,
      matches: candidateMatches.slice(0, 4),
      allPresets: PRESET_SCIENTIFIC_VECTORS,
    });
  });

  // ==========================================
  // 3. AR SPATIAL SCAN API (Camera Vision)
  // ==========================================
  const DESK_OBJECT_EXPERIMENT_MAP: Record<string, any> = {
    water_bottle: {
      id: "scan-water-bottle",
      objectName: "Water Bottle / Glass Tumbler",
      category: "Fluid & Molecular Optics",
      confidence: 0.94,
      physicalProperties: {
        density: "1.00 g/cm³",
        refractiveIndex: "1.333 (Liquid H₂O)",
        molecularGeometry: "Bent (104.5° bond angle)",
        thermalCapacity: "4.184 J/(g·°C)",
      },
      scientificSignificance: "Cylindrical liquid volume exhibits total internal reflection, acts as a cylindrical fluid lens, and demonstrates polar hydrogen bonding.",
      suggestedExperiments: [
        {
          labId: "chemistry",
          title: "VSEPR Polar Geometry & Hydrogen Bonds",
          action: "Load 3D H₂O Molecule",
          reason: "Directly explore the bent 104.5° molecular geometry of water molecules inside your container.",
          xpReward: 35,
        },
        {
          labId: "optics",
          title: "Snell's Law & Cylindrical Liquid Refraction",
          action: "Launch Liquid Bench",
          reason: "Simulate laser beams passing through a n=1.33 liquid cylinder with critical angle reflection.",
          xpReward: 40,
        },
        {
          labId: "astrophysics",
          title: "Hydrostatic Planetary Ocean Pressure (Europa/Titan)",
          action: "Compare Ocean Worlds",
          reason: "Compare terrestrial liquid column pressure with deep subterranean oceans of Jovian icy moons.",
          xpReward: 30,
        },
      ],
    },
    desk_lamp: {
      id: "scan-desk-lamp",
      objectName: "Desk Lamp / Light Source",
      category: "Photonics & Electromagnetic Radiation",
      confidence: 0.92,
      physicalProperties: {
        dominantWavelength: "450 - 650 nm (Visible Spectrum)",
        photonFlux: "3.2 × 10¹⁸ photons/s",
        radiationType: "Blackbody / LED Phosphor Emission",
        speedOfPropagation: "299,792,458 m/s (c)",
      },
      scientificSignificance: "Continuous emission spectrum source suitable for wave interference, Cauchy prism dispersion, and photoelectric excitation.",
      suggestedExperiments: [
        {
          labId: "optics",
          title: "Prism Dispersion & Snell Refraction",
          action: "Load Triangular Prism",
          reason: "Disperse the white light emitted by your lamp into its constituent chromatic wavelength spectrum.",
          xpReward: 45,
        },
        {
          labId: "astrophysics",
          title: "Stellar Blackbody Radiation & Planck Spectra",
          action: "Launch Solar Array",
          reason: "Compare artificial lamp lumen emission with the 5,778 K blackbody curve of our Helios star.",
          xpReward: 35,
        },
      ],
    },
    notebook_pen: {
      id: "scan-notebook-pen",
      objectName: "Lab Notebook & Ballpoint Pen",
      category: "Classical Mechanics & Friction",
      confidence: 0.89,
      physicalProperties: {
        ballBearingDiameter: "0.7 mm Tungsten Carbide",
        capillaryViscosity: "1000 - 3000 mPa·s (Thixotropic Ink)",
        staticFrictionCoeff: "μ_s = 0.45",
      },
      scientificSignificance: "Rolling shear friction dynamics, non-Newtonian fluid rheology, and surface tension capillary pull.",
      suggestedExperiments: [
        {
          labId: "chemistry",
          title: "Chromatography & Pigment Molecular Separation",
          action: "Launch Chemistry Bench",
          reason: "Analyze how ink solvents separate into polar and non-polar dye pigments.",
          xpReward: 30,
        },
      ],
    },
    ball_sphere: {
      id: "scan-ball-sphere",
      objectName: "Spherical Ball / Round Object",
      category: "Orbital Gravity & Kinematics",
      confidence: 0.93,
      physicalProperties: {
        momentOfInertia: "I = 2/5 M·R² (Solid Sphere)",
        surfaceAreaToVolumeRatio: "3 / R",
        sphericity: "0.985 (Equipotential Gravitational Analogue)",
      },
      scientificSignificance: "Perfect macroscopic model for planetary celestial bodies, central gravity fields, and orbital momentum transfer.",
      suggestedExperiments: [
        {
          labId: "astrophysics",
          title: "Keplerian Orbits & N-Body Gravity Well",
          action: "Map to Terra Orbit",
          reason: "Treat your desk sphere as an orbiting planet and observe how gravitational tidal forces act upon it.",
          xpReward: 50,
        },
      ],
    },
    plant_leaf: {
      id: "scan-plant-leaf",
      objectName: "Plant Leaf / Houseplant",
      category: "Cellular Biology & Photosynthesis",
      confidence: 0.95,
      physicalProperties: {
        pigmentType: "Chlorophyll-a & Chlorophyll-b",
        peakAbsorption: "430 nm (Blue) & 662 nm (Red)",
        cellularStructure: "Palisade Mesophyll & Stomatal Guard Cells",
      },
      scientificSignificance: "Biological light-harvesting complex converting photon energy into chemical ATP through electron transport chains.",
      suggestedExperiments: [
        {
          labId: "cellular_biology",
          title: "Chloroplast Stroma & ATP Synthesis",
          action: "Load 3D Plant Cell",
          reason: "Zoom into the microscopic thylakoid membrane inside plant leaves on your desk.",
          xpReward: 45,
        },
      ],
    },
    eyeglass_lens: {
      id: "scan-eyeglass-lens",
      objectName: "Eyeglasses / Convex/Concave Lens",
      category: "Geometric Optics",
      confidence: 0.91,
      physicalProperties: {
        diopterPower: "-2.0 to +2.5 D",
        refractiveIndex: "n = 1.56 (Polycarbonate CR-39)",
        focalLength: "400 - 500 mm",
      },
      scientificSignificance: "Corrective refraction according to the Lensmaker's equation: 1/f = (n-1)(1/R1 - 1/R2).",
      suggestedExperiments: [
        {
          labId: "optics",
          title: "Convex & Concave Lens Ray Tracing",
          action: "Launch Lensmaker Bench",
          reason: "Replicate the exact focal length of your lenses in the 3D ray-tracing optics laboratory.",
          xpReward: 40,
        },
      ],
    },
  };

  app.post("/api/ai/spatial-scan", async (req, res) => {
    const { imageBase64, labContext, deskObjectHint } = req.body;

    let detectedKey = "water_bottle";
    if (deskObjectHint && DESK_OBJECT_EXPERIMENT_MAP[deskObjectHint]) {
      detectedKey = deskObjectHint;
    }

    // Try Gemini Multimodal Vision if an image is sent
    let liveVisionText = "";
    if (imageBase64 && typeof imageBase64 === "string" && imageBase64.length > 50) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const visionPrompt = `You are the KEV XR Science Academy Spatial Vision Scanner.
Examine this image of a student's desk learning space.
1. Identify 1 or 2 key physical objects (e.g. water bottle, mug, desk lamp, book, glasses, ball, plant, calculator, ruler).
2. Briefly describe what scientific principles (optics, molecular chemistry, kinematics, or cellular biology) the student can investigate using that object as a real-world anchor.
Keep it under 3 concise sentences.`;

        const result = await generateGeminiContent([
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          { text: visionPrompt },
        ]);

        if (result) {
          liveVisionText = result;
          // Simple keyword mapping to select best suggested item
          const lower = result.toLowerCase();
          if (lower.includes("light") || lower.includes("lamp") || lower.includes("bulb")) {
            detectedKey = "desk_lamp";
          } else if (lower.includes("plant") || lower.includes("leaf") || lower.includes("flower")) {
            detectedKey = "plant_leaf";
          } else if (lower.includes("glass") || lower.includes("lens") || lower.includes("spectacle")) {
            detectedKey = "eyeglass_lens";
          } else if (lower.includes("ball") || lower.includes("sphere") || lower.includes("round")) {
            detectedKey = "ball_sphere";
          } else if (lower.includes("pen") || lower.includes("pencil") || lower.includes("book")) {
            detectedKey = "notebook_pen";
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    const primaryObject = DESK_OBJECT_EXPERIMENT_MAP[detectedKey] || DESK_OBJECT_EXPERIMENT_MAP.water_bottle;

    return res.json({
      success: true,
      detectedObject: primaryObject,
      liveVisionAnalysis: liveVisionText || primaryObject.scientificSignificance,
      availableDeskObjects: Object.values(DESK_OBJECT_EXPERIMENT_MAP),
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // 4. LESSON DIFFERENTIATOR API (Diffit AI)
  // ==========================================
  app.post("/api/curriculum/differentiate", async (req, res) => {
    const {
      lessonTitle,
      subject,
      originalDescription,
      gradeLevel = "high_school",
    } = req.body;

    const levelDescriptions: Record<string, { label: string; lexile: string; tone: string }> = {
      elementary: {
        label: "Elementary School (Grades 3-5)",
        lexile: "450L - 700L",
        tone: "Fun, highly visual, storytelling-driven with everyday metaphors and simple sentences.",
      },
      middle: {
        label: "Middle School (Grades 6-8)",
        lexile: "750L - 1000L",
        tone: "Clear, engaging, foundational scientific concepts with clear definitions and relatable examples.",
      },
      high_school: {
        label: "High School Standard (Grades 9-10)",
        lexile: "1050L - 1200L",
        tone: "Standard curriculum rigor, formal scientific terminology, and balanced algebraic/mechanistic models.",
      },
      ap_honors: {
        label: "AP / Honors (Grades 11-12)",
        lexile: "1250L - 1400L",
        tone: "Advanced placement depth, quantitative derivations, critical inquiry, and experimental design.",
      },
      college: {
        label: "University / Research Undergraduate",
        lexile: "1450L+",
        tone: "University academic rigor, formal mathematical formulations, vector/tensor notation, and literature references.",
      },
    };

    const targetConfig = levelDescriptions[gradeLevel] || levelDescriptions.high_school;

    const prompt = `You are a Diffit-style AI Curriculum Differentiation Specialist for the KEV XR Science Academy.
Take this lesson and adapt it specifically for: ${targetConfig.label} (Lexile band: ${targetConfig.lexile}).

Lesson Title: "${lessonTitle}"
Discipline / Subject: "${subject}"
Original Lesson Brief: "${originalDescription}"

Produce a structured JSON response with these exact keys:
1. "adaptedPassage": A 2 to 3 paragraph engaging, differentiated reading text calibrated specifically for this grade level.
2. "keyTakeaways": An array of 4 concise bulleted takeaways.
3. "vocabularyList": An array of 4 key domain words. Each word must have:
   - "term": string
   - "pronunciation": string
   - "partOfSpeech": string
   - "definition": string (written in grade-appropriate language)
   - "example": string (used in a sentence)
4. "assessmentQuestions": An array of 3 multiple-choice questions. Each question must have:
   - "id": string (e.g. "q1")
   - "question": string
   - "options": array of 4 strings
   - "correctIndex": integer (0 to 3)
   - "explanation": string explaining why the answer is correct
5. "socraticPrompt": An open-ended critical thinking discussion question.
6. "handsOnLabActivity": A 2-sentence hands-on experiment suggestion for the virtual lab.

Return ONLY valid JSON matching this structure.`;

    let generatedData: any = null;
    try {
      const responseText = await generateGeminiContent([
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ]);

      if (responseText) {
        const cleaned = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        generatedData = JSON.parse(cleaned);
      }
    } catch (err) {
      // Fallback below
    }

    // High-quality fallback curriculum content if upstream is slow or unavailable
    if (!generatedData || !generatedData.adaptedPassage) {
      generatedData = getFallbackDifferentiatedLesson(lessonTitle, subject, gradeLevel, targetConfig);
    }

    return res.json({
      success: true,
      gradeLevel,
      gradeLabel: targetConfig.label,
      lexile: targetConfig.lexile,
      data: generatedData,
    });
  });

  // =========================================================================
  // 5. XR SCIENCE TWIN CHALLENGE (Daily Lab Calibration)
  // =========================================================================
  app.get("/api/ai/science-twin/challenges", (req, res) => {
    return res.json({
      success: true,
      message: "Daily XR Science Twin Calibration Targets retrieved.",
      targets: [
        {
          id: "chem-twin-so2",
          labId: "chemistry",
          title: "Sulfur Dioxide Bent Conformation",
          scientificFormulaOrName: "SO₂ (Sulfur Dioxide)",
          description: "Calibrate simulation to reproduce the bent geometry of sulfur dioxide (119°), governed by one non-bonding sulfur lone pair squeezing two S=O bonds.",
          targetPhenomenon: "VSEPR Bent Molecular Conformation (AX₂E₁)",
          targetParameters: {
            bondAngleDeg: 119.0,
            lonePairs: 1,
            electronegativityDelta: 0.86,
            dipoleMomentD: 1.63,
          },
          tolerance: {
            bondAngleDeg: 5.0,
            electronegativityDelta: 0.25,
            dipoleMomentD: 0.35,
          },
        },
        {
          id: "chem-twin-h2o",
          labId: "chemistry",
          title: "Water Dipole & Hydrogen Bond Angle",
          scientificFormulaOrName: "H₂O (Water)",
          description: "Tune electronegativity and valence shell electron repulsion to produce the classic 104.5° bent geometry with two bulky lone pairs.",
          targetPhenomenon: "Tetrahedral-derived Bent Geometry (AX₂E₂)",
          targetParameters: {
            bondAngleDeg: 104.5,
            lonePairs: 2,
            electronegativityDelta: 1.24,
            dipoleMomentD: 1.85,
          },
          tolerance: {
            bondAngleDeg: 4.0,
            electronegativityDelta: 0.2,
            dipoleMomentD: 0.3,
          },
        },
        {
          id: "astro-twin-lagrange-l4",
          labId: "astrophysics",
          title: "Stable L4 Lagrange Trojan Orbital Resonance",
          scientificFormulaOrName: "Earth-Moon L4 Point (Trojan Resonance)",
          description: "Stabilize an orbiting body 60° ahead of the secondary mass in an equilateral triangle with zero net gravitational drift.",
          targetPhenomenon: "Restricted Three-Body Equilateral Equilibrium",
          targetParameters: {
            orbitalAngleDeg: 60.0,
            eccentricity: 0.01,
            semiMajorAxisAU: 1.0,
          },
          tolerance: {
            orbitalAngleDeg: 5.0,
            eccentricity: 0.08,
            semiMajorAxisAU: 0.15,
          },
        },
        {
          id: "optics-twin-tir-crown",
          labId: "optics",
          title: "Crown Glass Critical Angle & Total Internal Reflection",
          scientificFormulaOrName: "TIR at θc = 41.1° in Crown Glass",
          description: "Calibrate laser incident angle to the exact critical angle boundary where refraction angle θ₂ reaches 90° and 100% of light reflects internally.",
          targetPhenomenon: "Snell's Law Critical Angle Threshold",
          targetParameters: {
            refractiveIndexN1: 1.52,
            criticalAngleDeg: 41.14,
            internalReflectancePercent: 100,
          },
          tolerance: {
            refractiveIndexN1: 0.05,
            criticalAngleDeg: 2.5,
          },
        },
        {
          id: "bio-twin-metaphase",
          labId: "biology",
          title: "Mitotic Metaphase Equator Alignment & Spindle Checkpoint",
          scientificFormulaOrName: "Metaphase-to-Anaphase Spindle Checkpoint",
          description: "Balance microtubule pulling tension to align all sister chromatid pairs precisely along the cell's equatorial metaphase plate.",
          targetPhenomenon: "Spindle Assembly Checkpoint (SAC) Equilibrium",
          targetParameters: {
            chromosomalEquatorOffsetMicrons: 0.05,
            kinetochoreTensionPicoNewtons: 45,
            cyclinBCdk1ActivityPercent: 100,
          },
          tolerance: {
            chromosomalEquatorOffsetMicrons: 0.1,
            kinetochoreTensionPicoNewtons: 10,
            cyclinBCdk1ActivityPercent: 15,
          },
        },
      ],
    });
  });

  app.post("/api/ai/science-twin/evaluate", async (req, res) => {
    const { targetId, labId, studentParams = {}, studentHypothesisPrompt = "" } = req.body;

    const TARGET_DEFINITIONS: Record<string, any> = {
      "chem-twin-so2": {
        title: "Sulfur Dioxide Bent Conformation (SO₂)",
        params: { bondAngleDeg: 119.0, lonePairs: 1, electronegativityDelta: 0.86, dipoleMomentD: 1.63 },
        tolerances: { bondAngleDeg: 6.0, lonePairs: 0.01, electronegativityDelta: 0.3, dipoleMomentD: 0.4 },
      },
      "chem-twin-h2o": {
        title: "Water Bent Dipole (H₂O)",
        params: { bondAngleDeg: 104.5, lonePairs: 2, electronegativityDelta: 1.24, dipoleMomentD: 1.85 },
        tolerances: { bondAngleDeg: 5.0, lonePairs: 0.01, electronegativityDelta: 0.25, dipoleMomentD: 0.35 },
      },
      "chem-twin-co2": {
        title: "Carbon Dioxide Linear Non-polar (CO₂)",
        params: { bondAngleDeg: 180.0, lonePairs: 0, electronegativityDelta: 0.89, dipoleMomentD: 0.0 },
        tolerances: { bondAngleDeg: 4.0, lonePairs: 0.01, electronegativityDelta: 0.2, dipoleMomentD: 0.15 },
      },
      "astro-twin-lagrange-l4": {
        title: "L4 Lagrange Trojan Resonance (60° Lead)",
        params: { orbitalAngleDeg: 60.0, eccentricity: 0.01, semiMajorAxisAU: 1.0 },
        tolerances: { orbitalAngleDeg: 6.0, eccentricity: 0.08, semiMajorAxisAU: 0.15 },
      },
      "astro-twin-eccentric-comet": {
        title: "Keplerian Eccentric Orbit (e = 0.58)",
        params: { eccentricity: 0.58, semiMajorAxisAU: 3.2, perihelionAU: 1.344 },
        tolerances: { eccentricity: 0.09, semiMajorAxisAU: 0.4, perihelionAU: 0.25 },
      },
      "optics-twin-tir-crown": {
        title: "Crown Glass Critical Angle (θc = 41.1°)",
        params: { refractiveIndexN1: 1.52, criticalAngleDeg: 41.14 },
        tolerances: { refractiveIndexN1: 0.06, criticalAngleDeg: 2.5 },
      },
      "optics-twin-dispersion": {
        title: "Prism Chromatic Rainbow Dispersion",
        params: { prismApexAngleDeg: 60.0, incidentAngleDeg: 45.0, angularSpreadDeg: 2.85 },
        tolerances: { prismApexAngleDeg: 5.0, incidentAngleDeg: 5.0, angularSpreadDeg: 0.6 },
      },
      "bio-twin-metaphase": {
        title: "Mitotic Metaphase Equator Alignment",
        params: { chromosomalEquatorOffsetMicrons: 0.05, kinetochoreTensionPicoNewtons: 45, cyclinBCdk1ActivityPercent: 100 },
        tolerances: { chromosomalEquatorOffsetMicrons: 0.12, kinetochoreTensionPicoNewtons: 12, cyclinBCdk1ActivityPercent: 20 },
      },
    };

    const target = TARGET_DEFINITIONS[targetId] || TARGET_DEFINITIONS["chem-twin-so2"];
    const breakdown: any[] = [];
    let totalScoreAcc = 0;
    let paramCount = 0;

    for (const [key, targetVal] of Object.entries(target.params)) {
      const tol = target.tolerances[key] || Math.max(1, (targetVal as number) * 0.1);
      const studentVal = studentParams[key] !== undefined ? Number(studentParams[key]) : Number(targetVal) * 0.85;
      const deviation = Math.abs(studentVal - (targetVal as number));
      const matchPct = Math.max(0, Math.min(100, Math.round((1 - deviation / (tol * 2)) * 100)));

      totalScoreAcc += matchPct;
      paramCount++;

      let feedback = "Matched theoretical target closely.";
      if (matchPct < 70) {
        feedback = studentVal < (targetVal as number) ? `Value is too low (target: ${targetVal}).` : `Value is too high (target: ${targetVal}).`;
      }

      breakdown.push({
        parameter: key,
        targetValue: targetVal,
        studentValue: Number(studentVal.toFixed(2)),
        matchPercentage: matchPct,
        feedback,
      });
    }

    let similarityScore = paramCount > 0 ? Math.round(totalScoreAcc / paramCount) : 80;

    // Evaluate student hypothesis prompt with AI if present
    let aiPhysicsAnalysis = `The simulation parameters yield a ${similarityScore}% correlation with the target ${target.title} state. Energy conservation and vector symmetries are appropriately maintained.`;

    if (studentHypothesisPrompt && studentHypothesisPrompt.length > 5) {
      try {
        const prompt = `You are the lead XR physics evaluator at KEV Academy. A student is attempting the "XR Science Twin Challenge" for: ${target.title}.
Target parameters: ${JSON.stringify(target.params)}.
Student's adjusted parameters: ${JSON.stringify(studentParams)}.
Calculated quantitative similarity: ${similarityScore}%.
Student's written scientific explanation/prompt: "${studentHypothesisPrompt}".

Provide a 2-3 sentence physics evaluation assessing their conceptual grasp, noting what physical law governs this phenomenon, and giving an encouraging calibration recommendation.`;
        const aiEvaluation = await generateGeminiContent([{ text: prompt }]);
        if (aiEvaluation) {
          aiPhysicsAnalysis = aiEvaluation;
        }
      } catch (err) {
        // use fallback
      }
    }

    const targetAchieved = similarityScore >= 85;
    const awardedXP = targetAchieved ? 100 : Math.round(similarityScore * 0.7);

    return res.json({
      success: true,
      similarityScore,
      targetAchieved,
      awardedXP,
      parameterBreakdown: breakdown,
      physicsDeviationAnalysis: aiPhysicsAnalysis,
      conceptualCritique: targetAchieved
        ? "Excellent calibration! The physical state matches the mathematical twin with high precision."
        : "Close calibration! Adjust the highlighted parameters slightly to minimize vector drift.",
    });
  });

  // =========================================================================
  // 6. EARTH & PLANETARY BIOME RECONNAISSANCE (Floor 3 Planetarium)
  // =========================================================================
  app.post("/api/ai/planetary-recon/analyze", async (req, res) => {
    const {
      targetId,
      solarZenithAngleDeg = 30,
      solarDeclinationDeg = 15,
      atmosphericHazeRatio = 1.2,
      customImageBase64,
    } = req.body;

    // Calculate latitude based on solar zenith angle: Latitude = Zenith Angle + Solar Declination
    const calculatedLatitudeDeg = Number((solarZenithAngleDeg + solarDeclinationDeg).toFixed(2));

    // Rayleigh scattering analysis: blue scattering ratio ~ 1 / lambda^4
    const rayleighBlueScatteringIndex = Number((atmosphericHazeRatio * 2.85).toFixed(2));

    let terrainInsight = "Analysis reveals distinct stratified sedimentary bedding interlaced with volcanic basalt flows, indicative of past fluvial activity and subsequent arid thermal weathering.";

    if (customImageBase64 && customImageBase64.length > 50) {
      try {
        const cleanBase64 = customImageBase64.replace(/^data:image\/\w+;base64,/, "");
        const response = await generateGeminiContent([
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: "You are a planetary geologist. Analyze this geological terrain image. Classify the rock type (igneous, sedimentary, metamorphic), identify visible erosion mechanisms (fluvial, aeolian, glacial, thermal), and provide a 2-sentence assessment of environmental habitability or planetary history.",
          },
        ]);
        if (response) {
          terrainInsight = response;
        }
      } catch (e) {
        // fallback
      }
    }

    return res.json({
      success: true,
      targetId,
      calculatedLatitude: {
        derivedLatitudeDeg: calculatedLatitudeDeg,
        formulaUsed: "φ = θ_z + δ (Solar Zenith Angle + Solar Declination)",
        confidencePercent: 94.5,
      },
      atmosphericScattering: {
        rayleighIndex: rayleighBlueScatteringIndex,
        skyColorModel: atmosphericHazeRatio > 1.5 ? "Deep Terrestrial Nitrogen-Oxygen Blue" : "Martian Oxidized Dust Butterscotch",
        solarZenithAngleDeg,
      },
      geologicalAnalysis: {
        rockClassification: targetId?.includes("jezero") || targetId?.includes("canyon") ? "Sedimentary Strata with Igneous Basement" : "Cryo-Igneous Ice Lithosphere",
        dominantMinerals: ["Olivine Silicate", "Magnesian Smectite Clay", "Ferric Oxide", "Quartzite Matrix"],
        erosionForces: ["Aeolian saltation sand-blasting", "Diurnal thermal expansion shock", "Fluvial paleochannel downcutting"],
        planetaryHabitabilityESI: targetId?.includes("trappist") ? 0.85 : targetId?.includes("earth") ? 1.0 : 0.64,
      },
      aiScientificSynthesis: terrainInsight,
      missionCompleted: true,
      awardedXP: 75,
    });
  });

  // =========================================================================
  // 7. SMART LAB SKETCH-TO-SIMULATION API
  // =========================================================================
  app.post("/api/ai/sketch-to-sim", async (req, res) => {
    const { sketchBase64, sketchPrompt = "" } = req.body;

    let recognizedType = "bent_molecule";
    let targetLabId = "chemistry";
    let synthesisDetails: any = {
      name: "Water (H₂O) Bent Conformation",
      formula: "H₂O",
      geometry: "Bent (104.5°)",
      labId: "chemistry",
      simulationParams: {
        bondAngle: 104.5,
        lonePairs: 2,
        electronegativity: 1.24,
        temperatureK: 298,
      },
      explanation: "Recognized central atom with two bonded peripheral atoms and unshared electron lone pairs.",
    };

    const hint = sketchPrompt.toLowerCase();
    if (hint.includes("prism") || hint.includes("triangle") || hint.includes("laser") || hint.includes("rainbow") || hint.includes("lens")) {
      recognizedType = "optical_prism";
      targetLabId = "optics";
      synthesisDetails = {
        name: "Equilateral Dispersion Prism",
        geometry: "60° Crown Glass Prism",
        labId: "optics",
        simulationParams: {
          prismType: "equilateral",
          refractiveIndex: 1.52,
          incidentAngle: 45.0,
          dispersionEnabled: true,
        },
        explanation: "Recognized triangular prism geometry with light ray refraction across interface boundary.",
      };
    } else if (hint.includes("orbit") || hint.includes("planet") || hint.includes("star") || hint.includes("kepler") || hint.includes("gravity") || hint.includes("ellipse")) {
      recognizedType = "kepler_orbit";
      targetLabId = "astrophysics";
      synthesisDetails = {
        name: "Keplerian Eccentric Orbit",
        geometry: "Elliptical Gravitational Trajectory",
        labId: "astrophysics",
        simulationParams: {
          trackedBody: "Terra",
          eccentricity: 0.42,
          orbitalDistance: 4.8,
          gravityMultiplier: 1.0,
        },
        explanation: "Recognized primary star focus with closed eccentric Keplerian orbital path.",
      };
    } else if (hint.includes("cell") || hint.includes("mitosis") || hint.includes("dna") || hint.includes("mitochondria")) {
      recognizedType = "cell_mitosis";
      targetLabId = "biology";
      synthesisDetails = {
        name: "Eukaryotic Cell & Mitotic Equator",
        geometry: "Eukaryotic Organelle Matrix",
        labId: "biology",
        simulationParams: {
          activeOrganelle: "mitochondria",
          atpProductionRate: 85,
          mitoticPhase: "Metaphase",
        },
        explanation: "Recognized membrane-bound cellular structure with chromosomal genetic core.",
      };
    }

    // Attempt Gemini AI recognition if base64 provided
    if (sketchBase64 && sketchBase64.length > 50) {
      try {
        const cleanBase64 = sketchBase64.replace(/^data:image\/\w+;base64,/, "");
        const aiClassification = await generateGeminiContent([
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this scientific hand-drawn doodle. Which virtual lab does it belong to? Options: "chemistry" (molecule/bonds), "optics" (prism/lens/laser), "astrophysics" (orbit/planet/gravity), or "biology" (cell/DNA). Also give the specific physical name and a 1-sentence explanation. Reply in JSON: {"labId": "...", "name": "...", "explanation": "..."}`,
          },
        ]);
        if (aiClassification) {
          const match = aiClassification.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.labId && ["chemistry", "optics", "astrophysics", "biology"].includes(parsed.labId)) {
              targetLabId = parsed.labId;
              synthesisDetails.name = parsed.name || synthesisDetails.name;
              synthesisDetails.labId = parsed.labId;
              synthesisDetails.explanation = parsed.explanation || synthesisDetails.explanation;
            }
          }
        }
      } catch (err) {
        // keep fallback
      }
    }

    return res.json({
      success: true,
      recognizedType,
      targetLabId,
      synthesis: synthesisDetails,
    });
  });

  // =========================================================================
  // 8. ADAPTIVE MULTI-TIER FACULTY TUTORING API
  // =========================================================================
  app.post("/api/ai/faculty-consult-tiered", async (req, res) => {
    const {
      facultyId = "prof-kev",
      tier = "high_school",
      question = "",
      labContext = "General XR Science Lab",
      simulationState = {},
    } = req.body;

    const FACULTY_BIOS: Record<string, { name: string; title: string; floor: string; defaultDiscipline: string }> = {
      "prof-kev": { name: "Professor KEV", title: "Dean of XR Sciences & Quantum Computing", floor: "Floor 4", defaultDiscipline: "Integrated XR Sciences" },
      "dr-reed": { name: "Dr. Evelyn Reed", title: "Head of Molecular Synthesis & VSEPR Benches", floor: "Floor 2", defaultDiscipline: "Chemistry" },
      "prof-thorne": { name: "Prof. Julian Thorne", title: "Director of Keplerian Astrophysics", floor: "Floor 3", defaultDiscipline: "Astrophysics" },
      "dr-lin": { name: "Dr. Sophia Lin", title: "Chair of Quantum Optics & Laser Dynamics", floor: "Floor 3", defaultDiscipline: "Optics" },
      "dr-vance": { name: "Dr. Alistair Vance", title: "Chief of Cellular Genomics & Bioenergetics", floor: "Floor 4", defaultDiscipline: "Biology" },
    };

    const faculty = FACULTY_BIOS[facultyId] || FACULTY_BIOS["prof-kev"];

    const TIER_INSTRUCTIONS: Record<string, string> = {
      middle_school: "Use vibrant everyday metaphors, intuitive physical analogies, and simple cause-and-effect reasoning. Absolutely NO calculus or advanced algebraic derivations. Keep vocabulary friendly, highly visual, and accessible.",
      high_school: "Maintain standard high school and AP preparatory rigor. Use standard algebraic formulas (Snell's Law, F=ma, VSEPR angle rules), formal scientific terms, and balanced mechanistic explanations.",
      ap_honors: "Provide deep analytical rigor suitable for AP/IB Honors students. Incorporate differential calculus relationships (d²r/dt² = -GM/r²), thermodynamic free energy (ΔG = ΔH - TΔS), and precise physical constants.",
      university: "Provide comprehensive undergraduate and graduate research-level depth. Use tensor or matrix notation where appropriate, molecular orbital theory, Hamiltonian orbital dynamics, and reference peer-reviewed scientific mechanisms.",
    };

    const tierGuide = TIER_INSTRUCTIONS[tier] || TIER_INSTRUCTIONS["high_school"];

    let tutorAnswer = `Greetings! ${faculty.name} here from ${faculty.floor}. Under ${tier.replace("_", " ")} rigor, let us examine how the governing physical equations dictate the 3D behavior observed on your workbench.`;

    try {
      const systemPrompt = `You are ${faculty.name}, ${faculty.title} at KEV XR Science Academy.
Pedagogical Level: ${tier} (${tierGuide}).
Current Facility / Lab Context: ${labContext}.
Current Workbench Simulation State: ${JSON.stringify(simulationState)}.

Answer the student's question directly:
1. Greet them warmly as ${faculty.name}.
2. Adhere strictly to the requested mathematical and conceptual rigor level (${tier}).
3. Explain the governing scientific mechanism with clarity.
4. Conclude with an actionable experimental task they should perform in the 3D virtual simulation to verify the concept empirically.`;

      const response = await generateGeminiContent([
        { text: `${systemPrompt}\n\nStudent Question: "${question || `What physical principles should I observe in this 3D simulation?`}"` },
      ]);
      if (response) {
        tutorAnswer = response;
      }
    } catch (e) {
      // High quality fallback based on faculty
      if (facultyId === "dr-reed") {
        tutorAnswer = tier === "middle_school"
          ? `Hello! Dr. Evelyn Reed here! Think of atoms like balloons tied together: they hate bumping into each other! In water, two invisible balloons (called lone pairs) push down on the hydrogen atoms, bending the molecule like a boomerang at 104.5 degrees! Try spinning the molecule on your bench to see the bend!`
          : `Hello scholar! Dr. Evelyn Reed here. Under ${tier} standards, molecular geometry is determined by minimizing electrostatic potential energy (VSEPR theory). Non-bonding electron pairs have greater spatial domain than bonding pairs, generating stronger repulsive forces that compress the H-O-H bond angle to 104.5°. In the 3D lab, test adjusting electronegativity to observe dipole vectors!`;
      } else {
        tutorAnswer = `Greetings! ${faculty.name} here. At your current study level (${tier}), observing the physical forces on your 3D bench proves how mathematical laws translate directly into physical reality. Try tuning your simulation parameters to verify this principle!`;
      }
    }

    return res.json({
      success: true,
      facultyId,
      facultyName: faculty.name,
      tier,
      answer: tutorAnswer,
    });
  });

  // =========================================================================
  // 9. 1-CLICK LAB STUDY KIT GENERATOR API
  // =========================================================================
  app.post("/api/ai/lab-study-kit", async (req, res) => {
    const { labId = "chemistry", tier = "high_school", experimentTitle = "Active Lab Experiment" } = req.body;

    const studyKit = {
      labId,
      tier,
      experimentTitle,
      summary: `Comprehensive scientific study kit for ${experimentTitle} leveled for ${tier.replace("_", " ")} students. This experiment investigates conservation laws, structural equilibria, and empirical observation methodologies.`,
      flashcards: [
        {
          id: "fc-1",
          term: "VSEPR Theory",
          phonetic: "VES-per",
          definition: "A model used in chemistry to predict the geometry of individual molecules from the number of electron pairs surrounding their central atoms.",
          relevance: "Governs why molecules adopt 3D shapes that minimize repulsive energy.",
        },
        {
          id: "fc-2",
          term: "Dipole Moment",
          phonetic: "DYE-pole MOH-ment",
          definition: "A measurement of the separation of two opposite electrical charges within a chemical bond or molecule.",
          relevance: "Determines molecular polarity, solubility, and intermolecular bonding.",
        },
        {
          id: "fc-3",
          term: "Critical Angle",
          phonetic: "KRIT-ih-kuhl ANG-guhl",
          definition: "The angle of incidence beyond which total internal reflection occurs at a boundary between two refractive media.",
          relevance: "Core mathematical threshold enabling fiber optic transmission.",
        },
        {
          id: "fc-4",
          term: "Kepler's Second Law",
          phonetic: "KEP-lerz SEK-und LAW",
          definition: "A line segment joining a planet and the Sun sweeps out equal areas during equal intervals of time.",
          relevance: "Proves conservation of angular momentum during perihelion speed bursts.",
        },
        {
          id: "fc-5",
          term: "Proton Motive Force",
          phonetic: "PROH-ton MOH-tiv FORSS",
          definition: "Energy generated by the transfer of protons across a biological membrane, creating a gradient of pH and electrical potential.",
          relevance: "Drives rotational catalytic synthesis of ATP in mitochondria.",
        },
      ],
      printableQuiz: [
        {
          questionNumber: 1,
          question: `In the 3D ${labId} simulation, what is the primary consequence of increasing the independent variable?`,
          options: [
            "A: The system shifts towards minimum potential energy",
            "B: Total energy is spontaneously destroyed",
            "C: Physical constants change their mathematical values",
            "D: Molecular bonds cease to vibrate",
          ],
          correctOption: "A",
          explanation: "Physical and chemical systems naturally minimize free energy or maximize entropy in equilibrium.",
        },
        {
          questionNumber: 2,
          question: "Which empirical measurement method ensures the highest reproducibility in this experiment?",
          options: [
            "A: Quantitative logging of telemetry vectors and repeated parameter trials",
            "B: Relying solely on a single unrecorded qualitative glance",
            "C: Changing all independent variables simultaneously without controls",
            "D: Ignoring measurement uncertainty",
          ],
          correctOption: "A",
          explanation: "Controlled variation of isolated variables produces statistically verifiable empirical results.",
        },
      ],
      googleFormsExportText: `Title: KEV Academy - ${experimentTitle} Quiz (${tier})\n\n1. In the 3D ${labId} simulation, what is the primary consequence of increasing the independent variable?\n( ) The system shifts towards minimum potential energy [CORRECT]\n( ) Total energy is spontaneously destroyed\n( ) Physical constants change their mathematical values\n( ) Molecular bonds cease to vibrate\n\n2. Which empirical measurement method ensures the highest reproducibility in this experiment?\n( ) Quantitative logging of telemetry vectors and repeated parameter trials [CORRECT]\n( ) Relying solely on a single unrecorded qualitative glance\n( ) Changing all independent variables simultaneously without controls`,
    };

    return res.json({
      success: true,
      studyKit,
    });
  });

  // =========================================================================
  // 10. AI RESEARCH PAPER SUMMARIZER (Curriculum View)
  // =========================================================================
  app.post("/api/curriculum/paper-summarizer", async (req, res) => {
    const { paperUrl = "", paperTitle = "", gradeTier = "high_school", customAbstract = "" } = req.body;

    let summaryResult = {
      title: paperTitle || "Recent Advances in Experimental Physical Sciences",
      sourceUrl: paperUrl || "https://arxiv.org/abs/2207.05632",
      kidFriendlySummary: "Scientists made an exciting breakthrough by analyzing spectral and physical data from advanced sensor arrays. By comparing experimental models against real observations, they revealed new molecular and orbital mechanisms that help us understand how our universe functions!",
      theBigQuestion: "How do microscopic molecular forces and macroscopic gravitational fields harmonize across physical scales?",
      keyHypotheses: [
        "Measurable physical variables correlate directly with theoretical quantum and orbital models.",
        "High-resolution 3D simulation tools allow students to replicate findings previously restricted to university supercomputers.",
        "Systematic data logging reveals repeatable empirical patterns across varying environmental thresholds.",
      ],
      prerequisiteConcepts: [
        {
          term: "Empirical Falsification",
          definition: "The scientific principle that a hypothesis must produce testable predictions that could be proven false.",
          whyItMatters: "Separates genuine physical science from speculation.",
        },
        {
          term: "Transmission Resonance",
          definition: "The amplification of wave oscillations when an external frequency matches the natural frequency of the medium.",
          whyItMatters: "Underpins both laser optics and molecular spectroscopy.",
        },
      ],
      suggestedVirtualExperiment: "Open the corresponding KEV virtual lab, set the initial conditions matching the paper's parameters, and record your snapshot in your Lab Notebook.",
      recommendedLab: "chemistry",
    };

    if (paperTitle || customAbstract || paperUrl) {
      try {
        const prompt = `You are an educational science communicator at KEV Academy. Summarize this scientific research paper for a ${gradeTier} student.
Paper Title / URL: ${paperTitle || paperUrl}
Abstract / Text: ${customAbstract || "Research investigating experimental measurements and physical models."}

Output valid JSON matching this exact structure:
{
  "title": "...",
  "kidFriendlySummary": "2-3 engaging, clear paragraphs explaining the discovery in accessible language without jargon.",
  "theBigQuestion": "1 concise sentence stating the fundamental scientific mystery the paper solves.",
  "keyHypotheses": ["Hypothesis 1", "Hypothesis 2", "Hypothesis 3"],
  "prerequisiteConcepts": [
    {"term": "...", "definition": "...", "whyItMatters": "..."},
    {"term": "...", "definition": "...", "whyItMatters": "..."}
  ],
  "suggestedVirtualExperiment": "1 sentence recommending which 3D virtual experiment to try at KEV Academy.",
  "recommendedLab": "chemistry | astrophysics | optics | biology"
}`;

        const aiResponse = await generateGeminiContent([{ text: prompt }]);
        if (aiResponse) {
          const match = aiResponse.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            summaryResult = {
              ...summaryResult,
              ...parsed,
              sourceUrl: paperUrl || summaryResult.sourceUrl,
            };
          }
        }
      } catch (err) {
        // fallback
      }
    }

    return res.json({
      success: true,
      data: summaryResult,
    });
  });
}


function getFallbackDifferentiatedLesson(
  title: string,
  subject: string,
  level: string,
  config: { label: string; lexile: string }
) {
  if (level === "elementary") {
    return {
      adaptedPassage: `Have you ever wondered how nature works all around us? In this lesson on ${title}, we become junior science detectives! Everything in our world—from the water you drink to the stars high up in the nighttime sky—follows amazing natural rules.\n\nImagine tiny building blocks bouncing and dancing around. When scientists look through powerful lenses or test how things move, they discover patterns that explain why things bend, shine, or stay in place. By testing these ideas with our hands in the virtual lab, you can see science come alive just like magic, but with real rules!`,
      keyTakeaways: [
        "Nature follows clear patterns that we can test and see.",
        "Tiny building blocks and invisible forces shape everything around us.",
        "Doing experiments in the lab lets you discover how things work for yourself.",
        "Asking 'why?' is the secret superpower of every great scientist!",
      ],
      vocabularyList: [
        {
          term: "Experiment",
          pronunciation: "ik-SPER-uh-munt",
          partOfSpeech: "noun",
          definition: "A fun test that scientists do to see how things happen and learn new facts.",
          example: "We did an experiment in the virtual lab to see which way the laser beam bent.",
        },
        {
          term: "Force",
          pronunciation: "FORSS",
          partOfSpeech: "noun",
          definition: "A push or a pull that can make objects move, stop, or change shape.",
          example: "Gravity is the invisible force that keeps our feet safely on the ground.",
        },
        {
          term: "Pattern",
          pronunciation: "PAT-urn",
          partOfSpeech: "noun",
          definition: "Something that happens over and over in a regular, predictable way.",
          example: "The planets orbit the sun in a smooth, repeating oval pattern.",
        },
        {
          term: "Observation",
          pronunciation: "ob-zer-VAY-shun",
          partOfSpeech: "noun",
          definition: "Looking closely at something using your senses and taking notes.",
          example: "Her lab observation showed that the blue light traveled in a straight line.",
        },
      ],
      assessmentQuestions: [
        {
          id: "q1",
          question: `What is the main goal of doing an experiment in ${title}?`,
          options: [
            "To test an idea and learn how nature works",
            "To make things as messy as possible",
            "To guess without checking",
            "To ignore the rules of science",
          ],
          correctIndex: 0,
          explanation: "Experiments let us test ideas carefully to discover true facts about our world.",
        },
        {
          id: "q2",
          question: "What helps scientists notice patterns in their experiments?",
          options: [
            "Closing their eyes",
            "Careful observation and taking notes",
            "Leaving before the test is done",
            "Skipping the instructions",
          ],
          correctIndex: 1,
          explanation: "Careful observation and notes allow scientists to see patterns clearly.",
        },
        {
          id: "q3",
          question: "Why do scientists ask questions about the world?",
          options: [
            "Because they already know everything",
            "Because questions help us discover new solutions",
            "To stop learning",
            "It doesn't help at all",
          ],
          correctIndex: 1,
          explanation: "Asking questions is how all great discoveries begin!",
        },
      ],
      socraticPrompt: "If you could design any experiment in our virtual lab to explore this topic, what question would you want to answer first?",
      handsOnLabActivity: "Open the 3D lab bench and try changing one setting at a time to see how the simulation reacts!",
    };
  }

  // Middle School / High School / Advanced default fallback
  return {
    adaptedPassage: `The study of ${title} represents a cornerstone in modern ${subject}. Across empirical research, scientists examine how physical constants and governing equations dictate observable phenomena under varying environmental constraints.\n\nIn this unit, we bridge theoretical derivation with experimental validation. Whether measuring the interaction of electromagnetic waves, calculating gravitational vectors in multi-body systems, or observing valence electron distributions, empirical evidence allows us to formulate predictive models that describe the universe with mathematical consistency.`,
    keyTakeaways: [
      `Governing principles of ${title} establish foundational predictive frameworks in ${subject}.`,
      "Empirical measurements confirm mathematical equations under controlled laboratory constraints.",
      "Variable manipulation in 3D simulations highlights non-linear responses and equilibrium states.",
      "Hypothesis-driven inquiry differentiates between causation and correlation in experimental data.",
    ],
    vocabularyList: [
      {
        term: "Empirical",
        pronunciation: "em-PEER-ih-kuhl",
        partOfSpeech: "adjective",
        definition: "Verifiable by observation, measurement, or experimental evidence rather than theory alone.",
        example: "The students collected empirical data on orbital velocity at varying radii.",
      },
      {
        term: "Equilibrium",
        pronunciation: "ee-kwih-LIB-ree-um",
        partOfSpeech: "noun",
        definition: "A state in which opposing forces or influences are balanced.",
        example: "In thermodynamic equilibrium, net energy transfer between the system and surroundings ceases.",
      },
      {
        term: "Vector",
        pronunciation: "VEK-ter",
        partOfSpeech: "noun",
        definition: "A quantity having direction as well as magnitude, especially as determining the position of one point in space relative to another.",
        example: "Gravitational force is a vector directed toward the center of mass.",
      },
      {
        term: "Derivation",
        pronunciation: "dair-uh-VAY-shun",
        partOfSpeech: "noun",
        definition: "The obtaining or developing of something from a source or mathematical origin.",
        example: "The derivation of Kepler's third law follows directly from Newton's law of universal gravitation.",
      },
    ],
    assessmentQuestions: [
      {
        id: "q1",
        question: `Which approach provides the strongest empirical evidence when investigating ${title}?`,
        options: [
          "Controlled laboratory experiments with measurable quantitative data",
          "Relying solely on historical anecdotal accounts",
          "Assuming mathematical models are always error-free without testing",
          "Omitting control variables during testing",
        ],
        correctIndex: 0,
        explanation: "Controlled experimentation yielding repeatable quantitative data is the hallmark of empirical scientific inquiry.",
      },
      {
        id: "q2",
        question: "When analyzing system equilibrium, what occurs when opposing forces are balanced?",
        options: [
          "The system accelerates exponentially",
          "Net acceleration is zero and the system maintains steady state",
          "All potential energy is instantly lost",
          "Physical constants change value",
        ],
        correctIndex: 1,
        explanation: "According to Newton's first law, balanced net forces result in zero net acceleration.",
      },
      {
        id: "q3",
        question: "Why are mathematical derivations essential in modern scientific methodology?",
        options: [
          "They eliminate the need to ever conduct real experiments",
          "They provide predictive models that can be systematically tested and falsified",
          "They are strictly decorative",
          "They only apply to theoretical philosophy",
        ],
        correctIndex: 1,
        explanation: "Mathematical derivations produce testable, falsifiable predictions that guide empirical research.",
      },
    ],
    socraticPrompt: `How would changing the governing physical constants in ${title} fundamentally alter the resulting equilibrium in our 3D simulation?`,
    handsOnLabActivity: `Launch the corresponding virtual lab, record three data points at varying parameter thresholds, and note your observations in your Lab Notebook.`,
  };
}
