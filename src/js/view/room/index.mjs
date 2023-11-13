/**
 * @file The room handling. Mainly in charge of UI, menus and managing the
 *       tabletop canvas itself - but not the stuff on the tabletop.
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

import shajs from 'sha.js'

import _ from '../../lib/FreeDOM.mjs'
import App from '../../app.mjs'
import Browser from '../../lib/util-browser.mjs'
import Content from '../../view/room/tabletop/content.mjs'
import Dom from '../../view/room/tabletop/dom.mjs'
import Icon from '../../lib/icon.mjs'
import ModalDemo from '../../view/room/modal/demo.mjs'
import ModalDisabled from '../../view/room/modal/disabled.mjs'
import ModalHelp from '../../view/room/modal/help.mjs'
import ModalLibrary from '../../view/room/library/index.mjs'
import ModalSettings from '../../view/room/modal/settings.mjs'
import Mouse from '../../view/room/mouse/index.mjs'
import Selection from './tabletop/selection.mjs'
import State from '../../state/index.mjs'
import Sync from '../../view/room/sync.mjs'

// -----------------------------------------------------------------------------

export default {
  getScrollPositionNative,
  getTableCoordinates,
  restoreScrollPosition,
  runRoom,
  setCursor,
  setScrollPositionNative,
  setupBackground,
  setupZoom,
  toggleGrid,
  toggleLayer,
  toggleLos,
  updateMenu,
  updateRoom,
  updateSelection,
  updateStatusline,
  zoomCoordinates
}

// -----------------------------------------------------------------------------

/**
 * Set the room mouse cursor (pointer, cross, ...)
 *
 * @param {?string} cursor Cursor (class), or undefined to revert to default cursor.
 */
function setCursor (cursor) {
  scroller.remove('.cursor-*')
  if (cursor) {
    scroller.add(cursor)
  } else {
    if (Mouse.isLMBLos()) {
      scroller.add('.cursor-cross')
    }
  }
}

/**
 * Get current top-left tabletop scroll position.
 *
 * @returns {object} Contains x and y in pixel.
 */
function getScrollPositionNative () {
  return {
    x: scroller.scrollLeft,
    y: scroller.scrollTop
  }
}

/**
 * Get current tabletop scroll position.
 *
 * @param {number} x X-coordinate.
 * @param {number} y Y-coordinate.
 */
function setScrollPositionNative (x, y) {
  scroller.node().scrollTo(x, y)
}

/**
 * Get current center of the viewport of the scroll position.
 *
 * @returns {object} Contains tablespace x and y in pixel.
 */
function getViewCenter () {
  return zoomCoordinates({
    x: scroller.scrollLeft + Math.floor(scroller.clientWidth / 2),
    y: scroller.scrollTop + Math.floor(scroller.clientHeight / 2)
  }, -1)
}

/**
 * Initialize and start the room/tabletop screen.
 *
 * @param {string} name Name of room, e.g. hilariousGazingPenguin.
 * @param {string} token API access token for this room.
 */
function runRoom (name, token) {
  console.info('$NAME$ v$VERSION$, room ' + name)

  State.loadRoom(name, token)
    .then(() => setupRoom())
}

/**
 * Toggle one of the layers on/off for selection.
 *
 * @param {string} layer Either LAYER.TILE, LAYER.STICKER or LAYER.TOKEN.
 */
function toggleLayer (layer) {
  _('#btn-' + layer).toggle('.active')
  _('#tabletop').toggle('.layer-' + layer + '-enabled')
  if (_('#btn-' + layer + '.active').exists()) {
    State.setRoomPreference(State.PREF['LAYER' + layer], true)
  } else {
    Selection.clear(layer)
    State.setRoomPreference(State.PREF['LAYER' + layer], false)
  }
}

/**
 * Toggle the ruler on/off.
 */
function toggleLos () {
  _('#btn-s').toggle('.active')
  Mouse.toggleLMBLos()
  if (Mouse.isLMBLos()) {
    setCursor('.cursor-cross')
    State.setRoomPreference(State.PREF.LOS, true)
  } else {
    setCursor()
    State.setRoomPreference(State.PREF.LOS, false)
  }
}

/**
 * Toggle grid display on/off.
 *
 * @param {number} value Grid value (0..2).
 */
function toggleGrid (value) {
  switch (value) {
    case 0:
    case 1:
    case 2:
      State.setRoomPreference(State.PREF.GRID, value)
      break
    default: // unknown value = cycle background
      State.setRoomPreference(State.PREF.GRID, (State.getRoomPreference(State.PREF.GRID) + 1) % 3)
  }
  setupBackground()
}

/**
 * Update the menu's disabled buttons.
 *
 * Mostly based on if a piece is selected or not.
 */
function updateMenu () {
  // (de)activate menu
  const menu = _('.menu-selected')
  const pieces = Selection.getPieces()

  _('.menu-selected button').remove('.disabled')
  _('.menu-selected button').add('.disabled')
  if (pieces.length <= 0) {
    menu.add('.disabled')
  } else {
    menu.remove('.disabled')

    const features = Selection.getFeatures()
    if (features.edit) _('#btn-e').remove('.disabled')
    if (features.rotate) _('#btn-r').remove('.disabled')
    if (features.flip) _('#btn-f').remove('.disabled')
    if (features.random) _('#btn-hash').remove('.disabled')
    if (features.top) _('#btn-t').remove('.disabled')
    if (features.bottom) _('#btn-b').remove('.disabled')
    if (features.clone) _('#btn-c').remove('.disabled')
    if (features.delete) _('#btn-del').remove('.disabled')
  }
}

/**
 * Update DOM room to current table-data.
 *
 * e.g. for resizing the room.
 *
 * @returns {_} Room FreeDOM element for further customization.
 */
function updateRoom () {
  const room = State.getRoom()

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
 * @param {number} windowX A window x coordinate e.g. from a click event.
 * @param {number} windowY A window y coordinate e.g. from a click event.
 * @returns {object} The absolute room coordinate as {x, y}.
 */
function getTableCoordinates (windowX, windowY) {
  const origin = scroller.node().getBoundingClientRect()

  return zoomCoordinates({
    x: windowX - origin.left + scroller.scrollLeft,
    y: windowY - origin.top + scroller.scrollTop
  }, -1)
}

/**
 * Convert tablespace coordinates into DOM coordinates.
 *
 * Compensates for current table zoom level. Tries to cache/minimize room pref calls.
 *
 * @param {object} coords {x, y} coordinates.
 * @param {number} direction 1 = multiply, -1 = divide
 * @returns {object} Zoom coordinates as {x, y}.
 */
function zoomCoordinates (coords, direction = 1) {
  if (coords.zoom) {
    const zzoom = direction > 0 ? coords.zoom : (1 / coords.zoom)
    return {
      x: Math.round(coords.x * zzoom),
      y: Math.round(coords.y * zzoom)
    }
  } else {
    const zoom = State.getRoomPreference(State.PREF.ZOOM)
    const zzoom = direction > 0 ? zoom : (1 / zoom)
    return {
      zoom,
      x: Math.round(coords.x * zzoom),
      y: Math.round(coords.y * zzoom)
    }
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
  const zoom = State.getRoomPreference(State.PREF.ZOOM)
  const zoomText = zoom === 1 ? '' : ` • ${zoom * 100 + '%'}`
  const message = State.SERVERLESS
    ? Browser.fakeTabularNums(`<a href="https://freebeegee.org/">FreeBeeGee</a> • ${time} • Table ${State.getTableNo()}${zoomText}`)
    : Browser.fakeTabularNums(`${time} • Table ${State.getTableNo()}${zoomText}`)
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
function restoreScrollPosition () {
  const last = State.getTablePreference(State.PREF.SCROLL)
  const zoom = State.getRoomPreference(State.PREF.ZOOM)
  const coords = {}
  if (last.x && last.y) {
    coords.x = last.x - Math.floor(scroller.clientWidth / 2 / zoom)
    coords.y = last.y - Math.floor(scroller.clientHeight / 2 / zoom)
  } else {
    const center = Content.getSetupCenter()
    coords.x = Math.floor(center.x - scroller.clientWidth / 2 / zoom)
    coords.y = Math.floor(center.y - scroller.clientHeight / 2 / zoom)
  }
  const zoomed = zoomCoordinates(coords)
  scroller.node().scrollTo(zoomed.x, zoomed.y)
}

/**
 * Set table magnification.
 *
 * @param {number} zoom Zoom factor. 1 is no zoom / 100%.
 */
function setupZoom (zoom) {
  const center = getViewCenter()
  State.setRoomPreference(State.PREF.ZOOM, zoom)
  const tabletop = _('#tabletop')
  tabletop.remove('.is-zoom-*')
  tabletop.add(`.is-zoom-${Math.trunc(zoom)}-${(zoom - Math.trunc(zoom)) * 100}`)

  // remove temporary transition effects
  tabletop.add('.is-delay-transition-none')
  setTimeout(() => {
    _('#tabletop').remove('.is-delay-*')
  }, 10)

  // move center of view
  const newCenter = zoomCoordinates({
    x: Math.floor(center.x - scroller.clientWidth / 2 / zoom),
    y: Math.floor(center.y - scroller.clientHeight / 2 / zoom)
  })
  scroller.node().scrollTo(newCenter.x, newCenter.y)

  updateStatusline()
}

/**
 * Set backround to tabletop.
 */
function setupBackground () {
  const room = State.getRoom()
  const gridType = State.getRoomPreference(State.PREF.GRID)
  const background = State.getBackground()

  updateRoom().css({
    '--fbg-tabletop-color': background.color,
    '--fbg-tabletop-image': Dom.url(background.image)
  })

  switch (room.setup?.type) {
    case Content.GRID.HEX:
      _('body').css({
        '--fbg-grid-x': '110px',
        '--fbg-grid-y': '64px',
        '--fbg-grid-x-origin': 'center',
        '--fbg-grid-y-origin': 'center'
      })
      break
    case Content.GRID.HEX2:
      _('body').css({
        '--fbg-grid-x': '64px',
        '--fbg-grid-y': '110px',
        '--fbg-grid-x-origin': 'center',
        '--fbg-grid-y-origin': 'center'
      })
      break
    default:
      _('body').css({
        '--fbg-grid-x': '64px',
        '--fbg-grid-y': '64px',
        '--fbg-grid-x-origin': '0',
        '--fbg-grid-y-origin': '0'
      })
  }

  // setup background / wallpaper + grid
  _('#tabletop').remove('.has-grid', '--fbg-tabletop-grid')

  if (gridType > 0) {
    _('#tabletop').add('.has-grid')
    _('#tabletop').css({
      '--fbg-tabletop-grid': Dom.url(background.gridFile)
    })
  }

  // setup scroller
  scroller.css({ // this is for moz://a
    scrollbarColor: `${background.scroller} ${background.color}`,
    '--fbg-color-scroll-fg': background.scroller,
    '--fbg-color-scroll-bg': background.color
  })
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} node The HTML node the user clicked on. Unselect all if null.
 * @param {boolean} toggle If false (default), selection replaces all previous.
 *                         If true, selection is added/removed (crtl-click).
 */
function updateSelection (node, toggle = false) {
  if (toggle) {
    if (node) {
      Selection.selectNode(node, true)
    } else {
      // do nothing = keep selection
    }
  } else {
    if (node) {
      if (!Selection.isSelectedId(node.piece?.id)) {
        Selection.selectNode(node)
      }
    } else {
      Selection.clear()
    }
  }
}

// --- internal ----------------------------------------------------------------

let scroller = null /** keep reference to scroller div - we need it often */

/**
 * Setup the room screen / HTML.
 */
function setupRoom () {
  State.cleanupStore()

  const room = State.getRoom()

  let mode = '.is-grid-square'
  switch (room.setup?.type) {
    case Content.GRID.HEX:
      mode = '.is-grid-hex'
      State.setRoomPreference(State.PREF.PIECE_ROTATE, State.getRoomPreference(State.PREF.PIECE_ROTATE) ?? 60)
      break
    case Content.GRID.HEX2:
      mode = '.is-grid-hex2'
      State.setRoomPreference(State.PREF.PIECE_ROTATE, State.getRoomPreference(State.PREF.PIECE_ROTATE) ?? 60)
      break
    default: // square
      State.setRoomPreference(State.PREF.PIECE_ROTATE, State.getRoomPreference(State.PREF.PIECE_ROTATE) ?? 90)
  }

  _('body').remove('.page-boxed').add(mode).innerHTML = `
    <div id="room" class="room is-fullscreen is-noselect">
      <div class="menu">
        <div>
          <div class="menu-brand is-content">
            <button id="btn-S" class="btn-icon" title="Room settings [s]">${Icon.LOGO}</button>
          </div>

          <div>
            <button id="btn-other" class="btn-icon" title="Toggle dice [1]">${Icon.DICE}</button>
            <button id="btn-token" class="btn-icon" title="Toggle tokens [2]">${Icon.TOKEN}</button>
            <button id="btn-sticker" class="btn-icon" title="Toggle stickers [3]">${Icon.STICKER}</button>
            <button id="btn-tile" class="btn-icon" title="Toggle tiles [4]">${Icon.TILE}</button>
          </div>

          <div class="spacing-small">
            <button id="btn-s" class="btn-icon" title="Measure [m]">${Icon.RULER}</button>
            <button id="btn-a" class="btn-icon" title="Open library [l]">${Icon.ADD}</button>
          </div>

          <div class="menu-selected disabled spacing-small">
            <button id="btn-e" class="btn-icon" title="Edit [e]">${Icon.EDIT}</button>
            <button id="btn-r" class="btn-icon" title="Rotate [r]">${Icon.ROTATE}</button>
            <button id="btn-f" class="btn-icon" title="Flip [f]">${Icon.FLIP}</button>
            <button id="btn-hash" class="btn-icon" title="Random [#]">${Icon.SHUFFLE}</button>
            <button id="btn-t" class="btn-icon" title="To top [t]">${Icon.TOP}</button>
            <button id="btn-b" class="btn-icon" title="To bottom [b]">${Icon.BOTTOM}</button>
            <button id="btn-c" class="btn-icon" title="Copy [ctrl][c]">${Icon.COPY}</button>
            <button id="btn-del" class="btn-icon" title="Delete [Del]">${Icon.DELETE}</button>
          </div>
        </div>
        <div>
          <button id="btn-h" class="btn-icon" title="Help [h]">${Icon.HELP}</button>

          <a id="btn-snap" class="btn-icon" title="Download snapshot">${Icon.DOWNLOAD}</a>

          <button id="btn-q" class="btn-icon" title="Leave room">${Icon.QUIT}</button>
        </div>
      </div>
      <div id="scroller" class="scroller">
        <div id="tabletop" class="tabletop layer-note-enabled">
          <div id="layer-other" class="layer layer-other"></div>
          <div id="layer-token" class="layer layer-token"></div>
          <div id="layer-note" class="layer layer-note"></div>
          <div id="layer-sticker" class="layer layer-sticker"></div>
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
  Dom.updateQuality()

  // setup menu for layers
  let undefinedCount = 0
  for (const layer of [Content.LAYER.TOKEN, Content.LAYER.STICKER, Content.LAYER.TILE, Content.LAYER.OTHER]) {
    _('#btn-' + layer).on('click', () => toggleLayer(layer))
    const prop = State.getRoomPreference(State.PREF['LAYER' + layer])
    if (prop === true) toggleLayer(layer) // stored enabled
    if (prop === undefined) undefinedCount++
  }
  if (undefinedCount >= 4) {
    // default if store was empty
    if (State.getSetup().layersEnabled) {
      if (State.getSetup().layersEnabled.includes(Content.LAYER.OTHER)) toggleLayer(Content.LAYER.OTHER)
      if (State.getSetup().layersEnabled.includes(Content.LAYER.TOKEN)) toggleLayer(Content.LAYER.TOKEN)
      if (State.getSetup().layersEnabled.includes(Content.LAYER.STICKER)) toggleLayer(Content.LAYER.STICKER)
      if (State.getSetup().layersEnabled.includes(Content.LAYER.TILE)) toggleLayer(Content.LAYER.TILE)
    } else {
      toggleLayer(Content.LAYER.OTHER)
      toggleLayer(Content.LAYER.TOKEN)
    }
  }

  if (State.getRoomPreference(State.PREF.LOS)) toggleLos()

  // setup menu for selection
  _('#btn-a').on('click', () => ModalLibrary.open(getViewCenter()))
  _('#btn-e').on('click', () => Selection.edit())
  _('#btn-r').on('click', () => Selection.rotate())
  _('#btn-c').on('click', () => Selection.copy())
  _('#btn-t').on('click', () => Selection.toTop())
  _('#btn-b').on('click', () => Selection.toBottom())
  _('#btn-f').on('click', () => Selection.flip())
  _('#btn-s').on('click', () => toggleLos())
  _('#btn-S').on('click', () => ModalSettings.open())
  _('#btn-hash').on('click', () => Selection.random())
  _('#btn-del').on('click', () => Selection.remove())

  // setup remaining menu
  _('#btn-h').on('click', () => ModalHelp.open())
  _('#btn-q').on('click', () => App.navigateToJoin(State.getRoom().name))

  setupBackground()
  setupZoom(State.getRoomPreference(State.PREF.ZOOM))

  _('body').on('contextmenu', e => e.preventDefault())

  // capture mousewheel
  _('#room').on('wheel', wheel => {
    if (event.ctrlKey) {
      event.preventDefault()
      Dom.zoom(Math.sign(event.deltaY * -1))
    }
  }, true)

  Mouse.enableDragAndDrop('#tabletop')

  // load + setup content
  State.setTableNo(State.getRoomPreference(State.PREF.TABLE) ?? State.getSetup()?.table ?? 1, false)
  runStatuslineLoop()

  // start autosyncing after a short delay to reduce server load a bit
  setTimeout(() => {
    Sync.startAutoSync(() => { autoTrackScrollPosition() })
  }, 100)

  if (State.SERVERLESS) {
    _('#btn-snap').on('click', () => ModalDisabled.open('would have downloaded a snapshot (a.k.a. savegame) of your whole room as <code>.zip</code> by now'))
    if (!State.getRoomPreference(State.PREF.DISCLAIMER)) {
      State.setRoomPreference(State.PREF.DISCLAIMER, true)
      ModalDemo.open()
    }
  } else {
    if (State.getToken()) {
      const token = shajs('sha256').update(`fbg-${State.getToken()}`).digest('hex')
      _('#btn-snap').href = `./api/rooms/${room.name}/snapshot/?tzo=${new Date().getTimezoneOffset() * -1}&token=${token}`
    } else {
      _('#btn-snap').href = `./api/rooms/${room.name}/snapshot/?tzo=${new Date().getTimezoneOffset() * -1}`
    }
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
      const pos = getViewCenter()
      State.setTablePreference(State.PREF.SCROLL, { x: pos.x, y: pos.y })
    }, 1000)
  })
}

let statuslineLoop = -1

/**
 *
 */
function runStatuslineLoop () {
  clearTimeout(statuslineLoop)
  updateStatusline()
  statuslineLoop = setTimeout(() => {
    runStatuslineLoop()
  }, 5000)
}
