/**
 * @file The create-a-game screen.
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
import { runError } from './error.js'

import { createGame as stateCreateGame } from './game/state.js'
import { stateGetServerInfo } from '../state.js'
import _ from '../FreeDOM.js'
import { apiGetTemplates } from '../api.js'

/**
 * Show a create-game dialog.
 *
 * @param {String} name The game name the user entered in the join dialog.
 */
export function createGame (name) {
  if (stateGetServerInfo().openSlots <= 0) {
    runError(3)
    return
  }

  createScreen(
    'Create your game',
    `
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <p class="is-wrapping">The game <strong>${name}</strong> does not exist yet. Go ahead and create it!</p>
    ` + (stateGetServerInfo().createPassword ? `
      <label for="password">Password</label>
      <input id="password" type="password" placeholder="* * * * * *">
      <p class="p-small spacing-tiny">This server requires a password to create new games.</p>
    ` : '') + `
      <label for="template">Template</label>
      <select id="template" name="template">
        <option value="RPG" selected>RPG</option>
      </select>
      <p class="p-small spacing-tiny">Let us know what we may pre-setup for you and what pieces you'll need.</p>

      <label for="size">Table size</label>
      <select id="size" name="size">
        <option value="1">48x24 - cosy</option>
        <option value="2" selected>62x32 - default</option>
        <option value="3">64x64 - maximum</option>
      </select>
      <p class="p-small spacing-tiny">Bigger isn't always better. But don't worry – you can change this later, too.</p>

      <a id="ok" class="btn btn-wide btn-primary spacing-medium" href="#">Create</a>
    `,

    `This server deletes games after ${stateGetServerInfo().ttl}h of inactivity.`
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

  _('#password').on('blur', blur => { _('#password').remove('.invalid') })
  _('#ok').on('click', click => { click.preventDefault(); ok(name) })
}

/**
 * Initiates actual game-create after user clicks OK.
 */
function ok (name) {
  const game = {
    name: name
  }

  switch (_('#size').value) {
    case '1':
      game.width = 48
      game.height = 24
      break
    case '3':
      game.width = 62
      game.height = 32
      break
    case '2':
    default:
      game.width = 64
      game.height = 64
  }

  game.template = _('#template').value

  const password = _('#password').value ?? null
  if (password !== null) {
    game.auth = password
  }

  stateCreateGame(game)
    .then((remoteGame) => {
      document.location = './#/game/' + remoteGame.name
    })
    .catch((error) => {
      if (error.message.includes('401')) {
        const p = _('#password')
        p.value = ''
        p.add('.invalid')
        p.focus()
      } if (error.message.includes('503')) {
        runError(2)
      } else {
        console.error('unexpected error:')
        console.error(error.message)
      }
    })
}
