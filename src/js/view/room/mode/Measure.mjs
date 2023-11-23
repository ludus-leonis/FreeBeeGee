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
import * as Dom from '../tabletop/dom.mjs'
import * as Mouse from '../mouse/index.mjs'
import * as Room from '../index.mjs'
import { Grab } from '../mouse/Grab.mjs'
import { Los } from '../mouse/Los.mjs'

export class Measure extends Mode {
  enter () { // initialize UI
    const menu = _('.menu-mode')
    menu.innerHTML = ''

    Mouse.setButtons(
      new Los(),
      new Grab(),
      null
    )
    Dom.setCursor('.cursor-cross')

    this.update()
  }

  quit () {
  }

  update () { // update UI, e.g. grey-out states
    // (de)activate menu
    _('.menu-mode button').remove('.disabled')
    _('.menu-mode button').add('.disabled')
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

  keydrag (keydown) {
    switch (keydown.key) {
      case ' ': // put los line on table
        Mouse.release(0)
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
