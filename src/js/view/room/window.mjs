/**
 * @file Common fullscreen-modal handling. Keeps one instance at a time.
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

import _ from 'src/js/lib/FreeDOM.mjs'
import * as Sync from 'src/js/view/room/sync.mjs'

let window = null // currently open instance

// --- public ------------------------------------------------------------------

/**
 * Determine if the/a modal is currently open.
 *
 * @returns {boolean} True, if there is a modal open.
 */
export function isOpen () {
  return window !== null
}

/**
 * Initialize an 'empty' full screen window.
 *
 * @returns {_} The modal's FreeDOM node ('#window').
 */
export function create () {
  close()
  window = _('#window.window.is-noselect').create()
  window.add(_('.window-header').create())
  window.add(_('.window-body').create())
  window.tabindex = -1
  _('body').add(window)
  return window
}

/**
 * Close and reset the current modal.
 *
 * Will also empty the `#modal` DOM node for reuse and trigger a new API poll.
 */
export function close () {
  window = null
  _('.window').delete() // delete all DOM nodes
  Sync.startAutoSync() // might have gotten shut down in long-opened windows
}
