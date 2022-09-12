/**
 * @file Handles moving around stuff on the tabletop, plus selection states.
 * @module
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

import _ from '../../../lib/FreeDOM.mjs'

import {
  getTableCoordinates
} from '../../../view/room/index.mjs'

import {
  touch
} from '../../../view/room/sync.mjs'

import {
  pointTo
} from '../../../view/room/tabletop/index.mjs'

import {
  SelectAndDrag
} from '../../../view/room/mouse/SelectAndDrag.mjs'

import {
  SelectAndProperties
} from '../../../view/room/mouse/SelectAndProperties.mjs'

import {
  Grab
} from '../../../view/room/mouse/Grab.mjs'

import {
  Los
} from '../../../view/room/mouse/Los.mjs'

import {
  popupHide
} from '../../../view/room/tabletop/popup.mjs'

// --- public ------------------------------------------------------------------

/**
 * Determine if user is currently dropping (move while mouse button down) something.
 *
 * @return {Boolean} True if so, false if not.
 */
export function isDragging () {
  return dragCurrent !== null
}

/**
 * Get the current mouse cursor position.
 * @return {Object} Object with x and y in pixels on the tabletop.
 */
export function getMouseCoords () {
  return getTableCoordinates(mouseX, mouseY)
}

/**
 * Enable the room area drag'n'drop handling by registering the event handlers.
 *
 * @param {String} tabletop Selector/ID for tabletop div.
 */
export function enableDragAndDrop (tabletop) {
  _(tabletop)
    .on('mousedown', mousedown => mouseDown(mousedown))
    .on('mousemove', mousemove => mouseMove(mousemove)) // also tracks cursor
    .on('mouseup', mouseup => mouseUp(mouseup))
}

/**
 * Enable LOS drawing mode on the left mouse button.
 */
export function toggleLMBLos () {
  if (dragCurrent === null) {
    if (isLMBLos()) {
      dragHandlers[0] = new SelectAndDrag()
    } else {
      dragHandlers[0] = new Los()
    }
  }
}

/**
 * Enable LOS drawing mode on the left mouse button.
 *
 * @param {Boolean} active If true, will also check if an actual drag is going on. Default false.
 * @return {Boolean} True if Los mode is on.
 */
export function isLMBLos (active = false) {
  if (active) {
    return dragHandlers[0] instanceof Los && dragHandlers[0].isDragging()
  }
  return dragHandlers[0] instanceof Los
}

/**
 * Force-release a button. Usually because some hotkey triggers that.
 *
 * @param {Number} no Number of the mouse button (0/1/2 = left/middle/right).
 */
export function release (no) {
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
 * @param {Number} x Mouse X.
 * @param {Number} y Mouse Y.
 */
function touchMousePosition (x, y) {
  mouseX = x
  mouseY = y
}

const dragHandlers = [
  new SelectAndDrag(), // LMB
  new Grab(), // CMB
  new SelectAndProperties() // RMB
]

let dragCurrent = null // current 'move' handler

/**
 * Handle mousedown events.
 *
 * Will route the handling depeding on the button.
 *
 * @param {MouseEvent} mousedown The triggering mouse event.
 */
function mouseDown (mousedown) {
  if (![mousedown.target.id, mousedown.target.parentNode?.id].includes('popper')) {
    popupHide()
  }
  if (dragCurrent != null) { // cancel any drag in progress
    dragHandlers[dragCurrent].cancel()
    dragCurrent = null
  }
  if (mousedown.button === 0 && mousedown.shiftKey) {
    pointTo(getMouseCoords())
    return
  }
  if (dragHandlers?.[mousedown.button]) {
    dragCurrent = mousedown.button
    dragHandlers[dragCurrent].push(mousedown)
  }
}

/**
 * Handle mousemove events.
 *
 * Will route the handling depeding on the button.
 *
 * @param {MouseEvent} mousemove The triggering mouse event.
 */
function mouseMove (mousemove) {
  touch()
  touchMousePosition(mousemove.clientX, mousemove.clientY)

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
 * Will route the handling depeding on the button.
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
