/**
 * @file Code related to the right-click popup window/menu.
 * @module
 * @copyright 2021-2023 Markus Leupold-Löwenthal
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

import { createPopper } from '@popperjs/core'

import _ from '../../../lib/FreeDOM.mjs'

import {
  iconAdd,
  iconNote,
  iconSettings,
  iconEdit,
  iconRotate,
  iconFlip,
  iconShuffle,
  iconPile,
  iconTop,
  iconBottom,
  iconClone,
  iconDelete
} from '../../../lib/icons.mjs'

import {
  selectionGetFeatures
} from './selection.mjs'

import {
  createNote,
  editSelected,
  rotateSelected,
  flipSelected,
  randomSelected,
  pileSelected,
  toTopSelected,
  toBottomSelected,
  deleteSelected,
  cloneSelected
} from '../../../view/room/tabletop/index.mjs'

import {
  getMouseCoords
} from '../../../view/room/mouse/index.mjs'

import {
  modalSettings
} from '../../../view/room/modal/settings.mjs'

import {
  modalLibrary
} from '../../../view/room/modal/library/index.mjs'

import {
  zoomCoordinates
} from '../../../view/room/index.mjs'

/**
 * Show the popup menu for a piece.
 *
 * @param {Object} piece The piece.
 */
export function popupPiece (piece) {
  popupHide()
  const popup = _('#popper.popup.is-content').create()
  const f = selectionGetFeatures()

  popup.node().for = piece.id
  popup.innerHTML = `
    <a class="popup-menu edit ${f.edit ? '' : 'disabled'}" href="#">${iconEdit}Edit</a>
    <a class="popup-menu rotate ${f.rotate ? '' : 'disabled'}" href="#">${iconRotate}Rotate</a>
    <a class="popup-menu flip ${f.flip ? '' : 'disabled'}" href="#">${iconFlip}Flip</a>
    <a class="popup-menu random ${f.random ? '' : 'disabled'}" href="#">${iconShuffle}Random</a>
    <a class="popup-menu pile ${f.pile ? '' : 'disabled'}" href="#">${iconPile}Pile</a>
    <a class="popup-menu top ${f.top ? '' : 'disabled'}" href="#">${iconTop}To top</a>
    <a class="popup-menu bottom ${f.bottom ? '' : 'disabled'}" href="#">${iconBottom}To bottom</a>
    ${(f.clone || f.delete) ? '<hr>' : ''}
    <a class="popup-menu clone ${f.clone ? '' : 'disabled'}" href="#">${iconClone}Clone</a>
    <a class="popup-menu delete ${f.delete ? '' : 'disabled'}" href="#">${iconDelete}Delete</a>
  `
  // <a class="popup-menu shuffle ${f.pile ? '' : 'disabled'}" href="#">${iconPileShuffle}Pile &amp; shuffle</a>

  _('#tabletop').add(popup)

  popupClick('#popper .edit', () => { editSelected() })
  popupClick('#popper .rotate', () => { rotateSelected() })
  popupClick('#popper .flip', () => { flipSelected() })
  popupClick('#popper .pile', () => { pileSelected() })
  // popupClick('#popper .shuffle', () => { pileSelected(true) })
  popupClick('#popper .random', () => { randomSelected() })
  popupClick('#popper .top', () => { toTopSelected() })
  popupClick('#popper .bottom', () => { toBottomSelected() })
  popupClick('#popper .delete', () => { deleteSelected() })
  popupClick('#popper .clone', () => { cloneSelected(getMouseCoords()) })

  createPopper(_('#' + piece.id).node(), popup.node(), {
    placement: 'right'
  })
  popup.add('.show')
}

/**
 * Show the popup menu for the table.
 *
 * @param coords {x, y} coords to show the popup at.
 */
export function popupTable (coords) {
  popupHide()
  const anchor = _('#popper-anchor.popup-anchor').create()
  const popup = _('#popper.popup.is-content').create()

  popup.innerHTML = `
    <a class="popup-menu add" href="#">${iconAdd}Add piece</a>
    <a class="popup-menu note" href="#">${iconNote}Add note</a>
    <hr>
    <a class="popup-menu settings" href="#">${iconSettings}Settings</a>
  `

  _('#tabletop').add(anchor)
  const zoomedCoords = zoomCoordinates(coords)
  anchor.css({
    left: `${zoomedCoords.x}px`,
    top: `${zoomedCoords.y}px`
  })
  _('#tabletop').add(popup)

  popupClick('#popper .add', () => { modalLibrary(coords) })
  popupClick('#popper .note', () => { createNote(coords) })
  popupClick('#popper .settings', () => { modalSettings() })

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
export function popupHide (id) {
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
 * @param {String} selector CSS selector for menu item.
 * @param {callback} callback Method to call.
 */
function popupClick (selector, callback) {
  _(selector).on('click', click => {
    click.preventDefault()
    _('#popper').remove('.show')
    callback()
  })
}
