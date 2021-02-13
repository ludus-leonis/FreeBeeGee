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

import {
  getGame,
  loadGame,
  pollState,
  stateCreatePiece,
  stateDeletePiece,
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

let scroller = null /** keep reference to scroller div - we need it often */

export const tilesize = 64 /** size of each grid field in px */

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
  } // simplebar.getScrollElement().scrollLeft
}

/**
 * Initialize and start the game/tabletop screen.
 *
 * @param {String} name Name of game, e.g. hilariousGazingPenguin.
 */
export function runGame (name) {
  console.info('$NAME$ v$VERSION$, game ' + name)

  loadGame(name)
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
 * @param {String} id UUID of piece.
 */
export function deletePiece (id) {
  _('#' + id).delete()
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
    const sides = JSON.parse(node.dataset.assets).length
    if (sides > 1) {
      stateFlipPiece(node.id, (Number(node.dataset.side) + 1) % sides)
    }
  })
}

/**
 * Add or re-set a piece.
 *
 * @param {Object} json The piece's full data object.
 * @param {Boolean} select If true, the piece will also get selected. Defaults to false.
 */
export function setPiece (json, select = false) {
  json.height = json.height < 0 ? json.width : json.height

  let selection = []

  // get the DOM node for the piece or (re)create it if major changes happened
  let div = _('#' + json.id)
  if (div.unique() && (
    div.dataset.type !== json.type ||
    Number(div.dataset.w) !== json.width ||
    Number(div.dataset.h) !== json.height ||
    Number(div.dataset.side) !== json.side
  )) {
    selection = _('#tabletop .is-selected').id
    if (!Array.isArray(selection)) selection = [selection] // make sure we use lists here
    div.delete()
  }
  if (!div.unique()) {
    const node = pieceToNode(json)
    if (selection.includes(json.id)) node.add('.is-selected')
    _('#layer-' + json.type).add(node)
  } else {
    updateNode(div.node(), json)
  }

  // update dom infos (position, rotation ...)
  div = _('#' + json.id) // fresh query
    .css({
      left: json.x * tilesize + 'px',
      top: json.y * tilesize + 'px',
      zIndex: json.z
    })
    .remove('.is-rotate-0', '.is-rotate-90', '.is-rotate-180', '.is-rotate-270')
  switch (json.r) {
    case 0:
    case 90:
    case 180:
    case 270:
      div.add('.is-rotate-' + json.r)
  }
  if (json.color >= 0 && json.color <= 7) {
    _(`#${json.id} .border`).css({
      borderColor: colors[json.color]
    })
  }

  // update label
  _('#' + json.id + ' .label').delete()
  const label = json.label ?? ''
  if (label !== '') {
    div.add(_('.label').create(label))
  }

  // update select status
  if (select && _('#tabletop.layer-' + json.type + '-enabled').exists()) {
    unselectPieces()
    div.add('.is-selected')
  }
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
    const maxZ = getMaxZ(node.dataset.type)
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
    const minZ = getMinZ(node.dataset.type)
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
}

/**
 * Get a list of all pieces' IDs that are in play.
 *
 * @return {String[]} Possibly empty array of UUIDs.
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
 * @param {String} id UUID of piece.
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
  const item = {}
  item.id = node.id
  item.type = node.dataset.type
  item.assets = JSON.parse(node.dataset.assets)
  item.width = Number(node.dataset.w)
  item.height = Number(node.dataset.h)
  item.x = Number(node.dataset.x)
  item.y = Number(node.dataset.y)
  item.z = Number(node.dataset.z)
  item.r = Number(node.dataset.r)
  item.side = Number(node.dataset.side)
  item.label = node.dataset.label
  item.color = Number(node.dataset.color)
  item.bg = node.dataset.bg
  return item
}

/**
* Convert a piece data object to a DOM node.
 *
 * @param {Object} Full piece data object.
 * @return {HTMLElement} Converted node (not added to DOM yet).
 */
export function pieceToNode (json) {
  const asset = _('.asset').create().css({
    backgroundImage: `url('api/games/${getGame().name}/assets/${json.type}/${json.assets[json.side ?? 0]}')`,
    backgroundColor: json.type === 'overlay' ? 'transparent' : `#${json.bg}`
  })
  const node = _(`.piece.${json.type}.is-w-${json.width}.is-h-${json.height}.is-wh-${json.width - json.height} > .box > .border`).create(asset)
  return updateNode(node, json)
}

// --- internal ----------------------------------------------------------------

/**
 * Setup the game screen / HTML.
 *
 * @param {Object} game Game data object.
 */
function setupGame (game) {
  _('body').innerHTML = `
    <div id="game" class="game is-fullscreen is-noselect">
      <div class="menu">
        <div>
          <div>
            <button id="btn-token" class="btn-icon" title="Toggle tokens [1]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"/><circle cx="12" cy="10" r="3"/><circle cx="12" cy="12" r="10"/></svg></button>

            <button id="btn-overlay" class="btn-icon" title="Toggle overlays [2]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg></button>

            <button id="btn-tile" class="btn-icon" title="Toggle tiles [3]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
          </div>

          <div class="spacing-medium">
            <button id="btn-a" class="btn-icon" title="Add piece [a]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></button>
          </div>

          <div class="menu-selected disabled spacing-medium">
            <button id="btn-e" class="btn-icon" title="Edit [e]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>

            <button id="btn-r" class="btn-icon" title="Rotate [r]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>

            <button id="btn-f" class="btn-icon" title="Flip [f]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></button>

            <button id="btn-t" class="btn-icon" title="To top [t]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg></button>

            <button id="btn-b" class="btn-icon" title="To bottom [b]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg></button>

            <button id="btn-c" class="btn-icon" title="Clone [c]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>

            <button id="btn-del" class="btn-icon" title="Delete [Del]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
          </div>
        </div>
        <div>
          <button id="btn-h" class="btn-icon" title="Help [h]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></button>

          <button id="btn-q" class="btn-icon" title="Leave game"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></button>
        </div>
      </div>
      <div id="scroller" class="scroller">
        <div id="tabletop" class="tabletop">
          <div id="cursor" class="cursor"></div>
          <div id="layer-token" class="layer layer-token"></div>
          <div id="layer-overlay" class="layer layer-overlay"></div>
          <div id="layer-tile" class="layer layer-tile"></div>
          <div id="layer-table" class="layer layer-table"></div>
        </div>
      </div>
    </div>
    <div id="modal" class="modal is-noselect" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div id="modal-header" class="modal-header is-content"></div>
          <div id="modal-body" class="modal-body is-content"></div>
          <div id="modal-footer" class="modal-footer"></div>
        </div>
      </div>
    </div>
  `

  // setup menu for layers
  let undefinedCount = 0
  for (const layer of ['token', 'overlay', 'tile']) {
    _('#btn-' + layer).on('click', () => toggleLayer(layer))
    const prop = stateGetGamePref('layer' + layer)
    if (prop === true) toggleLayer(layer) // stored enabled
    if (prop === undefined) undefinedCount++
  }
  if (undefinedCount >= 3) toggleLayer('token') // default if store was empty

  // setup menu for selection
  _('#btn-a').on('click', () => modalLibrary(getMouseTileX(), getMouseTileY()))
  _('#btn-e').on('click', () => editSelected())
  _('#btn-r').on('click', () => rotateSelected())
  _('#btn-c').on('click', () => cloneSelected(getMouseTileX(), getMouseTileY()))
  _('#btn-t').on('click', () => toTopSelected())
  _('#btn-b').on('click', () => toBottomSelected())
  _('#btn-f').on('click', () => flipSelected())
  _('#btn-del').on('click', () => deleteSelected())

  // setup remaining menu
  _('#btn-h').on('click', () => modalHelp())
  _('#btn-q').on('click', () => quit())

  _('#tabletop').css({
    width: (game.width * tilesize) + 'px',
    height: (game.height * tilesize) + 'px',
    backgroundColor: game.backgroundColor,
    backgroundImage: 'url("img/checkers-white.png?v=$CACHE$"),url("' + game.backgroundImage + '?v=$CACHE$")',
    backgroundSize: '64px,768px'
  })

  scroller = _('#scroller').node() // keep reference for scroll-tracking

  // setup content
  pollState()

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
 * @param {HTMLElement} node DOM element to update.
 * @param {Object} piece Piece data.
 * @return {HTMLElement} Updated node.
 */
function updateNode (node, piece) {
  node.id = piece.id
  node.dataset.assets = JSON.stringify(piece.assets)
  node.dataset.type = piece.type ?? 'tile'
  node.dataset.w = piece.width ?? 1
  node.dataset.h = piece.height ?? 1
  node.dataset.x = piece.x ?? 0
  node.dataset.y = piece.y ?? 0
  node.dataset.z = piece.z ?? 0
  node.dataset.r = piece.r ?? 0
  node.dataset.color = piece.color ?? 0
  node.dataset.bg = piece.bg ?? '808080'
  node.dataset.side = clamp(0, piece.side ?? 0, piece.assets.length - 1)
  node.dataset.label = piece.label ?? ''
  return node
}

const colors = ['#0d0d0d', '#3f8efc', '#0f956a', '#40bfbf', '#cc2936', '#bf40bf', '#ff6700', '#f2e4be'] /** our outline colors */
