/**
 * @file Handles the main tabletop game mode.
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

import _ from '../../../lib/FreeDOM.mjs'
import { Mode } from './_Mode.mjs'
import Icon from '../../../lib/icon.mjs'
import Mouse from '../mouse/index.mjs'
import Room from '../index.mjs'
import { Grab } from '../mouse/Grab.mjs'
import { Los } from '../mouse/Los.mjs'

export class Measure extends Mode {
  enter () { // initialize UI
    const menu = _('.menu-mode')
    menu.innerHTML = `
      <button id="btn-m" class="btn-icon" title="Play mode [m]">${Icon.BALL}</button>
    `

    _('#btn-m').on('click', () => Room.setMode(Room.MODE.MAIN))

    Mouse.setButtons(
      new Los(),
      new Grab(),
      null
    )
    Room.setCursor('.cursor-cross')

    this.update()
  }

  quit () {
  }

  update () { // update UI, e.g. grey-out states
    // (de)activate menu
    _('.menu-mode button').remove('.disabled')
    _('.menu-mode button').add('.disabled')
    _('#btn-m').remove('.disabled')
  }

  keydown (keydown) {
    switch (keydown.key) {
      case 'm': // back to main mode
        Room.setMode(Room.MODE.MAIN)
        break
      default:
        return false // key not handled
    }
    return true // key handled
  }

  mousedown (mousedown) {
    return false
  }
}

export default Measure
