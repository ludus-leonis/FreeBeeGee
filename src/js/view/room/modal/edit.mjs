/**
 * @file Handles the piece editor modal.
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

import _ from '../../../lib/FreeDOM.mjs'

import {
  getLibrary,
  getTemplate,
  editPiece
} from '../../../state/index.mjs'

import {
  createModal,
  getModal,
  isModalActive,
  modalClose
} from '../../../view/modal.mjs'

import {
  TYPE_HEX,
  stickyNoteColors,
  getAssetURL
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  prettyName,
  equalsJSON
} from '../../../lib/utils.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the edit-piece modal.
 *
 * @param {Object} piece The piece's data object.
 */
export function modalEdit (piece) {
  if (piece != null && !isModalActive()) {
    const node = createModal()
    node.piece = piece

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">Edit</h3>
    `
    _('#modal-body').innerHTML = getModalBody(piece)

    // label
    _('#piece-label').value = piece.t?.[0] ?? ''

    // badges
    const badges = _('#piece-badges')
    for (const badge of getLibrary().badge) {
      const span = _('span.toggle-icon').create().css({
        backgroundImage: `url('${getAssetURL(badge)}'`
      }).on('click', () => {
        span.toggle('.active')
      })
      if (piece.b?.includes(badge.id)) span.add('.active')
      span.badge = badge
      span.title = prettyName(badge.name)
      badges.add(span)
    }

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
    for (let r = 0; r < 360; r += getTemplate().type === TYPE_HEX ? 60 : 90) {
      const option = _('option').create(r === 0 ? '0°' : r + '°')
      option.value = r
      if (r === piece.r) option.selected = true
      pieceR.add(option)
    }

    // side
    const pieceSide = _('#piece-side')
    for (let s = 1; s <= piece._meta.sides; s++) {
      let label = s
      if (s === piece._meta.sides) label = 'back'
      if (s === 1) label = 'front'
      const option = _('option').create(label)
      option.value = s - 1
      if (s - 1 === piece.s) option.selected = true
      pieceSide.add(option)
    }

    // piece color
    const pieceColor = _('#piece-color')
    const template = getTemplate()
    if (piece.l === 'note') {
      for (let c = 0; c < stickyNoteColors.length; c++) {
        const option = _('option').create(stickyNoteColors[c].name)
        option.value = c
        if (c === piece.c[0]) option.selected = true
        pieceColor.add(option)
      }
    } else {
      // default/none color
      const option = _('option').create('none')
      option.value = 0
      if (piece.c[0] === 0) option.selected = true
      pieceColor.add(option)

      // other colors
      for (let c = 1; c <= template.colors.length; c++) {
        const option = _('option').create(template.colors[c - 1].name)
        option.value = c
        if (c === piece.c[0]) option.selected = true
        pieceColor.add(option)
      }
    }

    // border color
    const borderColor = _('#piece-border')
    if (piece.l === 'note') {
      const option = _('option').create('none')
      option.value = 0
      option.selected = true
      borderColor.add(option)
    } else {
      // default/none color
      const option = _('option').create('none')
      option.value = 0
      if (piece.c[1] === 0) option.selected = true
      borderColor.add(option)

      // other colors
      for (let c = 1; c <= template.borders.length; c++) {
        const option = _('option').create(template.borders[c - 1].name)
        option.value = c
        if (c === piece.c[1]) option.selected = true
        borderColor.add(option)
      }
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

function getModalBody (piece) {
  switch (piece.l) {
    case 'note':
      return getModalNote(piece)
    case 'tile':
    case 'overlay':
      return getModalTile(piece)
    case 'other':
      return getModalOther(piece)
    case 'token':
    default:
      return getModalToken(piece)
  }
}

function getModalToken (piece) {
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
    <form class="container">
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
      </div>
    </form>
  `
}

function getModalOther () {
  return `
    <form class="container">
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <div class="row">
        <div class="col-12">
          <label for="piece-label">Label</label>
          <input id="piece-label" name="piece-label" type="text" maxlength="32">
        </div>
        <div class="col-4">
          <label for="piece-w">Width</label>
          <select id="piece-w" name="piece-w"></select>
        </div>
        <div class="col-4">
          <label for="piece-h">Height</label>
          <select id="piece-h" name="piece-h"></select>
        </div>
        <div class="col-6 col-lg-3 is-hidden">
          <label for="piece-r">Rotate</label>
          <select id="piece-r" name="piece-r"></select>
        </div>
        <div class="col-4">
          <label for="piece-side">Side</label>
          <select id="piece-side" name="piece-side"></select>
        </div>
        <div class="col-6 is-hidden">
          <label for="piece-color">Color</label>
          <select id="piece-color" name="piece-color"></select>
        </div>
        <div class="col-6 is-hidden">
          <label for="piece-border">Border</label>
          <select id="piece-border" name="piece-border"></select>
        </div>
        <div class="col-6 is-hidden">
          <label for="piece-number">Number</label>
          <select id="piece-number" name="piece-number"></select>
        </div>
      </div>
    </form>
  `
}

function getModalTile () {
  return `
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
        <div class="col-6 is-hidden">
          <label for="piece-color">Color</label>
          <select id="piece-color" name="piece-color"></select>
        </div>
        <div class="col-6 is-hidden">
          <label for="piece-border">Border</label>
          <select id="piece-border" name="piece-border"></select>
        </div>
        <div class="col-6 is-hidden">
          <label for="piece-number">Number</label>
          <select id="piece-number" name="piece-number"></select>
        </div>
      </div>
    </form>
  `
}

function getModalNote () {
  return `
    <form class="container">
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <div class="row">
        <div class="col-12">
          <label for="piece-label">Label</label>
          <input id="piece-label" name="piece-label" type="text" maxlength="128">
        </div>
        <div class="col-6 col-lg-3">
          <label for="piece-w">Width</label>
          <select id="piece-w" name="piece-w"></select>
        </div>
        <div class="col-6 col-lg-3">
          <label for="piece-h">Height</label>
          <select id="piece-h" name="piece-h"></select>
        </div>
        <div class="col-6 col-lg-3 is-hidden">
          <label for="piece-r">Rotate</label>
          <select id="piece-r" name="piece-r"></select>
        </div -->
        <div class="col-6 col-lg-3 is-hidden">
          <label for="piece-side">Side</label>
          <select id="piece-side" name="piece-side"></select>
        </div>
        <div class="col-12 col-lg-6">
          <label for="piece-color">Color</label>
          <select id="piece-color" name="piece-color"></select>
        </div>
        <div class="col-6 is-hidden">
          <label for="piece-border">Border</label>
          <select id="piece-border" name="piece-border"></select>
        </div>
        <div class="col-6 is-hidden">
          <label for="piece-number">Number</label>
          <select id="piece-number" name="piece-number"></select>
        </div>
      </div>
    </form>
  `
}

/**
 * Hides modal and pushes changes to the state.
 */
function modalOk () {
  const piece = _('#modal').node().piece
  const updates = {}

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

  const b = []
  for (const node of _('#piece-badges .active').nodes()) {
    b.push(node.badge.id)
  }
  if (!equalsJSON(piece.b, b)) {
    updates.b = b
  }

  const w = Number(_('#piece-w').value)
  const h = Number(_('#piece-h').value)
  if (w !== piece.w || h !== piece.h) { // always send both
    updates.w = w
    updates.h = h
  }

  const r = Number(_('#piece-r').value)
  if (r !== piece.r) updates.r = r

  const side = Number(_('#piece-side').value)
  if (side !== piece.s) updates.s = side

  const c = Number(_('#piece-color').value)
  const c2 = Number(_('#piece-border').value)
  if (c !== piece.c[0] || c2 !== piece.c[1]) {
    updates.c = [c, c2]
  }

  const n = Number(_('#piece-number').value)
  if (n !== piece.n) updates.n = n

  editPiece(piece.id, updates)
  getModal().hide()
}
