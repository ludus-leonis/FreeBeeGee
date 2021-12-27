/**
 * @file Common modal handling. Keeps one modal instance at a time.
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

import _ from 'lib/FreeDOM.mjs'

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
 * Initialize an 'empty' new modal.
 *
 * This is a modal with no card / white area in it, to be filled by the caller.
 *
 * @return {FreeDOM} The modal's DOM node ('#modal').
 */
export function createModalRaw (html) {
  const node = _('#modal.modal.is-noselect').create()
  node.tabindex = -1
  _('body').add(node)

  node.innerHTML = html

  modal = new globalThis.bootstrap.Modal(node.node(), {
    backdrop: 'static',
    keyboard: true,
    focus: true
  })

  return node.node()
}

/**
 * Initialize a new modal.
 *
 * Assumes an hidden, empty modal frame to be present in the DOM as '#modal' and
 * will return it as Bootstrap Modal instance.
 *
 * @param {Boolean} large If true, a large modal will be created. If false, a
 *                        regular (smaller) modal will be created.
 * @return {FreeDOM} The modal's DOM node ('#modal').
 */
export function createModal (large = false) {
  const node = createModalRaw(`
      <div class="modal-dialog">
        <div id="modal-content class="modal-content">
          <div id="modal-header" class="modal-header is-content"></div>
          <div id="modal-body" class="modal-body is-content"></div>
          <div id="modal-footer" class="modal-footer fb"></div>
        </div>
      </div>
    `)

  if (large) node.classList.add('modal-large')

  return node
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
    _('#modal').delete()
    _('.modal-backdrop').delete()
  }
}
