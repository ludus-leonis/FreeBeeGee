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
  movePiece
} from '../../../state/index.mjs'

import {
  getMouseCoords
} from '../../../view/room/mouse/index.mjs'

import {
  findRealClickTarget,
  findPiece,
  getMaxZ
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  updateSelection,
  setCursor
} from '../../../view/room/index.mjs'

import {
  moveNodeToSnapped
} from '../../../view/room/tabletop/index.mjs'

export class SelectAndDrag extends MouseButtonHandler {
  constructor () {
    super()
    this.dragging = null // the currently dragged object, or null
  }

  isPreDrag () {
    return this.dragging === null
  }

  isDragging () {
    return this.dragging !== null
  }

  push (mousedown) {
    // we only react on pieces or the tabletop
    if (!mousedown.target.classList.contains('piece') &&
      !mousedown.target.classList.contains('tabletop')) return

    const target = findRealClickTarget(mousedown, getMouseCoords())
    updateSelection(target)
    if (!target) return // no real click

    if (this.isDragging()) { // you can't drag twice
      this.dragging.parentNode.removeChild(this.dragging) // quick fix for release-outsite bug
      this.dragging = null
      mousedown.preventDefault()
      return
    }

    if (!target.classList.contains('piece')) return // we only drag pieces
    setCursor('.cursor-grab')

    this.dragging = target.cloneNode(true)
    this.dragging.id = this.dragging.id + '-drag'
    this.dragging.piece = findPiece(target.id)

    this.dragging.style.zIndex = 999999999 // drag visually on top of everything
    this.dragging.classList.add('dragging')
    this.dragging.classList.add('dragging-hidden') // hide new item till it gets moved (1)
    target.parentNode.appendChild(this.dragging)

    this.dragging.startX = mousedown.clientX // no need to compensate, as we
    this.dragging.startY = mousedown.clientY // only calculate offset anyway

    mousedown.preventDefault()
  }

  drag (mousemove) {
    if (this.isDragging()) {
      this.dragging.classList.remove('dragging-hidden') // we are moving now (1)
      moveNodeToSnapped(
        this.dragging,
        this.dragging.piece.x + mousemove.clientX - this.dragging.startX,
        this.dragging.piece.y + mousemove.clientY - this.dragging.startY
      )
      mousemove.preventDefault()
    }
  }

  release (mouseup) {
    if (this.isDragging()) {
      moveNodeToSnapped(
        this.dragging,
        this.dragging.piece.x + mouseup.clientX - this.dragging.startX,
        this.dragging.piece.y + mouseup.clientY - this.dragging.startY
      )

      // only record state if there was a change in position
      if (this.dragging.piece.x !== this.dragging.x ||
        this.dragging.piece.y !== this.dragging.y) {
        const maxZ = getMaxZ(this.dragging.piece.l, {
          top: this.dragging.y - this.dragging.piece._meta.heightPx / 2,
          left: this.dragging.x - this.dragging.piece._meta.widthPx / 2,
          bottom: this.dragging.y + this.dragging.piece._meta.heightPx / 2,
          right: this.dragging.x + this.dragging.piece._meta.widthPx / 2
        })
        movePiece(
          this.dragging.piece.id,
          this.dragging.x,
          this.dragging.y,
          this.dragging.piece.z === maxZ ? this.dragging.piece.z : getMaxZ(this.dragging.piece.l) + 1
        )
      }

      mouseup.preventDefault()
      this.cancel()
    }
  }

  cancel () {
    this.dragging?.parentNode && this.dragging.parentNode.removeChild(this.dragging)
    this.dragging = null
    setCursor()
  }
}
