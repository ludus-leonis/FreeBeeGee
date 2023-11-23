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
import * as Icon from '../../../lib/icon.mjs'
import * as ModalLibrary from '../library/index.mjs'
import * as Mouse from '../mouse/index.mjs'
import * as Room from '../index.mjs'
import * as Selection from '../tabletop/selection.mjs'
import * as WindowLibrary from '../library/editor.mjs'

import { Grab } from '../mouse/Grab.mjs'
import { SelectAndDrag } from '../mouse/SelectAndDrag.mjs'
import { SelectAndProperties } from '../mouse/SelectAndProperties.mjs'

export class Main extends Mode {
  enter () { // initialize UI
    const menu = _('.menu-mode')
    menu.innerHTML = `
      <button id="btn-m" class="btn-icon" title="Measure mode [m]">${Icon.RULER}</button>

      <button id="btn-a" class="btn-icon" title="Open library [l]">${Icon.ADD}</button>
      <button id="btn-e" class="btn-icon" title="Edit [e]">${Icon.EDIT}</button>
      <button id="btn-r" class="btn-icon" title="Rotate [r]">${Icon.ROTATE}</button>
      <button id="btn-f" class="btn-icon" title="Flip [f]">${Icon.FLIP}</button>
      <button id="btn-hash" class="btn-icon" title="Random [#]">${Icon.SHUFFLE}</button>
      <button id="btn-t" class="btn-icon" title="To top [t]">${Icon.TOP}</button>
      <button id="btn-b" class="btn-icon" title="To bottom [b]">${Icon.BOTTOM}</button>
      <button id="btn-c" class="btn-icon" title="Copy [ctrl][c]">${Icon.COPY}</button>
      <button id="btn-del" class="btn-icon" title="Delete [Del]">${Icon.DELETE}</button>
    `

    _('#btn-m').on('click', () => Room.setMode(Room.MODE.MEASURE))

    _('#btn-a').on('click', () => ModalLibrary.open(Room.getViewCenter()))
    _('#btn-e').on('click', () => Selection.edit())
    _('#btn-r').on('click', () => Selection.rotate())
    _('#btn-f').on('click', () => Selection.flip())
    _('#btn-hash').on('click', () => Selection.flipRandom())
    _('#btn-t').on('click', () => Selection.toTop())
    _('#btn-b').on('click', () => Selection.toBottom())
    _('#btn-c').on('click', () => Selection.copy())
    _('#btn-del').on('click', () => Selection.remove())

    Mouse.setButtons(
      new SelectAndDrag(),
      new Grab(),
      new SelectAndProperties()
    )
    Dom.setCursor()

    this.update()
  }

  quit () {
    Selection.clear()
  }

  update () { // update UI, e.g. grey-out states
    // (de)activate menu
    _('.menu-mode button').remove('.disabled')
    _('.menu-mode button').add('.disabled')

    _('#btn-m').remove('.disabled')
    _('#btn-a').remove('.disabled')
    const features = Selection.getFeatures()
    if (features.edit) _('#btn-e').remove('.disabled')
    if (features.rotate) _('#btn-r').remove('.disabled')
    if (features.flip) _('#btn-f').remove('.disabled')
    if (features.random) _('#btn-hash').remove('.disabled')
    if (features.top) _('#btn-t').remove('.disabled')
    if (features.bottom) _('#btn-b').remove('.disabled')
    if (features.clone) _('#btn-c').remove('.disabled')
    if (features.delete) _('#btn-del').remove('.disabled')
  }

  keydown (keydown) { // handle mode-specific hotkeys
    switch (keydown.key) {
      case 'ArrowDown':
        if (keydown.shiftKey) Selection.moveTiles(0, 10); else Selection.moveTiles(0, 1)
        break
      case 'ArrowUp':
        if (keydown.shiftKey) Selection.moveTiles(0, -10); else Selection.moveTiles(0, -1)
        break
      case 'ArrowLeft':
        if (keydown.shiftKey) Selection.moveTiles(-10, 0); else Selection.moveTiles(-1, 0)
        break
      case 'ArrowRight':
        if (keydown.shiftKey) Selection.moveTiles(10, 0); else Selection.moveTiles(1, 0)
        break
      case 'Home':
        if (keydown.shiftKey) Selection.moveTiles(-10, -10); else Selection.moveTiles(-1, -1)
        break
      case 'PageUp':
        if (keydown.shiftKey) Selection.moveTiles(10, -10); else Selection.moveTiles(1, -1)
        break
      case 'End':
        if (keydown.shiftKey) Selection.moveTiles(-10, 10); else Selection.moveTiles(-1, 1)
        break
      case 'PageDown':
        if (keydown.shiftKey) Selection.moveTiles(10, 10); else Selection.moveTiles(1, 1)
        break
      case 'Delete': // delete selected
        Selection.remove()
        break
      case ' ':
        Dom.pointTo(Mouse.getMouseCoords())
        break
      case 'l': // library / add piece
        ModalLibrary.open(Mouse.getMouseCoords())
        break
      case 'L': // library / editor
        WindowLibrary.open(Mouse.getMouseCoords())
        break
      case 'n': // library / add piece
        Dom.createNote(Mouse.getMouseCoords())
        break
      case 'b': // to-bottom
        Selection.toBottom()
        break
      case 't': // to-top
        Selection.toTop()
        break
      case 'a': // select-all
        if (keydown.ctrlKey) Selection.selectAll()
        break
      case 'c': // copy/clone
        if (keydown.ctrlKey) Selection.copy(); else Selection.clone(Mouse.getMouseCoords())
        break
      case 'x': // cut
        if (keydown.ctrlKey) Selection.cut()
        break
      case 'Cut': // dedicated cut key
        Selection.cut()
        break
      case 'v': // paste
        if (keydown.ctrlKey) Selection.paste(Mouse.getMouseCoords())
        break
      case 'Copy': // dedicated copy key
        Selection.copy()
        break
      case 'Paste': // dedicated copy key
        Selection.paste(Mouse.getMouseCoords())
        break
      case 'e': // edit
      case 'F2':
        Selection.edit()
        break
      case 'f': // flip forward
        Selection.flip()
        if (keydown.altKey) Selection.flipRandom(); else Selection.flip()
        break
      case 'F': // flip backward
        Selection.flip(false)
        break
      case '#': // random side
        Selection.flipRandom()
        break
      case 'g': // grid (piece)
        Selection.grid()
        break
      case 'o': // token color
        Selection.toggleColor()
        break
      case 'O': // outline color
        Selection.toggleBorder()
        break
      case 'p': // pile/stack selection
        Selection.pile()
        break
      case 'r': // rotate CW
        if (keydown.altKey) Selection.rotateRandom(); else Selection.rotate()
        break
      case 'R': // rotate CCW
        Selection.rotate(false)
        break
      case '>': // increase No.
        Selection.number(1)
        break
      case '<': // decrease No.
        Selection.number(-1)
        break
      case 'm': // measure/LOS tool
        Room.setMode(Room.MODE.MEASURE)
        break
      default:
        return false // key not handled
    }
    return true // key handled
  }

  mousedown (mousedown) {
    if (mousedown.button === 0 && mousedown.shiftKey) {
      Dom.pointTo(Mouse.getMouseCoords())
      return true
    }
    return false
  }
}

export default Main
