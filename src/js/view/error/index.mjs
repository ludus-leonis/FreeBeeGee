/**
 * @file Various error dialogs
 * @module
 * @copyright 2021-2022 Markus Leupold-Löwenthal
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

import _ from '../../lib/FreeDOM.mjs'

import {
  createScreen
} from '../../view/screen.mjs'

import {
  UnexpectedStatus
} from '../../api/index.mjs'

import {
  navigateToJoin,
  navigateReload
} from '../../app.mjs'

/**
 * Show an error dialog.
 *
 * @param {String} code Code of error message to show.
 * @param {*} options Options / stuff to simply forwart to the error.
 */
export function runError (code, options) {
  switch (code) {
    case 'ROOM_INVALID_ENGINE':
      runErrorRoomDeprecated(options)
      break
    case 'UNEXPECTED': // 5
      runErrorUnexpected(options)
      break
    case 'TABLE_GONE': // 4
      runErrorRoomGone(options)
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
 * Try to find out what the problem is.
 *
 * @return {String} Explanatory HTML error message, or generic 'try again'.
 **/
function detectProblem () {
  const error = _('#content')
  const missing = new Error('Server is missing requirements.')

  globalThis.fetch('api/issues/')
    .then(response => {
      response.text()
        .then(text => {
          if (response.status === 200) {
            if (text.search(/This file is part of FreeBeeGee/) >= 0) {
              error.innerHTML = '<p>PHP is not enabled on this server. FreeBeeGee can\'t run without PHP 😞</p>'
              throw missing // abort further diagnosis
            } else if (
              !text.search(/{/) >= 0 || // output does not start with json object
              text.search(/^[^{]+{/) >= 0 // output has php messages before json object
            ) {
              error.innerHTML = `
                <p>The API is reporting unexpected errors or warnings. Please inform your admin that&nbsp;...</p>
                <ul>
                  <li>PHP 7.3 or higher is required to run FreeBeeGee,</li>
                  <li>the server might be out of resources,</li>
                  <li>the webserver's <code>error.log</code> might contain more clues.</li>
                </ul>
              `
            } else {
              // no better cause found - output standard message
              error.innerHTML = `
                <p>No more information is available. Please try again later.</p>
                <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Try again</a>
              `
              _('#ok').on('click', click => { navigateReload() })
            }
          }
          if (response.status === 204) return {}
          try { // try to parse what we got by skipping potential PHP errors before the JSON data
            return JSON.parse(text.replace(/^[^{]+{/, '{'))
          } catch (error) {
            throw missing // abort further error detection due invalid JSON data
          }
        })
        .then(errorJson => {
          console.error(errorJson)

          // The api seems to deliver JSON. Try to pin down the problem better.
          let issues = ''
          if (!errorJson.phpOk) issues += '<li>PHP 7.3 or higher is required.</li>'
          if (!errorJson.moduleZip) issues += '<li>The PHP <code>zip</code> module is not available.</li>'

          if (issues !== '') {
            error.innerHTML = `
              <p>This server does not meet FreeBeeGee's requirements. Please inform your admin that&nbsp;...</p>
              <ul>
                ${issues}
              </ul>
            `
          }
        })
    })
}

/**
 * Error screen be shown when an existing room disappeared. Probably the admin
 * deleted/closed it.
 */
function runErrorUnexpected (error) {
  console.error('*that* was unexpected!', error, error.body) // only log if error is serious

  if (!'$VERSION$'.endsWith('dev')) {
    runErrorClientGeneric() // show nice error message if not in development mode
  }
}

/**
 * Error screen be shown when an existing room disappeared. Probably the admin
 * deleted/closed it.
 */
function runErrorRoomGone (roomName, error) {
  if (error instanceof UnexpectedStatus && error.status !== 404) {
    console.error('room gone', error) // only log if error is serious
  }

  createScreen(
    'Room gone ...',
    `
      <p class="is-wrapping">Room <strong>${roomName}</strong> does not exist (any more).</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Restart</a>
    `
  )
  _('#ok').on('click', click => { navigateToJoin(roomName) })
}

/**
 * Error screen be shown when a room seems to be from an older, incopatible FBG
 * version.
 */
function runErrorRoomDeprecated (roomName) {
  createScreen(
    'Room outdated ...',
    `
      <p class="is-wrapping">Room <strong>${roomName}</strong> has been created by an incompatible FreeBeeGee version.</p>

      <p>We are sorry, but it can not be run on this server. Please choose another room.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { navigateToJoin() })
}

/**
 * Error screen be shown when no more slots are available for new rooms and this
 * is known in advance.
 */
function runErrorNoSlotAvailable () {
  createScreen(
    'Room not found ...',
    `
      <p>Your room does not exist yet.</p>

      <p>Usually we would offer you to create it now, but our server is over capacity. You'll have to wait until a room gets available. Please try again later.</p>

      <p>However, you still can enter existing rooms if you know their names.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { navigateToJoin() })
}

/**
 * Error screen be shown when no more slots are available for new rooms and this
 * is is discovered during a create-api call.
 */
function runErrorOverCapacity () {
  createScreen(
    'We are out of space ...',
    `
      <p>It seems our server is curreontly over capacity. All available rooms are taken. Please try again later.</p>

      <p>However, you still can enter existing rooms if you know their names.</p>

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
      <p>Our server is currently experiencing technical difficulties.</p>
      <p id="why">Trying to detect why ...</p>
    `
  )
  detectProblem()
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
