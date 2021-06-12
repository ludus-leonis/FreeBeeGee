/**
 * @file Handles the table settings modal.
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

import _ from '../../../FreeDOM.js'

import {
  createModal,
  getModal,
  modalClose
} from '../../../modal.js'
import {
  getTemplate,
  updateTemplate,
  updateState,
  restoreState,
  getTable,
  deleteTable,
  getStateNo,
  setStateNo,
  stateGetTablePref,
  stateSetTablePref
} from '../state.js'
import { timeRecords } from '../../../utils.js'
import { navigateToJoin } from '../../../nav.js'
import {
  moveContent,
  getContentRectGrid
} from '../index.js'

// --- public ------------------------------------------------------------------

/**
 * Show the settings modal.
 */
export function modalSettings () {
  createModal()

  _('#modal-header').innerHTML = `
    <h3 class="modal-title">Settings</h3>
  `
  _('#modal-body').innerHTML = `
    <div id="tabs-settings" class="tabs">
      <input id="tab-1" type="radio" name="tabs">
      <input id="tab-2" type="radio" name="tabs">
      <input id="tab-3" type="radio" name="tabs">
      <div class="tabs-tabs">
        <label for="tab-1" class="tabs-tab">Preferences</label>
        <label for="tab-2" class="tabs-tab">Table</label>
        <label for="tab-3" class="tabs-tab">Danger Zone</label>
      </div>
      <div class="tabs-content">
        <form class="container"><div id="tab-my" class="row">
          <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
          <div class="col-12">
            <p>This tab only affects your browser, not the other players.</p>

            <h2 class="h3">Render quality</h2>
            <p>If your table seems to be slow, you can change the render quality here:</p>
            <input type="range" min="0" max="3" value="${stateGetTablePref('renderQuality') ?? 3}" class="slider" id="quality">
            <p class="if-quality-low"><strong>Low:</strong> No shadows, bells and whistles. Will look very flat.</p>
            <p class="if-quality-medium"><strong>Medium:</strong> Simplified shadows and no rounded corners.</p>
            <p class="if-quality-high"><strong>High:</strong> Some minor details are missing.</p>
            <p class="if-quality-ultra"><strong>Ultra:</strong> Full details and random piece rotation are enabled.</p>

            <h2 class="h3">Statistics</h2>
            <p>Table: ${getTemplate().gridWidth}x${getTemplate().gridHeight} spaces, ${_('.piece.piece-token').nodes().length}x token, ${_('.piece.piece-overlay').nodes().length}x overlay, ${_('.piece.piece-tile').nodes().length}x tile, ${_('.piece.piece-other').nodes().length}x other</p>
            <p>Refresh time: ${Math.ceil(timeRecords['sync-network'].reduce((a, b) => a + b) / timeRecords['sync-network'].length)}ms network + ${Math.ceil(timeRecords['sync-ui'].reduce((a, b) => a + b) / timeRecords['sync-ui'].length)}ms browser</p>
          </div>
        </div></form>
        <form class="container"><div id="tab-my" class="row">
          <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>

          <div class="col-12 spacing-small">
            <h2 class="h3">Subtable</h2>
            <p>Switch to a different view/setup on the current table:</p>
          </div>

          <div class="col-6 col-sm-8">
            <label for="table-sub">Subtable</label>
            <select id="table-sub" name="subtable"></select>
          </div>
          <div class="col-6 col-sm-4">
            <label for="btn-table-sub d-none d-sm-block">&nbsp;</label>
            <button id="btn-table-sub" class="btn btn-wide">Switch</button>
          </div>

          <div class="col-12 spacing-small">
            <h2 class="h3">Table content</h2>
            <p>Move all the content on the table to a corner/side of your choice:</p>
          </div>

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

          <div class="col-12 spacing-small">
            <h2 class="h3">Table size</h2>
          </div>

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

        </div></form>
        <form class="container"><div id="tab-server" class="row">
          <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>

          <div class="col-12 spacing-small">
            <p>The following settings will affect the whole table and all players. There will be <strong>no&nbsp;undo</strong> if you push any of those buttons!</p>
            <p><input id="danger" type="checkbox"><label for="danger">Enable danger zone.</label></p>
          </div>

          <div class="col-12 col-sm-8">
            <p>Clearing the table will remove all pieces from it. The library will not be changed.</p>
          </div>
          <div class="col-12 col-sm-4">
            <button id="btn-table-clear" class="btn btn-wide" disabled>Clear table</button>
          </div>
          <div class="col-12 col-sm-8">
            <p>Resetting the table will revert it to the initial setup. The library will not be changed.</p>
          </div>
          <div class="col-12 col-sm-4">
            <button id="btn-table-reset" class="btn btn-wide" disabled>Reset table</button>
          </div>
          <div class="col-12 col-sm-8">
            <p>Deleting your table will permanently erase it and it's library.</p>
          </div>
          <div class="col-12 col-sm-4">
            <button id="btn-table-delete" class="btn btn-wide" disabled>Delete table</button>
          </div>
        </div></form>
      </div>
    </div>
  `
  _('#modal-footer').innerHTML = `
    <button id='btn-close' type="button" class="btn btn-primary">Close</button>
  `

  // store/retrieve selected tab
  _('input[name="tabs"]').on('change', change => {
    stateSetTablePref('modalSettingsTab', change.target.id)
  })
  const preselect = stateGetTablePref('modalSettingsTab') ?? 'tab-1'
  _('#' + preselect).checked = true

  _('#quality').on('change', () => changeQuality(Number(_('#quality').value)))

  _('#danger').on('click', () => {
    if (_('#danger').checked) {
      _('#btn-table-clear').disabled = false
      _('#btn-table-reset').disabled = false
      _('#btn-table-delete').disabled = false
    } else {
      _('#btn-table-clear').disabled = true
      _('#btn-table-reset').disabled = true
      _('#btn-table-delete').disabled = true
    }
  })

  const select = _('#table-sub')
  for (let i = 1; i <= 9; i++) {
    const option = _('option').create(i)
    option.value = i
    if (i === getStateNo()) option.selected = true
    select.add(option)
  }

  const rect = getContentRectGrid()
  populateSizes('#table-w', getTemplate().gridWidth, rect.right)
  populateSizes('#table-h', getTemplate().gridHeight, rect.bottom)

  _('#btn-close').on('click', () => getModal().hide())
  _('#modal').on('hidden.bs.modal', () => modalClose())

  _('#btn-table-clear').on('click', click => {
    click.preventDefault()
    updateState([])
  })
  _('#btn-table-reset').on('click', click => {
    click.preventDefault()
    restoreState(0)
  })
  _('#btn-table-delete').on('click', click => {
    click.preventDefault()
    deleteTable().then(() => navigateToJoin(getTable().name))
  })

  _('#btn-table-sub').on('click', click => {
    click.preventDefault()
    setStateNo(Number(_('#table-sub').value))
  })

  _('#btn-table-tl').on('click', click => {
    click.preventDefault()
    moveContent(
      1,
      1
    )
  })

  _('#btn-table-tc').on('click', click => {
    click.preventDefault()

    moveContent(
      Math.floor(getTemplate().gridWidth / 2 - getContentRectGrid().width / 2),
      1
    )
  })

  _('#btn-table-tr').on('click', click => {
    click.preventDefault()
    moveContent(
      Math.floor(getTemplate().gridWidth - 1 - getContentRectGrid().width),
      1
    )
  })

  _('#btn-table-cl').on('click', click => {
    click.preventDefault()
    moveContent(
      1,
      Math.floor(getTemplate().gridHeight / 2 - getContentRectGrid().height / 2)
    )
  })

  _('#btn-table-cc').on('click', click => {
    click.preventDefault()

    moveContent(
      Math.floor(getTemplate().gridWidth / 2 - getContentRectGrid().width / 2),
      Math.floor(getTemplate().gridHeight / 2 - getContentRectGrid().height / 2)
    )
  })

  _('#btn-table-cr').on('click', click => {
    click.preventDefault()
    moveContent(
      Math.floor(getTemplate().gridWidth - 1 - getContentRectGrid().width),
      Math.floor(getTemplate().gridHeight / 2 - getContentRectGrid().height / 2)
    )
  })

  _('#btn-table-bl').on('click', click => {
    click.preventDefault()
    moveContent(
      1,
      Math.floor(getTemplate().gridHeight - 1 - getContentRectGrid().height)
    )
  })

  _('#btn-table-bc').on('click', click => {
    click.preventDefault()

    moveContent(
      Math.floor(getTemplate().gridWidth / 2 - getContentRectGrid().width / 2),
      Math.floor(getTemplate().gridHeight - 1 - getContentRectGrid().height)
    )
  })

  _('#btn-table-br').on('click', click => {
    click.preventDefault()
    moveContent(
      Math.floor(getTemplate().gridWidth - 1 - getContentRectGrid().width),
      Math.floor(getTemplate().gridHeight - 1 - getContentRectGrid().height)
    )
  })

  _('#btn-table-resize').on('click', click => {
    click.preventDefault()
    resizeTable()
  })

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
  const body = _('body').remove('.is-quality-low', '.is-quality-medium', '.is-quality-high', '.is-quality-ultra')
  stateSetTablePref('renderQuality', value)
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
 * @param {Number} tableSize Current table size in tiles.
 * @param {Number} contentSize Current right-most content size, in tiles.
 * @param {Number} increments (Optional) Increment size, defaults to 16.
 */
function populateSizes (id, tableSize, contentSize, increments = 16) {
  const select = _(id)

  for (let i = -2; i <= 2; i++) {
    const size = tableSize + increments * i
    if (size > 0 && size <= 256 && size >= contentSize + 1) {
      const option = _('option').create(size)
      option.value = size
      if (size === tableSize) option.selected = true
      select.add(option)
    }
  }
}

/**
 * Resize the table (if size actually changed)
 */
function resizeTable () {
  const template = getTemplate()
  const w = Number(_('#table-w').value)
  const h = Number(_('#table-h').value)
  if (w !== template.gridWidth || h !== template.gridHeight) {
    updateTemplate({
      gridWidth: w,
      gridHeight: h
    })
  }
}
