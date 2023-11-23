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
import * as App from '../../app.mjs'
import * as Browser from '../../lib/util-browser.mjs'
import * as Content from '../../view/room/tabletop/content.mjs'
import * as Dom from '../../view/room/tabletop/dom.mjs'
import * as Icon from '../../lib/icon.mjs'
import * as ModalDemo from '../../view/room/modal/demo.mjs'
import * as ModalDisabled from '../../view/room/modal/disabled.mjs'
import * as ModalHelp from '../../view/room/modal/help.mjs'
import * as ModalSettings from '../../view/room/modal/settings.mjs'
import { Main as ModeMain } from './mode/Main.mjs'
import { Measure as ModeMeasure } from './mode/Measure.mjs'
import * as Mouse from '../../view/room/mouse/index.mjs'
import * as Selection from './tabletop/selection.mjs'
import * as State from '../../state/index.mjs'
import * as Sync from '../../view/room/sync.mjs'

export const MODE = {
  MAIN: 'MAIN',
  MEASURE: 'MEASURE'
}

/**
 * Get the room's current mode specifics.
 *
 * @returns {object} Mode object.
 */
export function getMode () {
  return mode
}

/**
 * Set the room's current mode .
 *
 * @param {string} m MODE.* to enable.
 */
export function setMode (m) {
  _('.menu-modes button').remove('.active')
  switch (m) {
    case MODE.MEASURE:
      mode?.quit()
      State.setRoomPreference(State.PREF.MODE, MODE.MEASURE)
      _('#btn-m2').add('.active')
      mode = new ModeMeasure()
      break
    case MODE.MAIN:
    default:
      mode?.quit()
      State.setRoomPreference(State.PREF.MODE, MODE.MAIN)
      _('#btn-m1').add('.active')
      mode = new ModeMain()
  }
  mode.enter()
}

/**
 * Get current center of the viewport of the scroll position.
 *
 * @returns {object} Contains tablespace x and y in pixel.
 */
export function getViewCenter () {
  const scroll = Dom.getScrollPosition()
  return zoomCoordinates({
    x: scroll.x + Math.floor(scroll.w / 2),
    y: scroll.y + Math.floor(scroll.h / 2)
  }, -1)
}

/**
 * Set current center of the viewport of the scroll position.
 *
 * @param {number} x X-coordinate in tabletop px.
 * @param {number} y Y-coordinate in tabletop px.
 */
export function setViewCenter (x, y) {
  const zoom = State.getRoomPreference(State.PREF.ZOOM)
  const scroll = Dom.getScrollPosition()
  const newCenter = zoomCoordinates({
    x: Math.floor(x - scroll.w / 2 / zoom),
    y: Math.floor(y - scroll.h / 2 / zoom)
  })
  Dom.setScrollPosition(newCenter.x, newCenter.y)
}

/**
 * Initialize and start the room/tabletop screen.
 *
 * @param {string} name Name of room, e.g. hilariousGazingPenguin.
 * @param {string} token API access token for this room.
 */
export function runRoom (name, token) {
  console.info('$NAME$ v$VERSION$, room ' + name)

  State.loadRoom(name, token)
    .then(() => setupRoom())
}

/**
 * Toggle one of the layers on/off for selection.
 *
 * @param {string} layer Either LAYER.TILE, LAYER.STICKER or LAYER.TOKEN.
 */
export function toggleLayer (layer) {
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
 * Toggle grid display on/off.
 *
 * @param {number} value Grid value (0..2).
 */
export function toggleGrid (value) {
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
export function updateMenu () {
  mode.update()
}

/**
 * Update DOM room to current table-data.
 *
 * e.g. for resizing the room.
 *
 * @returns {_} Room FreeDOM element for further customization.
 */
export function updateRoom () {
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
export function getTableCoordinates (windowX, windowY) {
  const origin = Dom.getScrollerBounds()
  const pos = Dom.getScrollPosition()

  return zoomCoordinates({
    x: windowX - origin.left + pos.x,
    y: windowY - origin.top + pos.y
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
export function zoomCoordinates (coords, direction = 1) {
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
export function updateStatusline () {
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
 * Set table magnification.
 *
 * @param {number} zoom Zoom factor. 1 is no zoom / 100%.
 */
export function setupZoom (zoom) {
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

  setViewCenter(center.x, center.y)

  updateStatusline()
}

/**
 * Set backround to tabletop.
 */
export function setupBackground () {
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

  Dom.setupScroller(background.scroller, background.color)
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} node The HTML node the user clicked on. Unselect all if null.
 * @param {boolean} toggle If false (default), selection replaces all previous.
 *                         If true, selection is added/removed (crtl-click).
 */
export function updateSelection (node, toggle = false) {
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

let mode = null

/**
 * Setup the room screen / HTML.
 */
function setupRoom () {
  State.cleanupStore()

  const room = State.getRoom()

  let grid = '.is-grid-square'
  switch (room.setup?.type) {
    case Content.GRID.HEX:
      grid = '.is-grid-hex'
      State.setRoomPreference(State.PREF.PIECE_ROTATE, State.getRoomPreference(State.PREF.PIECE_ROTATE) ?? 60)
      break
    case Content.GRID.HEX2:
      grid = '.is-grid-hex2'
      State.setRoomPreference(State.PREF.PIECE_ROTATE, State.getRoomPreference(State.PREF.PIECE_ROTATE) ?? 60)
      break
    default: // square
      State.setRoomPreference(State.PREF.PIECE_ROTATE, State.getRoomPreference(State.PREF.PIECE_ROTATE) ?? 90)
  }

  _('body').remove('.page-boxed').add(grid).innerHTML = `
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

          <div class="menu-modes spacing-small">
            <button id="btn-m1" class="btn-icon" title="Main mode [m]">${Icon.BALL}</button>
            <button id="btn-m2" class="btn-icon" title="Measure mode [m]">${Icon.RULER}</button>
          </div>

          <div class="menu-mode spacing-small"></div>
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

  setupBackground()
  setupZoom(State.getRoomPreference(State.PREF.ZOOM))

  // game mode
  setMode(State.getRoomPreference(State.PREF.MODE))

  // setup remaining menu
  _('#btn-S').on('click', () => ModalSettings.open())
  _('#btn-m1').on('click', () => setMode(MODE.MAIN))
  _('#btn-m2').on('click', () => setMode(MODE.MEASURE))
  _('#btn-h').on('click', () => ModalHelp.open())
  _('#btn-q').on('click', () => App.navigateToJoin(State.getRoom().name))

  _('body').on('contextmenu', e => e.preventDefault())

  // capture mousewheel
  _('#room').on('wheel', wheel => {
    if (event.ctrlKey) {
      event.preventDefault()
      Dom.zoom(Math.sign(event.deltaY * -1), Mouse.getMouseCoords())
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
