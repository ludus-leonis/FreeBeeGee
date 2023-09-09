/**
 * @file Handles the note editor modal.
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
  FLAGS,
  createPieces,
  editPiece
} from '../../../../state/index.mjs'

import {
  stickyNoteColors
} from '../../../../view/room/tabletop/tabledata.mjs'

import {
  inputMaxLength
} from '../../../../lib/utils-html.mjs'

import {
  setupFlags,
  setupLabel,
  setupSize,
  updateColor,
  updateFlags,
  updateLabel,
  updateSize
} from './index.mjs'

// --- public ------------------------------------------------------------------

export const NOTE_LENGTH = 256

/**
 * Show the edit-piece modal.
 *
 * @param {object} piece The piece's data object.
 * @returns {Function} Callback for ok/save button.
 */
export function setup (piece) {
  _('#modal-body').innerHTML = getModalNote()

  setupLabel(piece)
  setupSize(piece)

  // piece color
  const pieceColor = _('#piece-color')
  for (let c = 0; c < stickyNoteColors.length; c++) {
    const option = _('option').create(stickyNoteColors[c].name)
    option.value = c
    if (c === piece.c[0]) option.selected = true
    pieceColor.add(option)
  }

  // note types
  const noteType = _('#piece-note-type')
  const option1 = _('option').create('Center')
  option1.value = 'c'
  if (piece.f & !FLAGS.NOTE_TOPLEFT) option1.selected = true
  noteType.add(option1)
  const option2 = _('option').create('Top-Left')
  option2.value = 'tl'
  if (piece.f & FLAGS.NOTE_TOPLEFT) option2.selected = true
  noteType.add(option2)

  setupFlags(piece)

  inputMaxLength(_('#piece-label').node(), NOTE_LENGTH, size => {
    _('#note-hint').innerText = `Markdown available, no HTML though. Bytes left: ${NOTE_LENGTH - size}`
  })

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
  updateSize(piece, updates)
  updateColor(piece, updates)
  updateFlags(piece, updates)

  if (piece.id) {
    editPiece(piece.id, updates)
  } else {
    createPieces([{
      ...piece,
      ...updates
    }], true)
  }

  return true
}

/**
 * Create the modal's content.
 *
 * @returns {string} HTML snippet.
 */
function getModalNote () {
  return `
    <form class="container modal-edit modal-edit-note">
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <div class="row">
        <div class="col-12 col-lg-8">
          <label for="piece-label">Note</label>
          <textarea id="piece-label" name="piece-label" maxlength="${NOTE_LENGTH}" rows="5"></textarea>
          <p id="note-hint" class="p-small spacing-micro"></p>
        </div>
        <div class="col-12 col-lg-4">
          <div class="row">
            <div class="col-6">
              <label for="piece-color">Color</label>
              <select id="piece-color" name="piece-color"></select>
            </div>
            <div class="col-6">
              <label for="piece-note-type">Align</label>
              <select id="piece-note-type" name="piece-note-type"></select>
            </div>
            <div class="col-6">
              <label for="piece-w">Width</label>
              <select id="piece-w" name="piece-w"></select>
            </div>
            <div class="col-6">
              <label for="piece-h">Height</label>
              <select id="piece-h" name="piece-h"></select>
            </div>
          </div>
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
