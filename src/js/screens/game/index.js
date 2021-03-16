/**
 * @file The actual game / tabletop stuff.
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
  getGame,
  getTemplate,
  getAsset,
  loadGameState,
  pollGameState,
  updatePieces,
  stateCreatePiece,
  stateDeletePiece,
  stateNumberPiece,
  stateFlipPiece,
  stateMovePiece,
  stateRotatePiece,
  stateSetGamePref,
  stateGetGamePref
} from './state.js'
import { enableDragAndDrop, getMouseTileX, getMouseTileY } from './mouse.js'
import _ from '../../FreeDOM.js'
import { clamp } from '../../utils.js'

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
 * Initialize and start the game/tabletop screen.
 *
 * @param {String} name Name of game, e.g. hilariousGazingPenguin.
 */
export function runGame (name) {
  console.info('$NAME$ v$VERSION$, game ' + name)

  loadGameState(name)
    .then(game => { if (game) setupGame(game) })
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
    stateSetGamePref('layer' + layer, true)
  } else {
    unselectPieces(layer)
    stateSetGamePref('layer' + layer, false)
  }
}

/**
 * Delete the currently selected piece from the game.
 *
 * Will silently fail if nothing is selected.
 */
export function deleteSelected () {
  _('#tabletop .is-selected').each(node => stateDeletePiece(node.id))
}

/**
 * Delete a piece from the game.
 *
 * Will silently fail if this piece does not exist.
 *
 * @param {String} id ID of piece.
 */
export function deletePiece (id) {
  _('#' + id).delete()
}

/**
 * Show settings dialog for the current game/table.
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
  const selected = _('#tabletop .is-selected')
  if (selected.exists()) {
    modalEdit(nodeToPiece(
      selected.node()
    ))
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
  _('#tabletop .is-selected').each(node => {
    const piece = nodeToPiece(node)
    piece.x = x
    piece.y = y
    if (piece.no > 0) { // increase piece letter (if it has one)
      piece.no = piece.no + 1
      if (piece.no > 26) piece.no = 1
    }
    stateCreatePiece(piece, true)
  })
}

/**
 * Flip the currently selected piece to it's next side.
 *
 * Will cycle the sides and silently fail if nothing is selected.
 */
export function flipSelected () {
  _('#tabletop .is-selected').each(node => {
    const sides = Number(node.dataset.sides)
    if (sides > 1) {
      stateFlipPiece(node.id, (Number(node.dataset.side) + 1) % sides)
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
    stateNumberPiece(node.id, (Number(node.dataset.no) + 16 + delta) % 16) // 0=nothing, 1-9, A-F
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
  _('#tabletop .is-selected').each(node => {
    const coords = []
    const pieces = []
    switch (node.dataset.feature) {
      case 'DICEMAT': // dicemat: randomize all pieces on it
        pieces.length = 0
        coords.length = 0
        for (let x = 0; x < Math.min(Number(node.dataset.w), 4); x++) {
          for (let y = 0; y < Math.min(Number(node.dataset.h), 4); y++) {
            coords.push({ // a max. 4x4 area in the center of the dicemat
              x: Math.max(0, Math.floor((Number(node.dataset.w) - 4) / 2)) + x,
              y: Math.max(0, Math.floor((Number(node.dataset.h) - 4) / 2)) + y
            })
          }
        }

        for (const piece of getPiecesWithin({
          left: Number(node.dataset.x),
          top: Number(node.dataset.y),
          right: Number(node.dataset.x) + Number(node.dataset.w) - 1,
          bottom: Number(node.dataset.y) + Number(node.dataset.h) - 1
        }, 'other')) {
          if (piece.dataset.feature === 'DICEMAT') continue // don't touch the dicemat

          // pick one random position
          let coord = { x: 0, y: 0 }
          let index = Math.floor(Math.random() * coords.length)
          if (coords[index].x === Number(piece.dataset.x) && coords[index].y === Number(piece.dataset.y)) {
            index = (index + 1) % coords.length
          }
          coord = coords[index]
          coords.splice(index, 1)

          // update the piece
          pieces.push({
            id: piece.id,
            side: Math.floor(Math.random() * Number(piece.dataset.sides)),
            x: Number(node.dataset.x) + coord.x,
            y: Number(node.dataset.y) + coord.y,
            r: (Number(node.dataset.r) + 90 + 90 * Math.floor(Math.random() * 3)) % 360
          })
        }
        updatePieces(pieces)
        break
      default: // ordinary piece
        if (Number(node.dataset.sides) > 1) { // only randomize multi-sided tokens
          updatePieces([{
            id: node.id,
            side: Math.floor(Math.random() * Number(node.dataset.sides)),
            r: (Number(node.dataset.r) + 90 + 90 * Math.floor(Math.random() * 3)) % 360
          }])
        }
    }
  })
}

/**
 * Add or re-set a piece.
 *
 * @param {Object} pieceJson The piece's full data object.
 * @param {Boolean} select If true, the piece will also get selected. Defaults to false.
 */
export function setPiece (pieceJson, select = false) {
  pieceJson.height = pieceJson.height < 0 ? pieceJson.width : pieceJson.height

  let selection = []

  // get the DOM node for the piece or (re)create it if major changes happened
  let div = _('#' + pieceJson.id)
  if (div.unique() && (
    div.dataset.layer !== pieceJson.layer ||
    Number(div.dataset.w) !== pieceJson.width ||
    Number(div.dataset.h) !== pieceJson.height ||
    Number(div.dataset.side) !== pieceJson.side
  )) {
    selection = _('#tabletop .is-selected').id
    if (!Array.isArray(selection)) selection = [selection] // make sure we use lists here
    div.delete()
  }
  if (!div.unique()) {
    const node = pieceToNode(pieceJson)
    if (selection.includes(pieceJson.id)) node.add('.is-selected')
    _('#layer-' + pieceJson.layer).add(node)
  }

  // update dom infos (position, rotation ...)
  const template = getTemplate()
  div = _('#' + pieceJson.id) // fresh query
    .css({
      left: pieceJson.x * template.gridSize + 'px',
      top: pieceJson.y * template.gridSize + 'px',
      zIndex: pieceJson.z
    })
    .remove('.is-rotate-0', '.is-rotate-90', '.is-rotate-180', '.is-rotate-270')
  switch (pieceJson.r) {
    case 0:
    case 90:
    case 180:
    case 270:
      div.add('.is-rotate-' + pieceJson.r)
  }
  if (pieceJson.color >= 0 && pieceJson.color <= 7) {
    _(`#${pieceJson.id}`).css({
      '--fbg-border-color': template.colors[pieceJson.color].value
    })
  }

  // update label
  if (Number(div.dataset.label) !== pieceJson.label) {
    _('#' + pieceJson.id + ' .label').delete()
    if (pieceJson.label && pieceJson.label !== '') {
      div.add(_('.label').create(pieceJson.label))
    }
  }

  // update piece number
  if (Number(div.dataset.no) !== pieceJson.no) {
    div.remove('.is-n', '.is-n-*')
    if (pieceJson.layer === 'token' && pieceJson.no !== 0) {
      div.add('.is-n', '.is-n-' + pieceJson.no)
    }
  }

  // update select status
  if (select && _('#tabletop.layer-' + pieceJson.layer + '-enabled').exists()) {
    unselectPieces()
    div.add('.is-selected')
  }

  updateNode(div, pieceJson)
}

/**
 * Rotate the currently selected piece.
 *
 * Done in 90° increments.
 */
export function rotateSelected () {
  _('#tabletop .is-selected').each(node => {
    stateRotatePiece(node.id, (parseFloat(node.dataset.r ?? 0) + 90) % 360)
  })
}

/**
 * Determine the lowest z-index in use by the pieces in a layer.
 *
 * @param {String} layer Either 'tile', 'overlay' or 'token'.
 * @return {Number} Lowest CSS z-index, or 0 if layer is empty.
 */
export function getMinZ (layer) {
  let minZ = 999999999
  _(`.layer-${layer} .piece`).each(piece => {
    const z = Number(piece.dataset.z)
    if (z === minZ) {
      minZ = z - 1 // make sure this duplicate creates an even lower z
    } else if (z < minZ) {
      minZ = z
    }
  })
  return minZ === 999999999 ? 0 : minZ // start at 0
}

/**
 * Determine the highest z-index in use by the pieces in a layer.
 *
 * @param {String} layer Either 'tile', 'overlay' or 'token'.
 * @return {Number} Highest CSS z-index, or 0 if layer is empty.
 */
export function getMaxZ (layer) {
  let maxZ = -999999999
  _(`.layer-${layer} .piece`).each(piece => {
    const z = Number(piece.dataset.z)
    if (z === maxZ) {
      maxZ = z + 1 // make sure this duplicate creates an even higher z
    } else if (z > maxZ) {
      maxZ = z
    }
  })
  return maxZ === -999999999 ? 0 : maxZ // start at 0
}

/**
 * Move the currently selected piece to the top within it's layer.
 *
 * Will silently fail if nothing is selected.
 */
export function toTopSelected () {
  for (const node of document.querySelectorAll('.piece.is-selected')) {
    const maxZ = getMaxZ(node.dataset.layer)
    if (Number(node.dataset.z) !== maxZ) {
      stateMovePiece(node.id, null, null, maxZ + 1)
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
    const minZ = getMinZ(node.dataset.layer)
    if (Number(node.dataset.z) !== minZ) {
      stateMovePiece(node.id, null, null, minZ - 1)
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
  _('#popper').remove('.show') // make sure popup is gone
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
 * Get the piece data object for a piece via it's ID.
 *
 * @param {String} id ID of piece.
 * @return {Object} Full piece data object.
 */
export function nodeIdToPiece (id) {
  const node = document.getElementById(id)
  return nodeToPiece(node)
}

/**
 * Convert a DOM node to a piece data object.
 *
 * Most of the data is stored in data-* attributes.
 *
 * @param {HTMLElement} node Node to convert.
 * @return {Object} Full piece data object.
 */
export function nodeToPiece (node) {
  const piece = {}
  if (node.id && node.id !== '') piece.id = node.id
  piece.layer = node.dataset.layer
  piece.asset = node.dataset.asset
  piece.width = Number(node.dataset.w)
  piece.height = Number(node.dataset.h)
  piece.x = Number(node.dataset.x)
  piece.y = Number(node.dataset.y)
  piece.z = Number(node.dataset.z)
  piece.r = Number(node.dataset.r)
  piece.no = Number(node.dataset.no)
  piece.side = Number(node.dataset.side)
  piece.label = node.dataset.label
  piece.color = Number(node.dataset.color)
  return piece
}

/**
 * Convert an asset data object to a DOM node.
 *
 * If we get an invalid asset (null or invalid propierties), we create and
 * return a dummy entry on screen.
 *
 * @param {Object} assetJson Full asset data object.
 * @param {Number} side Side to show (zero-based).
 * @return {HTMLElement} Converted node (not added to DOM yet).
 */
export function assetToNode (assetJson, side = 0) {
  let node

  // create the dom node
  if (assetJson.id === '0000000000000000') {
    node = createInvalidAsset(assetJson.type)
  } else {
    if (assetJson.base) { // layered asset
      node = _(`.piece.piece-${assetJson.type}.has-layer`).create().css({
        backgroundImage: `url('api/data/games/${getGame().name}/assets/${assetJson.type}/${assetJson.base}')`,
        '--fbg-layer-image': `url('api/data/games/${getGame().name}/assets/${assetJson.type}/${assetJson.assets[side]}')`
      })
    } else { // regular asset
      node = _(`.piece.piece-${assetJson.type}`).create().css({
        backgroundImage: `url('api/data/games/${getGame().name}/assets/${assetJson.type}/${assetJson.assets[side]}')`
      })
    }
  }
  if (assetJson.type !== 'overlay' && assetJson.type !== 'other') {
    node.css({
      backgroundColor: '#' + (assetJson.bg ?? '808080')
    })
  }

  // set default metadata from asset
  node.data({
    asset: assetJson.id,
    layer: assetJson.type,
    w: assetJson.width,
    h: assetJson.height,
    side: side,
    sides: assetJson.assets.length,
    r: 0,
    no: 0,
    bg: assetJson.bg,
    color: 0
  })

  // add feature hook to piece (if it has one)
  if (assetJson.alias === 'dicemat') {
    node.data({
      feature: 'DICEMAT'
    })
  }

  return node
}

/**
* Convert a piece data object to a DOM node.
 *
 * @param {Object} Full piece data object.
 * @return {HTMLElement} Converted node (not added to DOM yet).
 */
export function pieceToNode (pieceJson) {
  const node = assetToNode(getAsset(pieceJson.asset), pieceJson.side ?? 0)
  node.add(`.is-w-${pieceJson.width}`, `.is-h-${pieceJson.height}`, `.is-wh-${pieceJson.width - pieceJson.height}`)

  const ret = updateNode(node, pieceJson)
  return ret
}

export function popupPiece (id) {
  const piece = _('#' + id)
  const popup = _('#popper')

  popup.innerHTML = `
    <a class="popup-menu edit" href="#">${iconEdit}Edit</a>
    <a class="popup-menu rotate" href="#">${iconRotate}Rotate</a>
    <a class="popup-menu flip ${piece.dataset.sides > 1 ? '' : 'disabled'}" href="#">${iconFlip}Flip</a>
    <a class="popup-menu top" href="#">${iconTop}To top</a>
    <a class="popup-menu bottom" href="#">${iconBottom}To bottom</a>
    <a class="popup-menu clone" href="#">${iconClone}Clone</a>
    <a class="popup-menu delete" href="#">${iconDelete}Delete</a>
  `

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

  createPopper(piece.node(), popup.node(), {
    placement: 'right'
  })
  popup.add('.show')
}

// --- internal ----------------------------------------------------------------

/**
 * Setup the game screen / HTML.
 *
 * @param {Object} game Game data object.
 */
function setupGame (game) {
  _('body').remove('.page-boxed').innerHTML = `
    <div id="game" class="game is-fullscreen is-noselect">
      <div class="menu">
        <div>
          <div class="menu-brand is-content">
            <button id="btn-s" class="btn-icon" title="Game settings [s]"><img src="icon.svg"></button>
          </div>

          <div>
            <button id="btn-other" class="btn-icon" title="Toggle dice [1]">${iconDice}</button>

            <button id="btn-token" class="btn-icon" title="Toggle tokens [2]">${iconToken}</button>

            <button id="btn-overlay" class="btn-icon" title="Toggle overlays [3]">${iconOverlay}</button>

            <button id="btn-tile" class="btn-icon" title="Toggle tiles [4]">${iconTile}</button>
          </div>

          <div class="spacing-medium">
            <button id="btn-a" class="btn-icon" title="Add piece [a]">${iconAdd}</button>
          </div>

          <div class="menu-selected disabled spacing-medium">
            <button id="btn-e" class="btn-icon" title="Edit [e]">${iconEdit}</button>

            <button id="btn-r" class="btn-icon" title="Rotate [r]">${iconRotate}</button>

            <button id="btn-f" class="btn-icon" title="Flip [f]">${iconFlip}</button>

            <button id="btn-t" class="btn-icon" title="To top [t]">${iconTop}</button>

            <button id="btn-b" class="btn-icon" title="To bottom [b]">${iconBottom}</button>

            <button id="btn-c" class="btn-icon" title="Clone [c]">${iconClone}</button>

            <button id="btn-del" class="btn-icon" title="Delete [Del]">${iconDelete}</button>
          </div>
        </div>
        <div>
          <button id="btn-h" class="btn-icon" title="Help [h]">${iconHelp}</button>

          <a id="btn-snap" class="btn-icon" title="Download game snapshot" href='./api/games/${game.name}/snapshot/'>${iconDownload}</a>

          <button id="btn-q" class="btn-icon" title="Leave game">${iconQuit}</button>
        </div>
      </div>
      <div id="scroller" class="scroller">
        <div id="tabletop" class="tabletop">
          <div id="cursor" class="cursor"></div>
          <div id="layer-other" class="layer layer-other"></div>
          <div id="layer-token" class="layer layer-token"></div>
          <div id="layer-overlay" class="layer layer-overlay"></div>
          <div id="layer-tile" class="layer layer-tile"></div>
          <div id="layer-table" class="layer layer-table"></div>
        </div>
      </div>
    </div>
    <div id="popper" class="popup is-content"></div>
  `

  changeQuality(stateGetGamePref('renderQuality') ?? 3)

  // setup menu for layers
  let undefinedCount = 0
  for (const layer of ['token', 'overlay', 'tile', 'other']) {
    _('#btn-' + layer).on('click', () => toggleLayer(layer))
    const prop = stateGetGamePref('layer' + layer)
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
  _('#btn-del').on('click', () => deleteSelected())

  // setup remaining menu
  _('#btn-h').on('click', () => modalHelp())
  _('#btn-q').on('click', () => quit())

  const table = game.tables[0] // assume one table for now

  _('#tabletop').css({
    width: table.width + 'px',
    height: table.height + 'px',
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
  scroller = scroller.node() // and this for the webkits out there
  scroller.style.setProperty('--fbg-color-scroll-fg', table.background.scroller)
  scroller.style.setProperty('--fbg-color-scroll-bg', table.background.color)

  // setup content
  pollGameState()

  enableDragAndDrop('#tabletop')
}

/**
 * Leave the current game by redirecting back to the join screen.
 */
function quit () {
  document.location = './?game=' + getGame().name
}

/**
 * Update a piece's DOM node with a piece data object.
 *
 * Will only set meta-fields (data-*), but not change styles.
 *
 * @param {FreeDOM} node DOM element to update.
 * @param {Object} piece Piece data.
 * @return {HTMLElement} Updated node.
 */
function updateNode (node, piece) {
  piece.sides = piece.sides ?? getAsset(piece.asset).assets.length // server pieces don't have this yet
  node.id = piece.id
  node.data({
    asset: piece.asset,
    layer: piece.layer ?? 'tile',
    w: piece.width ?? 1,
    h: piece.height ?? 1,
    x: piece.x ?? 0,
    y: piece.y ?? 0,
    z: piece.z ?? 0,
    r: piece.r ?? 0,
    no: piece.no ?? 0,
    color: piece.color ?? 0,
    side: clamp(0, piece.side ?? 0, piece.sides - 1),
    label: piece.label ?? ''
  })
  return node
}

/**
 * Find all pieces within a grid area.
 *
 * @param {Object} rect Rectangle object, containing top/left/bottom/right.
 * @param {String} layer Optional name of layer to search within. Defaults to 'all'.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
function getPiecesWithin (rect, layer = 'all') {
  const pieces = []
  const filter = layer === 'all' ? '.piece' : '.layer-' + layer + ' .piece'
  _('#tabletop ' + filter).each(node => {
    if (intersect(rect, {
      left: Number(node.dataset.x),
      top: Number(node.dataset.y),
      right: Number(node.dataset.x) + (node.dataset.r === '0' || node.dataset.r === '180' ? Number(node.dataset.w) : Number(node.dataset.h)) - 1,
      bottom: Number(node.dataset.y) + (node.dataset.r === '0' || node.dataset.r === '180' ? Number(node.dataset.h) : Number(node.dataset.w)) - 1
    })) {
      pieces.push(node)
    }
  })
  return pieces
}

/**
 * Determine if two rectacles intersect / overlap.
 *
 * @param {Object} rect1 First rect, containing of top/left/bottom/right.
 * @param {Object} rect2 Second rect, containing of top/left/bottom/right.
 * @returns {Boolean} True if they intersect.
 */
function intersect (rect1, rect2) {
  return (rect1.left <= rect2.right &&
    rect2.left <= rect1.right &&
    rect1.top <= rect2.bottom &&
    rect2.top <= rect1.bottom)
}

/**
 * Create an asset node for invalid assets / ids.
 *
 * @param {String} type Asset type (token, tile, ...).
 * @return {FreeDOM} dummy node.
 */
function createInvalidAsset (type) {
  return _(`.piece.piece-${type}`).create().css({
    backgroundImage: `url('api/data/games/${getGame().name}/invalid.svg')`,
    backgroundColor: '#40bfbf'
  })
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

const iconDownload = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>'

const iconHelp = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'

const iconQuit = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>'
