/**
 * @file The actual tabletop stuff. Mainly in charge of state -> DOM
 *       propagation. Does not manipulate data nor does it do API calls.
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

import { marked } from 'marked'

import _ from '../../../lib/FreeDOM.mjs'

import {
  mod,
  clamp,
  shuffle,
  recordTime,
  brightness,
  equalsJSON,
  sortByNumber
} from '../../../lib/utils.mjs'

import {
  FLAG_NO_CLONE,
  FLAG_NO_MOVE,
  FLAG_NOTE_TOPLEFT,
  PREFS,
  getRoom,
  getSetup,
  getTable,
  getMaterialMedia,
  updatePieces,
  createPieces,
  deletePiece,
  numberPiece,
  flipPiece,
  movePieces,
  movePiecePatch,
  colorPiece,
  rotatePiece,
  getRoomPreference
} from '../../../state/index.mjs'

import {
  selectionGetPieces,
  selectionGetIds,
  selectionAdd,
  selectionClear,
  selectionGetFeatures,
  findMaxZBelowSelection,
  findMinZBelowSelection
} from './selection.mjs'

import {
  updateStatusline,
  restoreScrollPosition,
  updateMenu,
  zoomCoordinates,
  setupZoom
} from '../../../view/room/index.mjs'

import {
  FEATURE_DICEMAT,
  FEATURE_DISCARD,
  LAYER_TILE,
  LAYER_OVERLAY,
  LAYER_NOTE,
  LAYER_TOKEN,
  LAYER_OTHER,
  TYPE_HEX,
  TYPE_HEX2,
  ID,
  findAsset,
  findPiece,
  findPiecesWithin,
  getAssetURL,
  getMaxZ,
  getTopLeft,
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

import {
  popupHide
} from '../../../view/room/tabletop/popup.mjs'

// --- public ------------------------------------------------------------------

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

/**
 * Delete the currently selected piece from the room.
 *
 * Will silently fail if nothing is selected.
 */
export function deleteSelected () {
  if (!selectionGetFeatures().delete) return

  for (const piece of selectionGetPieces()) {
    deletePiece(piece.id)
  }
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
  if (!selectionGetFeatures().edit) return

  const selected = selectionGetPieces()
  if (selected.length === 1) {
    modalEdit(findPiece(selected[0].id))
  }
}

/**
 * Clone the currently selected piece(s) to a given position.
 *
 * Will silently fail if nothing is selected.
 *
 * @param {Object} tile Grid x/y position (in tiles).
 */
export function cloneSelected (xy) {
  const clones = []
  const features = selectionGetFeatures()
  const bounds = features.boundingBox
  if (!features.clone) return

  const room = getRoom()

  // make sure the clone fits on the table
  xy.x = clamp(bounds.w / 2, xy.x, room.width - 1 - bounds.w / 2)
  xy.y = clamp(bounds.h / 2, xy.y, room.height - 1 - bounds.h / 2)

  const zLower = findMaxZBelowSelection(xy.x, xy.y)
  const zUpper = {} // one z per layer
  for (const piece of sortByNumber(selectionGetPieces(), 'z', 0)) {
    if (piece.f & FLAG_NO_CLONE) continue
    const selectionOffset = {
      x: piece.x - bounds.x,
      y: piece.y - bounds.y
    }
    const snapped = snap(xy.x + selectionOffset.x, xy.y + selectionOffset.y)
    const clone = JSON.parse(JSON.stringify(piece))
    clone.x = snapped.x
    clone.y = snapped.y
    zUpper[clone.l] = (zUpper[clone.l] ?? 0) + 1 // init or increase
    clone.z = (zLower[clone.l] ?? 0) + zUpper[clone.l]
    if (clone.n > 0) { // increase clone letter (if it has one)
      clone.n = clone.n + 1
      if (clone.n >= 36) clone.n = 1
    }
    clones.push(clone)
  }
  if (clones.length > 0) {
    selectionClear()
    createPieces(clones, true)
  }
}

/**
 * Flip the currently selected piece to its next side.
 *
 * Will cycle the sides and silently fail if nothing is selected.
 *
 * @param {Boolean} forward If true (default), will cycle forward, otherwise backward.
 */
export function flipSelected (forward = true) {
  if (!selectionGetFeatures().flip) return

  for (const piece of selectionGetPieces()) {
    const sides = piece._meta.sides + piece._meta.sidesExtra
    if (sides > 1) {
      flipPiece(piece.id, mod(piece.s + (forward ? +1 : -1), sides))
    }
  }
}

/**
 * Switch the piece/border color of the currently selected piece.
 *
 * Will cycle through all available colors and silently fail if nothing is selected.
 *
 * @param {boolean} border If true, this will cycle the border color.
 */
export function colorSelected (border = false) {
  if (border) {
    if (!selectionGetFeatures().border) return
  } else {
    if (!selectionGetFeatures().color) return
  }

  for (const piece of selectionGetPieces()) {
    switch (piece.l) {
      case LAYER_NOTE:
        // always change base color
        colorPiece(piece.id, piece.c[0] + 1, piece.c[1])
        break
      default:
        if (border) {
          colorPiece(piece.id, piece.c[0], piece.c[1] + 1)
        } else {
          colorPiece(piece.id, piece.c[0] + 1, piece.c[1])
        }
    }
  }
}

/**
 * Pile up all selected pieces.
 *
 * Will silently fail if nothing is selected or items are locked.
 *
 * @param {boolean} randomize If the z order of all items will be randomized.
 */
export function pileSelected (randomize = false) {
  const features = selectionGetFeatures()
  const snapped = snap(features.boundingBox.x, features.boundingBox.y)
  const toMove = []
  const z = []

  for (const piece of selectionGetPieces()) {
    if (piece.f & FLAG_NO_MOVE) return // abort if one no-mover is here
    toMove.push({
      id: piece.id,
      x: snapped.x,
      y: snapped.y,
      z: piece.z
    })
    z.push(piece.z) // keep for shuffling
  }
  if (randomize) {
    shuffle(z)
    for (const piece of toMove) {
      piece.z = z.pop()
    }
  }

  movePieces(toMove)
}

/**
 * Increase/decrease the token number (if it is a token).
 *
 * Will cycle through all states
 */
export function numberSelected (delta) {
  if (!selectionGetFeatures().number) return

  for (const piece of selectionGetPieces()) {
    if (piece.l === LAYER_TOKEN) {
      numberPiece(piece.id, piece.n + delta) // 0=nothing, 1-9, A-F
    }
  }
}

/**
 * Randomize the seleced piece.
 *
 * What happens depends a bit on the piece type, but usually it is flipped to a
 * random side. It also gets rotated and/or moved on the dicemat, so that there
 * is a visual difference even if the same side randomly comes up.
 */
export function randomSelected () {
  const setup = getSetup()

  if (!selectionGetFeatures().random) return

  for (const piece of selectionGetPieces()) {
    switch (piece._meta.feature) {
      case FEATURE_DICEMAT: // dicemat: randomize all pieces on it
        randomDicemat(piece)
        break
      case FEATURE_DISCARD: // dicard pile: randomize & center & flip all pieces on it
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
          const offset = Math.floor(setup.gridSize / 2)
          const x = Math.abs(clamp(0, piece.x + slideX * offset, (setup.gridWidth - 1) * setup.gridSize))
          const y = Math.abs(clamp(0, piece.y + slideY * offset, (setup.gridHeight - 1) * setup.gridSize))
          // send to server
          updatePieces([{
            id: piece.id,
            s: Math.floor(Math.random() * piece._meta.sides),
            x,
            y
          }])
        }
    }
  }
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
 * @return {FreeDOM} Created or updated node.
 */
function createOrUpdatePieceDOM (piece) {
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
    selection = selectionGetIds()
    div.delete()
  }
  if (!div.unique()) { // (re)create
    const node = piece.l === LAYER_NOTE ? noteToNode(piece) : pieceToNode(piece)
    node.piece = _piece
    _piece = {}
    _('#layer-' + piece.l).add(node)
    if (selection.includes(piece.id)) selectionAdd(piece.id)
  }

  // update dom infos + classes (position, rotation ...)
  const setup = getSetup()
  div = _('#' + piece.id) // fresh query

  if (_piece.x !== piece.x || _piece.y !== piece.y || _piece.z !== piece.z) {
    const tl = getTopLeft(piece)
    div.css({
      '--fbg-x': tl.left + 'px',
      '--fbg-y': tl.top + 'px',
      '--fbg-z': piece.z
    })
  }
  if (_piece.r !== piece.r) {
    div.remove('.is-r-*')
    if (piece.l !== LAYER_OTHER) {
      div.add(`.is-r-${piece.r}`)
      if (Math.abs(_piece.r - piece.r) > 180) {
        div.add(`.is-delay-r-${_piece.r}`)
      }
    }
  }
  if (_piece.w !== piece.w || _piece.h !== piece.h) {
    div
      .remove('.is-w-*', '.is-h-*')
      .add(`.is-w-${piece.w}`, `.is-h-${piece.h}`)
  }
  if (_piece.n !== piece.n) {
    div.remove('.is-n', '.is-n-*')
    if (piece.l === LAYER_TOKEN && piece.n !== 0) {
      div.add('.is-n', '.is-n-' + piece.n)
    }
  }

  if (_piece.c?.[0] !== piece.c[0] || _piece.c?.[1] !== piece.c[1]) {
    // (background) color
    if (piece.l === LAYER_NOTE) {
      div.css({
        '--fbg-color': stickyNoteColors[piece.c[0]].value,
        '--fbg-color-invert': brightness(stickyNoteColors[piece.c[0]].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
      })
    } else if (piece._meta.hasColor) {
      if (piece.c[0] === 0) { // no/default color
        div.remove('--fbg-color', '--fbg-color-invert')
      } else { // color
        div.css({
          '--fbg-color': setup.colors[piece.c[0] - 1].value,
          '--fbg-color-invert': brightness(setup.colors[piece.c[0] - 1].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
        })
      }
    } else if (piece.l === LAYER_OVERLAY || piece.l === LAYER_OTHER) {
      // no color
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
          '--fbg-border-color': setup.borders[piece.c[1] - 1].value,
          '--fbg-border-color-invert': brightness(setup.borders[piece.c[1] - 1].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
        })
      }
    }
  }

  return div
}

/**
 * Propagate selection of data/state to DOM.
 *
 * @param {boolean} hidePopup If true (default) it will also hide the popup.
 */
export function updateSelectionDOM () {
  const selection = selectionGetIds()
  _('#tabletop .piece').each(node => {
    if (selection.includes(node.id)) {
      _(node).add('.is-selected')
    } else {
      _(node).remove('.is-selected')
    }
  })
  updateMenu()
}

/**
 * Add or re-set a piece.
 *
 * @param {Object} piece The piece's full data object.
 */
export function setPiece (piece) {
  const node = createOrUpdatePieceDOM(piece)

  // set the label
  if (piece.t?.[0] || piece.b?.[0]) { // make sure label bubble is there
    let changed = node.piece.t?.[0] !== piece.t?.[0] || !equalsJSON(node.piece.b, piece.b)

    if (!_('#' + piece.id + ' .label').exists()) {
      node.add(_('.label.ellipsis>span').create())
      changed = true
    }

    // update content if it has changed
    if (changed) {
      const content = _('#' + piece.id + ' .label').empty()

      // update text part
      if (piece.t?.length >= 1) {
        content.add(_('span').create(piece.t[0]))
      }

      // update icon part
      for (const id of piece.b ?? []) {
        const asset = findAsset(id, 'badge')
        if (asset) {
          const img = _('img.icon').create()
          img.src = getAssetURL(asset, 0)
          content.add(img)
        }
      }
    }
  } else { // remove label bubble
    _('#' + piece.id + ' .label').delete()
  }

  node.piece = piece // store piece for future delta-checking
}

/**
 * Add or re-set a sticky note.
 *
 * @param {Object} pieceJson The note's full data object.
 */
export function setNote (note) {
  const node = createOrUpdatePieceDOM(note)

  if (note.f & FLAG_NOTE_TOPLEFT) {
    node.add('.is-topleft')
  } else {
    node.remove('.is-topleft')
  }

  if (node.piece.t?.[0] !== note.t?.[0]) { // update note on change
    node.node().innerHTML = markdown(note.t?.[0])
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
  const setup = getSetup()

  if (!selectionGetFeatures().rotate) return

  for (const piece of selectionGetPieces()) {
    const increment = (setup.type === TYPE_HEX || setup.type === TYPE_HEX2) ? 60 : 90
    const r = cw ? (piece.r + increment) : (piece.r - increment)
    rotatePiece(piece.id, r)
  }
}

/**
 * Move the currently selected piece to the top within its layer.
 *
 * Will silently fail if nothing is selected.
 */
export function toTopSelected () {
  const features = selectionGetFeatures()
  if (!features.top) return

  const zLower = findMaxZBelowSelection(features.boundingBox.x, features.boundingBox.y)
  const zUpper = {} // one z per layer
  const toMove = []
  for (const piece of sortByNumber(selectionGetPieces(), 'z', 0)) {
    zUpper[piece.l] = (zUpper[piece.l] ?? 0) + 1 // init or increase
    const z = (zLower[piece.l] ?? 0) + zUpper[piece.l]
    if (piece.z !== z) {
      toMove.push(movePiecePatch(piece.id, null, null, z))
    }
  }
  if (toMove.length > 0) movePieces(toMove)
}

/**
 * Move the currently selected piece to the bottom within its layer.
 *
 * Will silently fail if nothing is selected.
 */
export function toBottomSelected () {
  const features = selectionGetFeatures()
  if (!features.bottom) return

  const zLower = findMinZBelowSelection(features.boundingBox.x, features.boundingBox.y)
  const zUpper = {} // one z per layer
  const toMove = []
  for (const piece of sortByNumber(selectionGetPieces(), 'z', 0).reverse()) {
    zUpper[piece.l] = (zUpper[piece.l] ?? 0) - 1 // init or decrease
    const z = (zLower[piece.l] ?? 0) + zUpper[piece.l]
    if (piece.z !== z) {
      toMove.push(movePiecePatch(piece.id, null, null, z))
    }
  }
  if (toMove.length > 0) movePieces(toMove)
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
    if (asset.tx) {
      node.css({
        '--fbg-material': url(getMaterialMedia(asset.tx))
      })
    } else {
      node.remove('--fbg-material')
    }
    if (asset.mask) {
      node.add('.has-mask')
      const inner = _('.masked').create().css({ '--fbg-mask': url(getAssetURL(asset, -2)) })
      node.add(inner)
    }

    if (asset.type !== LAYER_OVERLAY && asset.type !== LAYER_OTHER) {
      if (!asset.bg.match(/^[0-9][0-9]?$/)) {
        // color information is html color or 'transparent' -> apply
        node.css({ '--fbg-color': asset.bg })
      }
    }

    // backsides
    if (piece.l === LAYER_TOKEN && piece._meta.sidesExtra > 0) {
      if (piece.s >= piece._meta.sides) {
        node.add('.is-backside')
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

  if (note.f & FLAG_NOTE_TOPLEFT) {
    node.add('.is-topleft')
  } else {
    node.remove('.is-topleft')
  }

  node.id = note.id
  node.node().innerHTML = markdown(note.t?.[0])

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
  selectionClear()
  const snapped = snap(xy.x, xy.y)
  createPieces([{
    l: LAYER_NOTE,
    w: 3,
    h: 3,
    x: snapped.x,
    y: snapped.y,
    z: getMaxZ(LAYER_NOTE) + 1
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
  const setup = getSetup()
  switch (setup.type) {
    case 'grid-hex':
      if (offsetX < 0) offsetX += 109
      if (offsetY < 0) offsetY += 63
      offsetX = Math.floor(offsetX / 110) * 110
      offsetY = Math.floor(offsetY / 64) * 64
      break
    case 'grid-hex2':
      if (offsetX < 0) offsetX += 63
      if (offsetY < 0) offsetY += 109
      offsetX = Math.floor(offsetX / 64) * 64
      offsetY = Math.floor(offsetY / 110) * 110
      break
    case 'grid-square':
    default:
      if (offsetX < 0) offsetX += 63
      if (offsetY < 0) offsetY += 63
      offsetX = Math.floor(offsetX / setup.gridSize) * setup.gridSize
      offsetY = Math.floor(offsetY / setup.gridSize) * setup.gridSize
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
 * Will add new, update existing and delete obsolete pieces.
 *
 * @param {Array} tableNo Table number to display.
 */
export function updateTabletop (tableNo) {
  const tableData = getTable(tableNo)
  const start = Date.now()

  setTableSurface(tableNo)

  const keepIds = []
  cleanupTable()
  for (const piece of tableData) {
    setItem(piece)
    keepIds.push(piece.id)
  }
  removeObsoletePieces(keepIds)
  updateSelectionDOM()
  updateStatusline()

  setTimeout(() => { // remove temporary transition classes
    _('.piece[class*="is-delay-"]').each(node => {
      _(node).remove('.is-delay-*')
    })
  }, 10)

  recordTime('sync-ui', Date.now() - start)
}

/**
 * Move the pointer to the given location.
 *
 * @param {Object} coords {x, y} object, in table px.
 */
export function pointTo (coords) {
  const setup = getSetup()
  const room = getRoom()

  coords.x = clamp(0, coords.x, room.width - setup.gridSize - 1)
  coords.y = clamp(0, coords.y, room.height - setup.gridSize - 1)

  const snapped = snap(coords.x, coords.y)

  createPieces([{ // always create (even if it is a move)
    a: ID.POINTER,
    l: LAYER_OTHER,
    w: 1,
    h: 1,
    x: snapped.x,
    y: snapped.y,
    z: getMaxZ(LAYER_OTHER) + 1
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
      l: LAYER_OTHER,
      x,
      y,
      w,
      h,
      z: getMaxZ(LAYER_OTHER) + 1
    }])
  }
}

/**
 * Move a (dragging) piece to a coord.
 *
 * @param {Element} element The HTML node to update.
 * @param {Number} x New x coordinate in px.
 * @param {Number} y New y coordinate in px.
 */
export function moveNodeTo (element, x, y) {
  if (element.piece.f & FLAG_NO_MOVE) return // we do not move frozen pieces
  if (element.x === x && element.y === y) return // no need to move to same place

  element.x = x
  element.y = y

  const tl = getTopLeft(element.piece, element.x, element.y)
  const zoomed = zoomCoordinates({ x: tl.left, y: tl.top })

  element.style.left = zoomed.x + 'px'
  element.style.top = zoomed.y + 'px'
}

/**
 * Create an asset node for LOS pointers.
 *
 * @param {Number} x X-coordinate of starting point in px.
 * @param {Number} y Y-coordinate of starting point in px.
 * @param {Number} w Width in px. Can be negative.
 * @param {Number} h Height in px. Can be negative.
 * @return {FreeDOM} dummy node.
 */
export function createLosPiece (x, y, width, height) {
  const zoom = getRoomPreference(PREFS.ZOOM)
  x *= zoom
  y *= zoom
  width *= zoom
  height *= zoom

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
  svg.classList.add('piece', 'piece-other', 'piece-los')

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

  // inch/cm line
  const ruler = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  ruler.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  ruler.setAttribute('stroke-linecap', 'round')
  ruler.setAttribute('stroke-linejoin', 'round')
  ruler.setAttribute('stroke', '#ffffff30') // red thread
  ruler.setAttribute('stroke-dasharray', '64, 64')
  ruler.setAttribute('stroke-dashoffset', 64)
  ruler.setAttribute('stroke-width', stroke - 1)
  svg.appendChild(ruler)

  // inch/cm line
  const ruler2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  ruler2.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  ruler2.setAttribute('stroke-linecap', 'round')
  ruler2.setAttribute('stroke-linejoin', 'round')
  ruler2.setAttribute('stroke', '#00000040') // red thread
  ruler2.setAttribute('stroke-dasharray', '64, 64')
  ruler2.setAttribute('stroke-width', stroke - 1)
  svg.appendChild(ruler2)

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

  // position
  svg.style.left = (width < 0 ? x + width : x) - stroke / 2 + 'px'
  svg.style.top = (height < 0 ? y + height : y) - stroke / 2 + 'px'
  svg.style.width = Math.abs(width) + stroke + 'px'
  svg.style.height = Math.abs(height) + stroke + 'px'
  svg.style.zIndex = 999999999

  return _(svg)
}

/**
 * Create an asset node for selection areas.
 *
 * @param {Number} x X-coordinate of starting point in px.
 * @param {Number} y Y-coordinate of starting point in px.
 * @param {Number} w Width in px. Can be negative.
 * @param {Number} h Height in px. Can be negative.
 * @return {FreeDOM} dummy node.
 */
export function createSelectPiece (x, y, width, height) {
  const zoom = getRoomPreference(PREFS.ZOOM)
  x *= zoom
  y *= zoom
  width *= zoom
  height *= zoom

  // container svg
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('viewBox', `0 0 ${Math.abs(width)} ${Math.abs(height)}`)

  // rect
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', 0)
  rect.setAttribute('y', 0)
  rect.setAttribute('width', Math.abs(width))
  rect.setAttribute('height', Math.abs(height))
  rect.setAttribute('stroke', '#bf40bf')
  rect.setAttribute('stroke-width', 4)
  rect.setAttribute('fill', '#bf40bf')
  rect.setAttribute('fill-opacity', 0.25)
  svg.appendChild(rect)

  // position
  svg.style.left = (width < 0 ? x + width : x) + 'px'
  svg.style.top = (height < 0 ? y + height : y) + 'px'
  svg.style.width = Math.abs(width) + 'px'
  svg.style.height = Math.abs(height) + 'px'
  svg.style.zIndex = 999999999

  return _(svg)
}

/**
 * Zoom in/out in available increments.
 *
 * @param {Number} direction If positive, zoom in. Otherwise zoom out.
 */
export function zoom (direction) {
  const current = getRoomPreference(PREFS.ZOOM)

  if (direction === 0) { // set to 100%
    setupZoom(1)
  } else if (direction > 0) { // zoom in
    const next = ZOOM_LEVELS.filter(zoom => zoom > current)
    if (next.length > 0) {
      setupZoom(next[0])
    }
  } else { // zoom out
    const next = ZOOM_LEVELS.filter(zoom => zoom < current)
    if (next.length > 0) {
      setupZoom(next.pop())
    }
  }
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
  const setup = getSetup()
  const coords = []
  const pieces = []
  for (let x = 0; x < Math.min(dicemat.w, 4); x++) {
    for (let y = 0; y < Math.min(dicemat.h, 4); y++) {
      coords.push({ // a max. 4x4 area in the center of the dicemat
        x: (Math.max(0, Math.floor((dicemat.w - 4) / 2)) + x + 0.5) * setup.gridSize,
        y: (Math.max(0, Math.floor((dicemat.h - 4) / 2)) + y + 0.5) * setup.gridSize
      })
    }
  }

  for (const piece of findPiecesWithin(getPieceBounds(dicemat), dicemat.l)) {
    if (piece._meta.feature === FEATURE_DICEMAT) continue // don't touch the dicemat

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
    if (piece._meta.feature === FEATURE_DISCARD) continue // don't touch the discard pile piece

    // detect the side to flip them to
    if (stackSide < 0) {
      // fip all pieces, based on the state of the first one
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
    popupHide(id)
  }
}

/**
 * Trigger UI update for new/changed server items.
 *
 * @param {Object} piece Piece to add/update.
 */
function setItem (piece) {
  switch (piece.l) {
    case LAYER_TILE:
    case LAYER_TOKEN:
    case LAYER_OVERLAY:
    case LAYER_OTHER:
      setPiece(piece)
      break
    case LAYER_NOTE:
      setNote(piece)
      break
    default:
      // ignore unkown piece type
  }
}

/**
 * Convert markdown to HTML.
 *
 * Will escape HTML already embedded.
 *
 * @param {String} content Markup to convert.
 * @returns {String} Converted markup, ready for xy.innerHTML=...
 */
function markdown (content) {
  return marked((content ?? '').replaceAll('<', '&lt;'))
    .replaceAll('<a ', '<a target="_blank" rel="noopener noreferrer" ')
}
