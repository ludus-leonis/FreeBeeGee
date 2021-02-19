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
  rotateSelected,
  deleteSelected,
  cloneSelected,
  editSelected,
  flipSelected,
  toTopSelected,
  toBottomSelected,
  toggleLayer
} from '.'
import { isDragging, getMouseTileX, getMouseTileY } from './mouse.js'
import { modalActive } from '../../modal.js'
import { modalLibrary } from './modals/library.js'
import { modalHelp } from './modals/help.js'
import _ from '../../FreeDOM.js'

/** register the keyboard handler on document load */
document.addEventListener('keydown', function (keydown) {
  if (handleGameKeys(keydown)) {
    keydown.preventDefault()
  }
})

/**
 * Call proper functions after certain keys are pressed.
 *
 * @param {KeyboardEvent} keydown The triggering event.
 * @return {Boolean} True if we could handle the event, false if it should bubble.
 */
function handleGameKeys (keydown) {
  if (!_('#tabletop').exists()) return false
  if (!isDragging() && !modalActive()) {
    switch (keydown.keyCode) {
      case 46: // DEL - delete selected
        deleteSelected()
        break
      case 49: // 1 - toggle layer
        toggleLayer('token')
        break
      case 50: // 2 - toggle layer
        toggleLayer('overlay')
        break
      case 51: // 3 - toggle layer
        toggleLayer('tile')
        break
      case 65: // a - add pice
        modalLibrary(getMouseTileX(), getMouseTileY())
        break
      case 66: // b - to-bottom
        toBottomSelected()
        break
      case 67: // c - copy/clone
        cloneSelected(getMouseTileX(), getMouseTileY())
        break
      case 69: // e - edit
      case 113: // F2
        editSelected()
        break
      case 70: // f - flip
        flipSelected()
        break
      case 72: // h - help
      case 112: // F1
        modalHelp()
        break
      case 82: // r - rotate
        rotateSelected()
        break
      case 84: // t - to-top
        toTopSelected()
        break
      default:
        return false // nothing in the switch() triggered
    }
    return true // something in the switch() triggered
  }
  return false // if nothing above triggered, we did not handle the key
}
