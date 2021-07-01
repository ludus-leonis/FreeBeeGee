/**
 * @file Utility functions that operate on (cached) state data, e.g. searching
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
  getTemplate,
  getLibrary,
  getState,
  getStateNo
} from './state.mjs'

import {
  clamp,
  intersect
} from '../../utils.mjs'

export const assetTypes = ['tile', 'token', 'overlay', 'other']

/**
 * Find a piece by ID.
 *
 * @param {String} id ID to lookup.
 * @param {Number} no State number, defaults to current state.
 * @return {Object} Piece, or null if not found.
 */
export function findPiece (id, no = getStateNo()) {
  for (const piece of getState(no)) {
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
 * Find all pieces within a grid area.
 *
 * @param {Object} rect Rectangle object, containing top/left/bottom/right.
 * @param {String} layer Optional name of layer to search within. Defaults to 'all'.
 * @param {Number} no State number, defaults to current state.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
export function findPiecesWithin (rect, layer = 'all', no = getStateNo()) {
  const template = getTemplate()
  const pieces = []

  for (const piece of getState(no)) {
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
    color: asset.color
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
  piece.border = piece.border ?? 0
  piece.r = piece.r ?? 0
  piece.n = piece.n ?? 0
  piece.h = piece.h < 0 ? piece.w : piece.h
  piece.label = piece.label ?? ''

  // add client-side meta information
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
 * @param {Array} pieces Data objects to populate.
 * @param {Object} headers Optional headers object (for date checking).
 * @return {Array} Pieces array for chaining.
 */
export function populatePiecesDefaults (pieces, headers = null) {
  for (const piece of pieces) {
    populatePieceDefaults(piece, headers)
  }
  return pieces
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
 * Determine rectancle all items on the table are within in px.
 *
 * @param {Number} no State number to work on, defaults to current.
 * @return {Object} Object with top/left/bottom/right property of main content.
 */
export function getContentRect (no = getStateNo()) {
  const rect = {
    left: Number.MAX_VALUE,
    top: Number.MAX_VALUE,
    right: Number.MIN_VALUE,
    bottom: Number.MIN_VALUE
  }
  const gridSize = getTemplate().gridSize
  const state = getState(no)

  // provide default for empty tables
  if (!state || state.length < 1) {
    return {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    }
  }

  // calculate values for non-empty tables
  for (const piece of state) {
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
 * Determine rectancle all items on the table are within in grid units.
 *
 * @param {Number} no State number to work on, defaults to current.
 * @return {Object} Object with top/left/bottom/right property of main content.
 */
export function getContentRectGrid (no = getStateNo()) {
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
 * Determine rectancle all items in all subtables on the table are within in grid units.
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

  return populatePieceDefaults(clampToTablesize({
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
 * Make sure a piece is fully on the table by clipping x/y based on it's size.
 *
 * @param {Object} item Piece to clamp.
 * @return {Object} Clamped piece.
 */
export function clampToTablesize (piece) {
  const template = getTemplate()
  piece.x = clamp(0, piece.x, (template.gridWidth - piece.w) * template.gridSize)
  piece.y = clamp(0, piece.y, (template.gridHeight - piece.h) * template.gridSize)
  return piece
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
    color: '40bfbf',
    alias: 'invalid',
    type: 'tile',
    id: '0000000000000000'
  }
}
