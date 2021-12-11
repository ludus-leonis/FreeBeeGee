/**
 * @file Utility functions that operate on (cached) table data, e.g. searching
 *       pieces. Does not do any API calls, only operates on pre-downloaded
 *       data. Does not know about DOM/nodes.
 * @module
 * @copyright 2021 Markus Leupold-Löwenthal
 * @license This file is part of FreeBeeGee.
 *
 * FreeBeeGee is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  getRoom,
  getTemplate,
  getLibrary,
  getTable,
  getTableNo
} from '../../../state/index.mjs'

import {
  clamp,
  snapGrid,
  snapHex,
  intersect,
  getDimensionsRotated
} from '../../../lib/utils.mjs'

export const assetTypes = [
  'tile',
  'token',
  'overlay',
  'other',
  'tag'
]

export const TYPE_SQUARE = 'grid-square'
export const TYPE_HEX = 'grid-hex'

export const stickyNoteColors = [
  { name: 'yellow' },
  { name: 'orange' },
  { name: 'green' },
  { name: 'blue' },
  { name: 'pink' }
]

export const LAYERS = [ // reverse order
  'tile',
  'overlay',
  'note',
  'token',
  'other'
]

function layerToName (layer) {
  return LAYERS[layer - 1]
}

export function nameToLayer (name) {
  return LAYERS.indexOf(name) + 1
}

/**
 * Find a piece by ID.
 *
 * @param {String} id ID to lookup.
 * @param {Number} no Table number, defaults to current one.
 * @return {Object} Piece, or null if not found.
 */
export function findPiece (id, no = getTableNo()) {
  for (const piece of getTable(no)) {
    if (piece.id === id) {
      return piece
    }
  }

  return null
}

/**
 * Find an asset by ID.
 *
 * @param {String} id ID to lookup.
 * @param {String} layer Optional layer to limit/speed up search.
 * @return {Object} Asset, or null if not found.
 */
export function findAsset (id, layer = 'any') {
  const library = getLibrary()

  for (const assetType of assetTypes) {
    if (layer === assetType || layer === 'any') {
      for (const asset of library[assetType]) {
        if (asset.id === id) return asset
      }
    }
  }

  return null
}

/**
 * Find an asset by ID.
 *
 * @param {String} name Alias to lookup.
 * @param {String} layer Optional layer to limit/speed up search.
 * @return {Object} First found asset with the given name.
 */
export function findAssetByAlias (name, layer = 'any') {
  const library = getLibrary()

  for (const assetType of assetTypes) {
    if (layer === assetType || layer === 'any') {
      for (const asset of library[assetType]) {
        if (asset.name === name) return asset
      }
    }
  }

  return null
}

/**
 * Get the URL for an asset media.
 *
 * @param {Object} asset Asset to get URL for.
 * @param {Number} side Side/media to get, -1 = base.
 * @return {String} URL to be used in url() or img.src.
 */
export function getAssetURL (asset, side) {
  if (side === -1) {
    return `api/data/rooms/${getRoom().name}/assets/${asset.type}/${asset.base}`
  } else {
    return `api/data/rooms/${getRoom().name}/assets/${asset.type}/${asset.media[side]}`
  }
}

/**
 * Get proper top-left coordinates for a piece.
 *
 * Takes into account that rotated pieces have a different offset to it's center
 * than the original as CSS 'transform: rotate()' rotates round the original center.
 *
 * @param {Object} piece A game piece to operate on.
 * @param {Number} x X coordinate of supposed center (defaults to piece.x)
 * @param {Number} y Y coordinate of supposed center (defaults to piece.y)
 * @return {Object} CSS-ready px String as { top: '', left: ''}.
 **/
export function getTopLeftPx (piece, x = piece.x, y = piece.y) {
  return {
    left: x - piece._meta.widthPx / 2 - piece._meta.originOffsetXPx + 'px',
    top: y - piece._meta.heightPx / 2 - piece._meta.originOffsetYPx + 'px'
  }
}

/**
 * Get the area in px a piece covers.
 *
 * @param {Object} piece A game piece to operate on.
 * @return {Object} Bounds as { top, left, bottom, right}.
 */
export function getPieceBounds (piece) {
  return {
    left: piece.x - piece._meta.widthPx / 2,
    right: piece.x + piece._meta.widthPx / 2 - 1,
    top: piece.y - piece._meta.heightPx / 2,
    bottom: piece.y + piece._meta.heightPx / 2 - 1
  }
}

/**
 * Find all pieces within a grid area.
 *
 * @param {Object} rect Rectangle object, containing top/left/bottom/right.
 * @param {String} layer Optional name of layer to search within. Defaults to 'all'.
 * @param {Number} no Table number, defaults to current one.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
export function findPiecesWithin (rect, layer = 'all', no = getTableNo()) {
  const pieces = []

  for (const piece of getTable(no)) {
    if (piece.l === layer || layer === 'all') {
      if (intersect(rect, getPieceBounds(piece))) {
        pieces.push(piece)
      }
    }
  }

  return pieces
}

/**
 * Find all pieces that are expired.
 *
 * @param {Number} no Table number, defaults to current one.
 * @returns {Array} Array of nodes/pieces that are expired.
 */
export function findExpiredPieces (no = getTableNo()) {
  const pieces = []

  const now = new Date()
  for (const piece of getTable(no)) {
    if (piece._expires && piece._expires <= now) {
      pieces.push(piece)
    }
  }

  return pieces
}

/**
 * Add default values to all properties that the API might omit.
 *
 * @param {Object} piece Data object to populate.
 * @param {Object} headers Optional headers object (for date checking).
 * @return {Array} Pieces array for chaining.
 */
export function populatePieceDefaults (piece, headers = null) {
  piece.l = layerToName(piece.l ?? 0)
  piece.w = piece.w ?? 1
  piece.h = piece.h ?? 1
  piece.s = piece.s ?? 0
  piece.c = piece.c ?? [0]
  piece.r = piece.r ?? 0
  piece.n = piece.n ?? 0
  piece.h = piece.h < 0 ? piece.w : piece.h
  piece.t = piece.t ?? []
  piece.b = piece.b ?? []

  // add client-side meta information for piece
  piece._meta = {}
  const template = getTemplate()
  piece._meta.originWidthPx = piece.w * template.gridSize
  piece._meta.originHeightPx = piece.h * template.gridSize
  const rect = getDimensionsRotated(piece._meta.originWidthPx, piece._meta.originHeightPx, piece.r)
  piece._meta.widthPx = rect.w
  piece._meta.heightPx = rect.h
  piece._meta.originOffsetXPx = (piece._meta.originWidthPx - rect.w) / 2
  piece._meta.originOffsetYPx = (piece._meta.originHeightPx - rect.h) / 2

  // add client-side meta information for asset
  const asset = findAsset(piece.a)
  if (asset) {
    const bgImage = getAssetURL(asset, asset.base ? -1 : piece.s)
    if (bgImage.match(/(png|svg)$/i)) piece._meta.mask = bgImage
    piece._meta.sides = asset.media.length ?? 1
    if (asset.id === 'ffffffffffffffff') {
      piece._meta.feature = 'POINTER'
    } else {
      switch (asset.name) {
        case 'dicemat':
          piece._meta.feature = 'DICEMAT'
          break
        case 'discard':
          piece._meta.feature = 'DISCARD'
          break
      }
    }
  }

  // header/expires information
  if (piece.expires && headers) {
    piece._expires = new Date()
    piece._expires.setSeconds(piece._expires.getSeconds() + piece.expires - Number(headers.get('servertime')))
  }

  return piece
}

/**
 * Add default values to all properties that the API might omit.
 *
 * Also tosses out expired pieces.
 *
 * @param {Array} pieces Data objects to populate.
 * @param {Object} headers Optional headers object (for date checking).
 * @return {Array} Pieces array for chaining.
 */
export function populatePiecesDefaults (pieces, headers = null) {
  const nonExpired = []
  const now = new Date()
  for (const piece of pieces) {
    populatePieceDefaults(piece, headers)
    if (piece._expires) {
      if (piece._expires && piece._expires > now) {
        nonExpired.push(piece)
      }
    } else {
      nonExpired.push(piece)
    }
  }
  return nonExpired
}

/**
 * Determine the lowest z-index in use by the pieces in a layer.
 *
 * @param {String} layer Name of a layer, e.g. 'tile'.
 * @param {Object} area Bounding rect in px to check pieces at least partly within.
 * @return {Number} Lowest CSS z-index, or 0 if layer is empty.
 */
export function getMinZ (layer, area = {
  left: 0,
  top: 0,
  right: Number.MAX_VALUE,
  bottom: Number.MAX_VALUE
}) {
  let minZ = Number.MAX_VALUE
  for (const piece of findPiecesWithin(area, layer)) {
    if (piece.z < minZ) {
      minZ = piece.z
    }
  }
  return minZ === Number.MAX_VALUE ? 0 : minZ // start at 0
}

/**
 * Sort pieces by their Z value.
 *
 * @param {Array} pieces Array of pieces to sort.
 * @return {Array} Given array, with sorted Z values (highest first).
 */
export function sortZ (pieces) {
  return pieces.sort((a, b) => b.z - a.z)
}

/**
 * Determine the highest z-index in use by the pieces in a layer.
 *
 * @param {String} layer Name of a layer, e.g. 'tile'.
 * @param {Object} area Bounding rect in px to check pieces at least partly within.
 * @return {Number} Highest CSS z-index, or 0 if area in layer is empty.
 */
export function getMaxZ (layer, area = {
  left: 0,
  top: 0,
  right: Number.MAX_VALUE,
  bottom: Number.MAX_VALUE
}) {
  let maxZ = Number.MIN_VALUE
  for (const piece of findPiecesWithin(area, layer)) {
    if (piece.z > maxZ) {
      maxZ = piece.z
    }
  }

  return maxZ === Number.MIN_VALUE ? 0 : maxZ // start at 0
}

/**
 * Determine rectancle all items on the room are within in px.
 *
 * @param {Number} no Table number to work on, defaults to current.
 * @return {Object} Object with top/left/bottom/right/width/height in px of main content.
 */
export function getContentRect (no = getTableNo()) {
  const rect = {
    left: Number.MAX_VALUE,
    top: Number.MAX_VALUE,
    right: Number.MIN_VALUE,
    bottom: Number.MIN_VALUE
  }
  const tableData = getTable(no)

  // provide default for empty rooms
  if (!tableData || tableData.length < 1) {
    return {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0
    }
  }

  // calculate values for non-empty rooms
  for (const piece of tableData) {
    const left = piece.x - piece._meta.widthPx / 2
    const top = piece.y - piece._meta.heightPx / 2
    const right = piece.x + piece._meta.widthPx / 2 - 1
    const bottom = piece.y + piece._meta.heightPx / 2 - 1

    rect.left = rect.left < left ? rect.left : left
    rect.top = rect.top < top ? rect.top : top
    rect.right = rect.right > right ? rect.right : right
    rect.bottom = rect.bottom > bottom ? rect.bottom : bottom
    rect.width = rect.right - rect.left + 1
    rect.height = rect.bottom - rect.top + 1
  }

  return rect
}

/**
 * Create a new piece from an asset.
 *
 * @param {Number} assetId ID of asset.
 * @param {Number} x X-position (px).
 * @param {Number} y Y-position (px).
 * @return {Object} Piece data object.
 */
export function createPieceFromAsset (assetId, x = 0, y = 0) {
  const asset = findAsset(assetId)
  const xy = snap(x, y)

  return populatePieceDefaults(clampToTableSize({
    a: asset.id,
    l: nameToLayer(asset.type),
    w: asset.w,
    h: asset.h,
    x: xy.x,
    y: xy.y,
    z: getMaxZ(asset.layer) + 1
  }))
}

/**
 * Make sure a piece is fully on the room by clipping x/y based on it's size.
 *
 * @param {Object} item Piece to clamp.
 * @return {Object} Clamped piece.
 */
export function clampToTableSize (piece) {
  const template = getTemplate()
  piece.x = clamp(0, piece.x, (template.gridWidth - piece.w) * template.gridSize)
  piece.y = clamp(0, piece.y, (template.gridHeight - piece.h) * template.gridSize)
  return piece
}

/**
 * Snap a coordinate to the closest hex position / grid.
 *
 * @param {Number} x X-coordinate to snap.
 * @param {Number} y Y-coordiante to snap.
 * @param {Number} lod Optional level of detail for snapping.
 *                     1 = centers,
 *                     2 = centers + corners,
 *                     3 = centers + corners + sides (default)
 * @return {Object} Closest grid vertex to original x/y as {x, y}.
 */
export function snap (x, y, lod = 3) {
  const template = getTemplate()
  if (template.snap === false) {
    return snapGrid(x, y, 8, 3) // snap to 4px
  }
  if (template.type === TYPE_HEX) {
    return snapHex(x, y, template.gridSize, lod)
  }
  return snapGrid(x, y, template.gridSize, lod)
}

/**
 * Calculate the center of the setup on the room.
 *
 * Iterates over all pieces and averages their centers. Empty tables are considered
 * to be centered on the whole table.
 *
 * @return {Object} Object with x and y.
 */
export function getSetupCenter (no = getTableNo()) {
  const template = getTemplate()
  const rect = getContentRect(no)

  // use table center for empty tables
  if (rect.bottom <= 0 && rect.right <= 0) {
    return {
      x: (template.gridSize * template.gridWidth) / 2,
      y: (template.gridSize * template.gridHeight) / 2
    }
  }

  // calculate setup center otherwise
  return {
    x: rect.left + (rect.right - rect.left) / 2,
    y: rect.top + (rect.bottom - rect.top) / 2
  }
}

/**
 * Extract parts (group, name, size, etc.) from an asset filename.
 *
 * @param {String} assetName Asset filename.
 * @return {Object} Parsed elements.
 */
export function splitAssetFilename (assetName) {
  const data = {
    name: 'unknown',
    w: 1,
    h: 1,
    s: 1,
    bg: '808080'
  }
  let match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.([a-fA-F0-9]{6}|transparent|piece)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.s = Number(match[4])
    data.bg = match[5]
    return data
  }
  match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.s = Number(match[4])
    return data
  }
  match = assetName.match(/^(.*)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    return data
  }
  return data
}
