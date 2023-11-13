/**
 * @file Common modal handling. Keeps one modal instance at a time.
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

import _ from '../../lib/FreeDOM.mjs'
import Sync from '../../view/room/sync.mjs'

// -----------------------------------------------------------------------------

export default {
  close,
  create,
  createConfirm,
  isOpen,
  open
}

let modal = null /** Currently open Bootstrap modal instance */

// --- public ------------------------------------------------------------------

/**
 * Determine if the/a modal is currently open.
 *
 * @returns {boolean} True, if there is a modal open.
 */
function isOpen () {
  return modal !== null
}

/**
 * Initialize an 'empty' new modal.
 *
 * This is a modal with no card / white area in it, to be filled by the caller.
 *
 * @param {string} html Modal body content.
 * @returns {_} The modal's FreeDOM node ('#modal').
 */
function createRaw (html) {
  const node = _('#modal.modal.is-noselect').create()
  node.tabindex = -1
  _('body').add(node)

  node.innerHTML = html

  modal = new globalThis.bootstrap.Modal(node.node(), {
    backdrop: 'static',
    keyboard: true,
    focus: true
  })

  node.on('wheel', wheel => { // disable mouse zoom
    if (event.ctrlKey) {
      event.preventDefault()
    }
  })

  node.on('hidden.bs.modal', () => { close() })

  return node.node()
}

/**
 * Initialize a new modal.
 *
 * Assumes an hidden, empty modal frame to be present in the DOM as '#modal' and
 * will return it as Bootstrap Modal instance.
 *
 * @param {boolean} large If true, a large modal will be created. If false, a
 *                        regular (smaller) modal will be created.
 * @returns {_} The modal's FreeDOM node ('#modal').
 */
function create (large = false) {
  const node = createRaw(`
      <div class="modal-dialog">
        <div id="modal-content" class="modal-content">
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
 * Open/show modal if it already exists. Will not create one.
 */
function open () {
  modal?.show()
}

/**
 * Close and reset the current modal.
 *
 * Will also empty the `#modal` DOM node for reuse and trigger a new API poll.
 */
function close () {
  if (isOpen()) {
    modal.dispose()
    modal = null
    _('#modal').delete()
    _('.modal-backdrop').delete()
  }
  Sync.startAutoSync() // might have gotten shut down in long-opened modals
}

/**
 * Create a confirm / ok modal.
 *
 * Cancel/Esc will just close the modal.
 *
 * @param {string} title Modal title.
 * @param {string} body Modal body markup.
 * @param {string} button Label of OK button.
 * @param {object} data Data to pass on to OK handler.
 * @param {Function} onOk Handler to call on OK click.
 */
function createConfirm (title, body, button, data = {}, onOk = () => true) {
  if (!isOpen()) {
    create()

    _('#modal-header').innerHTML = title
    _('#modal-body').innerHTML = body

    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <button id='btn-ok' type="button" class="btn btn-primary">${button}</button>
    `

    _('#btn-close').on('click', () => modal.hide())
    _('#btn-ok').on('click', () => onOk(data))
    _('#modal')
      .add('.modal-small')

    modal.show()
  }
}
