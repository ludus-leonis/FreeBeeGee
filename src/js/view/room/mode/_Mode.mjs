/**
 * @file Handle all features of a specific tabletop/game mode.
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

export class Mode {
  enter () { // initialize UI
  }

  quit () { // initialize UI
  }

  update () { // update UI, e.g. grey-out states
  }

  keydown (keydown) { // handle mode-specific hotkeys
  }

  keydrag (keydown) { // keys pressed during dragging
  }

  mousedown (mousedown) { // handle mode-specific mouse buttons
  }
}
