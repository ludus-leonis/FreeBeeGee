/**
 * @file Code related to handling selection and handle multi-select.
 * @module
 * @copyright 2021-2022 Markus Leupold-Löwenthal
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

// This only operates on state, not on DOM.
// Selection is different for each table and always applies to current one.

import {
  FEATURE_DICEMAT,
  FEATURE_DISCARD,
  LAYER_OTHER,
  LAYER_TOKEN,
  findPiece,
  findPiecesWithin
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  FLAG_NO_CLONE,
  FLAG_NO_DELETE,
  getTable,
  getTableNo
} from '../../../state/index.mjs'

/**
 * Add a piece to the selection.
 *
 * @param {string} id Piece id to select.
 * @param {boolean} forced If false (default), selection will only happen if piece exists.
 */
export function selectionAdd (id, forced = false) {
  const piece = findPiece(id)
  if ((piece || forced) && !selectionGetIds().includes(id)) {
    selectionGetIds().push(id)
  }
}

/**
 * Add a piece to the selection.
 *
 * @param {string} id Piece id to select.
 */
export function selectionRemove (id) {
  const piece = findPiece(id)
  if (piece && selectionGetIds().includes(id)) {
    const selection = selectionGetIds()
    selection.splice(selection.indexOf(id), 1)
  }
}

/**
* Check if an piece ID is currently selected
*
* @param {string} id ID to check.
* @return {boolean} True, if this element is selected.
*/
export function isSelectedId (id) {
  return selectionGetIds().includes(id)
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} node The HTML node the user clicked on. Unselect all if null.
 * @param {boolean} toggle If false (default), selection replaces all previous.
 *                         If true, selection is added/removed.
 */
export function selectNode (node, toggle = false) {
  if (toggle) { // toggle-selects add/remove one item to the selection
    // no change on table click
    if (node.id === 'tabletop') return

    // invert selection state (if it is a piece)
    if (node.piece) {
      if (isSelectedId(node.piece.id)) {
        selectionRemove(node.piece.id)
      } else {
        selectionAdd(node.piece.id)
      }
    }
  } else { // non-toggle-selects replace selection
    // selectionClear everything if 'nothing' was clicked
    if (!node || node.id === 'tabletop') {
      selectionClear()
      return
    }

    if (node.piece) {
      selectionClear()
      selectionAdd(node.piece.id)
    }
  }
}

/**
 * Clear the selection of pieces.
 *
 * @param {String} layer Either LAYER_TILE, LAYER_OVERLAY or LAYER_TOKEN to clear a specific
 *                       layer, or 'all' for all layers.
 */
export function selectionClear (layer = 'all') {
  for (const piece of selectionGetPieces(layer)) {
    selectionRemove(piece.id)
  }
}

/**
 * Get all currently selected pieces.
 *
 * @param {String} layer Either LAYER_TILE, LAYER_OVERLAY or LAYER_TOKEN to clear a specific
 *                       layer, or 'all' for all layers.
 * @return {piece[]} Possibly empty array of selected pieces.
 */
export function selectionGetPieces (layer = 'all') {
  const selected = []
  for (const piece of getTable()) {
    if (layer === 'all' || piece.l === layer) {
      if (isSelectedId(piece.id)) selected.push(piece)
    }
  }
  return selected
}

/**
 * Get all currently selected IDs.
 *
 * @return {piece[]} Possibly empty array of selected pieces.
 */
export function selectionGetIds () {
  return selectionIds[getTableNo()]
}

/**
 * Fet the featureset all currently selected pieces support
 *
 * @return {Object} Object with features true/false.
 */
export function selectionGetFeatures () {
  const semi = [FEATURE_DICEMAT, FEATURE_DISCARD]
  const pieces = selectionGetPieces()

  let features = {
    edit: false,
    rotate: false,
    flip: false,
    random: false,
    top: false,
    bottom: false,
    clone: false,
    delete: false,
    color: false,
    border: false,
    number: false,
    boundingBox: {}
  }
  if (pieces.length > 0) {
    features = {
      edit: pieces.length === 1,
      rotate: true,
      flip: true,
      random: true,
      top: true,
      bottom: true,
      clone: true,
      delete: true,
      color: true,
      border: true,
      number: true,
      boundingBox: {}
    }

    for (const piece of pieces) {
      if (piece.l === LAYER_OTHER) features.rotate = false
      if (piece.f & FLAG_NO_CLONE) features.clone = false
      if (piece.f & FLAG_NO_DELETE) features.delete = false
      if (!piece._meta?.hasColor) features.color = false
      if (!piece._meta?.hasBorder) features.border = false
      if (piece.l !== LAYER_TOKEN) features.number = false

      if ((piece._meta?.sides ?? 1) <= 1) features.flip = false
      if (semi.includes(piece._meta?.feature)) features.flip = false

      if ((piece._meta?.sides ?? 1) <= 1 && !semi.includes(piece._meta?.feature)) features.random = false

      // plus/minus half-size of item?
      if (piece.x - piece._meta.widthPx / 2 < (features.boundingBox.left ?? Number.MAX_VALUE)) {
        features.boundingBox.left = Math.round(piece.x - piece._meta.widthPx / 2)
      }
      if (piece.x + piece._meta.widthPx / 2 > (features.boundingBox.right ?? Number.MIN_VALUE)) {
        features.boundingBox.right = Math.round(piece.x + piece._meta.widthPx / 2 - 1)
      }
      if (piece.y - piece._meta.heightPx / 2 < (features.boundingBox.top ?? Number.MAX_VALUE)) {
        features.boundingBox.top = Math.round(piece.y - piece._meta.heightPx / 2)
      }
      if (piece.y + piece._meta.heightPx / 2 > (features.boundingBox.bottom ?? Number.MIN_VALUE)) {
        features.boundingBox.bottom = Math.round(piece.y + piece._meta.heightPx / 2 - 1)
      }
      features.boundingBox.w = features.boundingBox.right - features.boundingBox.left + 1
      features.boundingBox.h = features.boundingBox.bottom - features.boundingBox.top + 1
      features.boundingBox.x = Math.floor((features.boundingBox.right + features.boundingBox.left + 1) / 2)
      features.boundingBox.y = Math.floor((features.boundingBox.bottom + features.boundingBox.top + 1) / 2)
    }
  }
  return features
}

/**
 * Find all pieces at current (or future) selection area.
 *
 * Mostly used before moving a selection to a new position what pieces might affect z.
 *
 * @param {Number} x Optional alterate center of selection.
 * @param {Number} y Optional alterate center of selection.
 * @param {boolean} padding If true, selection will extend 2px on all sides.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
export function findPiecesWithinSelection (x = undefined, y = undefined, padding = false) {
  const bounds = selectionGetFeatures().boundingBox
  const offset = {
    x: x ? x - bounds.x : 0,
    y: y ? y - bounds.y : 0
  }
  const rect = padding
    ? {
        top: bounds.top + offset.y - 2,
        bottom: bounds.bottom + offset.y + 2,
        left: bounds.left + offset.x - 2,
        right: bounds.right + offset.x + 2
      }
    : {
        top: bounds.top + offset.y,
        bottom: bounds.bottom + offset.y,
        left: bounds.left + offset.x,
        right: bounds.right + offset.x
      }
  return findPiecesWithin(rect)
}

/**
 * Find all highest Z values below the selection target.
 *
 * @param {Number} x Center of selection.
 * @param {Number} y Center of selection.
 * @returns {Object} Contains higest z per layer as {tile, token, ...}.
 */
export function findMaxZBelowSelection (x, y) {
  const zLower = {}
  for (const piece of findPiecesWithinSelection(x, y, true)) {
    if (!isSelectedId(piece.id)) {
      if (piece.z > (zLower[piece.l] ?? Number.MIN_VALUE)) zLower[piece.l] = piece.z
    }
  }
  return zLower
}

/**
 * Find all lowest Z values below the selection target.
 *
 * @param {Number} x Center of selection.
 * @param {Number} y Center of selection.
 * @returns {Object} Contains lowest z per layer as {tile, token, ...}.
 */
export function findMinZBelowSelection (x, y) {
  const zLower = {}
  for (const piece of findPiecesWithinSelection(x, y, true)) {
    if (!isSelectedId(piece.id)) {
      if (piece.z < (zLower[piece.l] ?? Number.MAX_VALUE)) zLower[piece.l] = piece.z
    }
  }
  return zLower
}

// -----------------------------------------------------------------------------

let selectionIds = [[], [], [], [], [], [], [], [], [], []] // 1+9 tables

export function _selectionReset () { // exposed only for testing
  selectionIds = [[], [], [], [], [], [], [], [], [], []]
}
