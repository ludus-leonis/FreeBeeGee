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
import Browser from '../../lib/util-browser.mjs'
import Content from '../../view/room/tabletop/content.mjs'
import Dom from '../../view/room/tabletop/dom.mjs'
import Event from '../../lib/event.mjs'
import Modal from '../../view/room/modal.mjs'
import ModalHelp from '../../view/room/modal/help.mjs'
import ModalLibrary from '../../view/room/library/index.mjs'
import ModalSettings from '../../view/room/modal/settings.mjs'
import Mouse from '../../view/room/mouse/index.mjs'
import Room from '../../view/room/index.mjs'
import Selection from '../../view/room/tabletop/selection.mjs'
import State from '../../state/index.mjs'
import Sync from '../../view/room/sync.mjs'
import Window from '../../view/room/window.mjs'
import WindowLibrary from '../../view/room/library/editor.mjs'

// -----------------------------------------------------------------------------

/** register the keyboard handler on document load */
document.addEventListener('keydown', keydown => handleRoomKeys(keydown))

// -----------------------------------------------------------------------------

/**
 * Call proper functions after certain keys are pressed.
 *
 * @param {KeyboardEvent} keydown The triggering event.
 */
function handleRoomKeys (keydown) {
  if (!_('#tabletop').exists()) return

  Sync.touch()

  if (keydown.key === 'Escape') { // close modals on ESC
    if (Modal.isOpen()) {
      Modal.close()
      keydown.stopPropagation()
      return
    } else if (Window.isOpen()) {
      Window.close()
      keydown.stopPropagation()
      return
    }
  }

  if (Mouse.isDragging() && !Modal.isOpen() && !Window.isOpen()) { // keys that work while dragging
    switch (keydown.key) {
      case ' ':
        if (Mouse.isLMBLos(true)) Mouse.release(0)
        keydown.stopPropagation()
        keydown.preventDefault()
        return
    }
  }

  if (!Mouse.isDragging() && !Modal.isOpen() && Window.isOpen()) { // keys for the library window
    switch (keydown.key) {
      case 'e': // edit
      case 'F2':
        Event.trigger(Event.HOOK.LIBRARY_EDIT)
        break
    }
    return
  }

  if (!Mouse.isDragging() && !Modal.isOpen() && !Window.isOpen()) { // keys that don't work while dragging
    if (keydown.repeat) { // prevent key-repeat on held keys
      keydown.stopPropagation()
      keydown.preventDefault()
      return
    }

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
      case '1': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(1); else Room.toggleLayer(Content.LAYER.OTHER)
        break
      case '2': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(2); else Room.toggleLayer(Content.LAYER.TOKEN)
        break
      case '3': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(3); else Room.toggleLayer(Content.LAYER.STICKER)
        break
      case '4': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(4); else Room.toggleLayer(Content.LAYER.TILE)
        break
      case '5': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(5)
        break
      case '6': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(6)
        break
      case '7': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(7)
        break
      case '8': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(8)
        break
      case '9': // toggle layer, switch table
        if (keydown.ctrlKey | keydown.altKey) State.setTableNo(9)
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
        if (keydown.ctrlKey) {
          Selection.copy()
          Selection.remove()
        }
        break
      case 'v': // paste
        if (keydown.ctrlKey) Selection.paste(Mouse.getMouseCoords())
        break
      case 'Copy': // dedicated copy key
        Selection.copy()
        break
      case 'Cut': // dedicated cut key
        Selection.copy()
        Selection.remove()
        break
      case 'Paste': // dedicated copy key
        Selection.paste(Mouse.getMouseCoords())
        break
      case 'u': // undo
      case 'z': // undo
        if (keydown.ctrlKey) State.undo()
        break
      case 'Undo': // dedicated undo key
        State.undo()
        break
      case 'e': // edit
      case 'F2':
        Selection.edit()
        break
      case 'F11':
        Browser.toggleFullscreen()
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
      case 'G': // grid (table)
        Room.toggleGrid()
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
      // case 'P': // pile/stack selection + randomize
      //   Selection.pile(true)
      //   break
      case 'h': // help
      case 'H':
      case '?':
      case 'F1':
      case 'Help':
        ModalHelp.open()
        break
      case 'r': // rotate CW
        if (keydown.altKey) Selection.rotateRandom(); else Selection.rotate()
        break
      case 'R': // rotate CCW
        Selection.rotate(false)
        break
      case 'm': // measure/LOS tool
        Room.toggleLos()
        break
      case 'S': // settings
        ModalSettings.open()
        break
      case '+': // zoom in
      case '=':
      case 'ZoomIn':
        Dom.zoom(1)
        break
      case '-': // zoom out
      case 'ZoomOut':
        Dom.zoom(-1)
        break
      case '>': // increase No.
        Selection.number(1)
        break
      case '<': // decrease No.
        Selection.number(-1)
        break
      default:
        return // nothing in the switch() triggered
    }
    keydown.stopPropagation()
    keydown.preventDefault()
  }
}
