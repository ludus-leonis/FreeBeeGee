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

export class MouseButtonHandler {
  isPreDrag () { // drag initialized but not yet started - waiting for mouse down
    console.error('Drag', 'isPreDrag() not implemented!')
    return false
  }

  isDragging () { // dragging in progress
    console.error('Drag', 'isDragging() not implemented!')
    return true
  }

  push (mousedown) { // trigger dragging via mouse down
    console.error('Drag', 'push() not implemented!')
  }

  drag (mousemove) { // continue dragging while mouse is down
    console.error('Drag', 'drag() not implemented!')
  }

  release (mouseup) { // successfully end drag
    console.error('Drag', 'release() not implemented!')
  }

  cancel () { // abort drag & revert to pre-drag
    console.error('Drag', 'cancel() not implemented!')
  }

  findParentPiece (node) { // if we clicked deeper inside a piece, bubble up to the piece itself
    if (node.classList.contains('piece') || node.classList.contains('tabletop')) {
      return node
    }

    if (['A'].includes(node.tagName)) return null // let browser handle those

    // check if we maybe clicked deeper within a piece (e.g. note markup)
    let parentPiece = node.parentNode
    while (parentPiece) {
      if (parentPiece.classList.contains('piece') || parentPiece.classList.contains('tabletop')) break
      parentPiece = parentPiece.parentNode
    }
    return parentPiece
  }
}
