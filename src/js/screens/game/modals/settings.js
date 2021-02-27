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

import { createModal, getModal, modalClose } from '../../../modal.js'
import { getTemplate } from '../state.js'

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
    <form class="container">
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <div class="row">
        <div class="col-12">
          <h2 class="h3">Game statistics</h2>
          <p>Table size: ${getTemplate().width}x${getTemplate().height} spaces</p>
          <p>Tokens: ${_('.piece.token').nodes().length}</p>
          <p>Overlays:  ${_('.piece.overlay').nodes().length}</p>
          <p>Tiles:  ${_('.piece.tile').nodes().length}</p>

          <!-- <h2 class="h3">Danger zone</h2>
          <p>Lorem</p> -->
        </div>
      </div>
    </form>
  `
  _('#modal-footer').innerHTML = `
    <button id='btn-close' type="button" class="btn btn-primary">Close</button>
  `

  _('#btn-close').on('click', () => getModal().hide())
  _('#modal').on('hidden.bs.modal', () => modalClose())

  getModal().show()
}

// --- internal ----------------------------------------------------------------
