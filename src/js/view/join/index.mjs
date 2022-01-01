/**
 * @file The join-room screen.
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
  createRoomView
} from '../../view/create/index.mjs'
import {
  runRoom
} from '../../view/room/index.mjs'

import {
  getServerInfo
} from '../../state/index.mjs'

import {
  getGetParameter,
  generateName,
  generateUsername
} from '../../lib/utils.mjs'

import {
  DEMO_MODE,
  apiGetRoom
} from '../../api/index.mjs'

import {
  navigateToRoom
} from '../../app.mjs'

import {
  runError
} from '../../view/error/index.mjs'

/** Limit room names like hilariousGazingPenguin */
const roomNameMaxLength = 48

/**
 * Show the enter-name dialog or skip it if name was already given.
 *
 * @param {String} roomName Room name.
 */
export function runJoin (roomName) {
  if (roomName) {
    openOrCreate(roomName)
  } else {
    showJoinDialog()
  }
}

// -----------------------------------------------------------------------------

/**
 * Show a join-room dialog.
 */
function showJoinDialog () {
  const ttl = getServerInfo().ttl
  const intro = DEMO_MODE
    ? '<p>Welcome to the FreeBeeGee Demo!</p>'
    : ''
  const intro2 = DEMO_MODE
    ? '<p>For this demo <strong>no data is stored on the server</strong>. If you clear your browser\'s site/cache data, your rooms &amp; tables will be gone.</p>'
    : ''
  createScreen(
    'Pick a room',
    `
      ${intro}
      <label for="name">Room name</label>
      <input id="name" name="name" type="text" placeholder="DustyDish" maxlength="${roomNameMaxLength}" pattern="[a-zA-Z0-9]{8,${roomNameMaxLength}}">
      <p class="p-small spacing-tiny">Min. 8 characters - no spaces or funky letters, please.</p>
      ${intro2}

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Enter</a>
    `,

    ttl > 0
      ? `This server deletes rooms after ${ttl}h of inactivity.`
      : 'Don\'t forget your room\'s name! You can reopen it later.'
  )

  const name = _('#name')
  name.on('keydown', keydown => {
    var key = keydown.keyCode

    // allow letters + digits
    if (
      ((key >= 48) && (key <= 57)) || // 0-9
      ((key >= 65) && (key <= 90)) || // a-z
      ((key >= 96) && (key <= 105)) // numpad 0-9
    ) {
      return
    }

    // allow meta-keys
    switch (key) {
      case 8: // backspace
      case 16: // shift
      case 37: // left
      case 39: // right
      case 46: // del
      case 9: // tab
      case keydown.metaKey: // mac-key, win-key etc.
      case 17: // ctrl
      case 20: // alt
      case 27: // esc
      case 35: // end
      case 36: // home
      case 38: // up
      case 40: // down
      case 45: // ins
      case 144: // num lock
      case 145: // scroll lock
        return
      case 13: // simulate submitbutton push
        keydown.preventDefault()
        ok()
        return
    }
    // deny rest
    keydown.preventDefault()
  })
  name.on('paste', paste => {
    setTimeout(() => {
      const input = _('#name')
      input.value = input.value.replace(/[^a-zA-Z0-9]/gi, '').substr(0, roomNameMaxLength)
    })
  })
  name.value = getGetParameter('room').replace(/[^a-zA-Z0-9]/gi, '').substr(0, roomNameMaxLength)
  name.placeholder = generateName()
  name.focus()

  const user = _('#user')
  user.value = getGetParameter('user').trim()
  user.placeholder = generateUsername()

  _('#ok').on('click', click => { click.preventDefault(); ok() })
}

/**
 * Initiates actual room-join after user clicks OK.
 */
function ok () {
  const invalid = document.querySelector('input:invalid')
  if (invalid) {
    invalid.focus()
  } else {
    navigateToRoom(_('#name').valueOrPlaceholder())
  }
}

/**
 * Try to open/init a room. If it does not exist, show the create screen.
 *
 * @param {String} roomName Room name.
 */
function openOrCreate (name) {
  apiGetRoom(name, true)
    .then((response) => {
      if (response.status === 200) {
        runRoom(response.body)
      } else { // 404
        createRoomView(name)
      }
    })
    .catch(() => runError())
}
