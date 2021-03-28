/**
 * @file The join-table screen.
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
import { createTable } from './create.js'
import { runTable } from './table'

import { stateGetServerInfo } from '../state.js'
import _ from '../FreeDOM.js'
import {
  getGetParameter,
  generateName,
  generateUsername
} from '../utils.js'
import { apiGetTable } from '../api.js'
import { navigateToTable } from '../nav.js'

/** Limit table names like hilariousGazingPenguin */
const tableNameMaxLength = 48

/**
 * Show the enter-name dialog or skip it if name was already given.
 *
 * @param {String} tableName Table name.
 */
export function runJoin (tableName) {
  if (tableName) {
    openOrCreate(tableName)
  } else {
    showJoinDialog()
  }
}

// -----------------------------------------------------------------------------

/**
 * Show a join-table dialog.
 */
function showJoinDialog () {
  createScreen(
    'Pick a table',
    `
      <label for="name">Table name</label>
      <input id="name" name="name" type="text" placeholder="DustyDish" maxlength="${tableNameMaxLength}" pattern="[a-zA-Z0-9]{8,${tableNameMaxLength}}">
      <p class="p-small spacing-tiny">Min. 8 characters - no spaces or funky letters, please.</p>

      <!--label for="user">Your name</label-->
      <input id="user" name="user" type="hidden" placeholder="Jolie Average">
      <!--p class="p-small spacing-tiny">Will be visible to other players at this table.</p-->

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Take me there!</a>
    `,

    `This server deletes tables after ${stateGetServerInfo().ttl}h of inactivity.`
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
      input.value = input.value.replace(/[^a-zA-Z0-9]/gi, '').substr(0, tableNameMaxLength)
    })
  })
  name.value = getGetParameter('table').replace(/[^a-zA-Z0-9]/gi, '').substr(0, tableNameMaxLength)
  name.placeholder = generateName()
  name.focus()

  const user = _('#user')
  user.value = getGetParameter('user').trim()
  user.placeholder = generateUsername()

  _('#ok').on('click', click => { click.preventDefault(); ok() })
}

/**
 * Initiates actual table-join after user clicks OK.
 */
function ok () {
  const invalid = document.querySelector('input:invalid')
  if (invalid) {
    invalid.focus()
  } else {
    navigateToTable(_('#name').valueOrPlaceholder())
  }
}

/**
 * Try to open/init a table. If it does not exist, show the create screen.
 *
 * @param {String} tableName Table name.
 */
function openOrCreate (name) {
  apiGetTable(name)
    .then((table) => {
      runTable(name)
    })
    .catch(() => createTable(name))
}
