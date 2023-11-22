/**
 * @file Handles moving around stuff on the tabletop, plus selection states.
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
import { Grab } from './Grab.mjs'
import Popup from '../../../view/room/tabletop/popup.mjs'
import Room from '../../../view/room/index.mjs'
import { SelectAndDrag } from './SelectAndDrag.mjs'
import { SelectAndProperties } from './SelectAndProperties.mjs'
import Sync from '../../../view/room/sync.mjs'

// -----------------------------------------------------------------------------

export default {
  enableDragAndDrop,
  getMouseCoords,
  isDragging,
  release,
  setButtons
}

// -----------------------------------------------------------------------------

/**
 * Determine if user is currently dropping (move while mouse button down) something.
 *
 * @returns {boolean} True if so, false if not.
 */
function isDragging () {
  return dragCurrent !== null
}

/**
 * Get the current mouse cursor position.
 *
 * @returns {object} Object with x and y in pixels on the tabletop.
 */
function getMouseCoords () {
  return Room.getTableCoordinates(mouseX, mouseY)
}

/**
 * Enable the room area drag'n'drop handling by registering the event handlers.
 *
 * @param {string} tabletop Selector/ID for tabletop div.
 */
function enableDragAndDrop (tabletop) {
  _(tabletop)
    .on('mousedown', mousedown => mouseDown(mousedown))
    .on('mousemove', mousemove => mouseMove(mousemove)) // also tracks cursor
    .on('mouseup', mouseup => mouseUp(mouseup))
}

/**
 * Set the actions that happen on left/center/right mouse buttons.
 *
 * @param {object} left Left mouse button.
 * @param {object} center Center mouse button.
 * @param {object} right Right mouse button.
 */
function setButtons (
  left = new SelectAndDrag(),
  center = new Grab(),
  right = new SelectAndProperties()
) {
  dragHandlers[0] = left
  dragHandlers[1] = center
  dragHandlers[2] = right
}

/**
 * Force-release a button. Usually because some hotkey triggers that.
 *
 * @param {number} no Number of the mouse button (0/1/2 = left/middle/right).
 */
function release (no) {
  if (dragHandlers[no].isDragging()) {
    dragHandlers[no].release()
    dragCurrent = null
  }
}

// --- internal ----------------------------------------------------------------

let mouseX = 0
let mouseY = 0

/**
 * Store current mouse position for later.
 *
 * @param {number} x Mouse X.
 * @param {number} y Mouse Y.
 */
function touchMousePosition (x, y) {
  mouseX = x
  mouseY = y
}

const dragHandlers = [
  null, // LMB
  null, // CMB
  null // RMB
]

let dragCurrent = null // current 'move' handler

/**
 * Handle mousedown events.
 *
 * Will route the handling depending on the button.
 *
 * @param {MouseEvent} mousedown The triggering mouse event.
 */
function mouseDown (mousedown) {
  if (![mousedown.target.id, mousedown.target.parentNode?.id].includes('popper')) {
    Popup.close()
  }
  if (dragCurrent != null) { // cancel any drag in progress
    dragHandlers[dragCurrent].cancel()
    dragCurrent = null
  }
  if (Room.getMode().mousedown(mousedown)) return
  if (dragHandlers?.[mousedown.button]) {
    dragCurrent = mousedown.button
    dragHandlers[dragCurrent].push(mousedown)
  }
}

/**
 * Handle mousemove events.
 *
 * Will route the handling depending on the button.
 *
 * @param {MouseEvent} mousemove The triggering mouse event.
 */
function mouseMove (mousemove) {
  Sync.touch()
  touchMousePosition(mousemove.clientX, mousemove.clientY) // inclusive sidenav

  if (dragCurrent != null) {
    const buttonMask = dragCurrent === 0 ? 1 : (dragCurrent === 2 ? 2 : 4)
    if (mousemove.buttons & buttonMask) { // button still pressed
      if (dragHandlers[dragCurrent].isPreDrag() === false) {
        dragHandlers[dragCurrent].drag(mousemove)
      }
    } else { // button somehow released (e.g. outside window)
      dragHandlers[dragCurrent].cancel()
      dragCurrent = null
    }
  }
}

/**
 * Handle mouseup events.
 *
 * Will route the handling depending on the button.
 *
 * @param {MouseEvent} mouseup The triggering mouse event.
 */
function mouseUp (mouseup) {
  if (dragCurrent != null) {
    if (dragHandlers[dragCurrent].isDragging()) {
      dragHandlers[dragCurrent].release(mouseup)
    }
    dragCurrent = null
  }
}
