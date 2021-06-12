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
  outlineSelected,
  toBottomSelected,
  toggleLayer
} from '.'
import {
  isDragging,
  getMouseTileX,
  getMouseTileY
} from './mouse.js'
import {
  touch
} from './sync.js'
import {
  setStateNo
} from './state.js'
import {
  modalActive,
  modalClose
} from '../../modal.js'
import {
  modalLibrary
} from './modals/library.js'
import {
  modalHelp
} from './modals/help.js'
import _ from '../../FreeDOM.js'

/** register the keyboard handler on document load */
document.addEventListener('keydown', keydown => handleTableKeys(keydown))

/**
 * Call proper functions after certain keys are pressed.
 *
 * @param {KeyboardEvent} keydown The triggering event.
 * @return {Boolean} True if we could handle the event, false if it should bubble.
 */
function handleTableKeys (keydown) {
  if (!_('#tabletop').exists()) return

  touch()

  if (keydown.key === 'Escape') { // close modals on ESC
    if (modalActive()) {
      modalClose()
      keydown.stopPropagation()
      return
    }
  }

  if (!isDragging() && !modalActive()) {
    switch (keydown.key) {
      case 'Delete': // delete selected
        deleteSelected()
        break
      case '1': // toggle layer
        if (keydown.ctrlKey | keydown.altKey) setStateNo(1); else toggleLayer('other')
        break
      case '2': // toggle layer
        if (keydown.ctrlKey | keydown.altKey) setStateNo(2); else toggleLayer('token')
        break
      case '3': // toggle layer
        if (keydown.ctrlKey | keydown.altKey) setStateNo(3); else toggleLayer('overlay')
        break
      case '4': // toggle layer
        if (keydown.ctrlKey | keydown.altKey) setStateNo(4); else toggleLayer('tile')
        break
      case 'l': // library / add piece
        modalLibrary(getMouseTileX(), getMouseTileY())
        break
      case 'n': // library / add piece
        createNote(getMouseTileX(), getMouseTileY())
        break
      case 'b': // to-bottom
        toBottomSelected()
        break
      case 't': // to-top
        toTopSelected()
        break
      case 'c': // copy/clone
        cloneSelected(getMouseTileX(), getMouseTileY())
        break
      case 'e': // edit
      case 'F2':
        editSelected()
        break
      case 'f': // flip
        flipSelected()
        break
      case 'o': // color/outline selected
        outlineSelected()
        break
      case 'h': // help
      case 'H':
      case '?':
      case 'F1':
        modalHelp()
        break
      case 'r': // rotate
        rotateSelected()
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
