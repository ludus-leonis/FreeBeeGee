/**
 * @file Send keyboard/shortcut events to the proper functions.
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

import _ from '../../lib/FreeDOM.mjs'

import {
  setTableNo
} from '../../state/index.mjs'

import {
  modalActive,
  modalClose
} from '../../view/modal.mjs'

import {
  toggleLayer,
  toggleGrid,
  toggleLos
} from '../../view/room/index.mjs'

import {
  settings,
  rotateSelected,
  deleteSelected,
  cloneSelected,
  editSelected,
  flipSelected,
  toTopSelected,
  randomSelected,
  numberSelected,
  createNote,
  cycleColor,
  toBottomSelected,
  pointTo
} from '../../view/room/tabletop/index.mjs'

import {
  isDragging,
  isLMBLos,
  release,
  getMouseCoords
} from '../../view/room/mouse/index.mjs'

import {
  touch
} from '../../view/room/sync.mjs'

import {
  modalLibrary
} from '../../view/room/modal/library.mjs'

import {
  modalHelp
} from '../../view/room/modal/help.mjs'

import {
  toggleFullscreen
} from '../../lib/utils.mjs'

/** register the keyboard handler on document load */
document.addEventListener('keydown', keydown => handleRoomKeys(keydown))

/**
 * Call proper functions after certain keys are pressed.
 *
 * @param {KeyboardEvent} keydown The triggering event.
 * @return {Boolean} True if we could handle the event, false if it should bubble.
 */
function handleRoomKeys (keydown) {
  if (!_('#tabletop').exists()) return

  touch()

  if (keydown.key === 'Escape') { // close modals on ESC
    if (modalActive()) {
      modalClose()
      keydown.stopPropagation()
      return
    }
  }

  if (isDragging() && !modalActive()) { // keys that work while dragging
    switch (keydown.key) {
      case ' ':
        if (isLMBLos(true)) release(0)
        keydown.stopPropagation()
        keydown.preventDefault()
        return
    }
  }

  if (!isDragging() && !modalActive()) { // keys that don't work while dragging
    switch (keydown.key) {
      case 'Delete': // delete selected
        deleteSelected()
        break
      case ' ':
        pointTo(getMouseCoords())
        break
      case '1': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(1); else toggleLayer('other')
        break
      case '2': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(2); else toggleLayer('token')
        break
      case '3': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(3); else toggleLayer('overlay')
        break
      case '4': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(4); else toggleLayer('tile')
        break
      case '5': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(5)
        break
      case '6': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(6)
        break
      case '7': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(7)
        break
      case '8': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(8)
        break
      case '9': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(9)
        break
      case 'l': // library / add piece
        modalLibrary(getMouseCoords())
        break
      case 'n': // library / add piece
        createNote(getMouseCoords())
        break
      case 'b': // to-bottom
        toBottomSelected()
        break
      case 't': // to-top
        toTopSelected()
        break
      case 'c': // copy/clone
        cloneSelected(getMouseCoords())
        break
      case 'e': // edit
      case 'F2':
        editSelected()
        break
      case 'F11':
        toggleFullscreen()
        break
      case 'f': // flip forward
        flipSelected()
        break
      case 'F': // flip backward
        flipSelected(false)
        break
      case 'g': // grid
        toggleGrid()
        break
      case 'o': // token color
        cycleColor(false)
        break
      case 'O': // outline color
        cycleColor(true)
        break
      case 'h': // help
      case 'H':
      case '?':
      case 'F1':
        modalHelp()
        break
      case 'r': // rotate CW
        rotateSelected()
        break
      case 'R': // rotate CCW
        rotateSelected(false)
        break
      case 'm': // measure/LOS tool
        toggleLos()
        break
      case 'S': // settings
        settings()
        break
      case '#': // random side
        randomSelected()
        break
      case '>': // increase No.
        numberSelected(1)
        break
      case '<': // decrease No.
        numberSelected(-1)
        break
      default:
        return // nothing in the switch() triggered
    }
    keydown.stopPropagation()
    keydown.preventDefault()
  }
}
