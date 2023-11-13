/**
 * @file The setup-a-room screen.
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
import Api from '../api/index.mjs'
import App from '../app.mjs'
import Error from './error.mjs'
import Icon from '../lib/icon.mjs'
import Screen from '../lib/screen.mjs'
import State from '../state/index.mjs'
import Text from '../lib/util-text.mjs'

// -----------------------------------------------------------------------------

export default {
  show
}

// -----------------------------------------------------------------------------

/**
 * Show a setup-room dialog.
 *
 * @param {string} name The room name the user entered in the join dialog.
 */
function show (name) {
  if (State.getServerInfo().freeRooms <= 0) {
    Error.runError('NO_SLOT')
    return
  }

  const snapshotHelp = State.getServerInfo().snapshotUploads
    ? 'You may also <label for="mode" class="is-link">upload</label> a snapshot instead.'
    : 'Let us know what game we may prepare for you.'

  const ttl = State.getServerInfo().ttl

  Screen.create(
    'Set up room',
    `
      <div class="page-setup">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <input id="mode" class="mode is-hidden" type="checkbox">
        <p class="is-wrapping">
          Room <strong>${name}</strong> does not exist yet. Feel free to set it up!
        </p>

        <p class="server-feedback"></p>

        ` + (State.getServerInfo().createPassword
      ? `
          <label for="password">Admin password</label>
          <input id="password" type="password" placeholder="* * * * * *">
          <p class="p-small spacing-tiny">
            Only admins can set up rooms on this server.
          </p>
        `
      : '') + `

        <label class="upload-label" for="uploadFile">Upload snapshot</label>
        <label class="upload-group" for="uploadFile">
          <div id="uploadInput" class="is-input placeholder">Select .zip</div>
          <input id="uploadFile" type="file" accept=".zip", class="is-hidden" />
        </label>
        <p class="upload-text p-small spacing-tiny">
          Got no snapshots? <label for="mode" class="is-link">Pick an existing</label> instead.
        </p>
        <div id="server-feedback-form"></div>

        <label id="snapshot-label" class="snapshot-label" for="snapshot">Snapshot</label>
        <select id="snapshot" class="snapshot" name="snapshot">
          <option value="RPG" selected>RPG</option>
        </select>
        <p class="snapshot-text p-small spacing-tiny">${snapshotHelp}</p>

        ` + (!State.SERVERLESS
      ? `
          <input id="enablepassword" class="enablepassword" type="checkbox">
          <label for="enablepassword" class="p-medium">Password-protect room</label>
          <label for="roompwd">Room password</label>
          <input id="roompwd" name="roompwd" type="password">
          <p class="p-small spacing-tiny">
            Will be needed to join. Leave empty for no password.
          </p>
        `
      : '') + `

        <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">OK</a>
        <p class="p-small is-faded is-center">
          Wrong room? <a href="./">Pick another</a>.
        </p>
      </div>
    `,

    ttl > 0
      ? `This server deletes rooms after ${Text.hoursToTimespan(ttl)} of inactivity.`
      : 'Don\'t forget your room\'s name! You can reopen it later.'
  )

  Api.getSnapshots()
    .then(snapshots => {
      const t = _('#snapshot')

      // determine preselected snapshot (with fallbacks)
      let preselected = snapshots.length > 0 ? snapshots[0].name : 'none'
      if (snapshots.find(s => s.name === 'Tutorial')) preselected = 'Tutorial'
      if (snapshots.find(s => s.name === State.getServerInfo().defaultSnapshot)) preselected = State.getServerInfo().defaultSnapshot
      if (snapshots.find(s => s.name === State.getServerPreference(State.PREF.SNAPSHOT))) preselected = State.getServerPreference(State.PREF.SNAPSHOT)

      t.innerHTML = ''
      for (const snapshot of Text.sortString(snapshots ?? [], 'name')) {
        const option = _('option').create(snapshot.name + (snapshot.system ? '' : ' (custom)'))
        option.value = snapshot.name
        if (snapshot.name === preselected) option.selected = true
        t.add(option)
      }
      if (snapshots.length <= 0) {
        const option = _('option').create('(no snapshots available)')
        option.value = 'NO_SNAPSHOT'
        option.selected = true
        t.add(option)
        _('.server-feedback').add('.show').innerHTML = `
          There are no snapshots available on this server.
          <span class="is-icon" title="Admins should check if the data/ directory is empty.">${Icon.HELP}</span>
        `
      }
    })

  _('#mode')
    .on('change', change => {
      reset()
    })

  _('#snapshot')
    .on('change', change => { _('#snapshot').remove('.invalid') })

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

  _('#snapshot').focus()
}

/**
 * Reset all error indicators on snapshot<->upload switch.
 */
function reset () {
  _('#snapshot').remove('.invalid')
  _('#uploadInput').remove('.invalid')
  _('.server-feedback').remove('.show')
  _('#server-feedback-form').innerHTML = ''
}

/**
 * Validate file upload.
 *
 * @returns {boolean} True if validation passes.
 */
function validate () {
  if (_('#mode').checked) { // upload mode
    if (_('#uploadFile').value.length <= 0) {
      _('#uploadInput').add('.invalid')
      return false
    }
    return true
  } else { // exisiting snapshot mode
    if (_('#snapshot').value === 'NO_SNAPSHOT') {
      return false
    }
    return true // checks handled by html input
  }
}

/**
 * Initiates actual room-setup after user clicks OK.
 *
 * @param {string} name The room's name.
 */
function ok (name) {
  _('#ok').add('.is-spinner')

  const room = {
    name
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
  } else { // exisiting snapshot mode
    room.snapshot = _('#snapshot').value
  }

  room.convert = false
  if (_('#server-feedback-form').hasAny('.show')) {
    room.convert = _('#convert').checked
  }

  State.addRoom(room, snapshot)
    .then((remoteRoom) => {
      if (!_('#mode').checked) { // not upload mode
        State.setServerPreference(State.PREF.SNAPSHOT, room.snapshot)
      }
      App.navigateToRoom(remoteRoom.name)
    })
    .catch((error) => {
      console.error(error)
      _('#ok').remove('.is-spinner')
      if (error instanceof Api.UnexpectedStatus) {
        switch (error.status) {
          case 400:
            switch (error.body._error) {
              case 'FILE_PERMISSIONS':
                serverFeedback(`
                  FreeBeeGee is missing file-permissions on the server and can't set up new rooms right now.
                  <span class="is-icon" title="Admins should check '${error.body._messages[0]}' to be writable.">${Icon.HELP}</span>
                `)
                _('#uploadInput').add('.invalid')
                _('#snapshot').add('.invalid').focus()
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
                _('#snapshot').add('.invalid').focus()
                break
              case 'ROOM_SIZE':
                serverFeedback(`
                  The snapshot is too large. This FreeBeeGee server limits ZIPs and their content to ${Text.bytesToIso(error.body._messages[1])}.
                  <span class="is-icon" title="Admins can change the limit in FBG's server.json.">${Icon.HELP}</span>
                `)
                _('#uploadInput').add('.invalid')
                _('#snapshot').add('.invalid').focus()
                break
              case 'PHP_SIZE':
                serverFeedback(`
                  The snapshot is too large. The current limit is ${Text.bytesToIso(error.body._messages[1])}.
                  <span class="is-icon" title="Admins should check the php.ini upload settings.">${Icon.HELP}</span>
                `)
                _('#uploadInput').add('.invalid')
                _('#snapshot').add('.invalid').focus()
                break
              case 'ZIP_INVALID':
              case 'SETUP_JSON_INVALID':
              case 'STATE_JSON_INVALID':
              default:
                serverFeedback('The selected snapshot contains errors and can\'t be loaded.')
                console.error(error.body._messages)
                _('#uploadInput').add('.invalid')
                _('#snapshot').add('.invalid').focus()
                break
            }
            break
          case 401:
            _('#password').add('.invalid').focus().value = ''
            break
          case 413:
            serverFeedback(`
              The snapshot is too large. It was rejeced by the webserver (or a proxy).
              <span class="is-icon" title="This is not an FBG issue. Admins should check the server's httpd.conf file.">${Icon.HELP}</span>
            `)
            _('#uploadInput').add('.invalid')
            _('#snapshot').add('.invalid').focus()
            break
          case 503:
            Error.runError('FULL')
            break
          default:
            Error.runError('BUG', error)
        }
      }
    })
}

/**
 * Show a server feedback (error message).
 *
 * @param {string} message Message to show.
 * @param {string} form HTML form to add.
 */
function serverFeedback (message, form) {
  _('.server-feedback').remove('.show')
  _('#server-feedback-form').remove('.show')

  _('.server-feedback').add('.show').innerHTML = message
  if (form) {
    _('#server-feedback-form').add('.show').innerHTML = form
  }
}
