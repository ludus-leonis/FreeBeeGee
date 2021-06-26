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

import { createScreen } from '../screen.mjs'
import _ from '../FreeDOM.mjs'
import { UnexpectedStatus } from '../api.mjs'
import {
  navigateToJoin,
  navigateReload
} from '../nav.mjs'

/**
 * Show an error dialog.
 *
 * @param {String} code Code of error message to show.
 * @param {*} options Options / stuff to simply forwart to the error.
 */
export function runError (code, options) {
  switch (code) {
    case 'UNEXPECTED': // 5
      runErrorUnexpected(options)
      break
    case 'TABLE_GONE': // 4
      runErrorTableGone(options)
      break
    case 'NO_SLOT': // 3
      runErrorNoSlotAvailable()
      break
    case 'FULL': // 2
      runErrorOverCapacity()
      break
    case 'UPDATE': // 1
      runErrorUpdate()
      break
    case 'UNKNOWN':
    default:
      runErrorServerGeneric()
      break
  }
}

/**
 * Error screen be shown when an existing table disappeared. Probably the admin
 * deleted/closed it.
 */
function runErrorUnexpected (error) {
  console.error('*that* was unexpected!', error, error.body) // only log if error is serious

  if (!'$VERSION$'.endsWith('dev')) {
    runErrorClientGeneric() // show nice error message if not in development mode
  }
}

/**
 * Error screen be shown when an existing table disappeared. Probably the admin
 * deleted/closed it.
 */
function runErrorTableGone (tableName, error) {
  if (error instanceof UnexpectedStatus && error.status !== 404) {
    console.error('table gone', error) // only log if error is serious
  }

  createScreen(
    'Table gone ...',
    `
      <p class="is-wrapping">Table <strong>${tableName}</strong> does not exist (any more).</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Restart</a>
    `
  )
  _('#ok').on('click', click => { navigateToJoin(tableName) })
}

/**
 * Error screen be shown when no more slots are available for new tables and this
 * is known in advance.
 */
function runErrorNoSlotAvailable () {
  createScreen(
    'Table not found ...',
    `
      <p>Your table does not exist yet.</p>

      <p>Usually we would offer you to create it now, but our server is over capacity. You'll have to wait until a table gets free. Please try again later.</p>

      <p>However, you still can join existing tables if you know their names.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { navigateToJoin() })
}

/**
 * Error screen be shown when no more slots are available for new tables and this
 * is is discovered during a create-api call.
 */
function runErrorOverCapacity () {
  createScreen(
    'We are out of space ...',
    `
      <p>It seems our server is curreontly over capacity. All available tables are taken. Please try again later.</p>

      <p>However, you still can join existing tables if you know their names.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { navigateToJoin() })
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
  _('#ok').on('click', click => { navigateReload() })
}

/**
 * A generic server error to be shown when the unexcepted happened.
 */
function runErrorServerGeneric () {
  createScreen(
    'We are sorry ...',
    `
      <p>Our server is currently experiencing technical difficulties. Please try again later.</p>
      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Try again</a>
    `
  )
  _('#ok').on('click', click => { navigateReload() })
}

/**
 * A generic server error to be shown when the unexcepted happened.
 */
function runErrorClientGeneric () {
  createScreen(
    'We are sorry ...',
    `
      <p>We are currently experiencing technical difficulties. You might have found a bug here. Please try again, but if the issue persists, please consider reporting it.</p>
      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Try again</a>
    `
  )
  _('#ok').on('click', click => { navigateReload() })
}
