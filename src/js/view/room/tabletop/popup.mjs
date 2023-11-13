/**
 * @file Code related to the right-click popup window/menu.
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

import { createPopper } from '@popperjs/core'

import _ from '../../../lib/FreeDOM.mjs'
import Dom from '../../../view/room/tabletop/dom.mjs'
import Icon from '../../../lib/icon.mjs'
import ModalLibrary from '../../../view/room/library/index.mjs'
import ModalSettings from '../../../view/room/modal/settings.mjs'
import Room from '../../../view/room/index.mjs'
import Selection from './selection.mjs'

// -----------------------------------------------------------------------------

export default {
  close,
  piece,
  table
}

// -----------------------------------------------------------------------------

/**
 * Show the popup menu for a piece.
 *
 * @param {object} piece The piece.
 */
function piece (piece) {
  close()
  const popup = _('#popper.popup.is-content').create()
  const f = Selection.getFeatures()

  popup.node().for = piece.id
  popup.innerHTML = `
    <a class="popup-menu edit ${f.edit ? '' : 'disabled'}" href="#">${Icon.EDIT}Edit</a>
    <a class="popup-menu rotate ${f.rotate ? '' : 'disabled'}" href="#">${Icon.ROTATE}Rotate</a>
    <a class="popup-menu flip ${f.flip ? '' : 'disabled'}" href="#">${Icon.FLIP}Flip</a>
    <a class="popup-menu random ${f.random ? '' : 'disabled'}" href="#">${Icon.SHUFFLE}Random</a>
    <a class="popup-menu pile ${f.move ? '' : 'disabled'}" href="#">${Icon.PILE}Pile</a>
    <a class="popup-menu top ${f.top ? '' : 'disabled'}" href="#">${Icon.TOP}To top</a>
    <a class="popup-menu bottom ${f.bottom ? '' : 'disabled'}" href="#">${Icon.BOTTOM}To bottom</a>
    ${(f.clone || f.delete) ? '<hr>' : ''}
    <a class="popup-menu clone ${f.clone ? '' : 'disabled'}" href="#">${Icon.COPY}Copy</a>
    <a class="popup-menu delete ${f.delete ? '' : 'disabled'}" href="#">${Icon.DELETE}Delete</a>
  `
  _('#tabletop').add(popup)

  popupClick('#popper .edit', () => { Selection.edit() })
  popupClick('#popper .rotate', () => { Selection.rotate() })
  popupClick('#popper .flip', () => { Selection.flip() })
  popupClick('#popper .pile', () => { Selection.pile() })
  // popupClick('#popper .shuffle', () => { Selection.pile(true) })
  popupClick('#popper .random', () => { Selection.random() })
  popupClick('#popper .top', () => { Selection.toTop() })
  popupClick('#popper .bottom', () => { Selection.toBottom() })
  popupClick('#popper .delete', () => { Selection.remove() })
  popupClick('#popper .clone', () => { Selection.copy() })

  createPopper(_('#' + piece.id).node(), popup.node(), {
    placement: 'right'
  })
  popup.add('.show')
}

/**
 * Show the popup menu for the table.
 *
 * @param {object} coords {x, y} coords to show the popup at.
 */
function table (coords) {
  close()
  const anchor = _('#popper-anchor.popup-anchor').create()
  const popup = _('#popper.popup.is-content').create()

  popup.innerHTML = `
    <a class="popup-menu add" href="#">${Icon.ADD}Add piece</a>
    <a class="popup-menu note" href="#">${Icon.NOTE}Add note</a>
    ${Selection.clipboardGetPieces().length > 0 ? '<a class="popup-menu paste" href="#">' + Icon.PASTE + 'Paste</a>' : ''}
    <hr>
    <a class="popup-menu settings" href="#">${Icon.SETTINGS}Settings</a>
  `

  _('#tabletop').add(anchor)
  const zoomedCoords = Room.zoomCoordinates(coords)
  anchor.css({
    left: `${zoomedCoords.x}px`,
    top: `${zoomedCoords.y}px`
  })
  _('#tabletop').add(popup)

  popupClick('#popper .add', () => { ModalLibrary.open(coords) })
  popupClick('#popper .note', () => { Dom.createNote(coords) })
  popupClick('#popper .paste', () => { Selection.paste(coords) })
  popupClick('#popper .settings', () => { ModalSettings.open() })

  createPopper(anchor.node(), popup.node(), {
    placement: 'right'
  })
  popup.add('.show')
}

/**
 * Hide/remove the current popup (if any).
 *
 * @param {string} id If this optional ID is given, the popup is only removed if it belongs to it.
 */
function close (id) {
  const popper = _('#popper')
  if (id && popper.exists() && popper.node().for !== id) return
  popper.delete()
  _('#popper-anchor').delete()
}

// --- private -----------------------------------------------------------------

/**
 * Handle the click on a popup menu item.
 *
 * Will hide the popup and then run a callback.
 *
 * @param {string} selector CSS selector for menu item.
 * @param {Function} callback Method to call.
 */
function popupClick (selector, callback) {
  _(selector).on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    callback()
  })
}
