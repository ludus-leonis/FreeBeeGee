/**
 * @file Handles the screensaver modal.
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

import _ from 'src/js/lib/FreeDOM.mjs'
import * as Modal from 'src/js/view/room/modal.mjs'

/**
 * Inform user about demo mode restrictions.
 */
export function open () {
  if (!Modal.isOpen()) {
    Modal.create(true)

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">Welcome to demo mode!</h3>
    `
    _('#modal-body').innerHTML = `
      <p>Hi there 👋 ... this is FreeBeeGee running in demo mode. This means we won't use a server - we store your rooms &amp; tables in your browser. But without a real server, a few things can't work:</p>
      <ul>
        <li>You can't invite other players to your room.</li>
        <li>You can't edit the library.</li>
        <li>You can't save your room as <code>.zip</code>.</li>
      </ul>
      <p>Other than that, all features should be working. Go ahead and check out what FreeBeeGee can do for you!</p>
      <p>If you don't allow your browser store site data &amp; cookies when closing, all you do here will be gone by then. Otherwise you might be able to reopen your room later - just don't rely on it to be there. It's a demo after all.</p>
    `

    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn btn-primary">Cool!</button>
    `

    _('#btn-close').on('click', () => Modal.close())

    Modal.open()
  }
}
