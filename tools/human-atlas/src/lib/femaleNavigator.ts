

export interface FemaleSystem {
  id: string;
  label: string;
  icon: string;
  overview: string;
  organs: FemaleOrgan[];
}

/** Map each system ID in the male atlas to a human-readable female label. */
const SYSTEM_META: Record<string, { label: string; icon: string; overview: string }> = {
  sensory: {
    id: "sensory",
    label: "Sensory organs",
    icon: "👁",
    overview:
      "Eyes, retina, and conjunctiva — light sensing and visual processing.",
  },
  reproductive: {
    id: "reproductive",
    name: "Female reproductive system",
    icon: "🌸",
    overview:
      "Ovaries, fallopian tubes, uterus, cervix, vagina, and mammary glands — the complete female reproductive tract.",
  },
  nervous: {
    name: "Nervous system",
    icon: "🧠",
    overview: "Brain, spinal cord, and peripheral nerves.",
  },
  endocrine: {
    name: "Endocrine system",
    icon: "⚗️",
    overview:
      "Hormone-producing glands: thyroid, adrenals, pituitary, and others.",
  },
  cardiovascular: {
    name: "Cardiovascular system",
    icon: "❤️",
    overview:
      "Heart, valves, and the major vessels that move blood through the body.",
  },
  digestive: {
    id: "digestive",
    name: "Digestive system",
    icon: "🫁",
    overview:
      "The digestive tract from mouth to anus, plus liver, pancreas, and gallbladder.",
  },
  urinary: {
    id: "urinary",
    name: "Urinary system",
    icon: "💧",
    overview: "Kidneys, ureters, bladder, and urethra — blood filtration and urine production.",
  },
  respiratory: {
    name: "Respiratory system",
    icon: "🫁",
    overview: "Trachea, bronchi, and the lungs where gas exchange happens.",
  },
  lymphatic: {
    name: "Lymphatic system",
    icon: "🛡️",
    overview: "Lymph nodes, tonsils, and vessels that support immunity.",
  },
  muscular: {
    name: "Muscular system",
    icon: "💪",
    overview: "Skeletal muscles that move the body.",
  },
  skeletal: {
    name: "Skeletal system",
    icon: "🦴",
    overview: "Bones, cartilage, and the joints that connect them.",
  },
  arterial: {
    name: "Arterial system",
    icon: "🩸",
    overview: "Major arteries and the arterial supply network.",
  },
  venous: {
    name: "Venous system",
    icon: "🩸",
    overview: "Major veins that return blood to the heart.",
  },
  integumentary: {
    name: "Integumentary system",
    icon: "🧴",
    overview: "Skin, hair, nails, and their associated glands.",
  },
};

/**
 * Group the male-atlas parts into named female systems, preserving the
 * named-organ records and their blurbs.
 */
export function buildFemaleNavigator(atlas: {
  parts: Array<{
    id: string;
    name: string;
    system: string;
    chunk: number;
    bounds: [number, number, number][];
  }>;
}): { systems: Array<{ id: string; label: string; icon: string; overview: string; organs: { id: string; name: string; system: string; chunk: number; bounds: [number, number, number][] }[] }> } {
  const bySystem = new Map<string, { id: string; label: string; icon: string; overview: string; organs: Array<{ id: string; name: string; system: string; chunk: number; bounds: [number, number, number][] }> }>();

  for (const part of atlas.parts) {
    const sys = part.system;
    if (!bySystem.has(sys)) {
      const meta = SYSTEM_META[sys] ?? { label: sys, icon: "🔬", overview: "Anatomical structure" };
      const group = {
        id: sys,
        label: meta.name,
        icon: sys === "reproductive" ? "🌸" : meta.icon,
        overview: meta.overview,
        organs: [] as typeof bySystem[keyof typeof bySystem],
      };
      bySystem.set(sys, grp);
    }
    const group = bySystem.get(sys)!;
    group.organs.push({
      id: part.id,
      name: part.name,
      system: part.system,
      chunk: part.chunk,
      bounds: part.bounds,
    });
  }

  // Ensure the female-specific groups are always present even if the source
  // atlas lacks a separate entry for them (they are subsumed by reproductive).
  const required = ["reproductive", "sensory", "urinary", "digestive"];
  for (const id of required) {
    if (!bySystem.has(id)) {
      const meta = SYSTEM_META[id] ?? { name: id, icon: "🔬", overview: "Anatomical structure" };
      bySystem.set(id, {
        id,
        name: meta.name,
        icon: meta.icon,
        overview: meta.overview,
        parts: [],
      });
    }
  }

  return { systems: Array.from(bySystem.values()) };
}

/** Convenience: flatten the navigator into a single ordered list of organs
 * grouped by system, preserving the system's display order. */
export function flattenFemaleNav(nav: { systems: { name: string; id: string; icon: string; overview: string; parts: { id: string; name: string }[] }[] }) {
  return nav.systems.flatMap((sys) =>
    sys.parts.map((p) => ({
      systemId: sys.id,
      systemName: sys.name,
      systemIcon: sys.icon,
      systemOverview: sys.overview,
      id: p.id,
      name: p.name,
    }))
  );
}

/** Stable display names for the system IDs used by the male atlas. */
const SYSTEM_META: Record<string, { name: string; icon: string; overview: string }> = {
  nervous: {
    name: "Nervous system",
    icon: "🧠",
    overview: "The brain, spinal cord, and peripheral nerves that coordinate the body.",
  },
  sensory: {
    name: "Sensory organs",
    icon: "👁️",
    overview: "Eyes, retina, and conjunctiva for vision and light processing.",
  },
  reproductive: {
    name: "Female reproductive system",
    icon: "🌸",
    overview: "Ovaries, fallopian tubes, uterus, cervix, and associated structures.",
  },
  digestive: {
    name: "Digestive system",
    icon: "🫁",
    overview: "Mouth, esophagus, stomach, intestines, liver, pancreas, and gallbladder.",
  },
  urinary: {
    name: "Urinary system",
    icon: "💧",
    overview: "Kidneys, ureters, bladder, and urinary tract.",
  },
  endocrine: {
    name: "Endocrine system",
    icon: "⚗️",
    overview: "Thyroid, adrenals, pituitary, and other hormone-producing glands.",
  },
  cardiovascular: {
    name: "Cardiovascular system",
    icon: "❤️",
    overview: "Heart, valves, and the vessels that move blood through the body.",
  },
  lymphatic: {
    name: "Lymphatic system",
    icon: "🛡️",
    overview: "Lymph nodes, tonsils, and vessels that support immunity.",
  },
  muscular: {
    name: "Muscular system",
    icon: "💪",
    overview: "Skeletal muscles and their attachments.",
  },
  skeletal: {
    name: "Skeletal system",
    icon: "🦴",
    overview: "Bones, cartilage, and the joints that connect them.",
  },
  arterial: {
    name: "Arterial system",
    icon: "🩸",
    overview: "Major arteries that carry oxygenated blood from the heart.",
  },
  venous: {
    name: "Venous system",
    icon: "🩸",
    overview: "Major veins that return blood to the heart.",
  },
  integumentary: {
    name: "Integumentary system",
    icon: "🧴",
    overview: "Skin, hair, nails, and their associated glands.",
  },
};
