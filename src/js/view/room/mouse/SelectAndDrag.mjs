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
  clamp,
  sortByNumber
} from '../../../lib/utils.mjs'

import {
  MouseButtonHandler
} from '../../../view/room/mouse/_MouseButtonHandler.mjs'

import {
  movePieces,
  isLayerActive,
  getRoom
} from '../../../state/index.mjs'

import {
  getMouseCoords
} from '../../../view/room/mouse/index.mjs'

import {
  findRealClickTarget,
  findPiecesContained,
  snap,
  ID,
  LAYER_NOTE
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  selectionGetPieces,
  selectionAdd,
  selectionClear,
  selectionGetFeatures,
  findMaxZBelowSelection
} from '../../../view/room/tabletop/selection.mjs'

import {
  updateSelection,
  setCursor
} from '../../../view/room/index.mjs'

import {
  moveNodeTo,
  createSelectPiece,
  updateSelectionDOM
} from '../../../view/room/tabletop/index.mjs'

export class SelectAndDrag extends MouseButtonHandler {
  constructor () {
    super()
    this.dragging = [] // the currently dragged objects
    this.selectionBounds = {} // bounding box of whole selection
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
    // we only react on pieces or the tabletop
    if (!mousedown.target.classList.contains('piece') &&
      !mousedown.target.classList.contains('tabletop')) return

    mousedown.preventDefault()

    findRealClickTarget(mousedown, getMouseCoords()).then(target => {
      if (target) { // drag mode
        updateSelection(target, mousedown.ctrlKey)
        this.dragStart()
      } else { // select mode
        this.selectStart()
      }
      updateSelectionDOM()
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
      if (!mouseup.ctrlKey) selectionClear()
      this.selectEnd()
      mouseup.preventDefault()
    } else if (this.isMoving()) {
      this.dragEnd()
      mouseup.preventDefault()
    }
    updateSelectionDOM()
  }

  cancel () {
    this.clear()
    setCursor()
  }

  clear () {
    for (const node of this.dragging) {
      node.parentNode && node.parentNode.removeChild(node)
    }
    _(`#${ID.SELECT}-drag`).delete()
    this.dragging = []
    this.multiselect = null
  }

  // --- (multi) select --------------------------------------------------------

  selectStart () {
    const coords = getMouseCoords()

    this.multiselect = {
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0
    }
  }

  selectContinue () {
    const coords = getMouseCoords()
    this.multiselect.width = coords.x - this.multiselect.x
    this.multiselect.height = coords.y - this.multiselect.y

    _(`#${ID.SELECT}-drag`).delete()
    if (this.multiselect.width !== 0 && this.multiselect.height !== 0) {
      const svg = createSelectPiece(this.multiselect.x, this.multiselect.y, this.multiselect.width, this.multiselect.height)
      svg.id = `${ID.SELECT}-drag`
      _('#layer-other').add(svg)
    }
  }

  selectEnd () {
    for (const piece of findPiecesContained({
      left: this.multiselect.width >= 0 ? this.multiselect.x : this.multiselect.x + this.multiselect.width,
      top: this.multiselect.height >= 0 ? this.multiselect.y : this.multiselect.y + this.multiselect.height,
      right: this.multiselect.width >= 0 ? this.multiselect.x + this.multiselect.width : this.multiselect.x,
      bottom: this.multiselect.height >= 0 ? this.multiselect.y + this.multiselect.height : this.multiselect.y
    })) {
      if (isLayerActive(piece.l) || piece.l === LAYER_NOTE) {
        selectionAdd(piece.id)
      }
    }
    this.clear()
  }

  // --- drag+drop -------------------------------------------------------------

  dragStart () {
    const coords = getMouseCoords()

    if (this.isMoving()) { // you can't drag twice
      this.clear() // quick fix for release-outsite bug
      return
    }

    for (const piece of sortByNumber(selectionGetPieces(), 'z', 0)) {
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

    this.selectionBounds = selectionGetFeatures().boundingBox
    this.selectionBounds.startX = coords.x
    this.selectionBounds.startY = coords.y
    this.selectionBounds.xa = this.selectionBounds.startX - this.selectionBounds.left
    this.selectionBounds.xb = this.selectionBounds.right - this.selectionBounds.startX
    this.selectionBounds.ya = this.selectionBounds.startY - this.selectionBounds.top
    this.selectionBounds.yb = this.selectionBounds.bottom - this.selectionBounds.startY
    this.selectionBounds.finalCenterX = this.selectionBounds.x
    this.selectionBounds.finalCenterY = this.selectionBounds.y

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

    setCursor('.cursor-grab')
  }

  dragContinue (shiftKey) {
    const room = getRoom()
    const coords = getMouseCoords()
    const clampCoords = {
      x: clamp(this.selectionBounds.xa, coords.x, room.width - 1 - this.selectionBounds.xb),
      y: clamp(this.selectionBounds.ya, coords.y, room.height - 1 - this.selectionBounds.yb)
    }

    // how far to shift all selected pieces so they still snap afterwards?
    const offset = snap(
      this.selectionBounds.x + clampCoords.x - this.selectionBounds.startX,
      this.selectionBounds.y + clampCoords.y - this.selectionBounds.startY,
      shiftKey ? 4 : undefined
    )
    offset.x -= this.selectionBounds.x
    offset.y -= this.selectionBounds.y

    this.selectionBounds.finalCenterX = this.selectionBounds.x + offset.x // for dragEnd()
    this.selectionBounds.finalCenterY = this.selectionBounds.y + offset.y // for dragEnd()

    for (const node of this.dragging) {
      node.classList.remove('is-dragging-hidden') // we are moving now (1)
      moveNodeTo(
        node,
        node.piece.x + offset.x,
        node.piece.y + offset.y
      )
    }
  }

  dragEnd () {
    // find the highest Z in the target area not occupied by the selection itself
    const zLower = findMaxZBelowSelection(
      this.selectionBounds.finalCenterX,
      this.selectionBounds.finalCenterY
    )

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
    movePieces(toMove)

    this.cancel()
  }
}
