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
  PREFS,
  getRoomPreference,
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
  pointTo
} from './tabletop/index.mjs'
import {
  nameToLayer,
  sortZ,
  getMaxZ,
  findPiece,
  getTopLeftPx,
  findPiecesWithin,
  snap
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
 * Determine if user is currently drawing something (line, square, ...).
 *
 * @return {Boolean} True if so, false if not.
 */
export function isDrawing () {
  return drawing !== null
}

/**
 * Get the current mouse cursor position.
 * @return {Object} Object with x and y in pixels.
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
  scroller = document.getElementById('scroller')

  _(tabletop)
    .on('mousedown', mousedown => mouseDown(mousedown))
    .on('mousemove', mousemove => mouseMove(mousemove)) // also tracks cursor
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
    if (piece._meta.sides <= 1) {
      _('#btn-f').add('.disabled')
      _('#btn-hash').add('.disabled')
    }
    if (piece._meta.sides <= 2) {
      _('#btn-hash').add('.disabled')
    }
    if (piece._meta.feature === 'DICEMAT') {
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
 * Determine if a piece is not transparent at a given coordinate.
 *
 * Does this by creating a temporary in-memory canvas and checking against its
 * alpha layer. Rotation is implicitly done by the browser as CSS 'transform:'
 * also rotates/scales click x/y.
 *
 * @param {Object} piece Piece to check.
 * @param {Number} x X-coordiante in px.
 * @param {Number} y Y-coordiante in px.
 * @return {Boolean} True if pixel at x/y is transparent, false otherwise.
 */
function isSolid (piece, x, y) {
  if (!piece) return true // no piece = no checking
  if (piece?.l === 'token') return true // token are always round & solid
  if (!piece._meta?.mask) return true // no mask = no checking possible

  // now do the hit detection
  const img = new Image() // eslint-disable-line no-undef
  img.src = piece._meta.mask
  if (img.complete) {
    const template = getTemplate()

    const width = piece.w * template.gridSize
    const height = piece.h * template.gridSize

    // calculate img->canvas scale,
    // compensate for 'background-size: cover'
    let sX = 0
    let sY = 0
    let sW = img.width * 1.0
    let sH = img.height * 1.0
    const sAspect = img.width * 1.0 / img.height
    const cAspect = width * 1.0 / height
    if (sAspect < cAspect) { // source higher
      const scale = width / sW
      sH = height / scale
      sY = (img.height - sH) / 2
    } else { // source wider
      const scale = height / sH
      sW = width / scale
      sX = (img.width - sW) / 2
    }

    // draw & check pixel
    const scale = 2 // we don't need full resolution for checking
    const c = document.createElement('canvas')
    c.width = width / scale
    c.height = height / scale
    const ctx = c.getContext('2d')
    ctx.drawImage(img, sX, sY, sW, sH, 0, 0, c.width, c.height)
    const alpha = ctx.getImageData(x / scale, y / scale, 1, 1).data[3]
    return alpha > 4 // alpha value
  } else {
    return true // image was not already loaded
  }
}

/**
 * Click-thru transparent areas of clickable pieces.
 *
 * If clicked on an 100% alpha area, try to find a better target for the event
 * by traversing all layers + object on the same coordnate.
 *
 * @param {Object} event JavaScript evend that was triggered on a click.
 */
function findRealClickTarget (event) {
  // in most cases the hit item will be the correct one
  if (isSolid(event.target.piece, event.offsetX, event.offsetY)) {
    return event.target
  }

  // seems the initial target is transparent. now traverse all layers.
  const index = nameToLayer(event.target.piece.l)
  const coords = getMouseCoords()
  for (const layer of ['other', 'token', 'note', 'overlay', 'tile']) {
    if (nameToLayer(layer) <= index && getRoomPreference(PREFS['LAYER' + layer])) { // we don't need to check higher layers
      for (const piece of sortZ(findPiecesWithin({
        left: coords.x,
        top: coords.y,
        right: coords.x,
        bottom: coords.y
      }, layer))) {
        if (piece.id === event.target.piece.id) continue // don't double-check

        //  compensate center
        const oX = coords.x - piece.x
        const oY = coords.y - piece.y
        let tX = oX
        let tY = oY

        // compensate rotation clockwise
        if (piece.r > 0) {
          const rs = Math.sin(piece.r * Math.PI / 180)
          const rc = Math.cos(piece.r * Math.PI / 180)
          tX = oX * rc + oY * rs
          tY = -oX * rs + oY * rc
        }

        tX += piece._meta.originWidthPx / 2
        tY += piece._meta.originHeightPx / 2
        if (isSolid(piece, tX, tY)) {
          return _('#' + piece.id).node()
        }
      }
    }
  }
  return null // no better target available
}

/**
 * Handle mousedown events.
 *
 * Will route the handling depeding on the button.
 *
 * @param {MouseEvent} mousedown The triggering mouse event.
 */
function mouseDown (mousedown) {
  let target
  switch (mousedown.button) {
    case 0:
      if (mousedown.shiftKey) {
        pointTo(getMouseCoords())
      } else {
        target = findRealClickTarget(mousedown)
        handleSelection(target)
        dragStart(mousedown, target)
      }
      break
    case 1:
      grabStart(mousedown)
      break
    case 2:
      mousedown.preventDefault()
      target = findRealClickTarget(mousedown)
      handleSelection(target)
      properties(target)
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
const drawing = null

/**
 * Start drag'n'drop after mousebutton was pushed.
 *
 * @param {MouseEvent} mousedown The triggering mouse event.
 * @param {Object} realTarget The real target of the drag (maybe not the one of mousedown).
 */
function dragStart (mousedown, realTarget) {
  if (!realTarget) return // no real click

  if (isDragging()) { // you can't drag twice
    dragging.parentNode.removeChild(dragging) // quick fix for release-outsite bug
    dragging = null
    mousedown.preventDefault()
    return
  }

  if (!realTarget.classList.contains('piece')) return // we only drag pieces
  scroller.classList.add('cursor-grab')

  dragging = realTarget.cloneNode(true)
  dragging.id = dragging.id + '-drag'
  dragging.piece = findPiece(realTarget.id)

  dragging.style.zIndex = 999999999 // drag visually on top of everything
  dragging.classList.add('dragging')
  dragging.classList.add('dragging-hidden') // hide new item till it gets moved (1)
  realTarget.parentNode.appendChild(dragging)

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
      dragging.piece.y + mousemove.clientY - dragging.startY
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
      if (dragging.piece.x !== dragging.x ||
        dragging.piece.y !== dragging.y) {
        const maxZ = getMaxZ(dragging.piece.l, {
          top: dragging.y - dragging.piece._meta.heightPx / 2,
          left: dragging.x - dragging.piece._meta.widthPx / 2,
          bottom: dragging.y + dragging.piece._meta.heightPx / 2,
          right: dragging.x + dragging.piece._meta.widthPx / 2
        })
        movePiece(
          dragging.piece.id,
          dragging.x,
          dragging.y,
          dragging.piece.z === maxZ ? dragging.piece.z : getMaxZ(dragging.piece.l) + 1
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

function properties (target) {
  if (!target) return // no real click

  if (target.classList.contains('piece')) {
    popupPiece(target.id)
  }
}

// --- other -------------------------------------------------------------------

/**
 * Move a dragging piece to the current mouse position.
 *
 * @param {Element} element The HTML node to update.
 * @param {Number} x New x coordinate in px.
 * @param {Number} y New y coordinate in px.
 */
function setPosition (element, x, y) {
  const template = getTemplate()

  x = clamp(0, x, template._meta.widthPx - 0 - 1)
  y = clamp(0, y, template._meta.heightPx - 0 - 1)

  const snapped = snap(x, y)
  element.x = Math.max(0, snapped.x)
  element.y = Math.max(0, snapped.y)

  const tl = getTopLeftPx(element.piece, element.x, element.y)
  element.style.left = tl.left
  element.style.top = tl.top
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} element The HTML node the user clicked on.
 */
function handleSelection (element) {
  // unselect everything if 'nothing' was clicked
  if (!element) {
    unselectPieces()
    return
  }

  // remove selection from all elements if we clicked on the background or on a piece
  if (element.id === 'tabletop' || element.classList.contains('piece') || element.classList.contains('backside')) {
    unselectPieces()
  }

  // add selection to clicked element (if it is a piece)
  if (element.classList.contains('piece')) {
    element.classList.add('is-selected')
  }

  // add selection to parent (if it is a backside piece)
  if (element.classList.contains('backside')) {
    element.parentElement.classList.add('is-selected')
  }

  updateMenu()
}
