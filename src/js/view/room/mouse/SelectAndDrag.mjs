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
import { MouseButtonHandler } from './_MouseButtonHandler.mjs'
import * as Content from '../../../view/room/tabletop/content.mjs'
import * as Dom from '../../../view/room/tabletop/dom.mjs'
import * as Mouse from '../../../view/room/mouse/index.mjs'
import * as Room from '../../../view/room/index.mjs'
import * as Selection from '../../../view/room/tabletop/selection.mjs'
import * as State from '../../../state/index.mjs'
import * as Text from '../../../lib/util-text.mjs'
import * as Util from '../../../lib/util.mjs'

export class SelectAndDrag extends MouseButtonHandler {
  constructor () {
    super()
    this.dragging = [] // the currently dragged objects
    this.dragData = {} // bounding box of whole selection
    this.multiselect = null // the select-square area
  }

  isPreDrag () {
    return this.dragging.length <= 0 && this.multiselect === null
  }

  isDragging () {
    return !this.isPreDrag()
  }

  isSelecting () {
    return this.multiselect !== null
  }

  isMoving () {
    return this.dragging.length > 0
  }

  push (mousedown) {
    const piece = this.findParentPiece(mousedown.target)
    if (!piece) return
    mousedown.preventDefault()

    Content.findRealClickTarget(piece, Mouse.getMouseCoords()).then(target => {
      if (target) { // drag mode
        Room.updateSelection(target, mousedown.ctrlKey)
        this.dragStart(target.piece)
      } else { // select mode
        this.selectStart()
      }
      Dom.updateSelection()
    })
  }

  drag (mousemove) {
    if (this.isSelecting()) {
      this.selectContinue()
      mousemove.preventDefault()
    } else if (this.isMoving()) {
      this.dragContinue(mousemove.shiftKey)
      mousemove.preventDefault()
    }
  }

  release (mouseup) {
    if (this.isSelecting()) {
      if (!mouseup.ctrlKey) Selection.clear()
      this.selectEnd()
      mouseup.preventDefault()
    } else if (this.isMoving()) {
      this.dragEnd()
      mouseup.preventDefault()
    }
    Dom.updateSelection()
  }

  cancel () {
    this.clear()
    Dom.setCursor()
  }

  clear () {
    for (const node of this.dragging) {
      node.parentNode && node.parentNode.removeChild(node)
    }
    _(`#${Content.ID.SELECT}-drag`).delete()
    this.dragging = []
    this.multiselect = null
  }

  // --- (multi) select --------------------------------------------------------

  selectStart () {
    const coords = Mouse.getMouseCoords()

    this.multiselect = {
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0
    }
  }

  selectContinue () {
    const tableCoords = Mouse.getMouseCoords()
    this.multiselect.width = tableCoords.x - this.multiselect.x
    this.multiselect.height = tableCoords.y - this.multiselect.y

    _(`#${Content.ID.SELECT}-drag`).delete()
    if (this.multiselect.width !== 0 && this.multiselect.height !== 0) {
      const svg = Dom.createSelectPiece(
        this.multiselect.x,
        this.multiselect.y,
        this.multiselect.width,
        this.multiselect.height
      )
      svg.id = `${Content.ID.SELECT}-drag`
      _('#layer-other').add(svg)
    }
  }

  selectEnd () {
    for (const piece of Content.findPiecesContained({
      left: this.multiselect.width >= 0 ? this.multiselect.x : this.multiselect.x + this.multiselect.width,
      top: this.multiselect.height >= 0 ? this.multiselect.y : this.multiselect.y + this.multiselect.height,
      right: this.multiselect.width >= 0 ? this.multiselect.x + this.multiselect.width : this.multiselect.x,
      bottom: this.multiselect.height >= 0 ? this.multiselect.y + this.multiselect.height : this.multiselect.y
    })) {
      if (State.isLayerActive(piece.l) || piece.l === Content.LAYER.NOTE) {
        Selection.select(piece.id)
      }
    }
    this.clear()
  }

  // --- drag+drop -------------------------------------------------------------

  dragStart (piece) {
    const coords = Mouse.getMouseCoords()

    if (this.isMoving()) { // you can't drag twice
      this.clear() // quick fix for release-outsite bug
      return
    }

    for (const piece of Text.sortNumber(Selection.getPieces(), 'z', 0)) {
      const originial = _(`#${piece.id}`).node()

      const clone = originial.cloneNode(true)
      clone.id = clone.id + '-drag'
      clone.piece = piece

      clone.style.zIndex = 999999999 // drag visually on top of everything
      clone.classList.add('is-dragging')
      clone.classList.add('is-dragging-hidden') // hide new item till it gets moved (1)
      originial.parentNode.appendChild(clone)

      clone.x = clone.piece.x
      clone.y = clone.piece.y

      this.dragging.push(clone)
    }

    this.dragData = Selection.getFeatures().boundingBox
    this.dragData.startX = coords.x
    this.dragData.startY = coords.y
    this.dragData.xa = this.dragData.startX - this.dragData.left
    this.dragData.xb = this.dragData.right - this.dragData.startX
    this.dragData.ya = this.dragData.startY - this.dragData.top
    this.dragData.yb = this.dragData.bottom - this.dragData.startY

    // use click target center instead of selection center to avoid hickups
    this.dragData.center.x = piece.x
    this.dragData.center.y = piece.y

    this.dragData.finalCenterX = this.dragData.center.x
    this.dragData.finalCenterY = this.dragData.center.y

    // xa/xb and ya/yb are the distance between the first drag-click and the
    // selection border:
    // +--------------------+
    // |             |      |
    // |             ya     |
    // |             |      |
    // |-----xa------*--xb--+
    // |            /|      |
    // |       click |      |
    // |             yb     |
    // |             |      |
    // |             |      |
    // +--------------------+
  }

  dragContinue (shiftKey) {
    if (!this.dragData.cursor) { // set cursor (only once)
      Dom.setCursor('.cursor-grab')
      this.dragData.cursor = true
    }

    const room = State.getRoom()
    const coords = Mouse.getMouseCoords()
    const clampCoords = {
      x: Util.clamp(this.dragData.xa, coords.x, room.width - 1 - this.dragData.xb),
      y: Util.clamp(this.dragData.ya, coords.y, room.height - 1 - this.dragData.yb)
    }

    // how far to shift all selected pieces so they still snap afterwards?
    const offset = Content.snap(
      this.dragData.center.x + clampCoords.x - this.dragData.startX,
      this.dragData.center.y + clampCoords.y - this.dragData.startY,
      shiftKey ? 4 : undefined
    )
    offset.x -= this.dragData.center.x
    offset.y -= this.dragData.center.y

    this.dragData.finalCenterX = this.dragData.center.x + offset.x // for dragEnd()
    this.dragData.finalCenterY = this.dragData.center.y + offset.y // for dragEnd()

    for (const node of this.dragging) {
      node.classList.remove('is-dragging-hidden') // we are moving now (1)
      Dom.moveNodeTo(
        node,
        node.piece.x + offset.x,
        node.piece.y + offset.y
      )
    }
  }

  dragEnd () {
    // find the highest Z in the target area not occupied by the selection itself

    const zLower = Content.findMaxZs(Selection.getPieces(), Selection.getPieces(), {
      x: this.dragData.finalCenterX,
      y: this.dragData.finalCenterY
    })

    // move the pieces
    const toMove = []
    const zUpper = {}
    for (const node of this.dragging.sort((a, b) => {
      return (a.piece.z ?? 0) - (b.piece.z ?? 0) // sort by Z to keep stack order
    })) {
      // only record state if there was a change in position
      if (node.piece.x !== node.x ||
        node.piece.y !== node.y) {
        zUpper[node.piece.l] = (zUpper[node.piece.l] ?? 0) + 1 // init or increase
        toMove.push({
          id: node.piece.id,
          x: node.x,
          y: node.y,
          z: (zLower[node.piece.l] ?? 0) + zUpper[node.piece.l]
        })
      }
    }
    State.movePieces(toMove)

    this.cancel()
  }
}
