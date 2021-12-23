/**
 * @file The room handling. Mainly in charge of UI, menus and managing the
 *       tabletop canvas itself - but not the stuff on the tabletop.
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

import _ from '../../lib/FreeDOM.mjs'
import {
  navigateToJoin
} from '../../app.mjs'
import {
  loadRoom,
  getRoom,
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
  deleteSelected
} from './tabletop/index.mjs'

import {
  TYPE_HEX,
  getSetupCenter,
  findPiece
} from './tabletop/tabledata.mjs'

import {
  enableDragAndDrop,
  getMouseCoords
} from './mouse.mjs'

import {
  startAutoSync
} from './sync.mjs'
import {
  modalLibrary
} from './modal/library.mjs'
import {
  modalHelp
} from './modal/help.mjs'

import {
  modalSettings,
  changeQuality
} from './modal/settings.mjs'

import {
  clamp,
  brightness
} from '../../lib/utils.mjs'

// --- public ------------------------------------------------------------------

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
  scroller.scrollTo(x, y)
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
 */
export function runRoom (room) {
  console.info('$NAME$ v$VERSION$, room ' + room.name)

  loadRoom(room.name)
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
    setRoomPreference('layer' + layer, true)
  } else {
    unselectPieces(layer)
    setRoomPreference('layer' + layer, false)
  }
}

/**
 * Toggle grid display on/off.
 */
export function toggleGrid (on) {
  if (on === true || on === false) {
    setRoomPreference('showGrid', on)
  } else { // undefined
    setRoomPreference('showGrid', !getRoomPreference('showGrid', false))
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
    cloneSelected(getMouseCoords())
  })

  createPopper(_('#' + id).node(), popup.node(), {
    placement: 'right'
  })
  popup.add('.show')
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
  const origin = scroller.getBoundingClientRect()

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
  const message = fakeTabularNums(`${time} • Table ${getTableNo()}`)
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
}

/**
 * Set backround to given index + store it as preference.
 *
 * @param {Number} bgIndex Index of background. Will be clamped to the available ones.
 * @param {Boolean} showGrid If true, the overlay grid will be drawn.
 */
export function setupBackground (
  bgIndex = getServerPreference('background', 99),
  showGrid = getRoomPreference('showGrid', false)
) {
  const room = getRoom()

  bgIndex = clamp(0, bgIndex, room.backgrounds.length - 1)

  updateRoom().css({
    '--fbg-tabletop-color': room.backgrounds[bgIndex].color,
    '--fbg-tabletop-image': `url("${room.backgrounds[bgIndex].image}")`
  })

  // setup background / wallpaper
  _('#tabletop').remove('.is-grid-*')
  if (showGrid) {
    const dark = brightness(room.backgrounds[bgIndex].color) < 92
    switch (room.template?.type) {
      case TYPE_HEX:
        _('#tabletop').add(dark ? '.is-grid-hex-light' : '.is-grid-hex-dark')
        break
      default:
        _('#tabletop').add(dark ? '.is-grid-square-light' : '.is-grid-square-dark')
    }
  }

  // setup scroller
  const scroller = _('#scroller')
  scroller.css({ // this is for moz://a
    scrollbarColor: `${room.backgrounds[bgIndex].scroller} ${room.backgrounds[bgIndex].color}`
  })
  scroller.node().style.setProperty('--fbg-color-scroll-fg', room.backgrounds[bgIndex].scroller)
  scroller.node().style.setProperty('--fbg-color-scroll-bg', room.backgrounds[bgIndex].color)

  // store for future reference
  setServerPreference('background', bgIndex)
  setRoomPreference('showGrid', showGrid)
}

// --- internal ----------------------------------------------------------------

let scroller = null /** keep reference to scroller div - we need it often */

/**
 * Setup the room screen / HTML.
 *
 * @param {Object} room Room data object.
 */
function setupRoom () {
  const room = getRoom()

  const mode = (room.template?.type === TYPE_HEX) ? '.is-grid-hex' : '.is-grid-square'

  _('body').remove('.page-boxed').add(mode).innerHTML = `
    <div id="room" class="room is-fullscreen is-noselect">
      <div class="menu">
        <div>
          <div class="menu-brand is-content">
            <button id="btn-s" class="btn-icon" title="Room settings [s]">${iconLogo}</button>
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

          <a id="btn-snap" class="btn-icon" title="Download snapshot" href='./api/rooms/${room.name}/snapshot/'>${iconDownload}</a>

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

  // load preferences
  changeQuality(getRoomPreference('renderQuality', 3))

  // setup menu for layers
  let undefinedCount = 0
  for (const layer of ['token', 'overlay', 'tile', 'other']) {
    _('#btn-' + layer).on('click', () => toggleLayer(layer))
    const prop = getRoomPreference('layer' + layer)
    if (prop === true) toggleLayer(layer) // stored enabled
    if (prop === undefined) undefinedCount++
  }
  if (undefinedCount >= 4) {
    // default if store was empty
    toggleLayer('other')
    toggleLayer('token')
  }

  // setup menu for selection
  _('#btn-a').on('click', () => modalLibrary(getViewportCenter()))
  _('#btn-e').on('click', () => editSelected())
  _('#btn-r').on('click', () => rotateSelected())
  _('#btn-c').on('click', () => cloneSelected(getMouseCoords()))
  _('#btn-t').on('click', () => toTopSelected())
  _('#btn-b').on('click', () => toBottomSelected())
  _('#btn-f').on('click', () => flipSelected())
  _('#btn-s').on('click', () => modalSettings())
  _('#btn-hash').on('click', () => randomSelected())
  _('#btn-del').on('click', () => deleteSelected())

  // setup remaining menu
  _('#btn-h').on('click', () => modalHelp())
  _('#btn-q').on('click', () => navigateToJoin(getRoom().name))
  _('#btn-snap').href = `./api/rooms/${room.name}/snapshot/?tzo=` + new Date().getTimezoneOffset() * -1

  setupBackground()

  _('body').on('contextmenu', e => e.preventDefault())

  // keep global reference for scroll-tracking
  scroller = _('#scroller').node()

  enableDragAndDrop('#tabletop')

  // load + setup content
  setTableNo(getRoomPreference('table', 1), false)
  runStatuslineLoop()
  startAutoSync(() => { autoTrackScrollPosition() })
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
      setTablePreference('scrollX', pos.x)
      setTablePreference('scrollY', pos.y)
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

const iconLogo = '<svg xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" stroke="currentColor" fill="none" height="24" width="24" viewBox="0 0 24 24"><rect rx="4" height="24" width="24" fill="#262626" stroke="none"/><path stroke="#40bfbf" d="M2.566 7.283L12 12l9.434-4.717L12 2.566z" stroke-width="1.88678"/><path stroke="#bf40bf" d="M2.566 16.717L12 21.434l9.434-4.717" stroke-width="1.88678"/><path stroke="#fff" d="M2.566 12L12 16.717 21.434 12" stroke-width="1.88678"/></svg>'

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
