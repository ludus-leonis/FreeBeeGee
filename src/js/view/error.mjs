/**
 * @file Various error dialogs
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
import * as Api from '../api/index.mjs'
import * as App from '../app.mjs'
import * as Screen from '../lib/screen.mjs'
import * as Sync from './room/sync.mjs'

/**
 * React on an API error.
 *
 * @param {object} error Error object from the API layer.
 * @param {string} roomName Room we are in.
 * @param {number[]} ignore Array of status codes to ignore as not-an-error.
 */
export function apiError (error, roomName, ignore = []) {
  if (error instanceof Api.UnexpectedStatus) { // API error
    if (ignore.includes(error.status)) {
      return // semi-expected error that is silently ignored
    }
    Sync.stopAutoSync()
    switch (error.status) {
      case 401:
        runError('BUG', error)
        return
      case 403:
        App.reload() // force reload to reset data + show password screen
        return
      case 404:
        runErrorRoomGone()
        return
    }
  }

  runError('BUG', error)
}

/**
 * Show an error dialog.
 *
 * @param {string} code Code of error message to show.
 * @param {*} options Options / stuff to simply forward to the error.
 */
export function runError (code, options) {
  switch (code) {
    case 'INVALID_ENGINE':
      runErrorRoomDeprecated(options)
      break
    case 'BUG':
      runErrorBug(options)
      break
    case 'ROOM_INVALID':
      runErrorRoomDeprecated(options)
      break
    case 'NO_SLOT':
      runErrorNoSlotAvailable()
      break
    case 'FULL':
      runErrorOverCapacity()
      break
    case 'UPDATE':
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
 * @returns {Promise} Promise of execution.
 */
function detectProblem () {
  const error = _('#content')
  const missing = new Error('Server is missing requirements.')

  return globalThis.fetch('api/issues/')
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
                  <li>PHP 7.4 or higher is required to run FreeBeeGee,</li>
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
              _('#ok').on('click', click => { App.reload() })
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
          if (!errorJson.phpOk) issues += '<li>PHP 7.4 or higher is required.</li>'
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
 *
 * @param {object} error Error object from the API layer.
 */
function runErrorBug (error) {
  console.error('*that* was unexpected!', error, error.body) // only log if error is serious

  if (!'$VERSION$'.endsWith('dev')) {
    Screen.create(
      'We are sorry ...',
      `
        <p>We are currently experiencing technical difficulties. You might have found a bug here. Please try again, but if the issue persists, please consider reporting it.</p>
        <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Try again</a>
      `
    )
    _('#ok').on('click', click => { App.reload() })
  }
}

/**
 * Error screen be shown when an existing room disappeared. Probably the admin
 * deleted/closed it.
 */
function runErrorRoomGone () {
  Screen.create(
    'Room gone ...',
    `
      <p class="is-wrapping">This room does not exist (any more).</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Restart</a>
    `
  )
  _('#ok').on('click', click => { App.navigateToJoin() })
}

/**
 * Error screen be shown when a room seems to be from an older, incopatible FBG
 * version.
 *
 * @param {string} roomName Room name for the card.
 */
function runErrorRoomDeprecated (roomName) {
  Screen.create(
    'Room outdated ...',
    `
      <p class="is-wrapping">Room <strong>${roomName}</strong> contains invalid data. It has probably been created by an older FreeBeeGee version.</p>

      <p>We are sorry, but it can not be run on this server. Please choose another room.</p>

      <p>Alternately, you can try to <a href="./api/rooms/${roomName}/snapshot/?tzo=${new Date().getTimezoneOffset() * -1}">download a snapshot</a> and re-upload it, so it gets converted to the current version.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { App.navigateToJoin() })
}

/**
 * Error screen be shown when no more slots are available for new rooms and this
 * is known in advance.
 */
function runErrorNoSlotAvailable () {
  Screen.create(
    'Room not found ...',
    `
      <p>Your room does not exist yet.</p>

      <p>Usually we would offer you to create it now, but our server is over capacity. You'll have to wait until a room gets available. Please try again later.</p>

      <p>However, you still can enter existing rooms if you know their names.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { App.navigateToJoin() })
}

/**
 * Error screen be shown when no more slots are available for new rooms and this
 * is is discovered during a create-api call.
 */
function runErrorOverCapacity () {
  Screen.create(
    'We are out of space ...',
    `
      <p>It seems our server is curreontly over capacity. All available rooms are taken. Please try again later.</p>

      <p>However, you still can enter existing rooms if you know their names.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Back</a>
    `
  )
  _('#ok').on('click', click => { App.navigateToJoin() })
}

/**
 * Error/hint screen be shown when the server version does not match the
 * (probably cached) client.
 */
function runErrorUpdate () {
  Screen.create(
    'Update available!',
    `
      <p>Good news: $NAME$ just got an update. Please reload this page to get the newer, better and faster version!</p>
      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Reload</a>
    `
  )
  _('#ok').on('click', click => { App.reload() })
}

/**
 * A generic server error to be shown when the unexcepted happened.
 */
function runErrorServerGeneric () {
  Screen.create(
    'We are sorry ...',
    `
      <p>Our server is currently experiencing technical difficulties.</p>
      <p id="why">Trying to detect why ...</p>
    `
  )
  detectProblem()
}
