/**
 * @file Handles the piece editor modals.
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
import * as Content from '../../../../view/room/tabletop/content.mjs'
import * as Dom from '../../../../view/room/tabletop/dom.mjs'
import * as Modal from '../../../../view/room/modal.mjs'
import * as ModalNote from './note.mjs'
import * as ModalOther from './other.mjs'
import * as ModalTile from './tile.mjs'
import * as ModalToken from './token.mjs'
import * as State from '../../../../state/index.mjs'
import * as Text from '../../../../lib/util-text.mjs'
import * as Util from '../../../../lib/util.mjs'

/**
 * Show the edit-piece modal.
 *
 * @param {object} piece A piece to show.
 */
export function open (piece) {
  if (piece != null && !Modal.isOpen()) {
    const node = Modal.create()
    node.piece = piece

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">Edit</h3>
    `

    let save = null
    switch (piece.l) {
      case Content.LAYER.NOTE:
        save = ModalNote.create(piece)
        break
      case Content.LAYER.TILE:
      case Content.LAYER.STICKER:
        save = ModalTile.create(piece)
        break
      case Content.LAYER.OTHER:
        save = ModalOther.create(piece)
        break
      case Content.LAYER.TOKEN:
      default:
        save = ModalToken.create(piece)
        break
    }

    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <button id='btn-ok' type="button" class="btn btn-primary">Apply</button>
    `

    _('#btn-close').on('click', () => Modal.close())
    _('#btn-ok').on('click', () => save() && Modal.close())

    Modal.open()

    const input = document.getElementById('piece-label')
    input?.focus()
    input?.select()
  }
}

/**
 * Populate modal field(s) with badge information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupBadge (piece) {
  // badges
  const badges = _('#piece-badges')
  for (const badge of State.getLibrary().badge) {
    const span = _('span.toggle-icon').create().css({
      backgroundImage: `url('${Dom.getAssetURL(badge)}'`
    }).on('click', () => {
      span.toggle('.active')
    })
    if (piece.b?.includes(badge.id)) span.add('.active')
    span.badge = badge
    span.title = Text.prettyName(badge.name)
    badges.add(span)
  }
}

/**
 * Set update object's badge field if it was changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateBadge (piece, updates) {
  const b = []
  for (const node of _('#piece-badges .active').nodes()) {
    b.push(node.badge.id)
  }
  if (!Util.equalsJSON(piece.b, b)) {
    updates.b = b
  }
}

/**
 * Populate modal field(s) with color information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupColor (piece) {
  const pieceColor = _('#piece-color')
  const setup = State.getSetup()

  // default/none color
  const option = _('option').create('none')
  option.value = 0
  if (piece.c[0] === 0) option.selected = true
  pieceColor.add(option)

  // other colors
  for (let c = 1; c <= setup.colors.length; c++) {
    const option = _('option').create(setup.colors[c - 1].name)
    option.value = c
    if (c === piece.c[0]) option.selected = true
    pieceColor.add(option)
  }
}

/**
 * Populate modal field(s) with border color information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupColorBorder (piece) {
  // border color
  const borderColor = _('#piece-border')
  const setup = State.getSetup()

  // default/none color
  const option = _('option').create('none')
  option.value = 0
  if (piece.c[1] === 0) option.selected = true
  borderColor.add(option)

  // other colors
  for (let c = 1; c <= setup.borders.length; c++) {
    const option = _('option').create(setup.borders[c - 1].name)
    option.value = c
    if (c === piece.c[1]) option.selected = true
    borderColor.add(option)
  }
}

/**
 * Set update object's color field if it was changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateColor (piece, updates) {
  const c = Number(_('#piece-color').value)
  if (c !== piece.c[0]) {
    updates.c = [c]
  }
}

/**
 * Set update object's color and border color fields if they were changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateColorBorder (piece, updates) {
  const c = Number(_('#piece-color').value)
  const c2 = Number(_('#piece-border').value)
  if (c !== piece.c[0] || c2 !== piece.c[1]) {
    updates.c = [c, c2]
  }
}

/**
 * Set update object's flags field if it was changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateFlags (piece, updates) {
  let flags = 0

  if (_('#piece-no-move').checked) flags |= Content.FLAG.NO_MOVE
  if (_('#piece-no-delete').checked) flags |= Content.FLAG.NO_DELETE
  if (_('#piece-no-clone').checked) flags |= Content.FLAG.NO_CLONE
  const tileGrid = _('#piece-grid')
  if (tileGrid.exists()) {
    if (tileGrid.value === 'minor') flags |= Content.FLAG.TILE_GRID_MINOR
    if (tileGrid.value === 'major') flags |= Content.FLAG.TILE_GRID_MAJOR
  }
  const noteType = _('#piece-note-type')
  if (noteType.exists() && noteType.value === 'tl') flags |= Content.FLAG.NOTE_TOPLEFT

  if (flags !== piece.f) updates.f = flags
}

/**
 * Populate modal field(s) with label information.
 *
 * @param {object} piece The piece's data object.
 * @param {Function} onEnter Optional callback to be run on enter.
 */
export function setupLabel (piece, onEnter) {
  const label = _('#piece-label')
  label.value = piece.t?.[0] ?? ''
  if (onEnter) {
    label.on('keydown', keydown => {
      switch (keydown.keyCode) {
        case 13: // simulate submitbutton push
          keydown.preventDefault()
          onEnter() && Modal.close()
      }
    })
  }
}

/**
 * Set update object's label field if it was changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateLabel (piece, updates) {
  const label = _('#piece-label').value.trim()
  if (piece.t?.length > 0) { // piece had label
    if (label.length <= 0) {
      updates.l = piece.l
      updates.t = []
    } else if (label !== piece.t?.[0]) {
      updates.l = piece.l
      updates.t = [label]
    }
  } else if (label?.length > 0) {
    updates.l = piece.l
    updates.t = [label]
  }
}

/**
 * Populate modal field(s) with grid information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupGrid (piece) {
  // piece number
  const grid = _('#piece-grid')

  let option = _('option').create('None')
  option.value = 'none'
  if (!(piece.f & Content.FLAG.TILE_GRID_MINOR || piece.f & Content.FLAG.TILE_GRID_MAJOR)) option.selected = true
  grid.add(option)

  option = _('option').create('Minor')
  option.value = 'minor'
  if (piece.f & Content.FLAG.TILE_GRID_MINOR) option.selected = true
  grid.add(option)

  option = _('option').create('Major')
  option.value = 'major'
  if (piece.f & Content.FLAG.TILE_GRID_MAJOR) option.selected = true
  grid.add(option)
}

/**
 * Populate modal field(s) with number information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupNumber (piece) {
  // piece number
  const pieceNo = _('#piece-number')
  const option = _('option').create('none')
  option.value = 0
  if (piece.n === 0) option.selected = true
  pieceNo.add(option)
  for (let n = 1; n <= 35; n++) {
    const letter = n <= 9 ? String.fromCharCode(48 + n) : String.fromCharCode(64 + n - 9)
    const option = _('option').create(letter)
    option.value = n
    if (n === piece.n) option.selected = true
    pieceNo.add(option)
  }
}

/**
 * Set update object's number field if it was changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateNumber (piece, updates) {
  const n = Number(_('#piece-number').value)
  if (n !== piece.n) updates.n = n
}

/**
 * Populate modal field(s) with rotate information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupRotate (piece) {
  const pieceR = _('#piece-r')
  const increment = State.getRoomPreference(State.PREF.PIECE_ROTATE)
  for (let r = 0; r < 360; r += increment) {
    const option = _('option').create(r === 0 ? '0°' : r + '°')
    option.value = r
    if (r === piece.r) option.selected = true
    pieceR.add(option)
  }
}

/**
 * Set update object's rotate field if it was changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateRotate (piece, updates) {
  const r = Number(_('#piece-r').value)
  if (r !== piece.r) updates.r = r
}

/**
 * Populate modal field(s) with side information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupSide (piece) {
  const pieceSide = _('#piece-side')
  const sides = piece._meta.sides + piece._meta.sidesExtra
  for (let s = 1; s <= sides; s++) {
    let label = s
    if (piece._meta.sides <= 1) {
      if (s >= piece._meta.sides) label = 'Back'
      if (s === 1) label = 'Front'
    }
    const option = _('option').create(label)
    option.value = s - 1
    if (s - 1 === piece.s) option.selected = true
    pieceSide.add(option)
  }
}

/**
 * Set update object's side field if it was changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateSide (piece, updates) {
  const side = Number(_('#piece-side').value)
  if (side !== piece.s) updates.s = side
}

/**
 * Populate modal field(s) with size information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupSize (piece) {
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
}

/**
 * Set update object's width & height fields if they were changed.
 *
 * @param {object} piece The piece's data object.
 * @param {object} updates The update object for the API call.
 */
export function updateSize (piece, updates) {
  const w = Number(_('#piece-w').value)
  const h = Number(_('#piece-h').value)
  if (w !== piece.w || h !== piece.h) { // always send both
    updates.w = w
    updates.h = h
  }
}

/**
 * Populate modal field(s) with flags information.
 *
 * @param {object} piece The piece's data object.
 */
export function setupFlags (piece) {
  _('#piece-no-move').checked = piece.f & Content.FLAG.NO_MOVE
  _('#piece-no-delete').checked = piece.f & Content.FLAG.NO_DELETE
  _('#piece-no-clone').checked = piece.f & Content.FLAG.NO_CLONE
}
