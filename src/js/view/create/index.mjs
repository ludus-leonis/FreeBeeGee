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
    'Open new room',
    `
      <div class="page-create">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <input id="mode" class="mode is-hidden" type="checkbox">
        <p class="is-wrapping">Room <strong>${name}</strong> does not exist yet. Feel free to open it!</p>

        <p class="server-feedback"></p>

        <label class="upload-label" for="uploadFile">Upload snapshot</label>
        <label class="upload-group" for="uploadFile">
          <div id="uploadInput" class="is-input placeholder">Select .zip</div>
          <input id="uploadFile" type="file" accept=".zip", class="is-hidden" />
        </label>
        <p class="upload-text p-small spacing-tiny">Got no snapshots? Pick an <label for="mode" class="is-link">existing template</label> instead.</p>
        <div id="server-feedback-form"></div>

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

    ttl > 0
      ? `This server deletes rooms after ${ttl}h of inactivity.`
      : 'Don\'t forget your room\'s name! You can reopen it later.'
  )

  apiGetTemplates()
    .then(templates => {
      const t = _('#template')
      t.innerHTML = ''
      for (const template of templates) {
        const option = _('option').create(template)
        option.value = template
        if (template === 'Tutorial') option.selected = true
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
  _('#ok').on('click', click => { click.preventDefault(); validate() && ok(name) })

  _('#template').focus()
}

/**
 * Reset all error indicators on template<->upload switch.
 */
function reset () {
  console.log('reset')
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
                  The snapshot is too large. This FreeBeeGee server limits ZIPs and their content to ${error.body._messages[1]}MB.
                  <span class="is-icon" title="Admins can change the limit in FBG's server.json.">${iconHelp}</span>
                `)
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'PHP_SIZE':
                serverFeedback(`
                  The snapshot is too large. Limit is ${error.body._messages[1] / 1024 / 1024}MB.
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
            runError('UNEXPECTED', error)
        }
      }
    })
}
