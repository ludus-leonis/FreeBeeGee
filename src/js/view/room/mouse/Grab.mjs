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
  getScrollPosition,
  setScrollPosition,
  setCursor
} from '../../../view/room/index.mjs'

import {
  clamp
} from '../../../lib/utils.mjs'

export class Grab extends MouseButtonHandler {
  constructor () {
    super()
    this.grabbing = null
  }

  isPreDrag () {
    return this.grabbing === null
  }

  isDragging () {
    return this.grabbing !== null
  }

  push (mousedown) {
    if (this.isDragging()) { // you can't grab twice
      this.grabbing = null
      mousedown.preventDefault()
      return
    }

    // find the tabletop
    let tabletop = mousedown.target
    while (tabletop !== null && !tabletop.classList.contains('tabletop')) {
      tabletop = tabletop.parentNode
    }
    if (!tabletop) return // no tabletop no grab
    setCursor('.cursor-grab')

    // record start position
    this.grabbing = {
      startX: mousedown.clientX, // no need to compensate, as we
      startY: mousedown.clientY, // only calculate offset anyway
      origin: getScrollPosition(),
      rectInner: tabletop.getBoundingClientRect(),
      rectOuter: tabletop.parentNode.getBoundingClientRect()
    }

    mousedown.preventDefault()
  }

  drag (mousemove) {
    if (this.isDragging()) {
      const scrollToX = clamp(
        0,
        this.grabbing.origin.x + (this.grabbing.startX - mousemove.clientX),
        this.grabbing.rectInner.width - this.grabbing.rectOuter.width
      )
      const scrollToY = clamp(
        0,
        this.grabbing.origin.y + (this.grabbing.startY - mousemove.clientY),
        this.grabbing.rectInner.height - this.grabbing.rectOuter.height
      )
      setScrollPosition(scrollToX, scrollToY)
      mousemove.preventDefault()
    }
  }

  release (mouseup) {
    this.cancel()
  }

  cancel () {
    this.grabbing = null
    setCursor()
  }
}
