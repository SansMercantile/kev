/**
 * Explosion layout packers for the immersive viewers.
 *
 * packCells() is adapted from the human-atlas tool (MIT, (c) ashemag -
 * see docs/ATTRIBUTION-human-atlas.md): it packs part bounding boxes into
 * aspect-aware rows so the fully exploded anatomy reads as an inventory
 * grid ("anatomical inventory" in the tool).
 *
 * packProjected() follows the model-x-studio approach (technique adapted;
 * see docs/ATTRIBUTION-model-x.md): project each piece's world bounds onto
 * the overview camera plane and pack those 2D cards, so even neighbouring
 * trim fragments separate visually and the camera can frame the whole
 * layout from the overview direction.
 */

import * as THREE from 'three'

/**
 * Pack cards into rows within a target width derived from total area and
 * the viewport aspect. Cards: {id, width, height}.
 * @returns {{cells: Map<string,{x:number,y:number,width:number,height:number}>, width:number, height:number}}
 */
export function packCells(cards, aspect = 1) {
  const area = cards.reduce((n, c) => n + c.width * c.height, 0)
  const maxWidth = Math.max(0.3, ...cards.map((c) => c.width))
  const targetWidth = Math.max(maxWidth, Math.sqrt(area * Math.max(0.5, Math.min(1.5, aspect))) * 1.18)
  const sorted = [...cards].sort((a, b) => b.height - a.height || String(a.id).localeCompare(String(b.id)))
  const cells = new Map()
  let x = 0
  let y = 0
  let row = 0
  let usedWidth = 0
  for (const c of sorted) {
    if (x > 0 && x + c.width > targetWidth) {
      x = 0
      y += row
      row = 0
    }
    cells.set(c.id, { x: x + c.width / 2, y: -y - c.height / 2, width: c.width, height: c.height })
    x += c.width
    usedWidth = Math.max(usedWidth, x)
    row = Math.max(row, c.height)
  }
  const height = y + row
  cells.forEach((c) => {
    c.x -= usedWidth / 2
    c.y += height / 2
  })
  return { cells, width: usedWidth, height }
}

/**
 * Project piece bounds onto the overview plane and pack them.
 * @param {Array<{id:string, part:string, bounds:THREE.Box3}>} pieces
 * @param {THREE.Vector3} overviewDirection - normalized camera direction for the exploded overview
 * @param {THREE.Vector3} layoutCenter - world point the grid centers on
 * @param {number} minWidth
 */
export function packProjected(pieces, overviewDirection, layoutCenter, minWidth = 12) {
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), overviewDirection).normalize()
  const up = new THREE.Vector3().crossVectors(overviewDirection, right).normalize()
  const cards = pieces
    .map((piece) => {
      const { min, max } = piece.bounds
      let left = Infinity
      let bottom = Infinity
      let rightEdge = -Infinity
      let top = -Infinity
      for (const px of [min.x, max.x]) {
        for (const py of [min.y, max.y]) {
          for (const pz of [min.z, max.z]) {
            const corner = new THREE.Vector3(px, py, pz)
            const u = corner.dot(right)
            const v = corner.dot(up)
            left = Math.min(left, u)
            rightEdge = Math.max(rightEdge, u)
            bottom = Math.min(bottom, v)
            top = Math.max(top, v)
          }
        }
      }
      return {
        ...piece,
        width: Math.max(0.36, rightEdge - left) + 0.22,
        height: Math.max(0.3, top - bottom) + 0.22,
        center: piece.bounds.getCenter(new THREE.Vector3()),
      }
    })
    .sort((a, b) => String(a.part).localeCompare(String(b.part)) || b.height - a.height || String(a.id).localeCompare(String(b.id)))
  const area = cards.reduce((sum, c) => sum + c.width * c.height, 0)
  const width = Math.max(minWidth, Math.sqrt(area * 1.6))
  let x = 0
  let y = 0
  let rowHeight = 0
  const slots = cards.map((card) => {
    if (x && x + card.width > width) {
      x = 0
      y += rowHeight
      rowHeight = 0
    }
    const slot = { ...card, x: x + card.width / 2, y: y + card.height / 2 }
    x += card.width
    rowHeight = Math.max(rowHeight, card.height)
    return slot
  })
  const height = y + rowHeight
  const result = new Map(
    slots.map((slot) => {
      const center = layoutCenter.clone().addScaledVector(right, slot.x - width / 2).addScaledVector(up, height / 2 - slot.y)
      return [slot.id, { translation: center.clone().sub(slot.center), center, width: slot.width, height: slot.height }]
    })
  )
  return { pieces: result, width, height }
}
