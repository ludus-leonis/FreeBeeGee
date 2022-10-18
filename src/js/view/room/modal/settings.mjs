/**
 * @file Handles the room settings modal.
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
  navigateToJoin
} from '../../../app.mjs'

import {
  getSetup,
  patchSetup,
  updateTable,
  getRoom,
  getServerInfo,
  deleteRoom,
  setRoomPassword,
  getTableNo,
  setTableNo,
  PREFS,
  getServerPreference,
  setServerPreference,
  getRoomPreference,
  setRoomPreference
} from '../../../state/index.mjs'

import {
  createModal,
  getModal,
  modalClose
} from '../../../view/room/modal.mjs'

import {
  ZOOM_LEVELS,
  moveContent
} from '../../../view/room/tabletop/index.mjs'

import {
  getContentRect
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  setupBackground,
  setupZoom,
  toggleGrid
} from '../../../view/room/index.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the settings modal.
 */
export function modalSettings () {
  createModal()

  _('#modal-header').innerHTML = `
    <h3 class="modal-title">Settings</h3>
  `
  const grid = getRoomPreference(PREFS.GRID)
  _('#modal-body').innerHTML = `
    <div id="tabs-settings" class="tabs">
      <input id="tab-1" type="radio" name="tabs">
      <input id="tab-2" type="radio" name="tabs">
      <input id="tab-3" type="radio" name="tabs">
      <div class="tabs-tabs">
        <label for="tab-1" class="tabs-tab">Preferences</label>
        <label for="tab-2" class="tabs-tab">Table</label>
        <label for="tab-3" class="tabs-tab">Room</label>
      </div>
      <div class="tabs-content">
        <form class="container">
          <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
          <div class="row">
            <div class="col-12">
              <p>This tab only affects what you can see, not the other players.</p>
            </div>
            <div class="col-6 col-lg-3">
              <label for="table-zoom">Zoom</label>
              <select id="table-zoom" name="zoom"></select>
              <p class="p-small spacing-tiny">Magnification</p>
            </div>
            <div class="col-6 col-lg-3">
              <label for="table-background">Background</label>
              <select id="table-background" name="background"></select>
              <p class="p-small spacing-tiny">Table texture.</p>
            </div>
            <div class="col-6 col-lg-3">
              <label for="table-grid">Grid</label>
              <select id="table-grid" name="grid">
                <option value="0" ${grid === 0 ? 'selected' : ''}>None</option>
                <option value="1" ${grid === 1 ? 'selected' : ''}>Minor</option>
                <option value="2" ${grid === 2 ? 'selected' : ''}>Major</option>
              </select>
              <p class="p-small spacing-tiny">Show grid?</p>
            </div>

            <div class="col-6 col-lg-3">
              <label for="table-sub">Table</label>
              <select id="table-sub" name="table"></select>
              <p class="p-small spacing-tiny">Visible table.</p>
            </div>
            <div class="col-12">
              <label for="table-quality">Render quality</label>
              <input id="table-quality" class="slider" type="range" min="0" max="3" value="${getServerPreference(PREFS.QUALITY)}" >
              <p class="p-small spacing-tiny if-quality-low"><strong>Low:</strong> No shadows, bells and whistles. Will look very flat.</p>
              <p class="p-small spacing-tiny if-quality-medium"><strong>Medium:</strong> Simplified shadows and no rounded corners.</p>
              <p class="p-small spacing-tiny if-quality-high"><strong>High:</strong> Some minor details are missing.</p>
              <p class="p-small spacing-tiny if-quality-ultra"><strong>Ultra:</strong> Full details and random piece rotation are enabled.</p>
            </div>
          </div>
        </form>
        <form class="container">
          <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
          <div class="row">
            <div class="col-12">

              <p>This tab affects the current table for all players.</p>

              <h2 class="h3">Table content</h2>
              <p>Move all the content on the table to a corner/side of your choice:</p>

              <div class="container spacing-small">
                <div class="row">
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-tl" class="btn btn-wide">Top-Left</button>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-tc" class="btn btn-wide">Top</button>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-tr" class="btn btn-wide">Top-Right</button>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-cl" class="btn btn-wide">Left</button>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-cc" class="btn btn-wide">Center</button>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-cr" class="btn btn-wide">Right</button>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-bl" class="btn btn-wide">Bottom-Left</button>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-bc" class="btn btn-wide">Bottom</button>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-br" class="btn btn-wide">Bottom-Right</button>
                  </div>
                </div>
              </div>

              <p><input id="dangerTable" type="checkbox"><label for="dangerTable">Enable danger zone - no undo below!</label></p>

              <div class="container spacing-small">
                <div class="row">
                  <div class="col-12 col-sm-8">
                    <p>Clearing the current table will remove all pieces from it. The library will not be changed.</p>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-clear" class="btn btn-wide" disabled>Clear table</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        <form class="container">
          <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
          <div class="row">
            <div class="col-12">
              <p>This tab affects all players.</p>

              <h2 class="h3">Room size</h2>
              <p>All tables in this room have the following size:</p>

              <div class="container spacing-small">
                <div class="row">
                  <div class="col-12 col-sm-4">
                    <label for="table-w">Width</label>
                    <select id="table-w" name="width"></select>
                  </div>
                  <div class="col-12 col-sm-4">
                    <label for="table-h">Height</label>
                    <select id="table-h" name="height"></select>
                  </div>
                  <div class="col-12 col-sm-4">
                    <label for="btn-table-resize d-none d-sm-block">&nbsp;</label>
                    <button id="btn-table-resize" class="btn btn-wide">Resize</button>
                  </div>
                </div>
              </div>

              <hr>
              <p><input id="dangerRoom" type="checkbox"><label for="dangerRoom">Enable danger zone - no undo below!</label></p>

              <div class="container spacing-small">
                <div class="row">
                  <div class="col-12 col-sm-8">
                    <label for="room-password">Room password</label>
                    <input id="room-password" type="password" placeholder="* * * * * *">
                  </div>
                  <div class="col-12 col-sm-4">
                    <label for="btn-room-password d-none d-sm-block">&nbsp;</label>
                    <button id="btn-room-password" class="btn btn-wide" disabled>Set password</button>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12 col-sm-8">
                    <p>Deleting your room will permanently erase it and its library.</p>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-room-delete" class="btn btn-wide" disabled>Delete room</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
  _('#modal-footer').innerHTML = `
    <button id='btn-close' type="button" class="btn btn-primary">Close</button>
  `

  // store/retrieve selected tab
  _('input[name="tabs"]').on('change', change => {
    setRoomPreference(PREFS.TAB_SETTINGS, change.target.id)
  })
  const preselect = getRoomPreference(PREFS.TAB_SETTINGS)
  _('#' + preselect).checked = true

  _('#table-quality').on('change', () => changeQuality(Number(_('#table-quality').value)))

  _('#dangerTable').on('click', () => {
    if (_('#dangerTable').checked) {
      _('#btn-table-clear').disabled = false
    } else {
      _('#btn-table-clear').disabled = true
    }
  })

  _('#dangerRoom').on('click', () => {
    if (_('#dangerRoom').checked) {
      _('#btn-room-delete').disabled = false
      _('#btn-room-password').disabled = false
    } else {
      _('#btn-room-delete').disabled = true
      _('#btn-room-password').disabled = true
    }
  })

  const zoom = _('#table-zoom')
  for (const z of ZOOM_LEVELS) {
    const option = _('option').create(z * 100 + '%')
    option.value = z
    if (z === getRoomPreference(PREFS.ZOOM)) option.selected = true
    zoom.add(option)
  }

  const server = getServerInfo()
  const backgrounds = _('#table-background')
  for (const background of server.backgrounds) {
    const option = _('option').create(background.name)
    option.value = background.name
    if (background.name === getServerPreference(PREFS.BACKGROUND)) option.selected = true
    backgrounds.add(option)
  }

  const table = _('#table-sub')
  for (let i = 1; i <= 9; i++) {
    const option = _('option').create(i)
    option.value = i
    if (i === getTableNo()) option.selected = true
    table.add(option)
  }

  const setup = getSetup()
  const rect = getContentRect()
  populateSizes('#table-w', getSetup().gridWidth, Math.floor(rect.right / setup.gridSize))
  populateSizes('#table-h', getSetup().gridHeight, Math.floor(rect.bottom / setup.gridSize))

  _('#btn-close').on('click', () => getModal().hide())
  _('#modal').on('hidden.bs.modal', () => modalClose())

  // ---------------------------------------------------------------------------

  _('#btn-table-clear').on('click', click => {
    click.preventDefault()
    updateTable([])
    getModal().hide()
  })
  _('#btn-room-password').on('click', click => {
    click.preventDefault()
    setRoomPassword(_('#room-password').value.trim()).then(() => getModal().hide())
  })
  _('#btn-room-delete').on('click', click => {
    click.preventDefault()
    deleteRoom().then(() => navigateToJoin(getRoom().name))
  })

  // ---------------------------------------------------------------------------

  _('#table-grid').on('change', () => toggleGrid(Number.parseInt(_('#table-grid').value)))
  _('#table-zoom').on('change', () => setupZoom(Number(_('#table-zoom').value)))
  _('#table-background').on('change', () => {
    setServerPreference(PREFS.BACKGROUND, _('#table-background').value)
    setupBackground()
  })
  _('#table-sub').on('change', () => setTableNo(Number(_('#table-sub').value)))

  _('#btn-table-tl').on('click', click => handleAlign(click, -1, -1))
  _('#btn-table-tc').on('click', click => handleAlign(click, 0, -1))
  _('#btn-table-tr').on('click', click => handleAlign(click, 1, -1))
  _('#btn-table-cl').on('click', click => handleAlign(click, -1, 0))
  _('#btn-table-cc').on('click', click => handleAlign(click, 0, 0))
  _('#btn-table-cr').on('click', click => handleAlign(click, 1, 0))
  _('#btn-table-bl').on('click', click => handleAlign(click, -1, 1))
  _('#btn-table-bc').on('click', click => handleAlign(click, 0, 1))
  _('#btn-table-br').on('click', click => handleAlign(click, 1, 1))

  _('#btn-table-resize').on('click', click => {
    click.preventDefault()
    resizeRoom()
    getModal().hide()
  })

  // ---------------------------------------------------------------------------

  getModal().show()
}

/**
 * Adapt the quality settings based on the current slider position.
 *
 * Will add matching .is-quality-* classes to the body.
 *
 * @param {Number} value Quality setting. 0 = low, 1 = medium, 2 = high, 3 = ultra
 */
export function changeQuality (value) {
  const body = _('body').remove('.is-quality-*')
  setServerPreference(PREFS.QUALITY, value)
  switch (value) {
    case 0:
      body.add('.is-quality-low')
      break
    case 1:
      body.add('.is-quality-medium')
      break
    case 2:
      body.add('.is-quality-high')
      break
    case 3:
    default:
      body.add('.is-quality-ultra')
  }
}

// --- internal ----------------------------------------------------------------

/**
 * Populate a grid-size <select> with appropriate entries.
 *
 * @param {String} id DOM-ID of select.
 * @param {Number} roomSize Current room size in tiles.
 * @param {Number} contentSize Current right-most content size, in tiles.
 * @param {Number} increments (Optional) Increment size, defaults to 16.
 */
function populateSizes (id, roomSize, contentSize, increments = 16) {
  const select = _(id)

  for (let i = -2; i <= 2; i++) {
    const size = roomSize + increments * i
    if (size > 0 && size <= 256 && size >= contentSize + 1) {
      const option = _('option').create(size)
      option.value = size
      if (size === roomSize) option.selected = true
      select.add(option)
    }
  }
}

/**
 * Resize the room (if size actually changed)
 */
function resizeRoom () {
  const setup = getSetup()
  const w = Number(_('#table-w').value)
  const h = Number(_('#table-h').value)
  if (w !== setup.gridWidth || h !== setup.gridHeight) {
    patchSetup({
      gridWidth: w,
      gridHeight: h
    })
  }
}

/**
 * Handle the alignment click event.
 *
 * @param {Event} click Click-event.
 * @param {Number} x X position on table, range [-1 .. 0 .. 1]
 * @param {Number} y Y position on table, range [-1 .. 0 .. 1]
 */
function handleAlign (click, x, y) {
  click.preventDefault()
  const setup = getSetup()
  const padding = setup.gridSize // leave room on side
  const rect = getContentRect()

  let x2
  let y2

  switch (x) {
    case -1:
      x2 = (padding + rect.width / 2) - (rect.left + rect.width / 2)
      break
    case 0:
      x2 = setup._meta.widthPx / 2 - (rect.left + rect.width / 2)
      break
    case 1:
      x2 = (setup._meta.widthPx - padding - rect.width / 2) - (rect.left + rect.width / 2)
  }

  switch (y) {
    case -1:
      y2 = (padding + rect.height / 2) - (rect.top + rect.height / 2)
      break
    case 0:
      y2 = setup._meta.heightPx / 2 - (rect.top + rect.height / 2)
      break
    case 1:
      y2 = (setup._meta.heightPx - padding - rect.height / 2) - (rect.top + rect.height / 2)
  }

  moveContent(Math.floor(x2), Math.floor(y2))
  getModal().hide()
}
