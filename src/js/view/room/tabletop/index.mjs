/**
 * @file The actual tabletop stuff. Mainly in charge of state -> DOM
 *       propagation. Does not manipulate data nor does it do API calls.
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
  mod,
  clamp,
  shuffle,
  recordTime,
  brightness,
  equalsJSON
} from '../../../lib/utils.mjs'

import {
  getRoom,
  getTemplate,
  getTable,
  updatePieces,
  createPieces,
  deletePiece,
  numberPiece,
  flipPiece,
  movePiece,
  colorPiece,
  rotatePiece
} from '../../../state/index.mjs'

import {
  updateStatusline,
  restoreScrollPosition,
  updateMenu
} from '../../../view/room/index.mjs'

import {
  TYPE_HEX,
  ID,
  findAsset,
  findPiece,
  findPiecesWithin,
  getAssetURL,
  getMinZ,
  getMaxZ,
  getTopLeftPx,
  getPieceBounds,
  snap,
  stickyNoteColors
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  modalEdit
} from '../../../view/room/modal/edit.mjs'

import {
  modalSettings
} from '../../../view/room/modal/settings.mjs'

// --- public ------------------------------------------------------------------

export const MEDIA_BACK = '##BACK##'

/**
 * Get all currently selected pieces.
 *
 * @return {FreeDOM} Selected DOM nodes.
 */
export function getSelected () {
  return _('#tabletop .is-selected')
}

/**
 * Delete the currently selected piece from the room.
 *
 * Will silently fail if nothing is selected.
 */
export function deleteSelected () {
  getSelected().each(node => deletePiece(node.id))
}

/**
 * Show settings dialog for the current table/room.
 */
export function settings () {
  modalSettings()
}

/**
 * Show edit dialog for currently selected piece.
 *
 * Will silently fail if nothing is selected.
 */
export function editSelected () {
  const selected = getSelected()
  if (selected.exists()) {
    modalEdit(findPiece(selected.node().id))
  }
}

/**
 * Clone the currently selected piece to a given position.
 *
 * Will silently fail if nothing is selected.
 *
 * @param {Object} tile Grid x/y position (in tiles).
 */
export function cloneSelected (xy) {
  getSelected().each(node => {
    const piece = findPiece(node.id)
    const snapped = snap(xy.x, xy.y)
    piece.x = snapped.x
    piece.y = snapped.y
    piece.z = getMaxZ(piece.l) + 1
    if (piece.n > 0) { // increase piece letter (if it has one)
      piece.n = piece.n + 1
      if (piece.n >= 16) piece.n = 1
    }
    createPieces([piece], true)
  })
}

/**
 * Flip the currently selected piece to its next side.
 *
 * Will cycle the sides and silently fail if nothing is selected.
 *
 * @param {Boolean} forward If true (default), will cycle forward, otherwise backward.
 */
export function flipSelected (forward = true) {
  getSelected().each(node => {
    const piece = findPiece(node.id)
    if (piece._meta.sides > 1) {
      flipPiece(piece.id, mod(forward ? (piece.s + 1) : (piece.s - 1), piece._meta.sides))
    }
  })
}

/**
 * Switch the piece/outline color of the currently selected piece.
 *
 * Will cycle through all available colors and silently fail if nothing is selected.
 *
 * @param {boolean} outline If true, this will cycle the outline color. If false/unset,
 *                          it will cycle the piece color.
 */
export function cycleColor (outline = false) {
  getSelected().each(node => {
    const piece = findPiece(node.id)
    switch (piece.l) {
      case 'note':
        // always change base color
        colorPiece(piece.id, piece.c[0] + 1, piece.c[1])
        break
      default:
        if (outline) {
          colorPiece(piece.id, piece.c[0], piece.c[1] + 1)
        } else {
          colorPiece(piece.id, piece.c[0] + 1, piece.c[1])
        }
    }
  })
}

/**
 * Increase/decrease the token number (if it is a token).
 *
 * Will cycle through all states
 */
export function numberSelected (delta) {
  _('#tabletop .piece-token.is-selected').each(node => {
    const piece = findPiece(node.id)
    numberPiece(piece.id, piece.n + delta) // 0=nothing, 1-9, A-F
  })
}

/**
 * Randomize the seleced piece.
 *
 * What happens depends a bit on the piece type, but usually it is flipped to a
 * random side. It also gets rotated and/or moved on the dicemat, so that there
 * is a visual difference even if the same side randomly comes up.
 */
export function randomSelected () {
  const template = getTemplate()
  getSelected().each(node => {
    const piece = findPiece(node.id)
    switch (piece._meta.feature) {
      case 'DICEMAT': // dicemat: randomize all pieces on it
        randomDicemat(piece)
        break
      case 'DISCARD': // dicard pile: randomize & center & flip all pieces on it
        randomDiscard(piece)
        break
      default: // ordinary piece
        if (piece._meta.sides > 1) { // only randomize multi-sided tokens
          // slide token around
          let slideX = Math.floor(Math.random() * 3) - 1
          let slideY = Math.floor(Math.random() * 3) - 1
          if (slideX === 0 && slideY === 0) {
            slideX = 1
            slideY = 1
          }
          const offset = Math.floor(template.gridSize / 2)
          const x = Math.abs(clamp(0, piece.x + slideX * offset, (template.gridWidth - 1) * template.gridSize))
          const y = Math.abs(clamp(0, piece.y + slideY * offset, (template.gridHeight - 1) * template.gridSize))
          // send to server
          updatePieces([{
            id: node.id,
            s: Math.floor(Math.random() * piece._meta.sides),
            x: x,
            y: y
          }])
        }
    }
  })
}

/**
 * Set the table surface for the given table number.
 *
 * Will restore table settings (like scroll pos, table texture, ...) and set css classes.
 *
 * @param {Number} no Table to set (1..9).
 */
export function setTableSurface (no) {
  const tabletop = _('#tabletop')
  if (tabletop.tableNo !== no) { // no need to re-update unchanged no.
    tabletop.tableNo = no
    tabletop.remove('.table-*').add(`.table-${no}`)
    restoreScrollPosition()
  }
}

/**
 * Update or recreate the DOM node of a piece.
 *
 * Will try to minimize recreation of objects and tries to only update its
 * properties/classes if possible.
 *
 * Assumes that the caller will add a 'piece' property to the node so we can
 * detect necessary changes.
 *
 * @param {Object} piece The piece's full data object.
 * @param {Boolean} select If true, the piece should be get selected.
 * @return {FreeDOM} Created or updated node.
 */
function createOrUpdatePieceDOM (piece, select) {
  let selection = []

  // reuse existing DOM node if possible, only (re)create on major changes
  let div = _('#' + piece.id)
  let _piece = div.unique() ? div.piece : {} // get old piece out of old node
  if (
    _piece.l !== piece.l ||
    _piece.w !== piece.w ||
    _piece.h !== piece.h ||
    _piece.s !== piece.s
  ) {
    selection = _('#tabletop .is-selected').id
    if (!Array.isArray(selection)) selection = [selection] // make sure we use lists here
    div.delete()
  }
  if (!div.unique()) { // (re)create
    const node = piece.l === 'note' ? noteToNode(piece) : pieceToNode(piece)
    node.piece = {}
    _piece = {}
    if (selection.includes(piece.id)) node.add('.is-selected')
    _('#layer-' + piece.l).add(node)
  }

  // update dom infos + classes (position, rotation ...)
  const template = getTemplate()
  div = _('#' + piece.id) // fresh query

  if (_piece.x !== piece.x || _piece.y !== piece.y || _piece.z !== piece.z) {
    const tl = getTopLeftPx(piece)
    div.css({
      '--fbg-x': tl.left,
      '--fbg-y': tl.top,
      '--fbg-z': piece.z
    })
  }
  if (_piece.r !== piece.r) {
    div
      .remove('.is-rotate-*')
      .add('.is-rotate-' + piece.r)
  }
  if (_piece.w !== piece.w || _piece.h !== piece.h) {
    div
      .remove('.is-w-*', '.is-h-*')
      .add(`.is-w-${piece.w}`, `.is-h-${piece.h}`)
  }
  if (_piece.n !== piece.n) {
    div.remove('.is-n', '.is-n-*')
    if (piece.l === 'token' && piece.n !== 0) {
      div.add('.is-n', '.is-n-' + piece.n)
    }
  }

  if (_piece.c?.[0] !== piece.c[0] || _piece.c?.[1] !== piece.c[1]) {
    // (background) color
    if (piece.l === 'note') {
      div.css({
        '--fbg-color': stickyNoteColors[piece.c[0]].value,
        '--fbg-color-invert': brightness(stickyNoteColors[piece.c[0]].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
      })
    } else if (piece.l === 'overlay' || piece.l === 'other') {
      // no color
    } else if (piece._meta.hasColor) {
      if (piece.c[0] === 0) { // no/default color
        div.remove('--fbg-color', '--fbg-color-invert')
      } else { // color
        div.css({
          '--fbg-color': template.colors[piece.c[0] - 1].value,
          '--fbg-color-invert': brightness(template.colors[piece.c[0] - 1].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
        })
      }
    } else {
      const asset = findAsset(piece.a)
      if (asset) {
        div.css({
          '--fbg-color': asset.bg,
          '--fbg-color-invert': brightness(asset.bg) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
        })
      }
    }

    // border color
    div.remove('.has-border')
    if (piece._meta.hasBorder) {
      if (piece.c[1] === 0) { // no border color
        _(`#${piece.id}`).remove('--fbg-border-color', '--fbg-border-color-invert')
      } else { // color
        div.add('.has-border')
        _(`#${piece.id}`).css({
          '--fbg-border-color': template.borders[piece.c[1] - 1].value,
          '--fbg-border-color-invert': brightness(template.borders[piece.c[1] - 1].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
        })
      }
    }
  }

  // update select status
  if (select && _('#tabletop.layer-' + piece.l + '-enabled').exists()) {
    unselectPieces()
    div.add('.is-selected')
  }

  return div
}

/**
 * Add or re-set a piece.
 *
 * @param {Object} piece The piece's full data object.
 * @param {Boolean} select If true, the piece will also get selected. Defaults to false.
 */
export function setPiece (piece, select = false) {
  const node = createOrUpdatePieceDOM(piece, select)

  if (node.piece.t?.[0] !== piece.t?.[0] || !equalsJSON(node.piece.b, piece.b)) { // update label on change
    _('#' + piece.id + ' .label').delete()
    if (piece.t?.[0] || piece.b?.[0]) {
      const label = _('.label').create()
      if (piece.t?.length >= 1) {
        const span = _('span').create(piece.t[0])
        label.add(span)
      }
      let i = 1
      let iconExtra
      for (const id of piece.b ?? []) {
        const asset = findAsset(id, 'badge')
        if (asset) {
          const img = _(i <= 3 ? 'img.icon' : 'img.icon.icon-extra').create()
          if (i === 3) iconExtra = img
          if (i === 4) {
            label.add(_('span.icon-ellipsis').create('+' + (piece.b.length - 2)))
            iconExtra.add('.icon-extra')
          }
          img.src = getAssetURL(asset, 0)
          label.add(img)
          i++
        }
      }
      node.add(label)
    }
  }

  node.piece = piece // store piece for future delta-checking
}

/**
 * Add or re-set a sticky note.
 *
 * @param {Object} pieceJson The note's full data object.
 * @param {Boolean} select If true, the note will also get selected. Defaults to false.
 */
export function setNote (note, select = false) {
  const node = createOrUpdatePieceDOM(note, select)

  if (node.piece.t?.[0] !== note.t?.[0]) { // update note on change
    node.node().innerHTML = note.t?.[0] ?? ''
  }

  node.piece = note // store piece for future delta-checking
}

/**
 * Rotate the currently selected piece.
 *
 * Done in increments based on game type.
 *
 * @param {Boolean} cw Optional direction. True = CW (default), False = CCW.
 */
export function rotateSelected (cw = true) {
  const template = getTemplate()

  getSelected().each(node => {
    const piece = findPiece(node.id)
    const increment = template.type === TYPE_HEX ? 60 : 90
    const r = cw ? (piece.r + increment) : (piece.r - increment)
    rotatePiece(piece.id, r)
  })
}

/**
 * Move the currently selected piece to the top within its layer.
 *
 * Will silently fail if nothing is selected.
 */
export function toTopSelected () {
  for (const node of document.querySelectorAll('.piece.is-selected')) {
    const piece = findPiece(node.id)
    const maxZ = getMaxZ(piece.l)
    if (piece.z < maxZ) {
      movePiece(piece.id, null, null, maxZ + 1)
    }
  }
}

/**
 * Move the currently selected piece to the bottom within its layer.
 *
 * Will silently fail if nothing is selected.
 */
export function toBottomSelected () {
  for (const node of document.querySelectorAll('.piece.is-selected')) {
    const piece = findPiece(node.id)
    const minZ = getMinZ(piece.l)
    if (piece.z > minZ) {
      movePiece(piece.id, null, null, minZ - 1)
    }
  }
}

/**
 * Clear the selection of pieces.
 *
 * @param {String} layer Either 'tile', 'overlay' or 'token' to clear a specific
 *                       layer, or 'all' for all layers.
 */
export function unselectPieces (layer = 'all') {
  const filter = layer === 'all' ? '' : '.layer-' + layer
  for (const node of document.querySelectorAll(filter + ' .piece.is-selected')) {
    node.classList.remove('is-selected')
  }
  _('#popper').delete() // make sure popup is gone
}

/**
 * Get a list of all pieces' IDs that are in play.
 *
 * @return {String[]} Possibly empty array of IDs.
 */
export function getAllPiecesIds () {
  const all = _('#tabletop .piece')
  if (all.exists()) {
    return all.id
  }
  return []
}

/**
* Convert a piece data object to a DOM node.
 *
 * @param {Object} pieceJson Full piece data object.
 * @return {FreeDOM} Converted node (not added to DOM yet).
 */
export function pieceToNode (piece) {
  let node

  // create the dom node
  const asset = findAsset(piece.a)
  if (asset === null) {
    switch (piece.a) {
      case ID.POINTER:
        node = createPointerPiece(piece.l)
        break
      case ID.LOS:
        node = createLosPiece(piece.x, piece.y, piece.w, piece.h)
        break
      default:
        node = createInvalidPiece(piece.l)
    }
  } else {
    if (asset.media[piece.s] === MEDIA_BACK) { // backside piece
      const uriMask = asset.base ? getAssetURL(asset, -1) : getAssetURL(asset, 0)
      node = _(`.piece.piece-${asset.type}`).create().css({
        '--fbg-mask': url(uriMask)
      })

      // create inner div as we can't image-mask the outer without cutting the shadow
      const inner = _('.backside').create()
      node.add(inner)
    } else { // regular piece
      const uriSide = getAssetURL(asset, piece.s)
      if (asset.base) { // layered asset
        const uriBase = getAssetURL(asset, -1)
        node = _(`.piece.piece-${asset.type}.has-decal`).create().css({
          '--fbg-image': url(uriBase),
          '--fbg-decal': url(uriSide)
        })
      } else { // regular asset
        node = _(`.piece.piece-${asset.type}`).create().css({
          '--fbg-image': url(uriSide)
        })
      }
    }
    if (asset.tx) {
      node.css({
        '--fbg-material': url(`img/material-${asset.tx}.png`)
      })
    } else {
      node.remove('--fbg-material')
    }

    if (asset.type !== 'overlay' && asset.type !== 'other') {
      if (!asset.bg.match(/^[0-9][0-9]?$/)) {
        // color information is html color or 'transparent' -> apply
        node.css({ '--fbg-color': asset.bg })
      }
    }

    if (piece._meta.hasHighlight) {
      node.add('.has-highlight')
    }
  }

  // set meta-classes on node
  node.id = piece.id

  return node
}

/**
 * Convert a sticky note to a DOM node.
 *
 * @param {Object} note Full note data object.
 * @return {FreeDOM} Converted node (not added to DOM yet).
 */
export function noteToNode (note) {
  const node = _('.piece.piece-note').create()

  node.id = note.id
  node.node().innerHTML = note.t?.[0] ?? ''

  return node
}

/**
 * Convert a filename into a CSS url() and apply a scoped caching postfix.
 *
 * @param {String} file Filname for url().
 * @param {Boolean} pin If true (optional), will append room id to pin caching.
 * @return {FreeDOM} Converted node (not added to DOM yet).
 */
export function url (file, pin = true) {
  let cache = ''
  if (pin) {
    const room = getRoom()
    cache = '?r=' + encodeURI(room.id)
  }
  return `url("${encodeURI(file)}${cache}")`
}

/**
 * Add a new sticky note to the cursor position.
 *
 * This adds a enirely new note to the table via a call to the state.
 *
 * @param {Object} tile {x, y} coordinates (tile) where to add.
 */
export function createNote (xy) {
  const snapped = snap(xy.x, xy.y)
  createPieces([{
    l: 'note',
    w: 3,
    h: 3,
    x: snapped.x,
    y: snapped.y,
    z: getMaxZ('note') + 1
  }], true)
}

/**
 * Move the room content by approximately x/y.
 *
 * The actual amount will depend on the page grid so that the moved content
 * still aligns to grid snapping.
 *
 * @param Number offsetX Delta of new x position.
 * @param Number offsetY Delta of new y position.
 */
export function moveContent (offsetX, offsetY) {
  const template = getTemplate()
  switch (template.type) {
    case 'grid-hex':
      if (offsetX < 0) offsetX += 109
      if (offsetY < 0) offsetY += 63
      offsetX = Math.floor(offsetX / 110) * 110
      offsetY = Math.floor(offsetY / 64) * 64
      break
    case 'grid-square':
    default:
      if (offsetX < 0) offsetX += 63
      if (offsetY < 0) offsetY += 63
      offsetX = Math.floor(offsetX / template.gridSize) * template.gridSize
      offsetY = Math.floor(offsetY / template.gridSize) * template.gridSize
  }
  const pieces = []
  _('#tabletop .piece').each(node => {
    pieces.push({
      id: node.piece.id,
      x: node.piece.x + offsetX,
      y: node.piece.y + offsetY
    })
  })
  updatePieces(pieces)
}

/**
 * Update the DOM to reflect the given table data.
 *
 * Will add new, update existing and delete obsolte pieces.
 *
 * @param {Array} tableNo Table number to display.
 * @param {Array} selectIds Optional array of IDs to re-select after update.
 */
export function updateTabletop (tableNo, selectIds = []) {
  const tableData = getTable(tableNo)
  const start = Date.now()

  setTableSurface(tableNo)

  const keepIds = []
  cleanupTable()
  for (const item of tableData) {
    setItem(item, selectIds.includes(item.id))
    keepIds.push(item.id)
  }
  removeObsoletePieces(keepIds)
  updateMenu()
  updateStatusline()

  recordTime('sync-ui', Date.now() - start)
}

/**
 * Move the pointer to the given location.
 *
 * @param {Object} coords {x, y} object, in table px.
 */
export function pointTo (coords) {
  const template = getTemplate()
  const room = getRoom()

  coords.x = clamp(0, coords.x, room.width - template.gridSize - 1)
  coords.y = clamp(0, coords.y, room.height - template.gridSize - 1)

  const snapped = snap(coords.x, coords.y)

  createPieces([{ // always create (even if it is a move)
    a: ID.POINTER,
    l: 'other',
    w: 1,
    h: 1,
    x: snapped.x,
    y: snapped.y,
    z: getMaxZ('other') + 1
  }])
}

/**
 * Persist the LOS line on the server
 *
 * @param {Object} from {x, y} object, in table px.
 * @param {Object} to {x, y} object, in table px.
 */
export function losTo (x, y, w, h) {
  if (w !== 0 || h !== 0) {
    createPieces([{
      a: ID.LOS,
      l: 'other',
      x: x,
      y: y,
      w: w,
      h: h,
      z: getMaxZ('other') + 1
    }])
  }
}

/**
 * Move a (dragging) piece to the current mouse position.
 *
 * @param {Element} element The HTML node to update.
 * @param {Number} x New x coordinate in px.
 * @param {Number} y New y coordinate in px.
 */
export function moveNodeToSnapped (element, x, y) {
  const template = getTemplate()

  x = clamp(0, x, template._meta.widthPx - 0 - 1)
  y = clamp(0, y, template._meta.heightPx - 0 - 1)

  const snapped = snap(x, y)
  element.x = Math.max(0, snapped.x)
  element.y = Math.max(0, snapped.y)

  const tl = getTopLeftPx(element.piece, element.x, element.y)
  element.style.left = tl.left
  element.style.top = tl.top
}

/**
 * Create an asset node for invalid assets / ids.
 *
 * @param {Number} x X-coordinate of starting point in px.
 * @param {Number} y Y-coordinate of starting point in px.
 * @param {Number} w Width in px. Can be negative.
 * @param {Number} h Height in px. Can be negative.
 * @return {FreeDOM} dummy node.
 */
export function createLosPiece (x, y, width, height) {
  const stroke = 4
  const padding = stroke / 2
  const x1 = (width >= 0 ? padding : -width + padding)
  const y1 = (height >= 0 ? padding : -height + padding)
  const x2 = (width >= 0 ? width + padding : padding)
  const y2 = (height >= 0 ? height + padding : padding)

  // container svg
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('viewBox', `0 0 ${Math.abs(width) + padding * 2} ${Math.abs(height) + padding * 2}`)
  svg.setAttribute('stroke', 'black')
  svg.classList.add('piece', 'piece-other', 'is-los')

  // base line
  const base = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  base.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  base.setAttribute('stroke-linecap', 'round')
  base.setAttribute('stroke-linejoin', 'round')
  base.setAttribute('stroke', '#ad371a') // red thread
  base.setAttribute('stroke-width', stroke - 1)
  svg.appendChild(base)

  // thicker line
  const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  shape.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  shape.setAttribute('stroke-linecap', 'round')
  shape.setAttribute('stroke-linejoin', 'round')
  shape.setAttribute('stroke-dasharray', '5,10')
  shape.setAttribute('stroke', '#ad371a') // red thread
  shape.setAttribute('stroke-width', stroke)
  svg.appendChild(shape)

  // shade line
  const shade = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  shade.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  shade.setAttribute('stroke-linecap', 'round')
  shade.setAttribute('stroke-linejoin', 'round')
  shade.setAttribute('stroke-dasharray', '3,12')
  shade.setAttribute('stroke-dashoffset', -1)
  shade.setAttribute('stroke-opacity', 0.05)
  shade.setAttribute('stroke', '#ffffff') // red thread
  shade.setAttribute('stroke-width', stroke - 1)
  svg.appendChild(shade)

  svg.style.left = (width < 0 ? x + width : x) - stroke / 2 + 'px'
  svg.style.top = (height < 0 ? y + height : y) - stroke / 2 + 'px'
  svg.style.width = Math.abs(width) + stroke + 'px'
  svg.style.height = Math.abs(height) + stroke + 'px'
  svg.style.zIndex = 999999999

  return _(svg)
}

// --- internal ----------------------------------------------------------------

/**
 * Remove dirty / obsolete / bad pieces from room.
 *
 * Usually called during library sync.
 */
function cleanupTable () {
  _('#tabletop .piece.is-invalid').delete()
}

/**
 * Create an asset node for invalid assets / ids.
 *
 * @param {String} type Asset type (token, tile, ...).
 * @return {FreeDOM} dummy node.
 */
function createInvalidPiece (type) {
  return _(`.piece.piece-${type}.is-invalid`).create()
}

/**
 * Create an asset node for invalid assets / ids.
 *
 * @param {String} type Asset type (token, tile, ...).
 * @return {FreeDOM} dummy node.
 */
function createPointerPiece () {
  return _('.piece.piece-other.is-pointer').create()
}

/**
 * Randomice the items (dice) on a dicemat node.
 *
 * @param {Object} dicemat Dicemat object.
 */
function randomDicemat (dicemat) {
  const template = getTemplate()
  const coords = []
  const pieces = []
  for (let x = 0; x < Math.min(dicemat.w, 4); x++) {
    for (let y = 0; y < Math.min(dicemat.h, 4); y++) {
      coords.push({ // a max. 4x4 area in the center of the dicemat
        x: (Math.max(0, Math.floor((dicemat.w - 4) / 2)) + x + 0.5) * template.gridSize,
        y: (Math.max(0, Math.floor((dicemat.h - 4) / 2)) + y + 0.5) * template.gridSize
      })
    }
  }

  for (const piece of findPiecesWithin(getPieceBounds(dicemat), dicemat.l)) {
    if (piece._meta.feature === 'DICEMAT') continue // don't touch the dicemat

    // pick one random position
    let coord = { x: 0, y: 0 }
    let index = Math.floor(Math.random() * coords.length)
    if (coords[index].x === piece.x && coords[index].y === piece.y) {
      index = mod(index + 1, coords.length)
    }
    coord = coords[index]
    coords.splice(index, 1)

    // update the piece
    pieces.push({
      id: piece.id,
      s: Math.floor(Math.random() * piece._meta.sides),
      x: dicemat.x - dicemat._meta.widthPx / 2 + coord.x,
      y: dicemat.y - dicemat._meta.heightPx / 2 + coord.y
    })
  }
  updatePieces(pieces)
}

/**
 * Randomice the pieces on a discard pile node.
 *
 * @param {Object} discard Discard pile object.
 */
function randomDiscard (discard) {
  const pieces = []
  let stackSide = -1

  const stack = findPiecesWithin(getPieceBounds(discard), discard.l)

  // shuffle z positions above the dicard pile piece
  const discardZ = discard.z
  const z = []
  for (let i = 0; i < stack.length; i++) {
    z.push(discardZ + i + 1)
  }
  shuffle(z)

  for (const piece of stack) {
    if (piece._meta.feature === 'DISCARD') continue // don't touch the discard pile piece

    // detect the side to flip them to
    if (stackSide < 0) {
      // fip all pices, based on the state of the first one
      if (piece.s === 0) {
        stackSide = Math.max(0, piece._meta.sides - 1)
      } else {
        stackSide = 0
      }
    }

    // update the piece
    pieces.push({
      id: piece.id,
      s: stackSide,
      x: discard.x,
      y: discard.y,
      z: z.pop()
    })
  }
  updatePieces(pieces)
}

/**
 * Detect deleted pieces and remove them from the room.
 *
 * @param {String[]} keepIds IDs of pieces to keep.
 */
function removeObsoletePieces (keepIds) {
  // get all piece IDs from dom
  let ids = getAllPiecesIds()
  ids = Array.isArray(ids) ? ids : [ids]

  // remove ids from list that are still there
  for (const id of keepIds) {
    ids = ids.filter(item => item !== id)
  }

  // remove ids from list that are dragndrop targets
  ids = ids.filter(item => !item.endsWith('-drag'))

  // delete ids that are still left
  for (const id of ids) {
    _('#' + id).delete()
  }
}

/**
 * Trigger UI update for new/changed server items.
 *
 * @param {Object} piece Piece to add/update.
 * @param {Boolean} selected If true, this item will be selected.
 */
function setItem (piece, selected) {
  switch (piece.l) {
    case 'tile':
    case 'token':
    case 'overlay':
    case 'other':
      setPiece(piece, selected)
      break
    case 'note':
      setNote(piece, selected)
      break
    default:
      // ignore unkown piece type
  }
}
