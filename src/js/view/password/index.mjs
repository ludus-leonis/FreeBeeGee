/**
 * @file The password screen.
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

import _ from '../../lib/FreeDOM.mjs'

import {
  auth
} from '../../app.mjs'

import {
  createScreen
} from '../../view/screen.mjs'

/**
 * Show a password dialog.
 *
 * @param {string} roomName The room name the user entered in the join dialog.
 * @param {boolean} first If true, this is the first password attempt (no error message shown).
 */
export function passwordView (roomName, first) {
  createScreen(
    'Room password required',
    `
      <div class="page-setup">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <input id="mode" class="mode is-hidden" type="checkbox">
        <p class="is-wrapping">
          Room <strong>${roomName}</strong> requires a password.
        </p>

        <p class="server-feedback"></p>

        <label for="roompwd">Room password</label>
        <input id="roompwd" name="roompwd" type="password">
        <p class="p-small spacing-tiny">
          Ask your host if you don't know it.
        </p>

        <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Enter!</a>
        <p class="p-small is-faded is-center">
          Wrong room? <a href="./">Pick another</a>.
        </p>
      </div>
    `
  )

  _('#roompwd')
    .on('blur', blur => { _('#roompwd').remove('.invalid') })
    .on('keydown', keydown => { if (keydown.keyCode === 13) ok(roomName) })
  _('#ok').on('click', click => { click.preventDefault(); ok(roomName) })

  if (!first) {
    _('.server-feedback').add('.show').innerHTML = 'Please enter a correct password.'
  }

  _('#roompwd').focus()
}

/**
 * Validate password on OK.
 *
 * @param {string} roomName Room name to check for.
 */
function ok (roomName) {
  _('#ok').add('.is-spinner')
  auth(roomName, _('#roompwd').value)
}
