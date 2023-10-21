/**
 * @file Code related to handling selection and handle multi-select.
 * @module
 * @copyright 2021-2023 Markus Leupold-Löwenthal
 * @license AGPL-3.0-or-later
 *
 * This file is part of FreeBeeGee.
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
  updateSelectionDOM
} from '../../../view/room/tabletop/index.mjs'

import {
  LAYER_NOTE,
  LAYER_TILE,
  LAYER_TOKEN,
  LAYER_STICKER,
  LAYER_OTHER,
  findPiece,
  findPiecesWithin,
  getFeatures
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  getTable,
  getTableNo,
  isLayerActive
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
 * Add all pieces on the table to the selection.
 */
export function selectionAddAll () {
  const layers = {}
  for (const layer of [LAYER_TILE, LAYER_TOKEN, LAYER_STICKER, LAYER_OTHER]) {
    layers[layer] = isLayerActive(layer)
  }
  for (const piece of getTable()) {
    if ((layers[piece.l] || piece.l === LAYER_NOTE) && !selectionGetIds().includes(piece.id)) {
      selectionGetIds().push(piece.id)
    }
  }
  updateSelectionDOM()
}

/**
 * Check if an piece ID is currently selected
 *
 * @param {string} id ID to check.
 * @returns {boolean} True, if this element is selected.
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
 * @param {string} layer Either LAYER_TILE, LAYER_STICKER or LAYER_TOKEN to clear a specific
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
 * @param {string} layer Either LAYER_TILE, LAYER_STICKER or LAYER_TOKEN to clear a specific
 *                       layer, or 'all' for all layers.
 * @returns {object[]} Possibly empty array of selected pieces.
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
 * @returns {object[]} Possibly empty array of selected pieces.
 */
export function selectionGetIds () {
  return selectionIds[getTableNo()]
}

/**
 * Get the featureset all currently selected pieces support.
 *
 * @returns {object} Object with features true/false.
 */
export function selectionGetFeatures () {
  return getFeatures(selectionGetPieces())
}

/**
 * Find all highest Z values below bounds.
 *
 * @param {object} bounds {top, left, right, bottom} to search within.
 * @param {object} center Center {x, y} of selection.
 * @returns {object} Contains higest z per layer as {tile, token, ...}.
 */
export function findMaxZBelow (bounds, center) {
  const zLower = {}
  for (const piece of findPiecesWithinBounds(bounds, center, true)) {
    if (!isSelectedId(piece.id)) {
      if (piece.z > (zLower[piece.l] ?? Number.MIN_VALUE)) zLower[piece.l] = piece.z
    }
  }
  return zLower
}

/**
 * Find all lowest Z values below bounds.
 *
 * @param {object} bounds {top, left, right, bottom} to search within.
 * @param {object} center Center {x, y} of selection.
 * @returns {object} Contains lowest z per layer as {tile, token, ...}.
 */
export function findMinZBelow (bounds, center) {
  const zLower = {}
  for (const piece of findPiecesWithinBounds(bounds, center, true)) {
    if (!isSelectedId(piece.id)) {
      if (piece.z < (zLower[piece.l] ?? Number.MAX_VALUE)) zLower[piece.l] = piece.z
    }
  }
  return zLower
}

/**
 * Copy the currently selected piece(s) into our clipboard.
 *
 * Will silently fail if nothing is selected.
 */
export function clipboardCopy () {
  clipboard.pieces = selectionGetPieces()
}

/**
 * Get the featureset all pieces in the clipboard support.
 *
 * @returns {object} Object with features true/false.
 */
export function clipboardGetPieces () {
  return clipboard.pieces
}

// -----------------------------------------------------------------------------

let selectionIds = [[], [], [], [], [], [], [], [], [], []] // 1+9 tables

const clipboard = {
  pieces: []
}

/**
 * Find all pieces at current (or future) area.
 *
 * Mostly used before moving a selection to a new position what pieces might affect z.
 *
 * @param {object} bounds {top, left, right, bottom} to search within.
 * @param {object} center Optional alterate center {x, y} of selection.
 * @param {boolean} padding If true, selection will extend 2px on all sides.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
function findPiecesWithinBounds (bounds, center = {}, padding = false) {
  const offset = {
    x: center.x ? center.x - bounds.center.x : 0,
    y: center.y ? center.y - bounds.center.y : 0
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
 * Remove a piece from the selection.
 *
 * @param {string} id Piece id to remove.
 */
function selectionRemove (id) {
  const piece = findPiece(id)
  if (piece && selectionGetIds().includes(id)) {
    const selection = selectionGetIds()
    selection.splice(selection.indexOf(id), 1)
  }
}

export const _private = {
  findPiecesWithinBounds,
  selectionRemove,
  selectionReset: function () { // exposed only for testing
    selectionIds = [[], [], [], [], [], [], [], [], [], []]
  }
}
