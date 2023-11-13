/**
 * @file Handles the room settings modal.
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

import _ from '../../../lib/FreeDOM.mjs'
import App from '../../../app.mjs'
import Content from '../../../view/room/tabletop/content.mjs'
import Dom from '../../../view/room/tabletop/dom.mjs'
import Modal from '../../../view/room/modal.mjs'
import Room from '../../../view/room/index.mjs'
import State from '../../../state/index.mjs'

// -----------------------------------------------------------------------------

export default {
  open
}

// -----------------------------------------------------------------------------

/**
 * Show the settings modal.
 */
function open () {
  Modal.create()

  _('#modal-header').innerHTML = `
    <h3 class="modal-title">Settings</h3>
  `
  const grid = State.getRoomPreference(State.PREF.GRID)
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
            <div class="col-6 col-lg-4">
              <label for="table-background">Background</label>
              <select id="table-background" name="background"></select>
            </div>
            <div class="col-6 col-lg-2">
              <label for="table-zoom">Zoom</label>
              <select id="table-zoom" name="zoom"></select>
            </div>
            <div class="col-6 col-lg-2">
              <label for="table-grid">Grid</label>
              <select id="table-grid" name="grid">
                <option value="0" ${grid === 0 ? 'selected' : ''}>None</option>
                <option value="1" ${grid === 1 ? 'selected' : ''}>Minor</option>
                <option value="2" ${grid === 2 ? 'selected' : ''}>Major</option>
              </select>
            </div>
            <div class="col-6 col-lg-2">
              <label for="table-sub">Table</label>
              <select id="table-sub" name="table"></select>
            </div>
            <div class="col-6 col-lg-2">
              <label for="table-rstep">Rotate steps</label>
              <select id="table-rstep" name="steps"></select>
            </div>

            <div class="col-12">
              <label for="table-quality">Render quality</label>
              <input id="table-quality" class="slider" type="range" min="0" max="3" value="${State.getServerPreference(State.PREF.QUALITY)}" >
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

              <div class="container spacing-medium">
                <div class="row">
                  <div class="col-12 col-sm-8">
                    <p>Clearing the current table will remove all pieces from it. The library will not be changed.</p>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-clear" class="btn btn-wide">Clear table</button>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12 col-sm-8">
                    <p>Undo table changes. Can revert the actions above, but also anything done on the table before opening this dialog.</p>
                  </div>
                  <div class="col-12 col-sm-4">
                    <button id="btn-table-undo" class="btn btn-wide">Undo</button>
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
    State.setRoomPreference(State.PREF.TAB_SETTINGS, change.target.id)
  })
  const preselect = State.getRoomPreference(State.PREF.TAB_SETTINGS)
  _('#' + preselect).checked = true

  _('#table-quality').on('change', () => {
    State.setServerPreference(State.PREF.QUALITY, Number(_('#table-quality').value))
    Dom.updateQuality()
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
  for (const z of Dom.ZOOM_LEVELS) {
    const option = _('option').create(z * 100 + '%')
    option.value = z
    if (z === State.getRoomPreference(State.PREF.ZOOM)) option.selected = true
    zoom.add(option)
  }

  const server = State.getServerInfo()
  const backgrounds = _('#table-background')
  for (const background of server.backgrounds) {
    const option = _('option').create(background.name)
    option.value = background.name
    if (background.name === State.getServerPreference(State.PREF.BACKGROUND)) option.selected = true
    backgrounds.add(option)
  }

  const table = _('#table-sub')
  for (let i = 1; i <= 9; i++) {
    const option = _('option').create(i)
    option.value = i
    if (i === State.getTableNo()) option.selected = true
    table.add(option)
  }

  const rotate = _('#table-rstep')
  const range = [Content.GRID.HEX, Content.GRID.HEX2].includes(State.getSetup().type) ? [10, 30, 60] : [10, 45, 90]
  for (const r of range) {
    const option = _('option').create(`${r}°`)
    option.value = r
    if (r === State.getRoomPreference(State.PREF.PIECE_ROTATE)) option.selected = true
    rotate.add(option)
  }

  const setup = State.getSetup()
  const rect = Content.getFeatures(State.getTable()).boundingBox
  populateSizes('#table-w', State.getSetup().gridWidth, Math.floor(rect.right / setup.gridSize))
  populateSizes('#table-h', State.getSetup().gridHeight, Math.floor(rect.bottom / setup.gridSize))

  _('#btn-close').on('click', () => Modal.close())

  // ---------------------------------------------------------------------------

  _('#btn-table-clear').on('click', click => {
    click.preventDefault()
    State.updateTable([])
  })
  _('#btn-table-undo').on('click', click => {
    click.preventDefault()
    State.undo()
  })
  _('#btn-room-password').on('click', click => {
    click.preventDefault()
    State.setRoomPassword(_('#room-password').value.trim()).then(() => Modal.close())
  })
  _('#btn-room-delete').on('click', click => {
    click.preventDefault()
    State.deleteRoom().then(() => App.navigateToJoin(State.getRoom().name))
  })

  // ---------------------------------------------------------------------------

  _('#table-grid').on('change', () => Room.toggleGrid(Number.parseInt(_('#table-grid').value)))
  _('#table-zoom').on('change', () => Room.setupZoom(Number(_('#table-zoom').value)))
  _('#table-background').on('change', () => {
    State.setServerPreference(State.PREF.BACKGROUND, _('#table-background').value)
    Room.setupBackground()
  })
  _('#table-sub').on('change', () => State.setTableNo(Number(_('#table-sub').value)))
  _('#table-rstep').on('change', () => State.setRoomPreference(State.PREF.PIECE_ROTATE, Number(_('#table-rstep').value)))

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
    Modal.close()
  })

  // ---------------------------------------------------------------------------

  Modal.open()
}

// --- internal ----------------------------------------------------------------

/**
 * Populate a grid-size <select> with appropriate entries.
 *
 * @param {string} id DOM-ID of select.
 * @param {number} roomSize Current room size in tiles.
 * @param {number} contentSize Current right-most content size, in tiles.
 * @param {number} increments (Optional) Increment size, defaults to 16.
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
  const setup = State.getSetup()
  const w = Number(_('#table-w').value)
  const h = Number(_('#table-h').value)
  if (w !== setup.gridWidth || h !== setup.gridHeight) {
    State.patchSetup({
      gridWidth: w,
      gridHeight: h
    })
  }
}

/**
 * Handle the alignment click event.
 *
 * @param {Event} click Click-event.
 * @param {number} x X position on table, range [-1 .. 0 .. 1]
 * @param {number} y Y position on table, range [-1 .. 0 .. 1]
 */
function handleAlign (click, x, y) {
  click.preventDefault()
  const setup = State.getSetup()
  const padding = setup.gridSize // leave room on side
  const rect = Content.getFeatures(State.getTable()).boundingBox

  let x2
  let y2

  switch (x) {
    case -1:
      x2 = (padding + rect.w / 2) - (rect.left + rect.w / 2)
      break
    case 0:
      x2 = setup._meta.widthPx / 2 - (rect.left + rect.w / 2)
      break
    case 1:
      x2 = (setup._meta.widthPx - padding - rect.w / 2) - (rect.left + rect.w / 2)
  }

  switch (y) {
    case -1:
      y2 = (padding + rect.h / 2) - (rect.top + rect.h / 2)
      break
    case 0:
      y2 = setup._meta.heightPx / 2 - (rect.top + rect.h / 2)
      break
    case 1:
      y2 = (setup._meta.heightPx - padding - rect.h / 2) - (rect.top + rect.h / 2)
  }

  Dom.moveContent(Math.floor(x2), Math.floor(y2))
}
