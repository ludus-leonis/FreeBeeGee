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
  createPieces,
  stateGetTablePref,
  stateSetTablePref
} from '../state.js'

import {
  getMaxZ,
  nodeToPiece,
  assetToNode
} from '..'
import _ from '../../../FreeDOM.js'
import {
  toTitleCase,
  sortByString
} from '../../../utils.js'
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
      <h3 class="modal-title">Library</h3>
    `
    _('#modal-body').add('.is-maximizied').innerHTML = `
      <div class="has-spinner">Loading</div>
    `
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>

      <span class="search">${iconSearch}<input id='input-search' type="text" class="search" placeholder="search ..." maxlength="8"></span>

      <button id='btn-ok' type="button" class="btn btn-primary">Add</button>
    `

    _('#btn-close').on('click', () => getModal().hide())
    _('#btn-ok').on('click', () => modalOk())
    _('#input-search').on('keyup', () => filter())
    _('#modal').on('hidden.bs.modal', () => modalClose())

    const library = getLibrary()

    _('#modal-body').innerHTML = `
      <div id="tabs-library" class="tabs">
        <input id="tab-1" type="radio" name="tabs">
        <input id="tab-2" type="radio" name="tabs">
        <input id="tab-3" type="radio" name="tabs">
        <input id="tab-4" type="radio" name="tabs">
        <input id="tab-5" type="radio" name="tabs">
        <div class="tabs-tabs">
          <label for="tab-1" class="tabs-tab">Tiles</label>
          <label for="tab-2" class="tabs-tab">Overlays</label>
          <label for="tab-3" class="tabs-tab">Token</label>
          <label for="tab-4" class="tabs-tab">Dice &amp; Cards</label>
          <label for="tab-5" class="tabs-tab">Upload</label>
        </div>
        <div class="tabs-content">
          <div class="container"><div id="tab-tiles" class="row"></div></div>
          <div class="container"><div id="tab-overlays" class="row"></div></div>
          <div class="container"><div id="tab-tokens" class="row"></div></div>
          <div class="container"><div id="tab-other" class="row"></div></div>
          <div class="container"><div id="tab-upload" class="row"></div></div>
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
    for (const asset of sortByString(library.tile ?? [], 'alias')) {
      tiles.add(assetToPreview(asset))
    }
    const overlays = _('#tab-overlays')
    for (const asset of sortByString(library.overlay ?? [], 'alias')) {
      overlays.add(assetToPreview(asset))
    }
    const tokens = _('#tab-tokens')
    for (const asset of sortByString(library.token ?? [], 'alias')) {
      tokens.add(assetToPreview(asset))
    }
    const other = _('#tab-other')
    for (const asset of sortByString(library.other ?? [], 'alias')) {
      other.add(assetToPreview(asset))
    }

    // enable selection
    _('#tabs-library .col-6').on('click', click => {
      _(click.target).toggle('.is-selected')

      // update add button
      const count = _('#tabs-library .is-selected').count()
      let label
      switch (count) {
        case 0:
          label = 'Add'
          break
        case 1:
          label = 'Add 1'
          break
        default:
          label = 'Add ' + count
      }
      _('#btn-ok').innerHTML = label

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
    '.is-w-' + assetJson.w,
    '.is-h-' + assetJson.h
  )

  const max = _('.is-scale-2').create(asset)
  const card = _('.col-6.col-sm-4.col-md-3.col-lg-2.col-card').create(max)
  asset.add('.is-max-' + Math.max(assetJson.w, assetJson.h))
  max.add('.is-max-' + Math.max(assetJson.w, assetJson.h))
  let tag = ''
  if (assetJson.w > 2 || assetJson.h > 2) {
    tag = `${assetJson.w}x${assetJson.h}`
  }
  if (assetJson.assets.length > 1) {
    tag += `:${assetJson.assets.length}`
  }
  if (tag !== '') max.add(_('.tag.tr').create().add(tag))
  card.add(_('p').create().add(prettyName(assetJson.alias)))
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
function prettyName (assetName = '') {
  const split = assetName.split('.')
  if (split.length <= 1) {
    return toTitleCase(split[0].replace(/([A-Z]+)/g, ' $1').trim())
  } else {
    return toTitleCase(split[0].replace(/([A-Z]+)/g, ' $1').trim()) +
    ', ' + toTitleCase(split[1].replace(/([A-Z]+)/g, ' $1').trim())
  }
}

/**
 * Hides modal and adds the selected piece after user clicks OK.
 */
function modalOk () {
  const template = getTemplate()
  const modal = document.getElementById('modal')
  const pieces = []
  let offsetZ = 1
  _('#tabs-library .is-selected .piece').each(item => {
    const piece = nodeToPiece(item)
    piece.x = Number(modal.x * template.gridSize)
    piece.y = Number(modal.y * template.gridSize)
    piece.z = getMaxZ(piece.layer) + offsetZ
    pieces.push(piece)
    offsetZ += 1
  })
  if (pieces.length > 0) {
    createPieces(pieces, true)
    getModal().hide()
  }
}

/**
 * Filter items in the library by string entered in the bottom input field.
 */
function filter () {
  const filter = _('#input-search').value.trim().toLowerCase()

  _('#tabs-library .col-card p').each(p => {
    if (!p.innerText.toLowerCase().includes(filter)) {
      p.parentNode.classList.add('is-gone')
    } else {
      p.parentNode.classList.remove('is-gone')
    }
  })
}

const iconSearch = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
