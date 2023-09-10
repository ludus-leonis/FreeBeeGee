/**
 * @file Handles the tile editor modal.
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

import _ from '../../../../lib/FreeDOM.mjs'

import {
  editPiece
} from '../../../../state/index.mjs'

import {
  setupBadge,
  setupColor,
  setupFlags,
  setupLabel,
  setupRotate,
  setupSide,
  setupSize,
  updateBadge,
  updateColor,
  updateFlags,
  updateLabel,
  updateRotate,
  updateSide,
  updateSize
} from './index.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the edit-piece modal.
 *
 * @param {object} piece The piece's data object.
 * @returns {Function} Callback for ok/save button.
 */
export function setup (piece) {
  _('#modal-body').innerHTML = getModalTile(piece)

  setupLabel(piece)
  setupBadge(piece)
  setupSize(piece)
  setupRotate(piece)
  setupSide(piece)
  setupColor(piece)
  setupFlags(piece)

  return modalOk
}

// --- internal ----------------------------------------------------------------

/**
 * Hides modal and pushes changes to the state.
 *
 * @returns {boolean} True, if save was successfull (and modal can be closed).
 */
function modalOk () {
  const piece = _('#modal').node().piece
  const updates = {}

  updateLabel(piece, updates)
  updateBadge(piece, updates)
  updateSize(piece, updates)
  updateRotate(piece, updates)
  updateSide(piece, updates)
  updateColor(piece, updates)
  updateFlags(piece, updates)

  editPiece(piece.id, updates)

  return true
}

/**
 * Create the modal's content.
 *
 * @param {object} piece Piece object to show.
 * @returns {string} HTML snippet.
 */
function getModalTile (piece) {
  let colorClass = 'is-hidden'
  let sideClass = 'is-hidden'
  let otherClass = 'col-lg-3'

  if (piece._meta.hasColor && piece._meta.sides >= 2) {
    colorClass = 'col-lg-4'
    sideClass = 'col-lg-2'
    otherClass = 'col-lg-2'
  } else if (piece._meta.hasColor) {
    colorClass = 'col-lg-3'
    otherClass = 'col-lg-3'
  } else if (piece._meta.sides >= 2) {
    sideClass = 'col-lg-3'
    otherClass = 'col-lg-3'
  }

  return `
    <form class="container modal-edit modal-edit-tile">
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <div class="row">
        <div class="col-12">
          <label for="piece-label">Label</label>
          <input id="piece-label" name="piece-label" type="text" maxlength="32">
        </div>
        <div class="col-6 ${colorClass}">
          <label for="piece-color">Color</label>
          <select id="piece-color" name="piece-color"></select>
        </div>
        <div class="col-6 ${otherClass}">
          <label for="piece-w">Width</label>
          <select id="piece-w" name="piece-w"></select>
        </div>
        <div class="col-6 ${otherClass}">
          <label for="piece-h">Height</label>
          <select id="piece-h" name="piece-h"></select>
        </div>
        <div class="col-6 ${otherClass}">
          <label for="piece-r">Rotate</label>
          <select id="piece-r" name="piece-r"></select>
        </div>
        <div class="col-6 ${sideClass}">
          <label for="piece-side">Side</label>
          <select id="piece-side" name="piece-side"></select>
        </div>

        <div class="col-12">
          <label>Protect</label>
          <input id="piece-no-move" type="checkbox"><label for="piece-no-move" class="p-medium">move</label>
          <input id="piece-no-clone" type="checkbox"><label for="piece-no-clone" class="p-medium">clone</label>
          <input id="piece-no-delete" type="checkbox"><label for="piece-no-delete" class="p-medium">delete</label>
        </div>
      </div>
    </form>
  `
}
