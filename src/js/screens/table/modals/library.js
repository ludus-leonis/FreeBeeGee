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
  getTemplate,
  stateCreatePiece,
  stateGetTablePref,
  stateSetTablePref
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
      <div class="has-spinner">Loading</div>
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
        <input id="tab-4" type="radio" name="tabs">
        <div class="tabs-tabs">
          <label for="tab-1" class="tabs-tab">Tiles</label>
          <label for="tab-2" class="tabs-tab">Overlays</label>
          <label for="tab-3" class="tabs-tab">Token</label>
          <label for="tab-4" class="tabs-tab">Dice &amp; Cards</label>
        </div>
        <div class="tabs-content">
          <div class="container"><div id="tab-tiles" class="row"></div></div>
          <div class="container"><div id="tab-overlays" class="row"></div></div>
          <div class="container"><div id="tab-tokens" class="row"></div></div>
          <div class="container"><div id="tab-other" class="row"></div></div>
        </div>
      </div>
    `

    // store/retrieve selected tab
    _('input[name="tabs"]').on('change', change => {
      stateSetTablePref('modalLibraryTab', change.target.id)
    })
    const preselect = stateGetTablePref('modalLibraryTab') ?? 'tab-1'
    _('#' + preselect).checked = true

    // add items to their tab
    const tiles = _('#tab-tiles')
    for (const asset of library.tile ?? []) { tiles.add(assetToPreview(asset)) }
    const overlays = _('#tab-overlays')
    for (const asset of library.overlay ?? []) { overlays.add(assetToPreview(asset)) }
    const tokens = _('#tab-tokens')
    for (const asset of library.token ?? []) { tokens.add(assetToPreview(asset)) }
    const other = _('#tab-other')
    for (const asset of library.other ?? []) { other.add(assetToPreview(asset)) }

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
    '.is-w-' + assetJson.width,
    '.is-h-' + assetJson.height
  )

  const max = _('.is-scale-2').create(asset)
  const card = _('.col-6.col-sm-4.col-md-3.col-lg-2.col-card').create(max)
  asset.add('.is-max-' + Math.max(assetJson.width, assetJson.height))
  let tag = ''
  if (assetJson.width > 2 || assetJson.height > 2) {
    tag = `${assetJson.width}x${assetJson.height}`
  }
  if (assetJson.assets.length > 1) {
    tag += `:${assetJson.assets.length}`
  }
  if (tag !== '') max.add(_('.tag.tr').create().add(tag))
  card.add(_('p').create().add(`${prettyName(assetJson.alias)}`))
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
    const template = getTemplate()
    const m = document.getElementById('modal')
    const piece = nodeToPiece(selected[0])
    piece.x = Number(m.x * template.gridSize)
    piece.y = Number(m.y * template.gridSize)
    piece.z = getMaxZ(piece.layer) + 1
    stateCreatePiece(piece, true)

    getModal().hide()
  }
}
