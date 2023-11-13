/**
 * @file The join-room screen.
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
import App from '../app.mjs'
import Browser from '../lib/util-browser.mjs'
import Screen from '../lib/screen.mjs'
import State from '../state/index.mjs'
import Text from '../lib/util-text.mjs'
import Util from '../lib/util.mjs'

// -----------------------------------------------------------------------------

export default {
  show
}

// -----------------------------------------------------------------------------

/** Limit room names like hilariousGazingPenguin */
const roomNameMaxLength = 48

/**
 * Show the enter-name dialog.
 */
function show () {
  const ttl = State.getServerInfo().ttl
  const intro = State.SERVERLESS
    ? '<p>Welcome to the FreeBeeGee Demo!</p>'
    : ''
  const intro2 = State.SERVERLESS
    ? '<p>For this demo <strong>no data is stored on the server</strong>. If you clear your browser\'s site/cache data, your rooms &amp; tables will be gone.</p>'
    : ''
  Screen.create(
    'Pick a room',
    `
      ${intro}
      <label for="name">Room name</label>
      <input id="name" name="name" type="text" placeholder="DustyDish" maxlength="${roomNameMaxLength}" pattern="${Util.REGEXP.ROOM_NAME}">
      <p class="p-small spacing-tiny">Min. 8 characters - no spaces or funky letters, please.</p>
      ${intro2}

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Enter</a>
    `,

    ttl > 0
      ? `This server deletes rooms after ${Text.hoursToTimespan(ttl)} of inactivity.`
      : 'Don\'t forget your room\'s name! You can reopen it later.'
  )

  const name = _('#name')
  name.on('keydown', keydown => {
    const key = keydown.keyCode

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
  name.value = Browser.getGetParameter('room').replace(/[^a-zA-Z0-9]/gi, '').substr(0, roomNameMaxLength)
  name.placeholder = Util.generateName()
  name.focus()

  const user = _('#user')
  user.value = Browser.getGetParameter('user').trim()
  user.placeholder = Util.generateUsername()

  _('#ok').on('click', click => { click.preventDefault(); ok() })
}

// -----------------------------------------------------------------------------

/**
 * Initiates actual room-join after user clicks OK.
 */
function ok () {
  const invalid = document.querySelector('input:invalid')
  if (invalid) {
    invalid.focus()
  } else {
    App.navigateToRoom(_('#name').valueOrPlaceholder())
  }
}
