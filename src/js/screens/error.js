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
import { UnexpectedStatus } from '../api.js'

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
    case 'GAME_GONE': // 4
      runErrorGameGone(options)
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
 * Error screen be shown when an existing game disappeared. Probably the admin
 * deleted/closed it.
 */
function runErrorUnexpected (error) {
  console.error('*that* was unexpected!', error, error.body) // only log if error is serious

  if (!'$VERSION$'.endsWith('dev')) {
    runErrorClientGeneric() // show nice error message if not in development mode
  }
}

/**
 * Error screen be shown when an existing game disappeared. Probably the admin
 * deleted/closed it.
 */
function runErrorGameGone (gameName, error) {
  if (error instanceof UnexpectedStatus && error.status !== 404) {
    console.error('game gone', error) // only log if error is serious
  }

  createScreen(
    'Game gone ...',
    `
      <p class="is-wrapping">Game <strong>${gameName}</strong> does not exist (any more).</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Restart</a>
    `
  )
  _('#ok').on('click', click => { backToStart(gameName) })
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
  _('#ok').on('click', click => { forceReload() })
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
  _('#ok').on('click', click => { forceReload() })
}

/**
 * Force the browser to reload the page.
 */
function forceReload () {
  globalThis.location.reload()
}

/**
 * Go back to the start/join screen. Remember game name if possible.
 *
 * @param {?String} gameName Optional name of game to add in redirect.
 */
function backToStart (gameName) {
  if (gameName) {
    globalThis.location = './?game=' + gameName
  } else {
    globalThis.location = './'
  }
}
