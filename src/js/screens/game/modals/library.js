/**
 * @file Handles the library modal.
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

import {
  getLibrary,
  stateCreatePiece,
  stateGetGamePref,
  stateSetGamePref
} from '../state.js'

import {
  getMaxZ,
  nodeToPiece,
  assetToNode
} from '..'
import _ from '../../../FreeDOM.js'
import { toTitleCase } from '../../../utils.js'
import { createModal, getModal, modalActive, modalClose } from '../../../modal.js'

// --- public ------------------------------------------------------------------

/**
 * Show the pieces library modal.
 *
 * @param {Number} x X grid coordinate where to add items on close.
 * @param {Number} y Y grid coordinate where to add items on close.
 */
export function modalLibrary (x, y) {
  if (!modalActive()) {
    const node = createModal(true)
    node.x = x
    node.y = y

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">Add piece</h3>
    `
    _('#modal-body').innerHTML = `
      <div class="spinner">Loading</div>
    `
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <button id='btn-ok' type="button" class="btn btn-primary">Add</button>
    `

    _('#btn-close').on('click', () => getModal().hide())
    _('#btn-ok').on('click', () => modalOk())
    _('#modal').on('hidden.bs.modal', () => modalClose())

    const library = getLibrary()

    _('#modal-body').innerHTML = `
      <div id="tabs-library" class="tabs">
        <input id="tab-1" type="radio" name="tabs">
        <input id="tab-2" type="radio" name="tabs">
        <input id="tab-3" type="radio" name="tabs">
        <div class="tabs-tabs">
          <label for="tab-1" class="tabs-tab">Tiles</label>
          <label for="tab-2" class="tabs-tab">Overlays</label>
          <label for="tab-3" class="tabs-tab">Token</label>
        </div>
        <div class="tabs-content">
          <div class="container"><div id="tab-tiles" class="row"></div></div>
          <div class="container"><div id="tab-overlays" class="row"></div></div>
          <div class="container"><div id="tab-tokens" class="row"></div></div>
        </div>
      </div>
    `

    _('input[name="tabs"]').on('change', change => {
      stateSetGamePref('modalLibraryTab', change.target.id)
    })

    const preselect = stateGetGamePref('modalLibraryTab') ?? 'tab-1'
    _('#' + preselect).checked = true

    // add items to their tab
    const tiles = _('#tab-tiles')
    for (const asset of library.tile) { tiles.add(assetToPreview(asset)) }
    const overlays = _('#tab-overlays')
    for (const asset of library.overlay) { overlays.add(assetToPreview(asset)) }
    const tokens = _('#tab-tokens')
    for (const asset of library.token) { tokens.add(assetToPreview(asset)) }

    // enable selection
    _('#tabs-library .col-6').on('click', click => {
      _('#tabs-library .is-selected').remove('.is-selected')
      _(click.target).toggle('.is-selected')
      click.preventDefault()
    })

    getModal().show()
  }
}

// --- internal ----------------------------------------------------------------

/**
 * Convert a library entry to a preview DOM element.
 *
 * @param {Object} assetJson The asset to convert.
 * @return {HTMLElement} Node for the modal.
 */
function assetToPreview (assetJson) {
  const asset = assetToNode(assetJson).add(
    assetJson.type === 'tile' ? '.is-scale-2' : '.is-scale-2',
    '.is-w-' + assetJson.width + '.is-h-' + assetJson.height
  )
  const card = _('.col-6.col-sm-4.col-md-3.col-lg-2.col-card').create(asset)
  if (assetJson.assets.length > 1) {
    asset.add(_('.tag.tr').create().add(document.createTextNode(
      `${assetJson.width ?? 1}x${assetJson.height ?? 1}:${assetJson.assets.length ?? 0}`
    )))
  } else {
    asset.add(_('.tag.tr').create().add(document.createTextNode(
      `${assetJson.width ?? 1}x${assetJson.height ?? 1}`
    )))
  }
  card.add(_('p').create().add(document.createTextNode(
    `${prettyName(assetJson.alias)}`
  )))
  return card
}

/**
 * Make an asset's name readable.
 *
 * Drops the group part (before the dot) and title-cases the rest.
 *
 * @param {String} assetName Name to convert, e.g. 'dungeon.ironDoor'.
 * @return {String} Improved name, e.g. 'Iron Door'.
 */
function prettyName (assetName) {
  const split = assetName.split('.')
  if (split.length <= 1) return toTitleCase(split[0])
  return toTitleCase(split[1].replace(/([A-Z]+)/, ' $1').trim())
}

/**
 * Hides modal and adds the selected piece after user clicks OK.
 */
function modalOk () {
  const selected = document.querySelectorAll('#tabs-library .is-selected .piece')
  if (selected.length > 0) {
    const m = document.getElementById('modal')
    const piece = nodeToPiece(selected[0])
    piece.x = Number(m.x)
    piece.y = Number(m.y)
    piece.z = getMaxZ(piece.layer) + 1
    stateCreatePiece(piece, true)

    getModal().hide()
  }
}
