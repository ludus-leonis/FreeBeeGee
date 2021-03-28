/**
 * @file The create-a-table screen.
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

import { createScreen, serverFeedback } from '../screen.js'
import { runError } from './error.js'

import { createTable as stateCreateTable } from './table/state.js'
import { stateGetServerInfo } from '../state.js'
import _ from '../FreeDOM.js'
import { apiGetTemplates, UnexpectedStatus } from '../api.js'
import { navigateToTable } from '../nav.js'

/**
 * Show a create-table dialog.
 *
 * @param {String} name The table name the user entered in the join dialog.
 */
export function createTable (name) {
  if (stateGetServerInfo().freeTables <= 0) {
    runError('NO_SLOT')
    return
  }

  const templateHelp = stateGetServerInfo().snapshotUploads
    ? 'You may also <label for="mode" class="is-link">upload</label> a snapshot instead.'
    : 'Let us know what kind of table we may prepare for you.'

  createScreen(
    'Setup your table',
    `
      <div class="page-create">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <input id="mode" class="mode is-hidden" type="checkbox">
        <p class="is-wrapping">Table <strong>${name}</strong> does not exist yet. It is yours to claim!</p>

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
      ` + (stateGetServerInfo().createPassword ? `
        <label for="password">Password</label>
        <input id="password" type="password" placeholder="* * * * * *">
        <p class="p-small spacing-tiny">This server requires a password to create tables.</p>
      ` : '') + `
        <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Let's play!</a>
      </div>
    `,

    `This server deletes tables after ${stateGetServerInfo().ttl}h of inactivity.`
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
 * Initiates actual table-create after user clicks OK.
 */
function ok (name) {
  const table = {
    name: name
  }

  const password = _('#password').value ?? null
  if (password !== null) {
    table.auth = password
  }

  let snapshot = null
  if (_('#mode').checked) { // upload mode
    const file = _('#uploadFile')
    if (file.value.length > 0) {
      snapshot = file.files[0]
    }
  } else { // exisiting template mode
    table.template = _('#template').value
  }

  stateCreateTable(table, snapshot)
    .then((remoteTable) => {
      navigateToTable(remoteTable.name)
    })
    .catch((error) => {
      console.error(error)
      if (error instanceof UnexpectedStatus) {
        switch (error.status) {
          case 400:
            switch (error.body._error) {
              case 'TEMPLATE_JSON_INVALID_ENGINE':
                serverFeedback(`This template requires engine <strong>${error.body._messages[1]}</strong> and can't be run on this server (engine <strong>${error.body._messages[2]}</strong>). Please choose another template.`)
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'SIZE_EXCEEDED':
                serverFeedback('This template is too large (or we are out of disk space). Please try again later or choose a smaller one.')
                _('#uploadInput').add('.invalid')
                _('#template').add('.invalid').focus()
                break
              case 'ZIP_INVALID':
              case 'TEMPLATE_JSON_INVALID':
              case 'STATE_JSON_INVALID':
              default:
                serverFeedback('This template contains errors and can\'t be added to your table. Please choose another template.')
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
