/**
 * @file Handles dynamic stuff on the tools page
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

import * as bcrypt from 'bcryptjs'

import _ from 'lib/FreeDOM.mjs'

export function setupBcrypt () {
  _('#tool-bcrypt').innerHTML = `
    <p class="spacing-none">
      Use the form below to generate a bcrypt password hash for your <code>server.json</code>.
      Everything will happen only in your browser, your password is <strong>not sent anywhere</strong>.
    </p>
    <form class="container modal-edit modal-edit-token">
      <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
      <div class="row">
        <div class="col-12">
          <label for="tool-in1">Your password</label>
          <input id="tool-in1" name="tool-in1" type="password">
        </div>
        <div class="col-12">
          <label for="tool-in2">Your password (again)</label>
          <input id="tool-in2" name="tool-in2" type="password">
        </div>
        <div class="col-12">
          <label for="tool-out">Your bcrypt password</label>
          <input id="tool-out" name="tool-out" type="text" readonly>
        </div>
      </div>
    </form>
    <p class="p-small">
      Hint: The same password will create different hashes every time you type it. That's ok.
    </p>
  `

  _('#tool-in1').on('change', change => hash())
  _('#tool-in1').on('keyup', keyup => hash())
  _('#tool-in2').on('change', change => hash())
  _('#tool-in2').on('keyup', keyup => hash())
}

function hash () {
  const in1 = _('#tool-in1').value.trim()
  const in2 = _('#tool-in2').value.trim()

  if (in1 === in2 && in1.length > 0) {
    _('#tool-out').value = bcrypt.hashSync(in1, 12)
  } else {
    _('#tool-out').value = ''
  }
}
