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

import { getTemplate, statePieceEdit } from '../state.js'
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
          <div class="col-6">
            <label for="piece-border">Color</label>
            <select id="piece-border" name="piece-color"></select>
          </div>
          <div class="col-6">
            <label for="piece-number">Number</label>
            <select id="piece-number" name="piece-number"></select>
          </div>
        </div>
      </form>
    `
    // label
    _('#piece-label').value = piece.label

    // piece number
    const pieceNo = _('#piece-number')
    const option = _('option').create('none')
    option.value = 0
    if (piece.n === 0) option.selected = true
    pieceNo.add(option)
    for (let w = 1; w <= 15; w++) {
      const letter = w <= 9 ? String.fromCharCode(48 + w) : String.fromCharCode(64 + w - 9)
      const option = _('option').create(letter)
      option.value = w
      if (w === piece.n) option.selected = true
      pieceNo.add(option)
    }

    // width
    const pieceW = _('#piece-w')
    for (let w = 1; w <= 32; w++) {
      const option = _('option').create(w)
      option.value = w
      if (w === piece.w) option.selected = true
      pieceW.add(option)
    }

    // height
    const pieceH = _('#piece-h')
    for (let h = 1; h <= 32; h++) {
      const option = _('option').create(h)
      option.value = h
      if (h === piece.h) option.selected = true
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
    for (let s = 1; s <= piece._sides; s++) {
      let label = s
      if (s === piece._sides) label = 'back'
      if (s === 1) label = 'front'
      const option = _('option').create(label)
      option.value = s - 1
      if (s - 1 === piece.side) option.selected = true
      pieceSide.add(option)
    }

    // border color
    const pieceColor = _('#piece-border')
    const template = getTemplate()
    for (let c = 0; c < template.colors.length; c++) {
      const option = _('option').create(template.colors[c].name)
      option.value = c
      if (c === piece.border) option.selected = true
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
  if (value !== piece.w) updates.w = value

  value = Number(_('#piece-h').value)
  if (value !== piece.h) updates.h = value

  value = Number(_('#piece-r').value)
  if (value !== piece.r) updates.r = value

  value = Number(_('#piece-side').value)
  if (value !== piece.side) updates.side = value

  value = Number(_('#piece-border').value)
  if (value !== piece.border) updates.border = value

  value = Number(_('#piece-number').value)
  if (value !== piece.n) updates.no = value

  statePieceEdit(piece.id, updates)
  getModal().hide()
}
