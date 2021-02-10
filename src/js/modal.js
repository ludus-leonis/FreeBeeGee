/**
 * @file Handles various modal windows but only keeps one modal instance at a
 *       time.
 * @module
 * @copyright 2021 Markus Leupold-Löwenthal
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

import _ from './FreeDOM.js'

let modal = null /** Currently open Bootstrap modal instance */

// --- public ------------------------------------------------------------------

/**
 * Get the currently open modal.
 *
 * @return {Modal} Bootstrap Modal or null if currently closed.
 */
export function getModal () {
  return modal
}

/**
 * Determine if the/a modal is currently open.
 *
 * @return {Boolean} True, if there is a modal open.
 */
export function modalActive () {
  return modal !== null
}

/**
 * Initialize a new modal.
 *
 * Assumes an hidden, empty modal frame to be present in the DOM as '#modal' and
 * will return it as Bootstrap Modal instance.
 *
 * @param {Boolean} large If true, a large modal will be created. If false, a
 *                        regular, smaller modal will be created.
 * @return {HTMLElement} The modal's DOM node ('#modal').
 */
export function createModal (large = false) {
  const n = _('#modal')
  if (large) {
    n.add('.modal-large')
  } else {
    n.remove('.modal-large')
  }

  modal = new globalThis.bootstrap.Modal(n.node(), {
    backdrop: 'static',
    // keyboard: false, // keyboard false to avoid not firing close handler
    focus: true
  })

  return n.node()
}

/**
 * Close and reset the current modal.
 *
 * Will also empty the `#modal` DOM node for reuse.
 */
export function modalClose () {
  if (modalActive()) {
    modal.dispose()
    modal = null
    // cleanup modal for re-use
    _('#modal-header').innerHTML = ''
    _('#modal-body').innerHTML = ''
    _('#modal-footer').innerHTML = ''
  }
}
