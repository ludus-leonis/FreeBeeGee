/**
 * @file The create-a-room screen.
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

import _ from 'lib/FreeDOM.mjs'

import {
  createScreen,
  serverFeedback
} from 'view/screen.mjs'

import {
  runError
} from 'view/error/index.mjs'

import {
  addRoom,
  getServerInfo
} from 'state/index.mjs'

import {
  apiGetTemplates,
  UnexpectedStatus
} from 'api/index.mjs'

import {
  navigateToRoom
} from 'app.mjs'

/**
 * Show a create-room dialog.
 *
 * @param {String} name The room name the user entered in the join dialog.
 */
export function createRoomView (name) {
  if (getServerInfo().freeRooms <= 0) {
    runError('NO_SLOT')
    return
  }

  const templateHelp = getServerInfo().snapshotUploads
    ? 'You may also <label for="mode" class="is-link">upload</label> a snapshot instead.'
    : 'Let us know what game we may prepare for you.'

  createScreen(
    'Open new room',
    `
      <div class="page-create">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <input id="mode" class="mode is-hidden" type="checkbox">
        <p class="is-wrapping">Room <strong>${name}</strong> does not exist yet. Feel free to open it!</p>

        <p class="server-feedback"></p>

        <label class="upload-label" for="uploadFile">Upload</label>
        <label class="upload-group" for="uploadFile">
          <div id="uploadInput" class="is-input placeholder">Select .zip</div>
          <input id="uploadFile" type="file" accept=".zip", class="is-hidden" />
        </label>
        <p class="upload-text p-small spacing-tiny">Got no snapshots? Pick an <label for="mode" class="is-link">existing template</label> instead.</p>
        <label id="template-label" class="template-label" for="template">Template</label>
        <select id="template" class="template" name="template">
          <option value="RPG" selected>RPG</option>
        </select>
        <p class="template-text p-small spacing-tiny">${templateHelp}</p>
      ` + (getServerInfo().createPassword ? `
        <label for="password">Password</label>
        <input id="password" type="password" placeholder="* * * * * *">
        <p class="p-small spacing-tiny">This server requires a password to create rooms.</p>
      ` : '') + `
        <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Open &amp; enter!</a>
        <p class="p-small is-faded is-center">Wrong room? <a href="./">Pick another</a>.</p>
      </div>
    `,

    `This server deletes rooms after ${getServerInfo().ttl}h of inactivity.`
  )

  apiGetTemplates()
    .then(templates => {
      const t = _('#template')
      t.innerHTML = ''
      for (const template of templates) {
        const option = _('option').create(template)
        option.value = template
        if (template === 'RPG') option.selected = true
        t.add(option)
      }
    })

  _('#template')
    .on('change', change => { _('#template').remove('.invalid') })

  _('#uploadFile')
    .on('change', change => {
      _('#uploadInput').remove('.invalid', '.placeholder').innerHTML = _('#uploadFile').value.split(/[\\/]/).pop()
    })

  _('#password')
    .on('blur', blur => { _('#password').remove('.invalid') })
    .on('keydown', keydown => { if (keydown.keyCode === 13) validate() && ok(name) })
  _('#ok').on('click', click => { click.preventDefault(); validate() && ok(name) })

  _('#template').focus()
}

function validate () {
  if (_('#mode').checked) { // upload mode
    if (_('#uploadFile').value.length <= 0) {
      _('#uploadInput').add('.invalid')
      return false
    }
    return true
  } else { // exisiting template mode
    return true // checks handled by html input
  }
}

/**
 * Initiates actual room-create after user clicks OK.
 */
function ok (name) {
  _('#ok').add('.is-spinner')

  const room = {
    name: name
  }

  const password = _('#password').value ?? null
  if (password !== null) {
    room.auth = password
  }

  let snapshot = null
  if (_('#mode').checked) { // upload mode
    const file = _('#uploadFile')
    if (file.value.length > 0) {
      snapshot = file.files[0]
    }
  } else { // exisiting template mode
    room.template = _('#template').value
  }

  addRoom(room, snapshot)
    .then((remoteRoom) => {
      navigateToRoom(remoteRoom.name)
    })
    .catch((error) => {
      console.error(error)
      _('#ok').remove('.is-spinner')
      if (error instanceof UnexpectedStatus) {
        switch (error.status) {
          case 400:
            switch (error.body._error) {
              case 'TEMPLATE_JSON_INVALID_ENGINE':
                serverFeedback(`The selected template requires engine <strong>${error.body._messages[1]}</strong> and can't be run on this server (engine <strong>${error.body._messages[2]}</strong>). Please choose another template.`)
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'SIZE_EXCEEDED':
                serverFeedback('The selected template is too large (or we are out of disk space). Please try again later or choose a smaller one.')
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'ZIP_INVALID':
              case 'TEMPLATE_JSON_INVALID':
              case 'STATE_JSON_INVALID':
              default:
                serverFeedback('The selected template contains errors and can\'t be added to your room. Please choose another template.')
                console.error(error.body._messages)
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
            }
            break
          case 401:
            _('#password').add('.invalid').focus().value = ''
            break
          case 413:
            serverFeedback('This snapshot is too large. Please choose a smaller one.')
            _('#uploadInput').add('.invalid')
            _('#template').add('.invalid').focus()
            break
          case 503:
            runError('FULL')
            break
          default:
            runError('UNEXPECTED', error)
        }
      }
    })
}
