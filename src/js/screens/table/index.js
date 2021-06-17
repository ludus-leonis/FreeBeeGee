/**
 * @file The actual table / tabletop stuff. Mainly in charge of state -> DOM
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

import { createPopper } from '@popperjs/core'

import {
  getTable,
  getTemplate,
  getStateNo,
  loadTable,
  updatePieces,
  createPieces,
  setStateNo,
  deletePiece,
  numberPiece,
  flipPiece,
  movePiece,
  borderPiece,
  rotatePiece,
  setTablePreference,
  getTablePreference
} from './state.js'
import {
  findAsset,
  findPiece,
  findPiecesWithin,
  getMinZ,
  getMaxZ,
  getContentRectGrid
} from './tabledata.js'
import { startAutoSync } from './sync.js'
import {
  enableDragAndDrop,
  getMouseTileX,
  getMouseTileY,
  updateMenu
} from './mouse.js'
import _ from '../../FreeDOM.js'
import {
  clamp,
  shuffle,
  recordTime
} from '../../utils.js'
import { navigateToJoin } from '../../nav.js'

import { modalLibrary } from './modals/library.js'
import { modalEdit } from './modals/edit.js'
import { modalHelp } from './modals/help.js'
import { modalSettings, changeQuality } from './modals/settings.js'

let scroller = null /** keep reference to scroller div - we need it often */

// --- public ------------------------------------------------------------------

/**
 * Get current tabletop scroll position.
 *
 * @return {Object} Contains x and y in pixel.
 */
export function getScrollPosition () {
  return {
    x: scroller.scrollLeft,
    y: scroller.scrollTop
  }
}

/**
 * Get current tabletop scroll position.
 *
 * @return {Number} x X-coordinate.
 * @return {Number} y Y-coordinate.
 */
export function setScrollPosition (x, y) {
  scroller.scrollTo(x, y)
}

/**
 * Initialize and start the table/tabletop screen.
 *
 * @param {String} name Name of table, e.g. hilariousGazingPenguin.
 */
export function runTable (table) {
  console.info('$NAME$ v$VERSION$, table ' + table.name)

  loadTable(table.name)
    .then(() => setupTable())
}

/**
 * Toggle one of the layers on/off for selection.
 *
 * @param {String} layer Either 'tile', 'overlay' or 'token'.
 */
export function toggleLayer (layer) {
  _('#btn-' + layer).toggle('.active')
  _('#tabletop').toggle('.layer-' + layer + '-enabled')
  if (_('#btn-' + layer + '.active').exists()) {
    setTablePreference('layer' + layer, true)
  } else {
    unselectPieces(layer)
    setTablePreference('layer' + layer, false)
  }
}

/**
 * Get all currently selected pieces.
 *
 * @return {FreeDOM} Selected DOM nodes.
 */
export function getSelected () {
  return _('#tabletop .is-selected')
}

/**
 * Delete the currently selected piece from the table.
 *
 * Will silently fail if nothing is selected.
 */
export function deleteSelected () {
  getSelected().each(node => deletePiece(node.id))
}

/**
 * Show settings dialog for the current table/table.
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
 * @param {Number} x x position (in tiles).
 * @param {Number} y y position (in tiles).
 */
export function cloneSelected (x, y) {
  getSelected().each(node => {
    const template = getTemplate()
    const piece = findPiece(node.id)
    piece.x = x * template.gridSize
    piece.y = y * template.gridSize
    piece.z = getMaxZ(piece.layer) + 1
    if (piece.no > 0) { // increase piece letter (if it has one)
      piece.no = piece.no + 1
      if (piece.no >= 16) piece.no = 1
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
    if (borders > 1) {
      borderPiece(piece.id, (piece.border + 1) % borders)
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
    numberPiece(piece.id, (piece.no + 16 + delta) % 16) // 0=nothing, 1-9, A-F
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
  if (_piece.no !== piece.no) {
    div.remove('.is-n', '.is-n-*')
    if (piece.layer === 'token' && piece.no !== 0) {
      div.add('.is-n', '.is-n-' + piece.no)
    }
  }
  if (_piece.border !== piece.border) {
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

  if (node.piece.label !== piece.label) { // update label on change
    _('#' + piece.id + ' .label').delete()
    if (piece.label !== '') {
      node.add(_('.label').create(piece.label))
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
  if (piece.asset === '0000000000000000') {
    node = createInvalidAsset(piece.layer)
  } else {
    const uriSide = asset.assets[piece.side] === '##BACK##'
      ? 'img/backside.svg'
      : `api/data/tables/${getTable().name}/assets/${asset.type}/${asset.assets[piece.side]}`
    const uriBase = `api/data/tables/${getTable().name}/assets/${asset.type}/${asset.base}`
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
  }
  if (asset.type !== 'overlay' && asset.type !== 'other') {
    if (asset.color === 'border') {
      node.css({
        backgroundColor: 'var(--fbg-border-color)',
        borderColor: '#202020'
      })
    } else {
      node.css({
        backgroundColor: (asset.color ?? '#808080')
      })
    }
  }

  // set meta-classes on node
  node.id = piece.id
  node.add(`.is-side-${piece.side}`)

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
 * @param {Number} x X-tile to add pice to.
 * @param {Number} y Y-tile to add pice to.
 */
export function createNote (tileX, tileY) {
  const template = getTemplate()
  createPieces([{
    layer: 'note',
    w: 3,
    h: 3,
    x: tileX * template.gridSize,
    y: tileY * template.gridSize,
    z: getMaxZ('note') + 1
  }], true)
}

export function popupPiece (id) {
  const piece = findPiece(id)
  const popup = _('#popper.popup.is-content').create()

  popup.innerHTML = `
    <a class="popup-menu edit" href="#">${iconEdit}Edit</a>
    <a class="popup-menu rotate" href="#">${iconRotate}Rotate</a>
    <a class="popup-menu flip ${piece._sides > 1 ? '' : 'disabled'}" href="#">${iconFlip}Flip</a>
    <a class="popup-menu random ${(piece._sides > 2 || piece._feature === 'DICEMAT') ? '' : 'disabled'}" href="#">${iconShuffle}Random</a>
    <a class="popup-menu top" href="#">${iconTop}To top</a>
    <a class="popup-menu bottom" href="#">${iconBottom}To bottom</a>
    <a class="popup-menu clone" href="#">${iconClone}Clone</a>
    <a class="popup-menu delete" href="#">${iconDelete}Delete</a>
  `

  _('#tabletop').add(popup)

  _('#popper .edit').on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    editSelected()
  })

  _('#popper .rotate').on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    rotateSelected()
  })

  _('#popper .flip').on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    flipSelected()
  })

  _('#popper .random').on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    randomSelected()
  })

  _('#popper .top').on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    toTopSelected()
  })

  _('#popper .bottom').on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    toBottomSelected()
  })

  _('#popper .delete').on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    deleteSelected()
  })

  _('#popper .clone').on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    cloneSelected(getMouseTileX(), getMouseTileY())
  })

  createPopper(_('#' + id).node(), popup.node(), {
    placement: 'right'
  })
  popup.add('.show')
}

/**
 * Remove dirty / obsolete / bad pieces from table.
 *
 * Usually called during library sync.
 */
export function cleanupTable () {
  _('#tabletop .piece.is-invalid').delete()
}

/**
 * Move the table content to the given x/y position.
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
 * Update DOM table to current table-data.
 *
 * e.g. for resizing the table.
 *
 * @param {Array} state State to update to.
 * @param {Array} selectIds Optional, possibly empty array of IDs to select
 *                          after update.
 * @return {FreeDOM} Table DOM element for further customization.
 */
export function updateTable () {
  const table = getTable()

  return _('#tabletop').css({
    width: table.width + 'px',
    height: table.height + 'px'
  })
}

export function updateTabletop (state, selectIds = []) {
  const start = Date.now()

  const keepIds = []
  cleanupTable()
  for (const item of state) {
    setItem(item, selectIds.includes(item.id))
    keepIds.push(item.id)
  }
  removeObsoletePieces(keepIds)
  updateMenu()
  updateStatusline()

  recordTime('sync-ui', Date.now() - start)
}

// --- internal ----------------------------------------------------------------

/**
 * Setup the table screen / HTML.
 *
 * @param {Object} table Table data object.
 */
function setupTable () {
  const table = getTable()

  _('body').remove('.page-boxed').innerHTML = `
    <div id="table" class="table is-fullscreen is-noselect">
      <div class="menu">
        <div>
          <div class="menu-brand is-content">
            <button id="btn-s" class="btn-icon" title="Table settings [s]"><img src="icon.svg"></button>
          </div>

          <div>
            <button id="btn-other" class="btn-icon" title="Toggle dice [1]">${iconDice}</button>

            <button id="btn-token" class="btn-icon" title="Toggle tokens [2]">${iconToken}</button>

            <button id="btn-overlay" class="btn-icon" title="Toggle overlays [3]">${iconOverlay}</button>

            <button id="btn-tile" class="btn-icon" title="Toggle tiles [4]">${iconTile}</button>
          </div>

          <div class="spacing-medium">
            <button id="btn-a" class="btn-icon" title="Open library [l]">${iconAdd}</button>
          </div>

          <div class="menu-selected disabled spacing-medium">
            <button id="btn-e" class="btn-icon" title="Edit [e]">${iconEdit}</button>

            <button id="btn-r" class="btn-icon" title="Rotate [r]">${iconRotate}</button>

            <button id="btn-f" class="btn-icon" title="Flip [f]">${iconFlip}</button>

            <button id="btn-hash" class="btn-icon" title="Random [#]">${iconShuffle}</button>

            <button id="btn-t" class="btn-icon" title="To top [t]">${iconTop}</button>

            <button id="btn-b" class="btn-icon" title="To bottom [b]">${iconBottom}</button>

            <button id="btn-c" class="btn-icon" title="Clone [c]">${iconClone}</button>

            <button id="btn-del" class="btn-icon" title="Delete [Del]">${iconDelete}</button>
          </div>
        </div>
        <div>
          <button id="btn-h" class="btn-icon" title="Help [h]">${iconHelp}</button>

          <a id="btn-snap" class="btn-icon" title="Download snapshot" href='./api/tables/${table.name}/snapshot/'>${iconDownload}</a>

          <button id="btn-q" class="btn-icon" title="Leave table">${iconQuit}</button>
        </div>
      </div>
      <div id="scroller" class="scroller">
        <div id="tabletop" class="tabletop layer-note-enabled">
          <div id="layer-other" class="layer layer-other"></div>
          <div id="layer-token" class="layer layer-token"></div>
          <div id="layer-note" class="layer layer-note"></div>
          <div id="layer-overlay" class="layer layer-overlay"></div>
          <div id="layer-tile" class="layer layer-tile"></div>
          <div id="layer-table" class="layer layer-table"></div>
        </div>
      </div>
      <div class="status"></div>
    </div>
  `

  // load preferences
  changeQuality(getTablePreference('renderQuality') ?? 3)

  // setup menu for layers
  let undefinedCount = 0
  for (const layer of ['token', 'overlay', 'tile', 'other']) {
    _('#btn-' + layer).on('click', () => toggleLayer(layer))
    const prop = getTablePreference('layer' + layer)
    if (prop === true) toggleLayer(layer) // stored enabled
    if (prop === undefined) undefinedCount++
  }
  if (undefinedCount >= 4) {
    // default if store was empty
    toggleLayer('other')
    toggleLayer('token')
  }

  // setup menu for selection
  _('#btn-a').on('click', () => modalLibrary(getMouseTileX(), getMouseTileY()))
  _('#btn-e').on('click', () => editSelected())
  _('#btn-r').on('click', () => rotateSelected())
  _('#btn-c').on('click', () => cloneSelected(getMouseTileX(), getMouseTileY()))
  _('#btn-t').on('click', () => toTopSelected())
  _('#btn-b').on('click', () => toBottomSelected())
  _('#btn-f').on('click', () => flipSelected())
  _('#btn-s').on('click', () => settings())
  _('#btn-hash').on('click', () => randomSelected())
  _('#btn-del').on('click', () => deleteSelected())

  // setup remaining menu
  _('#btn-h').on('click', () => modalHelp())
  _('#btn-q').on('click', () => navigateToJoin(getTable().name))

  updateTable().css({
    backgroundColor: table.background.color,
    backgroundImage: 'url("img/checkers-white.png?v=$CACHE$"),url("' + table.background.image + '?v=$CACHE$")',
    backgroundSize: table.template.gridSize + 'px,1152px 768px'
  })

  _('body').on('contextmenu', e => e.preventDefault())

  // setup scroller + keep reference for scroll-tracking
  scroller = _('#scroller')
  scroller.css({ // this is for moz://a
    scrollbarColor: `${table.background.scroller} ${table.background.color}`
  })
  scroller = scroller.node()
  scroller.style.setProperty('--fbg-color-scroll-fg', table.background.scroller)
  scroller.style.setProperty('--fbg-color-scroll-bg', table.background.color)

  enableDragAndDrop('#tabletop')

  // load + setup content
  setStateNo(getTablePreference('subtable') ?? 1, false)
  runStatuslineLoop()
  startAutoSync(() => { setAutoScrollPosition() })
}

let scrollFetcherTimeout = -1

/**
 * Scroll to the last open scroll position.
 *
 * Defaults to the center of the setup if no last scroll position ist known. Will
 * also install an event handler to capture scroll events & record them.
 */
function setAutoScrollPosition () {
  const scroller = _('#scroller')
  const lastX = getTablePreference('scrollX')
  const lastY = getTablePreference('scrollY')
  if (lastX && lastY) {
    scroller.node().scrollTo(
      lastX - Math.floor(scroller.clientWidth / 2),
      lastY - Math.floor(scroller.clientHeight / 2)
    )
  } else {
    const center = getSetupCenter()
    scroller.node().scrollTo(
      Math.floor(center.x - scroller.clientWidth / 2),
      Math.floor(center.y - scroller.clientHeight / 2)
    )
  }
  scroller.on('scroll', () => {
    clearTimeout(scrollFetcherTimeout)
    scrollFetcherTimeout = setTimeout(() => { // delay a bit to not/less fire during scroll
      setTablePreference('scrollX', scroller.scrollLeft + Math.floor(scroller.clientWidth / 2))
      setTablePreference('scrollY', scroller.scrollTop + Math.floor(scroller.clientHeight / 2))
    }, 1000)
  })
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
 * Calculate the center of the setup on the table.
 *
 * Iterates over all pieces and averages their centers.
 *
 * @return {Object} Object with x and y.
 */
function getSetupCenter () {
  const x = []
  const y = []
  _('.piece').each(node => {
    const piece = findPiece(node.id)
    x.push((piece.x + piece.w) / 2)
    y.push((piece.y + piece.h) / 2)
  })
  return {
    x: x.length > 0 ? Math.ceil(x.reduce((a, b) => a + b) / x.length) : 0,
    y: y.length > 0 ? Math.ceil(y.reduce((a, b) => a + b) / y.length) : 0
  }
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
 * Detect deleted pieces and remove them from the table.
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

/**
 * Update the status line (clock etc.).
 */
function updateStatusline () {
  const time = new Date().toLocaleTimeString('de', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
  const message = fakeTabularNums(`${time} • Table ${getStateNo()}`)
  const status = _('#table .status')
  if (status.innerHTML !== message) {
    console.log('replacing')
    status.innerHTML = message
  }
}

let statuslineLoop = -1

function runStatuslineLoop () {
  clearTimeout(statuslineLoop)
  updateStatusline()
  statuslineLoop = setTimeout(() => {
    runStatuslineLoop()
  }, 5000)
}

function fakeTabularNums (text) {
  return text.replace(/([0-9])/g, '<span class="is-tabular">$1</span>')
}

const iconDice = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'

const iconToken = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"/><circle cx="12" cy="10" r="3"/><circle cx="12" cy="12" r="10"/></svg>'

const iconOverlay = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'

const iconTile = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>'

const iconAdd = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>'

const iconEdit = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'

const iconRotate = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>'

const iconFlip = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>'

const iconTop = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>'

const iconBottom = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>'

const iconClone = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'

const iconDelete = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'

const iconShuffle = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>'

const iconDownload = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>'

const iconHelp = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'

const iconQuit = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>'
