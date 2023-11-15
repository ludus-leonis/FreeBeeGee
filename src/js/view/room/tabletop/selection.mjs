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

import Content from '../../../view/room/tabletop/content.mjs'
import Dom from '../../../view/room/tabletop/dom.mjs'
import ModalEdit from '../../../view/room/modal/piece/index.mjs'
import State from '../../../state/index.mjs'

// -----------------------------------------------------------------------------

export default {
  clear,
  clipboardGetPieces,
  clone,
  cut,
  copy,
  edit,
  flip,
  flipRandom,
  getFeatures,
  getIds,
  getPieces,
  grid,
  isSelectedId,
  moveTiles,
  number,
  paste,
  pile,
  remove,
  rotate,
  rotateRandom,
  select,
  selectAll,
  selectNode,
  toBottom,
  toggleBorder,
  toggleColor,
  toTop,
  unselect,

  _private: {
    selectionReset: function () { // exposed only for testing
      selectionIds = [[], [], [], [], [], [], [], [], [], []]
    }
  }
}

// -----------------------------------------------------------------------------

/**
 * Add a piece to the selection.
 *
 * @param {string} id Piece id to select.
 * @param {boolean} forced If false (default), selection will only happen if piece exists.
 * @returns {boolean} True if id could be found and added, false otherwise.
 */
function select (id, forced = false) {
  const piece = Content.findPiece(id)
  if ([Content.ID.POINTER, Content.ID.LOS].includes(piece?.a)) return false
  if ((piece || forced) && !getIds().includes(id)) {
    getIds().push(id)
    return true
  }
  return false
}

/**
 * Add all pieces on the table to the selection.
 */
function selectAll () {
  const layers = {}
  for (const layer of [Content.LAYER.TILE, Content.LAYER.TOKEN, Content.LAYER.STICKER, Content.LAYER.OTHER]) {
    layers[layer] = State.isLayerActive(layer)
  }
  for (const piece of State.getTable()) {
    if ([Content.ID.POINTER, Content.ID.LOS].includes(piece.a)) continue
    if ((layers[piece.l] || piece.l === Content.LAYER.NOTE) && !getIds().includes(piece.id)) {
      getIds().push(piece.id)
    }
  }
  Dom.updateSelection()
}

/**
 * Remove a piece from the selection.
 *
 * @param {string} id Piece id to remove.
 * @returns {boolean} True if id could be found and was unselected, false otherwise
 */
function unselect (id) {
  const piece = Content.findPiece(id)
  if (piece && getIds().includes(id)) {
    const selection = getIds()
    selection.splice(selection.indexOf(id), 1)
    return true
  }
  return false
}

/**
 * Clear the selection of pieces.
 *
 * @param {string} layer Either LAYER.TILE, LAYER.STICKER or LAYER.TOKEN to clear a specific
 *                       layer, or 'all' for all layers.
 */
function clear (layer = 'all') {
  for (const piece of getPieces(layer)) {
    unselect(piece.id)
  }
}

/**
 * Check if an piece ID is currently selected
 *
 * @param {string} id ID to check.
 * @returns {boolean} True, if this element is selected.
 */
function isSelectedId (id) {
  return getIds().includes(id)
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} node The HTML node the user clicked on. Unselect all if null.
 * @param {boolean} toggle If false (default), selection replaces all previous.
 *                         If true, selection is added/removed.
 */
function selectNode (node, toggle = false) {
  if (toggle) { // toggle-selects add/remove one item to the selection
    // no change on table click
    if (node.id === 'tabletop') return

    // invert selection state (if it is a piece)
    if (node.piece) {
      if (isSelectedId(node.piece.id)) {
        unselect(node.piece.id)
      } else {
        select(node.piece.id)
      }
    }
  } else { // non-toggle-selects replace selection
    // clear selection if 'nothing' was clicked
    if (!node || node.id === 'tabletop') {
      clear()
      return
    }

    if (node.piece) {
      clear()
      select(node.piece.id)
    }
  }
}

/**
 * Get all currently selected pieces.
 *
 * @param {string} layer Either LAYER.TILE, LAYER.STICKER or LAYER.TOKEN to clear a specific
 *                       layer, or 'all' for all layers.
 * @returns {object[]} Possibly empty array of selected pieces.
 */
function getPieces (layer = 'all') {
  const selected = []
  for (const piece of State.getTable()) {
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
function getIds () {
  return selectionIds[State.getTableNo()]
}

/**
 * Get the featureset all currently selected pieces support.
 *
 * @returns {object} Object with features true/false.
 */
function getFeatures () {
  return Content.getFeatures(getPieces())
}

/**
 * Get the featureset all pieces in the clipboard support.
 *
 * @returns {object} Object with features true/false.
 */
function clipboardGetPieces () {
  return clipboard.pieces
}

// --- manipulate selected pieces ----------------------------------------------

/**
 * Clone the currently selected piece(s) to a given position.
 *
 * Will silently fail if nothing is selected.
 *
 * @param {object} xy Grid x/y position (in tiles).
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function clone (xy, api = true) {
  const toClone = getPieces()
  clear()
  return Content.clone(toClone, xy, 1, api)
}

/**
 * Copy the currently selected piece(s) into our clipboard.
 *
 * Will silently fail if nothing is selected.
 *
 * @param {boolean} cut If true, selection was cut. Stored for later.
 */
function copy (cut = false) {
  clipboard.pieces = getPieces()
  clipboard.pastes = 1
}

/**
 * Cut the currently selected piece(s) into our clipboard.
 */
function cut () {
  clipboard.pieces = getPieces()
  clipboard.pastes = 0
  remove()
}

/**
 * Clone the currently copied (clipboard) piece(s) to a given position.
 *
 * Will silently fail if clipboard is empty.
 *
 * @param {object} xy Grid x/y position (in tiles).
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function paste (xy, api = true) {
  clear()
  return Content.clone(clipboardGetPieces(), xy, clipboard.pastes++, api)
}

/**
 * Rotate the currently selected pieces.
 *
 * Done in increments based on game type.
 *
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function rotateRandom (api = true) {
  return Content.rotateRandom(getPieces(), api)
}

/**
 * Rotate the currently selected pieces.
 *
 * Done in increments based on game type.
 *
 * @param {boolean} cw Optional direction. True = CW (default), False = CCW.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function rotate (cw = true, api = true) {
  return Content.rotate(getPieces(), cw, api)
}

/**
 * Move the currently selected pieces to the top within their layers.
 *
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function toTop (api = true) {
  return Content.toTop(getPieces(), api)
}

/**
 * Move the currently selected pieces to the bottom within their layers.
 *
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function toBottom (api = true) {
  return Content.toBottom(getPieces(), api)
}

/**
 * Delete selected pieces.
 *
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function remove (api = true) {
  return Content.remove(getPieces(), api)
}

/**
 * Switch the piece/border color of the currently selected piece.
 *
 * Will cycle through all available colors and silently fail if nothing is selected.
 *
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function toggleColor (api = true) {
  return Content.toggleColor(getPieces(), api)
}

/**
 * Switch the piece/border color of the currently selected piece.
 *
 * Will cycle through all available colors and silently fail if nothing is selected.
 *
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function toggleBorder (api = true) {
  return Content.toggleBorder(getPieces(), api)
}

/**
 * Flip the currently selected piece to its next side.
 *
 * Will cycle the sides and silently fail if nothing is selected.
 *
 * @param {boolean} forward If true (default), will cycle forward, otherwise backward.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function flip (forward = true, api = true) {
  return Content.flip(getPieces(), forward, api)
}

/**
 * Randomize the seleced piece.
 *
 * What happens depends a bit on the piece type, but usually it is flipped to a
 * random side. It also gets rotated and/or moved on the dicemat, so that there
 * is a visual difference even if the same side randomly comes up.
 *
 * Will silently fail if no tiles are selected.
 *
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function flipRandom (api = true) {
  return Content.flipRandom(getPieces(), api)
}

/**
 * Move selection. Honors diagonal movement for hex grids.
 *
 * Will silently fail if nothing is selected, move would push selection out of
 * table or items are locked.
 *
 * @param {number} x Move x in tiles. Can be negative.
 * @param {number} y Move y in tiles. Can be negative.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {object[]} Pieces to be moved.
 */
function moveTiles (x, y, api = true) {
  return Content.moveTiles(getPieces(), x, y, api)
}

/**
 * Increase/decrease the token number (if it is a token).
 *
 * Will cycle through all states
 *
 * @param {number} delta Amount to increase.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function number (delta, api = true) {
  return Content.number(getPieces(), delta, api)
}

/**
 * Pile up all selected pieces.
 *
 * Will silently fail if nothing is selected.
 *
 * @param {boolean} randomize If the z order of all items will be randomized.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function pile (randomize = false, api = true) {
  return Content.pile(getPieces(), randomize, api)
}

/**
 * Toggle / cycle overlay grid on selected tiles.
 *
 * Will silently fail if no tiles are selected.
 *
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function grid (api = true) {
  return Content.grid(getPieces(), api)
}

/**
 * Show edit dialog for currently selected piece (if only one).
 *
 * Will silently fail if nothing is selected.
 */
function edit () {
  if (!getFeatures().edit) return

  const selected = getPieces()
  if (selected.length === 1) {
    ModalEdit.open(Content.findPiece(selected[0].id))
  }
}

// -----------------------------------------------------------------------------

let selectionIds = [[], [], [], [], [], [], [], [], [], []] // 1+9 tables

const clipboard = {
  pieces: [],
  pastes: 0
}
