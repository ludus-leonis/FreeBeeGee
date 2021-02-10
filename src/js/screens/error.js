/**
 * @file Various error dialogs
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

import { createScreen } from '../screen.js'
import _ from '../FreeDOM.js'

/**
 * Show an error dialog.
 *
 * @param {Number} code Code of error message to show.
 */
export function runError (code) {
  createScreen()

  switch (code) {
    case 3:
      runErrorNoSlotAvailable()
      break
    case 2:
      runErrorOverCapacity()
      break
    case 1:
      runErrorUpdate()
      break
    case 0:
    default:
      runErrorGeneric()
      break
  }
}

/**
 * Error screen be shown when no more slots are available for new games and this
 * is known in advance.
 */
function runErrorNoSlotAvailable () {
  createScreen(
    'Game not found ...',
    `
      <p>Your game does not exist yet.</p>

      <p>Usually we would offer you to create it now, but our server is over capacity. You'll have to wait until other games close down. Please try again later.</p>

      <p>However, you still can join existing games if you know their names.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { forceReload() })
}

/**
 * Error screen be shown when no more slots are available for new games and this
 * is is discovered during a create-api call.
 */
function runErrorOverCapacity () {
  createScreen(
    'We are out of space ...',
    `
      <p>It seems our server is over capacity. All available game slots are taken and we currently can't accept any new games. Please try again later.</p>

      <p>However, you still can join existing games if you know their names.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { forceReload() })
}

/**
 * Error/hint screen be shown when the server version does not match the
 * (probably cached) client.
 */
function runErrorUpdate () {
  createScreen(
    'Update available!',
    `
      <p>Good news: $NAME$ just got an update. Please reload this page to get the newer, better and faster version!</p>
      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Reload</a>
    `
  )
  _('#ok').on('click', click => { forceReload() })
}

/**
 * A generic error to be shown when the unexcepted happened.
 */
function runErrorGeneric () {
  createScreen(
    'We are sorry ...',
    `
      <p>Our server is currently experiencing technical difficulties. Please try again later.</p>
      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Try again</a>
    `
  )
  _('#ok').on('click', click => { forceReload() })
}

/**
 * Force the browser to reload the page.
 */
function forceReload () {
  globalThis.location.reload()
}
