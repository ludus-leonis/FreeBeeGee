/**
 * @file Send keyboard/shortcut events to the proper functions.
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

import _ from '../../lib/FreeDOM.mjs'

import {
  setTableNo
} from '../../state/index.mjs'

import {
  isModalActive,
  modalClose
} from '../../view/room/modal.mjs'

import {
  isWindowActive,
  closeWindow
} from '../../view/room/window.mjs'

import {
  toggleLayer,
  toggleGrid,
  toggleLos
} from '../../view/room/index.mjs'

import {
  settings,
  clipboardPaste,
  rotateSelected,
  deleteSelected,
  cloneSelected,
  editSelected,
  flipSelected,
  toTopSelected,
  randomSelected,
  numberSelected,
  moveSelected,
  createNote,
  colorSelected,
  pileSelected,
  toBottomSelected,
  pointTo,
  undo,
  zoom
} from '../../view/room/tabletop/index.mjs'

import {
  LAYER_TILE,
  LAYER_OVERLAY,
  LAYER_TOKEN,
  LAYER_OTHER
} from '../../view/room/tabletop/tabledata.mjs'

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
} from '../../view/room/library/index.mjs'

import {
  modalLibraryManager
} from '../../view/room/library/editor.mjs'

import {
  modalHelp
} from '../../view/room/modal/help.mjs'

import {
  HOOK_LIBRARY_EDIT,
  triggerEvent
} from '../../lib/events.mjs'

import {
  clipboardCopy,
  selectionAddAll
} from '../../view/room/tabletop/selection.mjs'

import {
  toggleFullscreen
} from '../../lib/utils-html.mjs'

/** register the keyboard handler on document load */
document.addEventListener('keydown', keydown => handleRoomKeys(keydown))

/**
 * Call proper functions after certain keys are pressed.
 *
 * @param {KeyboardEvent} keydown The triggering event.
 */
function handleRoomKeys (keydown) {
  if (!_('#tabletop').exists()) return

  touch()

  if (keydown.key === 'Escape') { // close modals on ESC
    if (isModalActive()) {
      modalClose()
      keydown.stopPropagation()
      return
    } else if (isWindowActive()) {
      closeWindow()
      keydown.stopPropagation()
      return
    }
  }

  if (isDragging() && !isModalActive() && !isWindowActive()) { // keys that work while dragging
    switch (keydown.key) {
      case ' ':
        if (isLMBLos(true)) release(0)
        keydown.stopPropagation()
        keydown.preventDefault()
        return
    }
  }

  if (!isDragging() && !isModalActive() && isWindowActive()) { // keys for the library window
    switch (keydown.key) {
      case 'e': // edit
      case 'F2':
        triggerEvent(HOOK_LIBRARY_EDIT)
        break
    }
    return
  }

  if (!isDragging() && !isModalActive() && !isWindowActive()) { // keys that don't work while dragging
    if (keydown.repeat) { // prevent key-repeat on held keys
      keydown.stopPropagation()
      keydown.preventDefault()
      return
    }

    switch (keydown.key) {
      case 'ArrowDown':
        if (keydown.shiftKey) moveSelected(0, 10); else moveSelected(0, 1)
        break
      case 'ArrowUp':
        if (keydown.shiftKey) moveSelected(0, -10); else moveSelected(0, -1)
        break
      case 'ArrowLeft':
        if (keydown.shiftKey) moveSelected(-10, 0); else moveSelected(-1, 0)
        break
      case 'ArrowRight':
        if (keydown.shiftKey) moveSelected(10, 0); else moveSelected(1, 0)
        break
      case 'Home':
        if (keydown.shiftKey) moveSelected(-10, -10); else moveSelected(-1, -1)
        break
      case 'PageUp':
        if (keydown.shiftKey) moveSelected(10, -10); else moveSelected(1, -1)
        break
      case 'End':
        if (keydown.shiftKey) moveSelected(-10, 10); else moveSelected(-1, 1)
        break
      case 'PageDown':
        if (keydown.shiftKey) moveSelected(10, 10); else moveSelected(1, 1)
        break
      case 'Delete': // delete selected
        deleteSelected()
        break
      case ' ':
        pointTo(getMouseCoords())
        break
      case '1': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(1); else toggleLayer(LAYER_OTHER)
        break
      case '2': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(2); else toggleLayer(LAYER_TOKEN)
        break
      case '3': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(3); else toggleLayer(LAYER_OVERLAY)
        break
      case '4': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) setTableNo(4); else toggleLayer(LAYER_TILE)
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
      case 'L': // library / editor
        modalLibraryManager(getMouseCoords())
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
      case 'a': // copy/clone
        if (keydown.ctrlKey) selectionAddAll()
        break
      case 'c': // copy/clone
        if (keydown.ctrlKey) clipboardCopy(); else cloneSelected(getMouseCoords())
        break
      case 'x': // paste
        if (keydown.ctrlKey) {
          clipboardCopy()
          deleteSelected()
        }
        break
      case 'v': // paste
        if (keydown.ctrlKey) clipboardPaste(getMouseCoords())
        break
      case 'u': // undo
      case 'z': // undo
        if (keydown.ctrlKey) undo()
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
        colorSelected(false)
        break
      case 'O': // outline color
        colorSelected(true)
        break
      case 'p': // pile/stack selection
        pileSelected(false)
        break
      // case 'P': // pile/stack selection + randomize
      //   pileSelected(true)
      //   break
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
      case '+': // zoom in
      case '=':
        zoom(1)
        break
      case '-': // zoom out
        zoom(-1)
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
