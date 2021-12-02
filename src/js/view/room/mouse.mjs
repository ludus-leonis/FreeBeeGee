/**
 * @file Handles moving around stuff on the tabletop, plus selection states.
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
  getTemplate,
  movePiece
} from '../../state/index.mjs'
import {
  clamp
} from '../../lib/utils.mjs'

import {
  getScrollPosition,
  setScrollPosition,
  getTableCoordinates,
  popupPiece
} from './index.mjs'
import {
  touch
} from './sync.mjs'
import {
  unselectPieces,
  getTableTile,
  pointTo
} from './tabletop/index.mjs'
import {
  getMaxZ,
  findPiece
} from './tabletop/tabledata.mjs'

let scroller = null // the tabletop wrapper
let mouseX = 0
let mouseY = 0

// --- public ------------------------------------------------------------------

/**
 * Determine if user is currently drag-n-dropping something.
 *
 * @return {Boolean} True if so, false if not.
 */
export function isDragging () {
  return dragging !== null
}

/**
 * Get the current mouse cursor position.
 * @return {Object} Object with x and y in pixels.
 */
export function getMouseCoords () {
  return getTableCoordinates(mouseX, mouseY)
}

/**
 * Get the current mouse cursor position.
 * @return {Object} Object with x and y in tiles/grid.
 */
export function getMouseTile () {
  return getTableTile(mouseX, mouseY)
}

/**
 * Enable the room area drag'n'drop handling by registering the event handlers.
 *
 * @param {String} tabletop Selector/ID for tabletop div.
 */
export function enableDragAndDrop (tabletop) {
  scroller = document.getElementById('scroller')

  _(tabletop)
    .on('mousedown', mousedown => mouseDown(mousedown))
    .on('mousemove', mousemove => mouseMove(mousemove)) // needed also to keep track of cursor
    .on('mouseup', mouseup => mouseUp(mouseup))
}

/**
 * Update the menu's disabled buttons.
 *
 * Mostly based on if a piece is selected or not.
 */
export function updateMenu () {
  // (de)activate menu
  const menu = _('.menu-selected')
  const selected = _('.is-selected').nodes()

  _('.menu-selected button').remove('.disabled')
  if (selected.length <= 0) {
    menu.add('.disabled')
  } else if (selected.length === 1) {
    const piece = findPiece(selected[0].id)
    menu.remove('.disabled')
    if (piece._sides <= 1) {
      _('#btn-f').add('.disabled')
      _('#btn-hash').add('.disabled')
    }
    if (piece._sides <= 2) {
      _('#btn-hash').add('.disabled')
    }
    if (piece._feature === 'DICEMAT') {
      _('#btn-hash').remove('.disabled')
    }
  } else {
    menu.remove('.disabled')
  }
}

// --- internal ----------------------------------------------------------------

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

/**
 * Handle mousedown events.
 *
 * Will route the handling depeding on the button.
 *
 * @param {MouseEvent} mousedown The triggering mouse event.
 */
function mouseDown (mousedown) {
  switch (mousedown.button) {
    case 0:
      if (mousedown.shiftKey) {
        pointTo(getTableCoordinates(mouseX, mouseY))
      } else {
        handleSelection(mousedown.target)
        dragStart(mousedown)
      }
      break
    case 1:
      grabStart(mousedown)
      break
    case 2:
      mousedown.preventDefault()
      handleSelection(mousedown.target)
      properties(mousedown)
      break
    default:
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

  // delegate the move, or end it if the button is no longer pressed. could
  // happen if user releases outside of our window
  if (mousemove.buttons & 1) {
    dragContinue(mousemove)
  } else {
    dragEnd(mousemove, true)
  }

  if (mousemove.buttons & 4) {
    grabContinue(mousemove)
  } else {
    grabEnd(mousemove)
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
  switch (mouseup.button) {
    case 0:
      dragEnd(mouseup)
      break
    case 1:
      grabEnd(mouseup)
      break
    default:
  }
}

// --- drag'n'drop -------------------------------------------------------------

let dragging = null // the currently dragge object, or null

/**
 * Start drag'n'drop after mousebutton was pushed.
 *
 * @param {MouseEvent} mousedown The triggering mouse event.
 */
function dragStart (mousedown) {
  if (isDragging()) { // you can't drag twice
    dragging.parentNode.removeChild(dragging) // quick fix for release-outsite bug
    dragging = null
    mousedown.preventDefault()
    return
  }

  if (!mousedown.target.classList.contains('piece')) return // we only drag pieces
  scroller.classList.add('cursor-grab')

  const node = mousedown.target
  dragging = node.cloneNode(true)
  dragging.id = dragging.id + '-drag'
  dragging.piece = findPiece(node.id)

  dragging.style.zIndex = 999999999 // drag visually on top of everything
  dragging.classList.add('dragging')
  dragging.classList.add('dragging-hidden') // hide new item till it gets moved (1)
  node.parentNode.appendChild(dragging)

  dragging.startX = mousedown.clientX // no need to compensate, as we
  dragging.startY = mousedown.clientY // only calculate offset anyway

  mousedown.preventDefault()
}

/**
 * Continue drag'n'drop while mousebutton is pushed and mouse is moved.
 *
 * @param {MouseEvent} mousemove The triggering mouse event.
 */
function dragContinue (mousemove) {
  if (isDragging()) {
    dragging.classList.remove('dragging-hidden') // we are moving now (1)
    setPosition(
      dragging,
      dragging.piece.x + mousemove.clientX - dragging.startX,
      dragging.piece.y + mousemove.clientY - dragging.startY,
      1
    )
    mousemove.preventDefault()
  }
}

/**
 * End/release drag'n'drop when mousebutton is released.
 *
 * @param {MouseEvent} mouseup The triggering mouse event.
 */
function dragEnd (mouseup, cancel = false) {
  if (isDragging()) {
    if (!cancel) { // drag could be canceled by releasing outside
      setPosition(
        dragging,
        dragging.piece.x + mouseup.clientX - dragging.startX,
        dragging.piece.y + mouseup.clientY - dragging.startY
      )

      // only record state if there was a change in position
      if (dragging.piece.x !== Number(dragging.dataset.x) ||
        dragging.piece.y !== Number(dragging.dataset.y)) {
        const template = getTemplate()
        const maxZ = getMaxZ(dragging.dataset.layer, {
          top: Number(dragging.dataset.y),
          left: Number(dragging.dataset.x),
          bottom: Number(dragging.dataset.y) + Number(dragging.dataset.h) * template.gridSize,
          right: Number(dragging.dataset.x) + Number(dragging.dataset.w) * template.gridSize
        })
        movePiece(
          dragging.piece.id,
          Number(dragging.dataset.x),
          Number(dragging.dataset.y),
          dragging.piece.z === maxZ ? dragging.piece.z : getMaxZ(dragging.piece.layer) + 1
        )
      }
    }

    dragging.parentNode && dragging.parentNode.removeChild(dragging)
    dragging = null
    mouseup.preventDefault()
    scroller.classList.remove('cursor-grab')
  }
}

// --- grab'n'move -------------------------------------------------------------

let grabbing = null

/**
 * Start grab'n'move after mousebutton was pushed.
 *
 * @param {MouseEvent} mousedown The triggering mouse event.
 */
function grabStart (mousedown) {
  if (grabbing != null) { // you can't grab twice
    grabbing = null
    mousedown.preventDefault()
    return
  }

  // find the tabletop
  let tabletop = mousedown.target
  while (tabletop !== null && !tabletop.classList.contains('tabletop')) {
    tabletop = tabletop.parentNode
  }
  if (!tabletop) return // no tabletop no grab
  scroller.classList.add('cursor-grab')

  // record start position
  grabbing = {}
  grabbing.startX = mousedown.clientX // no need to compensate, as we
  grabbing.startY = mousedown.clientY // only calculate offset anyway
  grabbing.origin = getScrollPosition()
  grabbing.rectInner = tabletop.getBoundingClientRect()
  grabbing.rectOuter = tabletop.parentNode.getBoundingClientRect()

  mousedown.preventDefault()
}

/**
 * Continue grab'n'move while mousebutton is pushed and mouse is moved.
 *
 * @param {MouseEvent} mousemove The triggering mouse event.
 */
function grabContinue (mousemove) {
  if (grabbing != null) {
    const scrollToX = clamp(
      0,
      grabbing.origin.x + (grabbing.startX - mousemove.clientX),
      grabbing.rectInner.width - grabbing.rectOuter.width
    )
    const scrollToY = clamp(
      0,
      grabbing.origin.y + (grabbing.startY - mousemove.clientY),
      grabbing.rectInner.height - grabbing.rectOuter.height
    )
    setScrollPosition(scrollToX, scrollToY)
    mousemove.preventDefault()
  }
}

/**
 * End/release grab'n'move when mousebutton is released.
 *
 * Not much to to here except to cancel the grab tracking.
 *
 * @param {MouseEvent} mouseup The triggering mouse event.
 */
function grabEnd (mouseup) {
  if (grabbing) {
    grabbing = null
    scroller.classList.remove('cursor-grab')
  }
}

// --- right-click properties --------------------------------------------------

function properties (mousedown) {
  if (mousedown.target.classList.contains('piece')) {
    popupPiece(mousedown.target.id)
  }
}

// --- other -------------------------------------------------------------------

/**
 * Move a dragging piece to the current mouse position.
 *
 * @param {Element} element The HTML node to update.
 * @param {Number} x New x coordinate in px.
 * @param {Number} y New y coordinate in px.
 * @param {Number} snap Grid/snap size. Defaults to the tilesize.
 */
function setPosition (element, x, y, snap = getTemplate().snapSize) {
  const template = getTemplate()
  switch (element.dataset.r) {
    case '90':
    case '270':
      x = clamp(0, x, (template.gridWidth - element.dataset.h) * template.gridSize - 1)
      y = clamp(0, y, (template.gridHeight - element.dataset.w) * template.gridSize - 1)
      break
    default:
      x = clamp(0, x, (template.gridWidth - element.dataset.w) * template.gridSize - 1)
      y = clamp(0, y, (template.gridHeight - element.dataset.h) * template.gridSize - 1)
  }
  x += Math.floor(snap / 2)
  y += Math.floor(snap / 2)
  element.dataset.x = Math.max(0, (Math.floor(x / snap) * snap))
  element.dataset.y = Math.max(0, (Math.floor(y / snap) * snap))
  element.style.left = element.dataset.x + 'px'
  element.style.top = element.dataset.y + 'px'
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} element The HTML node the user clicked on.
 */
function handleSelection (element) {
  // remove selection from all elements if we clicked on the background or on a piece
  if (element.id === 'tabletop' || element.classList.contains('piece')) {
    unselectPieces()
  }

  // add selection to clicked element (if it is a piece)
  if (element.classList.contains('piece')) {
    element.classList.add('is-selected')
  }

  updateMenu()
}
