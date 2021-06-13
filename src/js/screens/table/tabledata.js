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
} from './state.js'

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

  return populatePiecesDefaults({
    asset: asset.id,
    layer: asset.type,
    w: asset.w,
    h: asset.h,
    sides: asset.assets.length,
    color: asset.color
  })
}

/**
 * Add default values to all properties that the API might omit.
 *
 * @param {Array} pieces Data objects to populate.
 * @return {Array} Pieces array for chaining.
 */
export function populatePiecesDefaults (pieces) {
  for (const piece of pieces) {
    piece.w = piece.w ?? 1
    piece.h = piece.h ?? 1
    piece.side = piece.side ?? 0
    piece.border = piece.border ?? 0
    piece.r = piece.r ?? 0
    piece.no = piece.no ?? 0
    piece.h = piece.h < 0 ? piece.w : piece.h
    piece.label = piece.label ?? ''

    // add client-side meta information
    const asset = findAsset(piece.asset)
    piece._sides = asset?.assets.length ?? 1
    switch (asset?.alias) {
      case 'dicemat':
        piece._feature = 'DICEMAT'
        break
      case 'discard':
        piece._feature = 'DISCARD'
        break
    }
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
    top: 999999999,
    left: 999999999,
    bottom: -999999999,
    right: -999999999
  }
  const gridSize = getTemplate().gridSize

  for (const piece of getState(no)) {
    const top = piece.y
    const left = piece.x
    const bottom = top + piece.h * gridSize - 1
    const right = left + piece.w * gridSize - 1
    rect.top = rect.top < top ? rect.top : top
    rect.left = rect.left < left ? rect.left : left
    rect.bottom = rect.bottom > bottom ? rect.bottom : bottom
    rect.right = rect.right > right ? rect.right : right
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
  rect.width = rect.right - rect.left + 1
  rect.height = rect.bottom - rect.top + 1

  return rect
}

// -----------------------------------------------------------------------------

/**
 * Determine if two rectacles intersect / overlap.
 *
 * @param {Object} rect1 First rect, containing of top/left/bottom/right.
 * @param {Object} rect2 Second rect, containing of top/left/bottom/right.
 * @returns {Boolean} True if they intersect.
 */
function intersect (rect1, rect2) {
  return (rect1.left <= rect2.right &&
    rect2.left <= rect1.right &&
    rect1.top <= rect2.bottom &&
    rect2.top <= rect1.bottom)
}

/**
 * Create asset to be used for invalid asset references.
 *
 * @return {Object} Asset with placeholder/invalid image.
 */
function createInvalidAsset () {
  return {
    assets: ['invalid.svg'],
    width: 1,
    height: 1,
    color: '40bfbf',
    alias: 'invalid',
    type: 'tile',
    id: '0000000000000000'
  }
}
