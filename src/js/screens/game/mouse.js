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

import { getTemplate, stateMovePiece } from './state.js'
import { getScrollPosition, unselectPieces } from '.'
import { clamp } from '../../utils.js'
import _ from '../../FreeDOM.js'

let dragging = null // the currently dragge object, or null
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
 * Calculate the grid/tile X coordinate based on mouse position.
 *
 * @return {Number} Current tile X.
 */
export function getMouseTileX () {
  const template = getTemplate()
  const mouseTileX = Math.floor(compensateOffsetX(mouseX) / template.gridSize)
  return clamp(0, mouseTileX, template.width - 1)
}

/**
 * Calculate the grid/tile Y coordinate based on mouse position.
 *
 * @return {Number} Current tile Y.
 */
export function getMouseTileY () {
  const template = getTemplate()
  const mouseTileY = Math.floor(compensateOffsetY(mouseY) / template.gridSize)
  return clamp(0, mouseTileY, template.height - 1)
}

/**
 * Enable the game area drag'n'drop handling by registering the event handlers.
 *
 * @param {String} tabletop Selector/ID for tabletop div.
 */
export function enableDragAndDrop (tabletop) {
  scroller = document.getElementById('scroller')

  _(tabletop)
    .on('mousedown', mousedown => drag(mousedown))
    .on('mousemove', mousemove => move(mousemove)) // needed also to keep track of cursor
    .on('mouseup', mouseup => drop(mouseup))
}

/**
 * Update the menu's disabled buttons.
 *
 * Mostly based on if a piece is selected or not.
 */
export function updateMenu () {
  // (de)activate menu
  const menu = document.querySelector('.menu-selected')
  menu.classList.remove('disabled')
  if (document.querySelectorAll('.is-selected').length <= 0) {
    menu.classList.add('disabled')
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
 * Start drag'n'drop after mousebutton was pushed.
 *
 * @param {MouseEvent} mousedown The triggering mouse event.
 */
function drag (mousedown) {
  if (isDragging()) {
    dragging.parentNode.removeChild(dragging) // quick fix for release-outsite bug
    dragging = null
    mousedown.preventDefault()
    return
  }
  handleSelection(mousedown.target)
  if (!mousedown.target.classList.contains('box')) return

  const piece = mousedown.target.parentNode // box -> piece
  dragging = piece.cloneNode(true)
  dragging.id = dragging.id + '-drag'
  dragging.origin = piece
  dragging.classList.add('dragging')
  dragging.classList.add('dragging-hidden') // hide new item till it gets moved (1)
  piece.parentNode.appendChild(dragging)

  // rect is relative to viewport, so we compensate for scrolling
  const rect = dragging.getBoundingClientRect()
  dragging.originX = compensateOffsetX(rect.left)
  dragging.originY = compensateOffsetY(rect.top)

  dragging.width = rect.right - rect.left
  dragging.height = rect.bottom - rect.top

  dragging.startX = mousedown.clientX // no need to compensate, as we
  dragging.startY = mousedown.clientY // only calculate offset anyway

  mousedown.preventDefault()
}

/**
 * Continue drag'n'drop while mousebutton is pushed and mouse is moved.
 *
 * @param {MouseEvent} mousemove The triggering mouse event.
 */
function move (mousemove) {
  if (isDragging()) {
    dragging.classList.remove('dragging-hidden') // we are moving now (1)
    setPosition(
      dragging,
      dragging.originX + mousemove.clientX - dragging.startX,
      dragging.originY + mousemove.clientY - dragging.startY,
      1
    )
    mousemove.preventDefault()
  } else {
    touchMousePosition(mousemove.clientX, mousemove.clientY)
    const cursor = document.getElementById('cursor')
    const template = getTemplate()
    cursor.style.left = getMouseTileX() * template.gridSize + 'px'
    cursor.style.top = getMouseTileY() * template.gridSize + 'px'
  }
}

/**
 * End/release drag'n'drop when mousebutton is released.
 *
 * @param {MouseEvent} mouseup The triggering mouse event.
 */
function drop (mouseup) {
  if (isDragging()) {
    setPosition(
      dragging,
      dragging.originX + mouseup.clientX - dragging.startX,
      dragging.originY + mouseup.clientY - dragging.startY
    )

    // only record state if there was a change in position
    if (dragging.origin.dataset.x !== dragging.dataset.x ||
      dragging.origin.dataset.y !== dragging.dataset.y) {
      stateMovePiece(dragging.origin.id, dragging.dataset.x, dragging.dataset.y)
    }

    dragging.parentNode.removeChild(dragging)
    dragging = null
    mouseup.preventDefault()
  }
}

/**
 * Convert a window mouse-x position to a tabletop canvas x position.
 *
 * Takes position of canvas and scroll position of canvas into account.
 *
 * @param {Number} x A window x coordinate.
 * @return {Number} A canvas x coordinate.
 */
function compensateOffsetX (x) {
  x += getScrollPosition().x // compensate scroll position
  x -= scroller.getBoundingClientRect().left // compensate container position
  return x
}

/**
 * Convert a window mouse-y position to a tabletop canvas y position.
 *
 * Takes position of canvas and scroll position of canvas into account.
 *
 * @param {Number} y A window y coordinate.
 * @return {Number} A canvas y coordinate.
 */
function compensateOffsetY (y) {
  y += getScrollPosition().y // compensate scroll position
  y -= scroller.getBoundingClientRect().top // compensate container position
  return y
}

/**
 * Move a dragging piece to the current mouse position.
 *
 * @param {Element} element The HTML node to update.
 * @param {Number} x New x coordinate.
 * @param {Number} y New y coordinate.
 * @param {Number} snap Grid/snap size. Defaults to the tilesize.
 */
function setPosition (element, x, y, snap = getTemplate().gridSize) {
  const template = getTemplate()
  x = clamp(0, x, (template.width - element.dataset.w) * template.gridSize - 1)
  y = clamp(0, y, (template.height - element.dataset.h) * template.gridSize - 1)
  x += Math.floor(snap / 2)
  y += Math.floor(snap / 2)
  element.dataset.x = Math.floor(x / template.gridSize)
  element.dataset.y = Math.floor(y / template.gridSize)
  element.style.left = Math.max(0, (Math.floor(x / snap) * snap)) + 'px'
  element.style.top = Math.max(0, (Math.floor(y / snap) * snap)) + 'px'
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} element The HTML node the user clicked on.
 */
function handleSelection (element) {
  // remove selection from all elements if we clicked on the background or on a piece
  if (element.id === 'tabletop' || element.classList.contains('box')) {
    unselectPieces()
  }

  // add selection to clicked element (if it is a piece)
  if (element.classList.contains('box')) {
    element.parentNode.classList.add('is-selected')
  }

  updateMenu()
}
