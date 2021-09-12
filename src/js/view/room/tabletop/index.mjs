/**
 * @file The actual tabletop stuff. Mainly in charge of state -> DOM
 *       propagation. Does not manipulate data nor does it do API calls.
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

import _ from '../../../lib/FreeDOM.mjs'

import {
  clamp,
  shuffle,
  recordTime
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
  borderPiece,
  rotatePiece
} from '../../../state/index.mjs'

import {
  updateStatusline,
  getTableCoordinates,
  restoreScrollPosition
} from '../index.mjs'

import {
  findAsset,
  findAssetByAlias,
  findPiece,
  findPiecesWithin,
  getAssetURL,
  getMinZ,
  getMaxZ,
  getContentRectGrid,
  stickyNoteColors
} from './tabledata.mjs'
import {
  updateMenu
} from '../mouse.mjs'

import { modalEdit } from '../modal/edit.mjs'
import { modalSettings } from '../modal/settings.mjs'

// --- public ------------------------------------------------------------------

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
export function cloneSelected (tile) {
  getSelected().each(node => {
    const template = getTemplate()
    const piece = findPiece(node.id)
    piece.x = tile.x * template.gridSize
    piece.y = tile.y * template.gridSize
    piece.z = getMaxZ(piece.layer) + 1
    if (piece.n > 0) { // increase piece letter (if it has one)
      piece.n = piece.n + 1
      if (piece.n >= 16) piece.n = 1
    }
    createPieces([piece], true)
  })
}

/**
 * Flip the currently selected piece to it's next side.
 *
 * Will cycle the sides and silently fail if nothing is selected.
 */
export function flipSelected () {
  getSelected().each(node => {
    const piece = findPiece(node.id)
    if (piece._sides > 1) {
      flipPiece(piece.id, (piece.side + 1) % piece._sides)
    }
  })
}

/**
 * Switch the outline color of the currently selected piece.
 *
 * Will cycle through all available colors and silently fail if nothing is selected.
 */
export function outlineSelected () {
  const borders = getTemplate().colors.length

  getSelected().each(node => {
    const piece = findPiece(node.id)
    console.log(piece)
    switch (piece.layer) {
      case 'note':
        borderPiece(piece.id, (piece.border + 1) % stickyNoteColors.length)
        break
      default:
        if (borders > 1) {
          borderPiece(piece.id, (piece.border + 1) % borders)
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
    numberPiece(piece.id, (piece.n + 16 + delta) % 16) // 0=nothing, 1-9, A-F
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
    switch (piece._feature) {
      case 'DICEMAT': // dicemat: randomize all pieces on it
        randomDicemat(piece)
        break
      case 'DISCARD': // dicard pile: randomize & center & flip all pieces on it
        randomDiscard(piece)
        break
      default: // ordinary piece
        if (piece._sides > 1) { // only randomize multi-sided tokens
          // slide token around
          let slideX = Math.floor(Math.random() * 3) - 1
          let slideY = Math.floor(Math.random() * 3) - 1
          if (slideX === 0 && slideY === 0) {
            slideX = 1
            slideY = 1
          }
          const x = Math.abs(clamp(
            -template.snapSize,
            piece.x + slideX * template.snapSize,
            (template.gridWidth - 1) * template.gridSize
          ))
          const y = Math.abs(clamp(
            -template.snapSize,
            piece.y + slideY * template.snapSize,
            (template.gridHeight - 1) * template.gridSize
          ))
          // send to server
          updatePieces([{
            id: node.id,
            side: Math.floor(Math.random() * piece._sides),
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
 * Will try to minimize recreation of objects and tries to only update it's
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
  if (_piece.layer !== piece.layer || _piece.side !== piece.side) {
    selection = _('#tabletop .is-selected').id
    if (!Array.isArray(selection)) selection = [selection] // make sure we use lists here
    div.delete()
  }
  if (!div.unique()) { // (re)create
    const node = piece.layer === 'note' ? noteToNode(piece) : pieceToNode(piece)
    node.piece = {}
    _piece = {}
    if (selection.includes(piece.id)) node.add('.is-selected')
    _('#layer-' + piece.layer).add(node)
  }

  // update dom infos + classes (position, rotation ...)
  const template = getTemplate()
  div = _('#' + piece.id) // fresh query

  if (_piece.x !== piece.x || _piece.y !== piece.y || _piece.z !== piece.z) {
    div.css({
      left: piece.x + 'px',
      top: piece.y + 'px',
      zIndex: piece.z
    })
  }
  if (_piece.r !== piece.r) {
    div
      .remove('.is-rotate-*')
      .add('.is-rotate-' + piece.r)
  }
  if (_piece.w !== piece.w || _piece.h !== piece.h) {
    div
      .remove('.is-w-*', '.is-h-*', '.is-wh-*')
      .add(`.is-w-${piece.w}`, `.is-h-${piece.h}`, `.is-wh-${piece.w - piece.h}`)
  }
  if (_piece.n !== piece.n) {
    div.remove('.is-n', '.is-n-*')
    if (piece.layer === 'token' && piece.n !== 0) {
      div.add('.is-n', '.is-n-' + piece.n)
    }
  }
  if (_piece.border !== piece.border) {
    div
      .remove('.is-border-*')
      .add('.is-border-' + piece.border)
    if (piece.border >= 0 && template.colors.length) {
      _(`#${piece.id}`).css({
        '--fbg-border-color': template.colors[piece.border].value
      })
    }
  }

  // update select status
  if (select && _('#tabletop.layer-' + piece.layer + '-enabled').exists()) {
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

  if (node.piece.label !== piece.label || node.piece.tag !== piece.tag) { // update label on change
    _('#' + piece.id + ' .label').delete()
    if (piece.label !== '' || piece.tag !== '') {
      const label = _('.label').create()
      if (piece.label !== '') {
        const span = _('span').create(piece.label)
        label.add(span)
      }
      if (piece.tag !== '') {
        const asset = findAssetByAlias(piece.tag, 'tag')
        if (asset) {
          const img = _('img.icon').create()
          img.src = getAssetURL(asset, 0)
          label.add(img)
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

  if (node.piece.label !== note.label) { // update note on change
    node.node().innerHTML = note.label ?? ''
  }

  node.piece = note // store piece for future delta-checking
}

/**
 * Rotate the currently selected piece.
 *
 * Done in 90° increments.
 */
export function rotateSelected () {
  const template = getTemplate()

  getSelected().each(node => {
    const piece = findPiece(node.id)
    const r = (piece.r + 90) % 360
    let x = piece.x
    let y = piece.y
    switch (r) {
      case 90:
      case 270:
        x = clamp(0, x, (template.gridWidth - piece.h) * template.gridSize - 1)
        y = clamp(0, y, (template.gridHeight - piece.w) * template.gridSize - 1)
        break
      default:
        x = clamp(0, x, (template.gridWidth - piece.w) * template.gridSize - 1)
        y = clamp(0, y, (template.gridHeight - piece.h) * template.gridSize - 1)
    }

    rotatePiece(piece.id, r, x, y)
  })
}

/**
 * Move the currently selected piece to the top within it's layer.
 *
 * Will silently fail if nothing is selected.
 */
export function toTopSelected () {
  for (const node of document.querySelectorAll('.piece.is-selected')) {
    const piece = findPiece(node.id)
    const maxZ = getMaxZ(piece.layer)
    if (piece.z < maxZ) {
      movePiece(piece.id, null, null, maxZ + 1)
    }
  }
}

/**
 * Move the currently selected piece to the bottom within it's layer.
 *
 * Will silently fail if nothing is selected.
 */
export function toBottomSelected () {
  for (const node of document.querySelectorAll('.piece.is-selected')) {
    const piece = findPiece(node.id)
    const minZ = getMinZ(piece.layer)
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
  const asset = findAsset(piece.asset)
  if (asset === null) {
    if (piece.asset === ID_POINTER) {
      node = createPointerAsset(piece.layer)
    } else {
      node = createInvalidAsset(piece.layer)
    }
  } else {
    const uriSide = asset.media[piece.side] === '##BACK##'
      ? 'img/backside.svg'
      : getAssetURL(asset, piece.side)
    const uriBase = getAssetURL(asset, -1)
    if (asset.base) { // layered asset
      node = _(`.piece.piece-${asset.type}.has-layer`).create().css({
        backgroundImage: 'url("' + encodeURI(uriBase) + '")',
        '--fbg-layer-image': 'url("' + encodeURI(uriSide) + '")'
      })
    } else { // regular asset
      node = _(`.piece.piece-${asset.type}`).create().css({
        backgroundImage: 'url("' + encodeURI(uriSide) + '")'
      })
    }

    if (asset.type !== 'overlay' && asset.type !== 'other') {
      node.css({
        backgroundColor: asset.color ?? '#808080'
      })
    }
  }

  // set meta-classes on node
  node.id = piece.id
  node.add(`.is-side-${piece.side}`)
  if (asset?.color === 'border') node.add('.is-bordercolor')

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
  node.add('.is-side-0')
  node.node().innerHTML = note.label ?? ''

  return node
}

/**
 * Add a new sticky note to the cursor position.
 *
 * This adds a enirely new note to the table via a call to the state.
 *
 * @param {Object} tile {x, y} coordinates (tile) where to add.
 */
export function createNote (tile) {
  const template = getTemplate()
  createPieces([{
    layer: 'note',
    w: 3,
    h: 3,
    x: tile.x * template.gridSize,
    y: tile.y * template.gridSize,
    z: getMaxZ('note') + 1
  }], true)
}

/**
 * Move the room content to the given x/y position.
 *
 * Will determine the content-box and move each item relative to its top/left
 * corner.
 *
 * @param Number toX New x position.
 * @param Number toY New y position.
 */
export function moveContent (toX, toY) {
  const template = getTemplate()
  const rect = getContentRectGrid()
  const offsetX = (toX - rect.left) * template.gridSize
  const offsetY = (toY - rect.top) * template.gridSize

  const pieces = []
  _('#tabletop .piece').each(node => {
    const piece = findPiece(node.id)
    pieces.push({
      id: piece.id,
      x: piece.x + offsetX,
      y: piece.y + offsetY
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
 * @param {Object} coords {x, y} object.
 */
export function pointTo (coords) {
  const template = getTemplate()
  const room = getRoom()

  coords.x = clamp(0, coords.x - template.gridSize / 2, room.width - template.gridSize)
  coords.y = clamp(0, coords.y - template.gridSize / 2, room.height - template.gridSize)

  createPieces([{ // always create (even if it is a move)
    asset: ID_POINTER,
    layer: 'other',
    w: 1,
    h: 1,
    x: coords.x,
    y: coords.y,
    z: getMaxZ('other') + 1
  }])
}

/**
 * Calculate the grid/tile X coordinate based on mouse position.
 *
 * @return {Object} Current tile as {x, y}.
 */
export function getTableTile (windowX, windowY) {
  const template = getTemplate()
  const coords = getTableCoordinates(windowX, windowY)
  coords.x = clamp(0, Math.floor(coords.x / template.gridSize), template.gridWidth - 1)
  coords.y = clamp(0, Math.floor(coords.y / template.gridSize), template.gridHeight - 1)
  return coords
}

// --- internal ----------------------------------------------------------------

const ID_POINTER = 'ffffffffffffffff'

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
function createInvalidAsset (type) {
  return _(`.piece.piece-${type}.is-invalid`).create()
}

/**
 * Create an asset node for invalid assets / ids.
 *
 * @param {String} type Asset type (token, tile, ...).
 * @return {FreeDOM} dummy node.
 */
function createPointerAsset () {
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
        x: (Math.max(0, Math.floor((dicemat.w - 4) / 2)) + x) * template.gridSize,
        y: (Math.max(0, Math.floor((dicemat.h - 4) / 2)) + y) * template.gridSize
      })
    }
  }

  for (const piece of findPiecesWithin({
    left: dicemat.x,
    top: dicemat.y,
    right: dicemat.x + dicemat.w * template.gridSize - 1,
    bottom: dicemat.y + dicemat.h * template.gridSize - 1
  }, dicemat.layer)) {
    if (piece._feature === 'DICEMAT') continue // don't touch the dicemat

    // pick one random position
    let coord = { x: 0, y: 0 }
    let index = Math.floor(Math.random() * coords.length)
    if (coords[index].x === piece.x && coords[index].y === piece.y) {
      index = (index + 1) % coords.length
    }
    coord = coords[index]
    coords.splice(index, 1)

    // update the piece
    pieces.push({
      id: piece.id,
      side: Math.floor(Math.random() * piece._sides),
      x: dicemat.x + coord.x,
      y: dicemat.y + coord.y
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
  const template = getTemplate()
  const pieces = []
  const centerX = discard.x + discard.w * template.gridSize / 2
  const centerY = discard.y + discard.h * template.gridSize / 2
  let stackSide = -1

  const stack = findPiecesWithin({
    left: discard.x,
    top: discard.y,
    right: discard.x + discard.w * template.gridSize - 1,
    bottom: discard.y + discard.h * template.gridSize - 1
  }, discard.layer)

  // shuffle z positions above the dicard pile piece
  const discardZ = discard.z
  const z = []
  for (let i = 0; i < stack.length; i++) {
    z.push(discardZ + i + 1)
  }
  shuffle(z)

  for (const piece of stack) {
    if (piece._feature === 'DISCARD') continue // don't touch the discard pile piece

    // detect the side to flip them to
    if (stackSide < 0) {
      // fip all pices, based on the state of the first one
      if (piece.side === 0) {
        stackSide = Math.max(0, piece._sides - 1)
      } else {
        stackSide = 0
      }
    }

    const w = piece.r === 90 || piece.r === 270 ? piece.h : piece.w
    const h = piece.r === 90 || piece.r === 270 ? piece.w : piece.h

    // update the piece
    pieces.push({
      id: piece.id,
      side: stackSide,
      x: Math.floor(centerX - (w * template.gridSize) / 2),
      y: Math.floor(centerY - (h * template.gridSize) / 2),
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
  switch (piece.layer) {
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
