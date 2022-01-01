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

import {
  MouseButtonHandler
} from '../../../view/room/mouse/_MouseButtonHandler.mjs'

import {
  getMouseCoords
} from '../../../view/room/mouse/index.mjs'

import {
  findRealClickTarget
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  popupPiece,
  updateSelection,
  setCursor
} from '../../../view/room/index.mjs'

export class SelectAndProperties extends MouseButtonHandler {
  isPreDrag () {
    return true
  }

  isDragging () {
    return false
  }

  push (mousedown) {
    mousedown.preventDefault()

    const target = findRealClickTarget(mousedown, getMouseCoords())
    updateSelection(target)
    if (!target) return // no real click

    if (target.classList.contains('piece')) {
      popupPiece(target.id)
    }
  }

  drag (mousemove) {
    // do nothing
  }

  release (mouseup) {
    this.cancel()
  }

  cancel () {
    setCursor()
  }
}
