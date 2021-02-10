/**
 * @file Handles the piece editor modal.
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

import { statePieceEdit } from '../state.js'
import _ from '../../../FreeDOM.js'

import { createModal, getModal, modalActive, modalClose } from '../../../modal.js'

// --- public ------------------------------------------------------------------

/**
 * Show the edit-piece modal.
 *
 * @param {Object} piece The piece's data object.
 */
export function modalEdit (piece) {
  if (piece != null && !modalActive()) {
    const node = createModal()
    node.piece = piece

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">Edit piece</h3>
    `
    _('#modal-body').innerHTML = `
      <form class="container">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <div class="row">
          <div class="col-12">
            <label for="piece-label">Label</label>
            <input id="piece-label" name="piece-label" type="text" maxlength="32">
          </div>
          <div class="col-6 col-lg-3">
            <label for="piece-w">Width</label>
            <select id="piece-w" name="piece-w"></select>
          </div>
          <div class="col-6 col-lg-3">
            <label for="piece-h">Height</label>
            <select id="piece-h" name="piece-h"></select>
          </div>
          <div class="col-6 col-lg-3">
            <label for="piece-r">Rotate</label>
            <select id="piece-r" name="piece-r"></select>
          </div>
          <div class="col-6 col-lg-3">
            <label for="piece-side">Side</label>
            <select id="piece-side" name="piece-side"></select>
          </div>
          <div class="col-12">
            <label for="piece-color">Color (Border)</label>
            <select id="piece-color" name="piece-color"></select>
          </div>
        </div>
      </form>
    `

    // label
    _('#piece-label').value = piece.label

    // width
    const pieceW = _('#piece-w')
    for (let w = 1; w <= 8; w++) {
      const option = _('option').create(w)
      option.value = w
      if (w === piece.width) option.selected = true
      pieceW.add(option)
    }

    // height
    const pieceH = _('#piece-h')
    for (let h = 1; h <= 8; h++) {
      const option = _('option').create(h)
      option.value = h
      if (h === piece.height) option.selected = true
      pieceH.add(option)
    }

    // rotate
    const pieceR = _('#piece-r')
    for (let r = 0; r <= 270; r += 90) {
      const option = _('option').create(r === 0 ? 'normal' : r + '°')
      option.value = r
      if (r === piece.r) option.selected = true
      pieceR.add(option)
    }

    // side
    const pieceSide = _('#piece-side')
    for (let s = 1; s <= piece.assets.length; s++) {
      let label = s
      if (s === piece.assets.length) label = 'back'
      if (s === 1) label = 'front'
      const option = _('option').create(label)
      option.value = s - 1
      if (s - 1 === piece.side) option.selected = true
      pieceSide.add(option)
    }

    // color
    const pieceColor = _('#piece-color')
    for (let c = 0; c <= 7; c++) {
      const option = _('option').create(`${c + 1} - ${colornames[c]}`)
      option.value = c
      if (c === piece.color) option.selected = true
      pieceColor.add(option)
    }

    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <button id='btn-ok' type="button" class="btn btn-primary">Apply</button>
    `

    _('#btn-close').on('click', () => getModal().hide())
    _('#btn-ok').on('click', () => modalOk())
    _('#modal').on('hidden.bs.modal', () => modalClose())

    _('#piece-label')
      .on('keydown', keydown => {
        switch (keydown.keyCode) {
          case 13: // simulate submitbutton push
            keydown.preventDefault()
            modalOk()
        }
      })

    getModal().show()

    var input = document.getElementById('piece-label')
    input.focus()
    input.select()
  }
}

// --- internal ----------------------------------------------------------------

/**
 * Hides modal and pushes changes to the state.
 */
function modalOk () {
  const piece = _('#modal').node().piece
  const updates = {}
  let value = _('#piece-label').value.trim()
  if (value !== piece.label) updates.label = value

  value = Number(_('#piece-w').value)
  if (value !== piece.width) updates.width = value

  value = Number(_('#piece-h').value)
  if (value !== piece.height) updates.height = value

  value = Number(_('#piece-r').value)
  if (value !== piece.r) updates.r = value

  value = Number(_('#piece-side').value)
  if (value !== piece.side) updates.side = value

  value = Number(_('#piece-color').value)
  if (value !== piece.color) updates.color = value

  statePieceEdit(piece.id, updates)
  getModal().hide()
}

/** our token border color names */
const colornames = ['black', 'blue', 'green', 'cyan', 'red', 'magenta', 'orange', 'ivory']
