// Human anatomy system catalog (ported from
// tools/human-atlas/app/anatomy.ts). The 15 display systems, their colors,
// and plain-language descriptions plus per-organ explanations. Shared by the
// Human Atlas (AnatomyLab) and Immersive Lab anatomy subject so both surfaces
// teach the same vocabulary.

export const ANATOMY_SYSTEMS = [
  { id: 'skeletal', name: 'Skeleton', color: '#e2d9ba', description: 'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.' },
  { id: 'muscular', name: 'Muscles', color: '#a85b50', description: 'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.' },
  { id: 'cardiac', name: 'Heart', color: '#b96760', description: 'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.' },
  { id: 'sensory', name: 'Sensory organs', color: '#b0c8ce', description: 'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.' },
  { id: 'arterial', name: 'Arteries', color: '#c05245', description: 'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.' },
  { id: 'venous', name: 'Veins', color: '#527c9f', description: 'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.' },
  { id: 'nervous', name: 'Nervous system', color: '#d8b565', description: 'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.' },
  { id: 'respiratory', name: 'Respiratory', color: '#b98991', description: 'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.' },
  { id: 'digestive', name: 'Digestive', color: '#b8916b', description: 'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.' },
  { id: 'urinary', name: 'Urinary', color: '#b47961', description: 'The kidneys filter blood and regulate fluid, electrolyte, and acid-base balance. Urine travels through the ureters to the bladder and exits through the urethra.' },
  { id: 'lymphatic', name: 'Lymphatic', color: '#879f7c', description: 'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.' },
  { id: 'endocrine', name: 'Endocrine', color: '#c5a09a', description: 'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.' },
  { id: 'reproductive', name: 'Reproductive', color: '#bda098', description: 'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.' },
  { id: 'integumentary', name: 'Body surface', color: '#ba9b7d', description: 'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.' },
  { id: 'connective', name: 'Connective tissue', color: '#aec3bb', description: 'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.' },
]

export const ANATOMY_EXPLANATIONS = {
  heart: 'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
  liver: 'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
  brain: 'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
  stomach: 'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
  spleen: 'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
  pancreas: 'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
  'urinary bladder': 'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
  trachea: 'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
  diaphragm: 'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
}

export function anatomyExplanation(name, systemId) {
  if (!name) return ''
  const hit = ANATOMY_EXPLANATIONS[String(name).toLowerCase()]
  if (hit) return hit
  const system = ANATOMY_SYSTEMS.find((s) => s.id === systemId)
  return system ? system.description : ''
}

// Representative teaching geometry per system: [name, position, size, description].
// The full human-atlas tool (tools/human-atlas, 2,234 meshes, CC BY 4.0
// BodyParts3D) is the reference; these boxes keep the lightweight viewers
// fast while teaching the same 15-system vocabulary.
export const ANATOMY_PARTS = {
  skeletal: [
    ['Skull', [0, 3.45, 0], [0.62, 0.72, 0.62], 'Cranium and facial bones protect the brain.'],
    ['Spine', [0, 1.7, 0], [0.25, 2.4, 0.25], 'The vertebral column supports the body and protects the spinal cord.'],
    ['Rib cage', [0, 2.25, 0], [1.35, 1.1, 0.55], 'The rib cage protects the heart and lungs.'],
    ['Pelvis', [0, 0.15, 0], [1.2, 0.55, 0.55], 'The pelvis transfers weight to the lower limbs.'],
    ['Left femur', [-0.45, -0.95, 0], [0.28, 1.75, 0.28], 'The femur is the longest and strongest bone in the human body.'],
    ['Right femur', [0.45, -0.95, 0], [0.28, 1.75, 0.28], 'The femur is the longest and strongest bone in the human body.'],
  ],
  muscular: [
    ['Pectoral muscles', [0, 2.35, 0.36], [1.35, 0.55, 0.3], 'The pectorals move and stabilize the shoulder and upper arm.'],
    ['Abdominal wall', [0, 1.35, 0.39], [0.95, 1.0, 0.25], 'The abdominal wall supports posture and protects internal organs.'],
    ['Left biceps', [-0.82, 1.85, 0], [0.25, 0.85, 0.25], 'The biceps flex the elbow and rotate the forearm.'],
    ['Right biceps', [0.82, 1.85, 0], [0.25, 0.85, 0.25], 'The biceps flex the elbow and rotate the forearm.'],
    ['Left quadriceps', [-0.42, -0.85, 0.2], [0.42, 1.55, 0.36], 'The quadriceps extend the knee and stabilize the leg.'],
    ['Right quadriceps', [0.42, -0.85, 0.2], [0.42, 1.55, 0.36], 'The quadriceps extend the knee and stabilize the leg.'],
  ],
  cardiac: [
    ['Heart', [0, 1.95, 0.48], [0.48, 0.55, 0.35], ANATOMY_EXPLANATIONS.heart],
    ['Aorta', [0, 2.55, 0.2], [0.16, 1.25, 0.16], 'The aorta carries oxygenated blood from the left ventricle to the body.'],
    ['Left ventricle', [-0.15, 1.8, 0.45], [0.25, 0.4, 0.2], 'The left ventricle is the strongest chamber; it pumps oxygenated blood into the aorta.'],
  ],
  sensory: [
    ['Left eye', [-0.18, 3.5, 0.42], [0.16, 0.16, 0.14], 'The eye focuses light onto the retina, where photoreceptors convert it into neural signals.'],
    ['Right eye', [0.18, 3.5, 0.42], [0.16, 0.16, 0.14], 'The eye focuses light onto the retina, where photoreceptors convert it into neural signals.'],
    ['Optic nerve', [0, 3.45, 0.2], [0.1, 0.1, 0.4], 'The optic nerve carries visual signals from each retina to the brain.'],
    ['Inner ear', [0.32, 3.5, 0], [0.12, 0.12, 0.12], 'The inner ear detects sound and head motion for hearing and balance.'],
  ],
  arterial: [
    ['Aortic arch', [0, 2.6, 0.2], [0.5, 0.18, 0.18], 'The aortic arch distributes blood to the head, arms, and descending aorta.'],
    ['Carotid artery', [-0.25, 3.0, 0.15], [0.09, 0.7, 0.09], 'The carotid arteries supply oxygenated blood to the head and brain.'],
    ['Femoral artery', [-0.28, 0.15, 0.18], [0.1, 2.3, 0.1], 'The femoral artery supplies the lower limb.'],
  ],
  venous: [
    ['Vena cava', [0.2, 2.0, 0.1], [0.14, 1.6, 0.14], 'The venae cavae return deoxygenated blood to the right atrium.'],
    ['Jugular vein', [0.25, 3.0, 0.12], [0.08, 0.7, 0.08], 'The jugular veins drain blood from the head and neck.'],
    ['Femoral vein', [0.28, 0.15, 0.18], [0.1, 2.3, 0.1], 'The femoral vein returns blood from the lower limb.'],
  ],
  nervous: [
    ['Brain', [0, 3.5, 0], [0.68, 0.62, 0.62], ANATOMY_EXPLANATIONS.brain],
    ['Spinal cord', [0, 1.75, 0.28], [0.12, 2.6, 0.12], 'The spinal cord carries signals between the brain and peripheral nerves.'],
    ['Left radial nerve', [-0.75, 1.4, 0.28], [0.08, 1.45, 0.08], 'The radial nerve supports sensation and movement in the upper limb.'],
    ['Right radial nerve', [0.75, 1.4, 0.28], [0.08, 1.45, 0.08], 'The radial nerve supports sensation and movement in the upper limb.'],
    ['Left sciatic nerve', [-0.3, -0.7, 0.28], [0.1, 1.9, 0.1], 'The sciatic nerve is the major nerve of the lower limb.'],
    ['Right sciatic nerve', [0.3, -0.7, 0.28], [0.1, 1.9, 0.1], 'The sciatic nerve is the major nerve of the lower limb.'],
  ],
  respiratory: [
    ['Trachea', [0, 2.95, 0.25], [0.16, 0.7, 0.16], ANATOMY_EXPLANATIONS.trachea],
    ['Left lung', [-0.45, 2.2, 0.1], [0.5, 0.8, 0.4], 'The lungs exchange oxygen and carbon dioxide across tiny air sacs.'],
    ['Right lung', [0.45, 2.2, 0.1], [0.5, 0.8, 0.4], 'The lungs exchange oxygen and carbon dioxide across tiny air sacs.'],
    ['Diaphragm', [0, 1.55, 0], [1.2, 0.12, 0.6], ANATOMY_EXPLANATIONS.diaphragm],
  ],
  digestive: [
    ['Liver', [0.3, 1.5, 0.25], [0.8, 0.45, 0.4], ANATOMY_EXPLANATIONS.liver],
    ['Stomach', [-0.3, 1.35, 0.3], [0.45, 0.5, 0.3], ANATOMY_EXPLANATIONS.stomach],
    ['Pancreas', [0, 1.15, 0.15], [0.55, 0.18, 0.2], ANATOMY_EXPLANATIONS.pancreas],
    ['Small intestine', [0, 0.75, 0.25], [0.85, 0.5, 0.35], 'The small intestine absorbs nutrients through folded walls rich in blood vessels.'],
  ],
  urinary: [
    ['Left kidney', [-0.35, 1.5, -0.15], [0.25, 0.4, 0.2], 'The kidneys filter blood and regulate fluid and electrolyte balance.'],
    ['Right kidney', [0.35, 1.5, -0.15], [0.25, 0.4, 0.2], 'The kidneys filter blood and regulate fluid and electrolyte balance.'],
    ['Urinary bladder', [0, 0.35, 0.25], [0.4, 0.35, 0.3], ANATOMY_EXPLANATIONS['urinary bladder']],
  ],
  lymphatic: [
    ['Spleen', [-0.55, 1.6, 0.1], [0.3, 0.35, 0.25], ANATOMY_EXPLANATIONS.spleen],
    ['Thymus', [0, 2.6, 0.3], [0.3, 0.25, 0.15], 'The thymus trains T-cells that coordinate immune responses.'],
    ['Left inguinal node', [-0.35, 0.0, 0.3], [0.12, 0.12, 0.12], 'Lymph nodes filter lymph and trap pathogens for immune cells.'],
  ],
  endocrine: [
    ['Thyroid', [0, 3.15, 0.3], [0.25, 0.15, 0.12], 'The thyroid releases hormones that set the metabolic rate.'],
    ['Pituitary gland', [0, 3.4, 0.1], [0.12, 0.1, 0.1], 'The pituitary directs other glands by releasing tropic hormones.'],
    ['Adrenal gland', [0.35, 1.75, -0.1], [0.14, 0.12, 0.12], 'Adrenal glands release cortisol and adrenaline during stress.'],
  ],
  reproductive: [
    ['Left testis', [-0.12, -0.35, 0.15], [0.14, 0.18, 0.14], 'The testes produce sperm and testosterone.'],
    ['Right testis', [0.12, -0.35, 0.15], [0.14, 0.18, 0.14], 'The testes produce sperm and testosterone.'],
    ['Prostate', [0, 0.0, 0.05], [0.16, 0.14, 0.14], 'The prostate contributes fluid to semen.'],
  ],
  integumentary: [
    ['Scalp skin', [0, 3.62, 0], [0.7, 0.12, 0.7], 'Skin forms a protective barrier and contributes to sensation and temperature regulation.'],
    ['Abdominal skin', [0, 1.2, 0.52], [1.0, 0.8, 0.06], 'Skin forms a protective barrier and contributes to sensation and temperature regulation.'],
    ['Forearm skin', [-0.82, 1.1, 0.1], [0.22, 0.6, 0.22], 'Skin forms a protective barrier and contributes to sensation and temperature regulation.'],
  ],
  connective: [
    ['Intervertebral disc', [0, 2.35, -0.05], [0.3, 0.12, 0.2], 'Cartilage discs cushion the vertebrae and distribute spinal loads.'],
    ['Left meniscus', [-0.45, -0.1, 0.1], [0.3, 0.1, 0.3], 'Menisci stabilize the knee and spread load across the joint.'],
    ['Achilles tendon', [-0.45, -1.7, -0.15], [0.12, 0.5, 0.12], 'The Achilles tendon links calf muscle to the heel for walking and running.'],
  ],
}
