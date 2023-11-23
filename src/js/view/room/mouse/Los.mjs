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

export class Los extends MouseButtonHandler {
  constructor () {
    super()
    this.los = null
  }

  isPreDrag () {
    return this.los === null
  }

  isDragging () {
    return this.los !== null
  }

  push (mousedown) {
    if (this.isDragging()) { // you can't drag twice
      this.los = null
      mousedown.preventDefault()
      return
    }

    const coords = Mouse.getMouseCoords()
    const snapped = Content.snap(coords.x, coords.y, 2)

    this.los = {
      originX: mousedown.shiftKey ? coords.x : snapped.x,
      originY: mousedown.shiftKey ? coords.y : snapped.y
    }

    mousedown.preventDefault()
  }

  drag (mousemove) {
    if (this.isDragging()) {
      const coords = Mouse.getMouseCoords()
      const snapped = Content.snap(coords.x, coords.y, 2)
      const width = (mousemove.shiftKey ? coords.x : snapped.x) - this.los.originX
      const height = (mousemove.shiftKey ? coords.y : snapped.y) - this.los.originY

      if (width !== this.los.width || height !== this.los.height) {
        // we need to re-create the SVG
        _(`#${Content.ID.LOS}-drag`).delete()

        this.los.width = width
        this.los.height = height

        if (width !== 0 || height !== 0) { // we don't care about zero-length lines
          const svg = Dom.createLosPiece(this.los.originX, this.los.originY, this.los.width, this.los.height)
          svg.id = `${Content.ID.LOS}-drag`
          _('#layer-other').add(svg)
        }
      }

      mousemove.preventDefault()
    }
  }

  release (mouseup) { // just hide line
    if (this.isDragging()) {
      if (mouseup) {
        mouseup.preventDefault()
      } else {
        // persist line on server after space press
        Dom.losTo(this.los.originX, this.los.originY, this.los.width, this.los.height)
      }
      this.cancel()
    }
  }

  cancel () {
    _(`#${Content.ID.LOS}-drag`).delete()
    this.los = null
  }
}
