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

import { MouseButtonHandler } from './_MouseButtonHandler.mjs'
import * as Content from '../../../view/room/tabletop/content.mjs'
import * as Dom from '../../../view/room/tabletop/dom.mjs'
import * as Mouse from '../../../view/room/mouse/index.mjs'
import * as Popup from '../../../view/room/tabletop/popup.mjs'
import * as Room from '../../../view/room/index.mjs'

export class SelectAndProperties extends MouseButtonHandler {
  isPreDrag () {
    return true
  }

  isDragging () {
    return false
  }

  push (mousedown) {
    const piece = this.findParentPiece(mousedown.target)
    if (!piece) return
    mousedown.preventDefault()

    Content.findRealClickTarget(piece, Mouse.getMouseCoords()).then(target => {
      Room.updateSelection(target, mousedown.ctrlKey)
      if (target) {
        if (target.classList.contains('piece')) {
          Popup.piece(target.piece)
        }
      } else {
        Popup.table(Mouse.getMouseCoords())
      }
      Dom.updateSelection()
    })
  }

  drag (mousemove) {
    // do nothing
  }

  release (mouseup) {
    this.cancel()
  }

  cancel () {
    Dom.setCursor()
  }
}
