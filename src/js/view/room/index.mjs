/**
 * @file The room handling. Mainly in charge of UI, menus and managing the
 *       tabletop canvas itself - but not the stuff on the tabletop.
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

import { createPopper } from '@popperjs/core'

import _ from '../../lib/FreeDOM.mjs'

import {
  navigateToJoin
} from '../../app.mjs'

import {
  iconLogo,
  iconDice,
  iconToken,
  iconOverlay,
  iconTile,
  iconAdd,
  iconEdit,
  iconRotate,
  iconFlip,
  iconTop,
  iconBottom,
  iconClone,
  iconDelete,
  iconShuffle,
  iconDownload,
  iconHelp,
  iconQuit,
  iconRuler,
  iconNote,
  iconSettings
} from '../../lib/icons.mjs'

import {
  FLAG_NO_CLONE,
  FLAG_NO_DELETE,
  loadRoom,
  getRoom,
  getServerInfo,
  PREFS,
  cleanupStore,
  getServerPreference,
  setServerPreference,
  getRoomPreference,
  setRoomPreference,
  getTablePreference,
  setTablePreference,
  getTableNo,
  setTableNo,
  getTemplate
} from '../../state/index.mjs'

import {
  unselectPieces,
  editSelected,
  rotateSelected,
  cloneSelected,
  toTopSelected,
  toBottomSelected,
  flipSelected,
  randomSelected,
  deleteSelected,
  createNote,
  url
} from '../../view/room/tabletop/index.mjs'

import {
  TYPE_HEX,
  getSetupCenter,
  findPiece
} from '../../view/room/tabletop/tabledata.mjs'

import {
  enableDragAndDrop,
  getMouseCoords,
  toggleLMBLos,
  isLMBLos
} from '../../view/room/mouse/index.mjs'

import {
  startAutoSync
} from '../../view/room/sync.mjs'

import {
  modalLibrary
} from '../../view/room/modal/library.mjs'

import {
  modalHelp
} from '../../view/room/modal/help.mjs'

import {
  modalDisabled
} from '../../view/room/modal/disabled.mjs'

import {
  modalDemo
} from '../../view/room/modal/demo.mjs'

import {
  modalSettings,
  changeQuality
} from '../../view/room/modal/settings.mjs'

import {
  clamp,
  brightness
} from '../../lib/utils.mjs'

import {
  DEMO_MODE
} from '../../api/index.mjs'

// --- public ------------------------------------------------------------------

/**
 * Set the room mouse cursor (pointer, cross, ...)
 *
 * @return {String} Cursor (class), or undefined to revert to default cursor.
 */
export function setCursor (cursor) {
  scroller.remove('.cursor-*')
  if (cursor) {
    scroller.add(cursor)
  } else {
    if (isLMBLos()) {
      scroller.add('.cursor-cross')
    }
  }
}

/**
 * Get current top-left tabletop scroll position.
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
  scroller.node().scrollTo(x, y)
}

/**
 * Get current center of the viewport of the scroll position.
 *
 * @return {Object} Contains x and y in pixel.
 */
export function getViewportCenter () {
  return {
    x: scroller.scrollLeft + Math.floor(scroller.clientWidth / 2),
    y: scroller.scrollTop + Math.floor(scroller.clientHeight / 2)
  }
}

/**
 * Get current center of the viewport of the scroll position.
 *
 * @return {Object} Contains x and y in pixel.
 */
export function getViewportCenterTile () {
  const template = getTemplate()
  const pos = getViewportCenter()
  return {
    x: Math.floor(pos.x / template.gridSize),
    y: Math.floor(pos.y / template.gridSize)
  }
}

/**
 * Initialize and start the room/tabletop screen.
 *
 * @param {String} name Name of room, e.g. hilariousGazingPenguin.
 * @param {String} token API access token for this room.
 */
export function runRoom (name, token) {
  console.info('$NAME$ v$VERSION$, room ' + name)

  loadRoom(name, token)
    .then(() => setupRoom())
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
    setRoomPreference(PREFS['LAYER' + layer], true)
  } else {
    unselectPieces(layer)
    setRoomPreference(PREFS['LAYER' + layer], false)
  }
}

/**
 * Toggle the ruler on/off.
 */
export function toggleLos () {
  _('#btn-s').toggle('.active')
  toggleLMBLos()
  if (isLMBLos()) {
    setCursor('.cursor-cross')
    setRoomPreference(PREFS.LOS, true)
  } else {
    setCursor()
    setRoomPreference(PREFS.LOS, false)
  }
}

/**
 * Toggle grid display on/off.
 *
 * @param {Number} value Grid value (0..2).
 */
export function toggleGrid (value) {
  switch (value) {
    case 0:
    case 1:
    case 2:
      setRoomPreference(PREFS.GRID, value)
      break
    default: // unknown value = cycle background
      setRoomPreference(PREFS.GRID, (getRoomPreference(PREFS.GRID) + 1) % 3)
  }
  setupBackground()
}

/**
 * Show the popup menu for a piece.
 *
 * @param {String} id Id of piece.
 */
export function popupPiece (id) {
  const piece = findPiece(id)
  const popup = _('#popper.popup.is-content').create()

  popup.innerHTML = `
    <a class="popup-menu edit" href="#">${iconEdit}Edit</a>
    <a class="popup-menu rotate" href="#">${iconRotate}Rotate</a>
    <a class="popup-menu flip ${piece._meta.sides > 1 ? '' : 'disabled'}" href="#">${iconFlip}Flip</a>
    <a class="popup-menu random ${(piece._meta.sides > 2 || piece._meta.feature === 'DICEMAT') ? '' : 'disabled'}" href="#">${iconShuffle}Random</a>
    <a class="popup-menu top" href="#">${iconTop}To top</a>
    <a class="popup-menu bottom" href="#">${iconBottom}To bottom</a>
    ${(piece.f & FLAG_NO_CLONE && piece.f & FLAG_NO_DELETE) ? '' : '<hr>'}
    <a class="popup-menu clone ${(piece.f & FLAG_NO_CLONE) ? 'disabled' : ''}" href="#">${iconClone}Clone</a>
    <a class="popup-menu delete ${(piece.f & FLAG_NO_DELETE) ? 'disabled' : ''}" href="#">${iconDelete}Delete</a>
  `

  _('#tabletop').add(popup)

  popupClick('#popper .edit', () => { editSelected() })
  popupClick('#popper .rotate', () => { rotateSelected() })
  popupClick('#popper .flip', () => { flipSelected() })
  popupClick('#popper .random', () => { randomSelected() })
  popupClick('#popper .top', () => { toTopSelected() })
  popupClick('#popper .bottom', () => { toBottomSelected() })
  popupClick('#popper .delete', () => { deleteSelected() })
  popupClick('#popper .clone', () => { cloneSelected(getMouseCoords()) })

  createPopper(_('#' + id).node(), popup.node(), {
    placement: 'right'
  })
  popup.add('.show')
}

/**
 * Show the popup menu for the table.
 */
export function popupTable () {
  const coords = getMouseCoords()

  const anchor = _('#popper-anchor.popup-anchor').create()
  const popup = _('#popper.popup.is-content').create()

  popup.innerHTML = `
    <a class="popup-menu add" href="#">${iconAdd}Add piece</a>
    <a class="popup-menu note" href="#">${iconNote}Add note</a>
    <hr>
    <a class="popup-menu settings" href="#">${iconSettings}Settings</a>
  `

  _('#tabletop').add(anchor)
  anchor.css({
    left: `${coords.x}px`,
    top: `${coords.y}px`
  })
  _('#tabletop').add(popup)

  popupClick('#popper .add', () => { modalLibrary(coords) })
  popupClick('#popper .note', () => { createNote(coords) })
  popupClick('#popper .settings', () => { modalSettings() })

  createPopper(anchor.node(), popup.node(), {
    placement: 'right'
  })
  popup.add('.show')
}

/**
 * Update the menu's disabled buttons.
 *
 * Mostly based on if a piece is selected or not.
 */
export function updateMenu () {
  // (de)activate menu
  const menu = _('.menu-selected')
  const selected = _('.is-selected').nodes()

  _('.menu-selected button').remove('.disabled')
  if (selected.length <= 0) {
    menu.add('.disabled')
  } else if (selected.length === 1) {
    const piece = findPiece(selected[0].id)
    menu.remove('.disabled')
    if (piece._meta.sides <= 1) {
      _('#btn-f').add('.disabled')
      _('#btn-hash').add('.disabled')
    }
    if (piece._meta.sides <= 2) {
      _('#btn-hash').add('.disabled')
    }
    if (piece._meta.feature === 'DICEMAT') {
      _('#btn-hash').remove('.disabled')
    }
    if (piece._meta.feature === 'DICEMAT') {
      _('#btn-hash').remove('.disabled')
    }
    if (piece.f & FLAG_NO_CLONE) {
      _('#btn-c').add('.disabled')
    }
    if (piece.f & FLAG_NO_DELETE) {
      _('#btn-del').add('.disabled')
    }
  } else {
    menu.remove('.disabled')
  }
}

/**
 * Update DOM room to current table-data.
 *
 * e.g. for resizing the room.
 *
 * @return {FreeDOM} Room DOM element for further customization.
 */
export function updateRoom () {
  const room = getRoom()

  return _('#tabletop').css({
    '--fbg-tabletop-width': room.width + 'px',
    '--fbg-tabletop-height': room.height + 'px'
  })
}

/**
 * Convert window coordinates to a tabletop coordinates.
 *
 * Takes position of element and scroll position inside the element into account.
 *
 * @param {Number} clientX A window x coordinate e.g. from a click event.
 * @param {Number} clientY A window y coordinate e.g. from a click event.
 * @return {Object} The absolute room coordinate as {x, y}.
 */
export function getTableCoordinates (windowX, windowY) {
  const origin = scroller.node().getBoundingClientRect()

  return {
    x: windowX + scroller.scrollLeft - origin.left,
    y: windowY + scroller.scrollTop - origin.top
  }
}

/**
 * Update the status line (clock etc.).
 */
export function updateStatusline () {
  const time = new Date().toLocaleTimeString('de', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
  const message = DEMO_MODE
    ? fakeTabularNums(`<a href="https://freebeegee.org/">FreeBeeGee</a> • ${time} • Table ${getTableNo()}`)
    : fakeTabularNums(`${time} • Table ${getTableNo()}`)
  const status = _('#room .status')
  if (status.innerHTML !== message) {
    status.innerHTML = message
  }
}

/**
 * Restore the scroll position from properties (if any).
 *
 * Defaults to the center of the table setup if no last scroll position ist known.
 */
export function restoreScrollPosition () {
  const last = getTablePreference(PREFS.SCROLL)
  if (last.x && last.y) {
    scroller.node().scrollTo(
      last.x - Math.floor(scroller.clientWidth / 2),
      last.y - Math.floor(scroller.clientHeight / 2)
    )
  } else {
    const center = getSetupCenter()
    scroller.node().scrollTo(
      Math.floor(center.x - scroller.clientWidth / 2),
      Math.floor(center.y - scroller.clientHeight / 2)
    )
  }
}

/**
 * Set backround to given index + store it as preference.
 *
 * @param {Number} bgIndex Index of background. Will be clamped to the available ones.
 * @param {Boolean} showGrid If true, the overlay grid will be drawn.
 */
export function setupBackground (
  bgIndex = getServerPreference(PREFS.BACKGROUND),
  gridType = getRoomPreference(PREFS.GRID)
) {
  const room = getRoom()
  const server = getServerInfo()

  bgIndex = clamp(0, bgIndex, server.backgrounds.length - 1)

  updateRoom().css({
    '--fbg-tabletop-color': server.backgrounds[bgIndex].color,
    '--fbg-tabletop-image': url(server.backgrounds[bgIndex].image)
  })

  // setup background / wallpaper + grid
  _('#tabletop').remove('.has-grid', '--fbg-tabletop-grid')
  if (gridType > 0) {
    _('#tabletop').add('.has-grid')

    const color = brightness(server.backgrounds[bgIndex].color) < 92 ? 'white' : 'black'
    const style = gridType > 1 ? 'major' : 'minor'
    const shape = room.template?.type === TYPE_HEX ? 'hex' : 'square'
    _('#tabletop').css({ '--fbg-tabletop-grid': url(`img/grid-${shape}-${style}-${color}.svg`) })
  }

  // setup scroller
  scroller.css({ // this is for moz://a
    scrollbarColor: `${server.backgrounds[bgIndex].scroller} ${server.backgrounds[bgIndex].color}`,
    '--fbg-color-scroll-fg': server.backgrounds[bgIndex].scroller,
    '--fbg-color-scroll-bg': server.backgrounds[bgIndex].color
  })

  // store for future reference
  setServerPreference(PREFS.BACKGROUND, bgIndex)
  setRoomPreference(PREFS.GRID, gridType)
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} element The HTML node the user clicked on. Unselect all if null.
 */
export function updateSelection (element) {
  // unselect everything if 'nothing' was clicked
  if (!element) {
    unselectPieces()
    updateMenu()
    return
  }

  // remove selection from all elements if we clicked on the background or on a piece
  if (element.id === 'tabletop' || element.classList.contains('piece') || element.classList.contains('backside')) {
    unselectPieces()
  }

  // add selection to clicked element (if it is a piece)
  if (element.classList.contains('piece')) {
    element.classList.add('is-selected')
  }

  // add selection to parent (if it is a backside piece)
  if (element.classList.contains('backside')) {
    element.parentElement.classList.add('is-selected')
  }

  updateMenu()
}

// --- internal ----------------------------------------------------------------

let scroller = null /** keep reference to scroller div - we need it often */

/**
 * Setup the room screen / HTML.
 *
 * @param {Object} room Room data object.
 */
function setupRoom () {
  cleanupStore()

  const room = getRoom()

  const mode = (room.template?.type === TYPE_HEX) ? '.is-template-grid-hex' : '.is-template-grid-square'

  _('body').remove('.page-boxed').add(mode).innerHTML = `
    <div id="room" class="room is-fullscreen is-noselect">
      <div class="menu">
        <div>
          <div class="menu-brand is-content">
            <button id="btn-S" class="btn-icon" title="Room settings [s]">${iconLogo}</button>
          </div>

          <div>
            <button id="btn-other" class="btn-icon" title="Toggle dice [1]">${iconDice}</button>
            <button id="btn-token" class="btn-icon" title="Toggle tokens [2]">${iconToken}</button>
            <button id="btn-overlay" class="btn-icon" title="Toggle overlays [3]">${iconOverlay}</button>
            <button id="btn-tile" class="btn-icon" title="Toggle tiles [4]">${iconTile}</button>
          </div>

          <div class="spacing-small">
            <button id="btn-s" class="btn-icon" title="Measure [m]">${iconRuler}</button>
            <button id="btn-a" class="btn-icon" title="Open library [l]">${iconAdd}</button>
          </div>

          <div class="menu-selected disabled spacing-small">
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

          <a id="btn-snap" class="btn-icon" title="Download snapshot">${iconDownload}</a>

          <button id="btn-q" class="btn-icon" title="Leave room">${iconQuit}</button>
        </div>
      </div>
      <div id="scroller" class="scroller">
        <div id="tabletop" class="tabletop layer-note-enabled">
          <div id="layer-other" class="layer layer-other"></div>
          <div id="layer-token" class="layer layer-token"></div>
          <div id="layer-note" class="layer layer-note"></div>
          <div id="layer-overlay" class="layer layer-overlay"></div>
          <div id="layer-tile" class="layer layer-tile"></div>
          <div id="layer-room" class="layer layer-room"></div>
        </div>
      </div>
      <div class="status"></div>
    </div>
  `

  // keep global reference for scroll-tracking
  scroller = _('#scroller')

  // load preferences
  changeQuality(getServerPreference(PREFS.QUALITY))

  // setup menu for layers
  let undefinedCount = 0
  for (const layer of ['token', 'overlay', 'tile', 'other']) {
    _('#btn-' + layer).on('click', () => toggleLayer(layer))
    const prop = getRoomPreference(PREFS['LAYER' + layer])
    if (prop === true) toggleLayer(layer) // stored enabled
    if (prop === undefined) undefinedCount++
  }
  if (undefinedCount >= 4) {
    // default if store was empty
    toggleLayer('other')
    toggleLayer('token')
  }

  if (getRoomPreference(PREFS.LOS)) toggleLos()

  // setup menu for selection
  _('#btn-a').on('click', () => modalLibrary(getViewportCenter()))
  _('#btn-e').on('click', () => editSelected())
  _('#btn-r').on('click', () => rotateSelected())
  _('#btn-c').on('click', () => cloneSelected(getMouseCoords()))
  _('#btn-t').on('click', () => toTopSelected())
  _('#btn-b').on('click', () => toBottomSelected())
  _('#btn-f').on('click', () => flipSelected())
  _('#btn-s').on('click', () => toggleLos())
  _('#btn-S').on('click', () => modalSettings())
  _('#btn-hash').on('click', () => randomSelected())
  _('#btn-del').on('click', () => deleteSelected())

  // setup remaining menu
  _('#btn-h').on('click', () => modalHelp())
  _('#btn-q').on('click', () => navigateToJoin(getRoom().name))

  setupBackground()

  _('body').on('contextmenu', e => e.preventDefault())

  enableDragAndDrop('#tabletop')

  // load + setup content
  setTableNo(getRoomPreference(PREFS.TABLE), false)
  runStatuslineLoop()

  // start autosyncing after a short delay to reduce server load a bit
  setTimeout(() => {
    startAutoSync(() => { autoTrackScrollPosition() })
  }, 100)

  if (DEMO_MODE) {
    _('#btn-snap').on('click', () => modalDisabled('would have downloaded a snapshot (a.k.a. savegame) of your whole room as <code>.zip</code> by now'))
    if (!getRoomPreference(PREFS.DISCLAIMER)) {
      setRoomPreference(PREFS.DISCLAIMER, true)
      modalDemo()
    }
  } else {
    _('#btn-snap').href = `./api/rooms/${room.name}/snapshot/?tzo=` + new Date().getTimezoneOffset() * -1
  }
}

let scrollFetcherTimeout = -1

/**
 * Start scroll tracking.
 */
function autoTrackScrollPosition () {
  _('#scroller').on('scroll', () => {
    clearTimeout(scrollFetcherTimeout)
    scrollFetcherTimeout = setTimeout(() => { // delay a bit to not/less fire during scroll
      const pos = getViewportCenter()
      setTablePreference(PREFS.SCROLL, { x: pos.x, y: pos.y })
    }, 1000)
  })
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

/**
 * Handle the click on a popup menu item.
 *
 * Will hide the popup and then run a callback.
 *
 * @param {String} selector CSS selector for menu item.
 * @param {callback} callback Method to call.
 */
function popupClick (selector, callback) {
  _(selector).on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    callback()
  })
}
