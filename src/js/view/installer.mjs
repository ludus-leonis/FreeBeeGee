/**
 * @file The setup-a-room screen.
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

import _ from '../lib/FreeDOM.mjs'
import * as Screen from '../lib/screen.mjs'

/**
 * Show a install-site dialog
 *
 * @param {string} page A page of the setup wizard. Currenly always 1.
 */
export function show (page) {
  Screen.create(
    'Almost there!',
    `
      <div class="page-setup">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <input id="mode" class="mode is-hidden" type="checkbox">
        <p class="is-wrapping">
          If you can read this, FreeBeeGee is running and has created a default configuration for you.
          But before you can play, you'll have to set an admin password.
        </p>
        <p>
          Create a bcrypt hash in your browser <a href="./tools">here</a>, then edit <code>api/data/server.json</code> on the server and replace the old hash there.
        </p>
        <p>
          Please refer to FreeBeeGee's <code>INSTALL.md</code> for more configuration options.
        </p>
      </div>
    `
  )

  _('#ok').on('click', click => { })
}
