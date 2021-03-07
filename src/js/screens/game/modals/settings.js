/**
 * @file Handles the game/table settings modal.
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
  updateState,
  restoreState
} from '../state.js'

// --- public ------------------------------------------------------------------

/**
 * Show the settings modal.
 */
export function modalSettings () {
  createModal()

  _('#modal-header').innerHTML = `
    <h3 class="modal-title">Table settings</h3>
  `
  _('#modal-body').innerHTML = `
    <form class="container">
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <div class="row">
        <div class="col-12">
          <h2 class="h3">Game statistics</h2>
          <p>Table size: ${getTemplate().width}x${getTemplate().height} spaces</p>
          <p>Pieces: ${_('.piece.token').nodes().length}x token, ${_('.piece.overlay').nodes().length}x overlay, ${_('.piece.tile').nodes().length}x tile</p>
          <p>Engine: $ENGINE$</p>

          <h2 class="h3">Danger zone</h2>
          <p>The following settings will affect the whole table. There will be no <em>undo</em> if you push any of those buttons!</p>
          <p><input id="danger" type="checkbox"><label for="danger">Enable danger mode.</label></p>
        </div>
        <div class="col-12 col-sm-8">
          <p>Clearing the table will remove all pieces from it. Your library will not be changed.</p>
        </div>
        <div class="col-12 col-sm-4">
          <button id="btn-table-clear" class="btn btn-wide" disabled>Clear table</button>
        </div>
        <div class="col-12 col-sm-8">
          <p>Resetting the table will revert it to the initial setup. Your library will not be changed.</p>
        </div>
        <div class="col-12 col-sm-4">
          <button id="btn-table-reset" class="btn btn-wide" disabled>Reset table</button>
        </div>
        <div class="col-12 col-sm-8">
          <p>Deleting your table will erase it and your library. Other players will be kicked out.</p>
        </div>
        <div class="col-12 col-sm-4">
          <button id="btn-table-delete" class="btn btn-wide" disabled>Delete table</button>
        </div>
      </div>
    </form>
  `
  _('#modal-footer').innerHTML = `
    <button id='btn-close' type="button" class="btn btn-primary">Close</button>
  `

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

  _('#btn-close').on('click', () => getModal().hide())
  _('#modal').on('hidden.bs.modal', () => modalClose())

  _('#btn-table-clear').on('click', () => updateState([]))
  _('#btn-table-reset').on('click', () => restoreState(0))

  getModal().show()
}

// --- internal ----------------------------------------------------------------
