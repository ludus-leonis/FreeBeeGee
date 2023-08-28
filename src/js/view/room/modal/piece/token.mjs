/**
 * @file Handles the token editor modal.
 * @module
 * @copyright 2021-2023 Markus Leupold-Löwenthal
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

import _ from '../../../../lib/FreeDOM.mjs'

import {
  editPiece
} from '../../../../state/index.mjs'

import {
  setupBadge,
  setupColor,
  setupColorBorder,
  setupFlags,
  setupLabel,
  setupNumber,
  setupRotate,
  setupSide,
  setupSize,
  updateBadge,
  updateColorBorder,
  updateFlags,
  updateLabel,
  updateNumber,
  updateRotate,
  updateSide,
  updateSize
} from './index.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the edit-piece modal.
 *
 * @param {Object} piece The piece's data object.
 * @return {function} Callback for ok/save button.
 */
export function setup (piece) {
  _('#modal-body').innerHTML = getModalToken(piece)

  setupLabel(piece)
  setupBadge(piece)
  setupNumber(piece)
  setupSize(piece)
  setupRotate(piece)
  setupSide(piece)
  setupColor(piece)
  setupColorBorder(piece)
  setupFlags(piece)

  return modalOk
}

// --- internal ----------------------------------------------------------------

/**
 * Hides modal and pushes changes to the state.
 *
 * @return {boolean} True, if save was successfull (and modal can be closed).
 */
function modalOk () {
  const piece = _('#modal').node().piece
  const updates = {}

  updateLabel(piece, updates)
  updateBadge(piece, updates)
  updateSize(piece, updates)
  updateRotate(piece, updates)
  updateSide(piece, updates)
  updateColorBorder(piece, updates)
  updateNumber(piece, updates)
  updateFlags(piece, updates)

  editPiece(piece.id, updates)

  return true
}

/**
 * Create the modal's content.
 *
 * @return {string} HTML snippet.
 */
function getModalToken (piece, protect) {
  let colorClass = 'is-hidden'
  let borderClass = 'is-hidden'
  let otherClass = 'col-lg-3'

  if (piece._meta.hasColor && piece._meta.hasBorder) {
    colorClass = 'col-lg-2'
    borderClass = 'col-lg-2'
    otherClass = 'col-lg-2'
  } else if (piece._meta.hasBorder) {
    borderClass = 'col-lg-4'
    otherClass = 'col-lg-2'
  } else if (piece._meta.hasColor) {
    colorClass = 'col-lg-4'
    otherClass = 'col-lg-2'
  }

  return `
    <form class="container modal-edit modal-edit-token">
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <div class="row">
        <div class="col-12 col-lg-8">
          <label for="piece-label">Label</label>
          <input id="piece-label" name="piece-label" type="text" maxlength="32">
        </div>
        <div class="col-12 col-lg-4">
          <label for="piece-number">Number</label>
          <select id="piece-number" name="piece-number"></select>
        </div>
        <div class="col-6 ${borderClass}">
          <label for="piece-border">Border</label>
          <select id="piece-border" name="piece-border"></select>
        </div>
        <div class="col-6 ${colorClass}">
          <label for="piece-color">Color</label>
          <select id="piece-color" name="piece-color"></select>
        </div>
        <div class="col-6 ${otherClass}">
          <label for="piece-side">Side</label>
          <select id="piece-side" name="piece-side"></select>
        </div>
        <div class="col-6 ${otherClass}">
          <label for="piece-r">Rotate</label>
          <select id="piece-r" name="piece-r"></select>
        </div>
        <div class="col-6 ${otherClass}">
          <label for="piece-w">Width</label>
          <select id="piece-w" name="piece-w"></select>
        </div>
        <div class="col-6 ${otherClass}">
          <label for="piece-h">Height</label>
          <select id="piece-h" name="piece-h"></select>
        </div>
        <div class="col-12">
          <label for="piece-badges">Badges</label>
          <div id="piece-badges" class="toggle-box"></div>
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
