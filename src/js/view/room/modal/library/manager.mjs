/**
 * @file Handles the library modal.
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

import shajs from 'sha.js'

import _ from '../../../../lib/FreeDOM.mjs'

import {
  createWindow,
  isWindowActive,
  closeWindow
} from '../../../../view/room/window.mjs'

import {
  isModalActive,
  createModalConfirm,
  getModal
} from '../../../../view/room/modal.mjs'

import {
  getBackground,
  getLibrary,
  getRoom,
  getColorLabel,
  deleteAsset
} from '../../../../state/index.mjs'

import {
  getRoomMediaURL,
  findAsset,
  countAssets
} from '../../../../view/room/tabletop/tabledata.mjs'

import {
  selectionGetPieces
} from '../../../../view/room/tabletop/selection.mjs'

import {
  assetToNode,
  url
} from '../../../../view/room/tabletop/index.mjs'

import {
  sortByString,
  prettyName
} from '../../../../lib/utils.mjs'

import {
  iconClose
} from '../../../../lib/icons.mjs'

import {
  HOOK_LIBRARY_UPDATE,
  registerObserver
} from '../../../../lib/events.mjs'

import {
  DEMO_MODE
} from '../../../../api/index.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the advanced library editor modal.
 *
 * @param {Object} tile {x, y} coordinates (tile) where to add.
 */
export function modalLibraryManager (xy) {
  preselect()

  if (!isModalActive()) {
    const background = getBackground()
    const window = createWindow()
      .add('.library-manager')
      .css({
        '--fbg-tabletop-color': background.color,
        '--fbg-tabletop-image': url(background.image),
        '--fbg-tabletop-grid': url(background.gridFile)
      })

    window.xy = xy

    _('#window .window-header').innerHTML = `
      <h3 class="modal-title">Library manager</h3>
      <div class="window-header-end">${iconClose}</div>
    `

    lastHash = null
    showSpinner()
    updateManager()
    registerObserver('LibraryManager', HOOK_LIBRARY_UPDATE, () => updateManager())

    _('.window-header-end').on('click', () => closeWindow())
  }
}

// --- internal ----------------------------------------------------------------

let lastHash = null
let selection = null

/**
 * Use table (piece) selection to pre-select an asset (if any).
 */
function preselect () {
  const selected = selectionGetPieces()
  if (selected.length > 0) {
    const asset = findAsset(selected[0].a)
    if (asset) selection = asset
  }
}

/**
 * Replace window content with loading spinner.
 */
function showSpinner () {
  _('#window .window-body')
    .empty()
    .add(_('.is-loading').create())
}

/**
 * Update the window to hold a filetree plus browser panel.
 */
function updateManager () {
  if (isWindowActive()) {
    getModal()?.hide()

    const library = getLibrary()
    const newHash = shajs('sha256').update(JSON.stringify(library)).digest('hex')
    if (lastHash !== newHash) {
      _('#window .window-body')
        .empty()
        .add(_('.filetree').create())
        .add(_('.browser.is-content').create())

      const library = getLibrary()

      const node = _('.filetree')
      node.add(createSubtree('Dice', 'other', library.other))
      node.add(createSubtree('Token', 'token', library.token))
      node.add(createSubtree('Overlays', 'overlay', library.overlay))
      node.add(createSubtree('Tiles', 'tile', library.tile))
      // node.add(createSubtree('Badges', 'badge', library.badge))

      lastHash = newHash
    }
  }
}

/**
 * Render a <details> element containing one asset type as folder.
 *
 * @param {string} title Asset type label for folder.
 * @param {string} type Asset type for folder.
 * @param {object[]} assets Assets to put into this tree.
 * @return {FreeDOM} DOM node of generated (sub)tree.
 */
function createSubtree (title, type, assets) {
  const details = _('details').create()
  const summary = _('summary').create()
  summary.innerHTML = title
  details.add(summary)

  if (type === selection?.type) {
    details.open = true
  }

  for (const asset of sortByString(assets ?? [], 'name')) {
    const entry = _(`.${type}`).create()
    entry.innerHTML = `${prettyName(asset.name)} ${asset.w}x${asset.h}`
    entry.asset = asset
    if (asset.id === selection?.id) {
      entry.add('.active')
      show(entry.asset)
    }
    entry.on('click', click => {
      _('.filetree .active').remove('.active')
      entry.add('.active')
      show(entry.asset)
    })
    details.add(entry)
  }

  return details
}

/**
 * Update browser area to show a given asset.
 *
 * @param {string} asset Asset to display.
 */
function show (asset) {
  selection = asset
  const browser = _('.browser')

  browser.innerHTML = `
    <h1>${prettyName(asset.name)} ${asset.w}x${asset.h}</h1>
    <table class="table-key-value">
      <tbody>
        <tr>
          <td rowspan="4" class="is-preview">
          </td>
          <th>ID</th>
          <td>${asset.id}</td>
        </tr>
        <tr>
          <th>Color</th>
          <td>${getColorLabel(asset.bg)}</td>
        </tr>
        <tr>
          <th>Material</th>
          <td>${prettyName(asset.tx ?? 'none')}</td>
        </tr>
        <tr>
          <th>Actions</th>
          <td>
            <button id="manager-delete" class="btn btn-xs btn-primary" href="#">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  `
  updatePreview(asset, 0)
  browser.add(assetToTable(asset))

  _('.browser .side').on('mouseenter', mouseenter => updatePreview(asset, parseInt(mouseenter.target.id.substr(9))))
  _('#manager-delete').on('click', () => modalDelete(asset))
}

/**
 * Update the preview box to show a given asset as preview-piece.
 *
 * @param {string} asset Asset to display.
 * @param {number} side Side to show.
 */
function updatePreview (asset, side) {
  _('.browser .is-preview')
    .empty()
    .add(assetToNode(asset, side))
    .remove('.is-max-*')
    .add('.is-max-' + Math.max(asset.w, asset.h))
}

/**
 * Generate a table of all sides of an asset, including base and mask.
 *
 * @param {string} asset Asset to display.
 * @param {number} side Side to show.
 * @return {FreeDOM} DOM node of generated table.
 */
function assetToTable (asset) {
  const table = _('table.table').create()
    .add(
      _('thead').create()
        .add(
          _('tr').create()
            .add(_('th').create('Type'))
            .add(_('th').create('File'))
            .add(_('th').create('Actions'))
        )
    )

  const tbody = _('tbody').create()
  table.add(tbody)
  let content = ''

  if (asset.mask) {
    content += `
      <tr>
        <td>Mask</td>
        <td><code>${asset.mask}</code></td>
        <td><a href="${getRoomMediaURL(getRoom().name, asset.type, asset.mask, DEMO_MODE)}" target="_blank">View</a></td>
      </tr>
    `
  }
  let index = 0
  for (const media of asset.media) {
    content += `
      <tr id="${asset.id}-${index}" class="side">
        <td>Side ${index + 1}</td>
        <td><code>${media}</code></td>
        <td><a href="${getRoomMediaURL(getRoom().name, asset.type, media, DEMO_MODE)}" target="_blank">View</a></td>
      </tr>
    `
    index++
  }
  if (asset.base) {
    content += `
      <tr>
        <td>Base</td>
        <td><code>${asset.base}</code></td>
        <td><a href="${getRoomMediaURL(getRoom().name, asset.type, asset.base, DEMO_MODE)}" target="_blank">View</a></td>
      </tr>
    `
  }

  tbody.innerHTML = content

  return table
}

/**
 * Show the confirmation modal to delete an asset.
 *
 * @param {string} asset Asset to be deleted.
 */
function modalDelete (asset) {
  const amount = countAssets(asset.id)
  createModalConfirm(
    '<h3 class="modal-title">Delete asset?</h3>',
    `
      <p>
        Asset <strong>${prettyName(asset.name)} ${asset.w}x${asset.h}</strong> is currently ${amount}x in use in your game.
        Are you sure you want to delete it?
      </p>
      <p>This action can't be undone!</p>
    `,
    'Delete',
    asset,
    asset => {
      deleteAsset(asset.id)
        .then(() => {
          getModal().hide()
          lastHash = null
          showSpinner()
        })
    }
  )
}
