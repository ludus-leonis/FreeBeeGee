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
  intersect
} from '../../../lib/utils.mjs'

export const assetTypes = [
  'tile',
  'token',
  'overlay',
  'other',
  'tag'
]

export const stickyNoteColors = [
  { name: 'yellow' },
  { name: 'orange' },
  { name: 'green' },
  { name: 'blue' },
  { name: 'pink' }
]

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
 * @param {String} alias Alias to lookup.
 * @param {String} layer Optional layer to limit/speed up search.
 * @return {Object} First found asset with the given alias.
 */
export function findAssetByAlias (alias, layer = 'any') {
  const library = getLibrary()

  for (const assetType of assetTypes) {
    if (layer === assetType || layer === 'any') {
      for (const asset of library[assetType]) {
        if (asset.alias === alias) return asset
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
 * Find all pieces within a grid area.
 *
 * @param {Object} rect Rectangle object, containing top/left/bottom/right.
 * @param {String} layer Optional name of layer to search within. Defaults to 'all'.
 * @param {Number} no Table number, defaults to current one.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
export function findPiecesWithin (rect, layer = 'all', no = getTableNo()) {
  const template = getTemplate()
  const pieces = []

  for (const piece of getTable(no)) {
    if (piece.layer === layer || layer === 'all') {
      if (intersect(rect, {
        left: piece.x,
        top: piece.y,
        right: piece.x + (piece.r === '0' || piece.r === '180' ? piece.w * template.gridSize : piece.h * template.gridSize) - 1,
        bottom: piece.y + (piece.r === '0' || piece.r === '180' ? piece.h * template.gridSize : piece.w * template.gridSize) - 1
      })) {
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
 * Create a new piece from an asset.
 *
 * @param {String} id Asset ID.
 * @return {Object} Piece generated from the asset.
 */
export function assetToPiece (id) {
  const asset = findAsset(id) ?? createInvalidAsset()

  return populatePieceDefaults({
    asset: asset.id,
    layer: asset.type,
    w: asset.w,
    h: asset.h,
    x: 0,
    y: 0,
    z: 0,
    bg: asset.bg
  })
}

/**
 * Add default values to all properties that the API might omit.
 *
 * @param {Object} piece Data object to populate.
 * @param {Object} headers Optional headers object (for date checking).
 * @return {Array} Pieces array for chaining.
 */
export function populatePieceDefaults (piece, headers = null) {
  piece.w = piece.w ?? 1
  piece.h = piece.h ?? 1
  piece.side = piece.side ?? 0
  piece.color = piece.color ?? 0
  piece.r = piece.r ?? 0
  piece.n = piece.n ?? 0
  piece.h = piece.h < 0 ? piece.w : piece.h
  piece.label = piece.label ?? ''
  piece.tag = piece.tag ?? ''

  // add client-side meta information
  const template = getTemplate()
  piece._width = piece.w * template.gridSize
  piece._height = piece.h * template.gridSize
  const asset = findAsset(piece.asset)
  piece._sides = asset?.media.length ?? 1
  if (asset?.id === 'ffffffffffffffff') {
    piece._feature = 'POINTER'
  } else {
    switch (asset?.alias) {
      case 'dicemat':
        piece._feature = 'DICEMAT'
        break
      case 'discard':
        piece._feature = 'DISCARD'
        break
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
 * @return {Object} Object with top/left/bottom/right property of main content.
 */
export function getContentRect (no = getTableNo()) {
  const rect = {
    left: Number.MAX_VALUE,
    top: Number.MAX_VALUE,
    right: Number.MIN_VALUE,
    bottom: Number.MIN_VALUE
  }
  const gridSize = getTemplate().gridSize
  const tableData = getTable(no)

  // provide default for empty rooms
  if (!tableData || tableData.length < 1) {
    return {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    }
  }

  // calculate values for non-empty rooms
  for (const piece of tableData) {
    const top = piece.y
    const left = piece.x
    const bottom = top + piece.h * gridSize - 1
    const right = left + piece.w * gridSize - 1
    rect.left = rect.left < left ? rect.left : left
    rect.top = rect.top < top ? rect.top : top
    rect.right = rect.right > right ? rect.right : right
    rect.bottom = rect.bottom > bottom ? rect.bottom : bottom
  }

  return rect
}

/**
 * Determine rectancle all items on the room are within in grid units.
 *
 * @param {Number} no Table number to work on, defaults to current.
 * @return {Object} Object with top/left/bottom/right property of main content.
 */
export function getContentRectGrid (no = getTableNo()) {
  const gridSize = getTemplate().gridSize
  const rect = getContentRect(no)

  rect.left = Math.floor(rect.left / gridSize)
  rect.top = Math.floor(rect.top / gridSize)
  rect.right = Math.floor(rect.right / gridSize)
  rect.bottom = Math.floor(rect.bottom / gridSize)
  if (rect.left === 0 && rect.right === 0) {
    rect.width = 0
  } else {
    rect.width = rect.right - rect.left + 1
  }
  if (rect.top === 0 && rect.bottom === 0) {
    rect.height = 0
  } else {
    rect.height = rect.bottom - rect.top + 1
  }

  return rect
}

/**
 * Determine rectancle all items in all tables on the room are within in grid units.
 *
 * @return {Object} Object with top/left/bottom/right property of main content.
 */
export function getContentRectGridAll () {
  const rect = {
    top: Number.MAX_VALUE,
    left: Number.MAX_VALUE,
    bottom: Number.MIN_VALUE,
    right: Number.MIN_VALUE
  }
  for (let i = 0; i <= 9; i++) {
    const rect2 = getContentRectGrid(i)
    if (rect2.width > 0) {
      rect.left = Math.min(rect.left, rect2.left)
      rect.right = Math.max(rect.right, rect2.right)
    }
    if (rect2.height > 0) {
      rect.top = Math.min(rect.top, rect2.top)
      rect.bottom = Math.max(rect.bottom, rect2.bottom)
    }
  }
  return rect
}

/**
 * Create a new piece from an asset.
 *
 * @param {Number} assetId ID of asset.
 * @param {Number} gridX X-position (grid).
 * @param {Number} gridY Y-position (grid).
 * @return {Object} Piece data object.
 */
export function createPieceFromAsset (assetId, gridX = 0, gridY = 0) {
  const asset = findAsset(assetId)
  const template = getTemplate()

  return populatePieceDefaults(clampToTableSize({
    asset: asset.id,
    layer: asset.type,
    w: asset.w,
    h: asset.h,
    x: gridX * template.gridSize,
    y: gridY * template.gridSize,
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
    alias: 'unknown',
    w: 1,
    h: 1,
    side: 1,
    bg: '808080'
  }
  let match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.([a-fA-F0-9]{6}|transparent|piece)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.alias = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.side = Number(match[4])
    data.bg = match[5]
    return data
  }
  match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.alias = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.side = Number(match[4])
    return data
  }
  match = assetName.match(/^(.*)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.alias = match[1]
    return data
  }
  return data
}

// -----------------------------------------------------------------------------

/**
 * Create asset to be used for invalid asset references.
 *
 * @return {Object} Asset with placeholder/invalid image.
 */
function createInvalidAsset () {
  return {
    media: ['invalid.svg'],
    width: 1,
    height: 1,
    bg: '40bfbf',
    alias: 'invalid',
    type: 'tile',
    id: '0000000000000000'
  }
}
