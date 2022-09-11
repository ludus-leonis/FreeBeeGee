/**
 * @file The create-a-room screen.
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
  iconHelp
} from '../../lib/icons.mjs'

import {
  bytesToIso
} from '../../lib/utils.mjs'

import {
  createScreen,
  serverFeedback
} from '../../view/screen.mjs'

import {
  runError
} from '../../view/error/index.mjs'

import {
  addRoom,
  getServerInfo
} from '../../state/index.mjs'

import {
  DEMO_MODE,
  apiGetTemplates,
  UnexpectedStatus
} from '../../api/index.mjs'

import {
  navigateToRoom
} from '../../app.mjs'

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

  const ttl = getServerInfo().ttl

  createScreen(
    'Create room',
    `
      <div class="page-create">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <input id="mode" class="mode is-hidden" type="checkbox">
        <p class="is-wrapping">
          Room <strong>${name}</strong> does not exist yet. Feel free to create it!
        </p>

        <p class="server-feedback"></p>

        ` + (getServerInfo().createPassword ? `
          <label for="password">Admin password</label>
          <input id="password" type="password" placeholder="* * * * * *">
          <p class="p-small spacing-tiny">
            Only admins can create rooms on this server.
          </p>
        ` : '') + `

        <label class="upload-label" for="uploadFile">Upload snapshot</label>
        <label class="upload-group" for="uploadFile">
          <div id="uploadInput" class="is-input placeholder">Select .zip</div>
          <input id="uploadFile" type="file" accept=".zip", class="is-hidden" />
        </label>
        <p class="upload-text p-small spacing-tiny">
          Got no snapshots? Pick an <label for="mode" class="is-link">existing template</label> instead.
        </p>
        <div id="server-feedback-form"></div>

        <label id="template-label" class="template-label" for="template">Template</label>
        <select id="template" class="template" name="template">
          <option value="RPG" selected>RPG</option>
        </select>
        <p class="template-text p-small spacing-tiny">${templateHelp}</p>

        ` + (!DEMO_MODE ? `
          <input id="enablepassword" class="enablepassword" type="checkbox">
          <label for="enablepassword" class="p-medium">Password-protect room</label>
          <label for="roompwd">Room password</label>
          <input id="roompwd" name="roompwd" type="password">
          <p class="p-small spacing-tiny">
            Will be needed to join. Leave empty for no password.
          </p>
        ` : '') + `

        <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Create</a>
        <p class="p-small is-faded is-center">
          Wrong room? <a href="./">Pick another</a>.
        </p>
      </div>
    `,

    ttl > 0
      ? `This server deletes rooms after ${ttl}h of inactivity.`
      : 'Don\'t forget your room\'s name! You can reopen it later.'
  )

  apiGetTemplates()
    .then(templates => {
      const t = _('#template')

      // determine preselected template (with fallbacks)
      let preselected = templates.length > 0 ? templates[0] : 'none'
      if (templates.includes('Tutorial')) preselected = 'Tutorial'
      if (templates.includes(getServerInfo().defaultTemplate)) preselected = getServerInfo().defaultTemplate

      t.innerHTML = ''
      for (const template of templates) {
        const option = _('option').create(template)
        option.value = template
        if (template === preselected) option.selected = true
        t.add(option)
      }
    })

  _('#mode')
    .on('change', change => {
      reset()
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

  _('#roompwd')
    .on('blur', blur => { _('#roompwd').remove('.invalid') })
    .on('keydown', keydown => { if (keydown.keyCode === 13) validate() && ok(name) })

  _('#ok').on('click', click => { click.preventDefault(); validate() && ok(name) })

  _('#template').focus()
}

/**
 * Reset all error indicators on template<->upload switch.
 */
function reset () {
  _('#template').remove('.invalid')
  _('#uploadInput').remove('.invalid')
  _('.server-feedback').remove('.show')
  _('#server-feedback-form').innerHTML = ''
}

/**
 * Validate file upload.
 */
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

  const roompwd = _('#roompwd').value ?? null
  if (roompwd !== null) {
    room.password = roompwd.trim()
  }

  const password = _('#password').value ?? null
  if (password !== null) {
    room.auth = password.trim()
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

  room.convert = false
  if (_('#server-feedback-form').hasAny('.show')) {
    room.convert = _('#convert').checked
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
              case 'FILE_PERMISSIONS':
                serverFeedback(`
                  FreeBeeGee is missing file-permissions on the server and can't create rooms right now.
                  <span class="is-icon" title="Admins should check '${error.body._messages[0]}' to be writable.">${iconHelp}</span>
                `)
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'INVALID_ENGINE':
                serverFeedback(
                  `This snapshot was created using engine
                    <strong>v${error.body._messages[1]}</strong>. It is
                    not compatible with this server, which runs engine
                    <strong>v${error.body._messages[2]}</strong>.
                    You may try to convert it below.
                  `, '<input id="convert" type="checkbox"><label for="convert" class="p-medium">Try to convert - may loose content.</label>')
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'ROOM_SIZE':
                serverFeedback(`
                  The snapshot is too large. This FreeBeeGee server limits ZIPs and their content to ${bytesToIso(error.body._messages[1])}.
                  <span class="is-icon" title="Admins can change the limit in FBG's server.json.">${iconHelp}</span>
                `)
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'PHP_SIZE':
                serverFeedback(`
                  The snapshot is too large. The current limit is ${bytesToIso(error.body._messages[1])}.
                  <span class="is-icon" title="Admins should check the php.ini upload settings.">${iconHelp}</span>
                `)
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'ZIP_INVALID':
              case 'TEMPLATE_JSON_INVALID':
              case 'STATE_JSON_INVALID':
              default:
                serverFeedback('The selected snapshot contains errors and can\'t be loaded.')
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
            serverFeedback(`
              The snapshot is too large. It was rejeced by the webserver (or a proxy).
              <span class="is-icon" title="This is not an FBG issue. Admins should check the server's httpd.conf file.">${iconHelp}</span>
            `)
            _('#uploadInput').add('.invalid')
            _('#template').add('.invalid').focus()
            break
          case 503:
            runError('FULL')
            break
          default:
            runError('BUG', error)
        }
      }
    })
}
