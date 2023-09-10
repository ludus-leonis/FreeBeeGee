/**
 * @file Handles the advanced library editor window.
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

import shajs from 'sha.js'

import _ from '../../../lib/FreeDOM.mjs'

import {
  createWindow,
  isWindowActive,
  closeWindow
} from '../../../view/room/window.mjs'

import {
  isModalActive,
  getModal
} from '../../../view/room/modal.mjs'

import {
  getBackground,
  getLibrary,
  getRoom,
  getColorLabel
} from '../../../state/index.mjs'

import {
  getRoomMediaURL,
  findAsset
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  selectionGetPieces
} from '../../../view/room/tabletop/selection.mjs'

import {
  assetToNode,
  url
} from '../../../view/room/tabletop/index.mjs'

import {
  sortByString,
  prettyName
} from '../../../lib/utils-text.mjs'

import {
  fakeTabularNums
} from '../../../lib/utils-html.mjs'

import {
  iconClose
} from '../../../lib/icons.mjs'

import {
  HOOK_LIBRARY_UPDATE,
  HOOK_LIBRARY_EDIT,
  HOOK_LIBRARY_RELOAD,
  registerObserver,
  triggerEvent
} from '../../../lib/events.mjs'

import {
  DEMO_MODE
} from '../../../api/index.mjs'

import {
  modalEdit
} from './modal/edit.mjs'

import {
  modalDelete
} from './modal/delete.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the advanced library editor modal.
 *
 * @param {object} xy {x, y} coordinates (tile) where to add.
 */
export function modalLibraryManager (xy) {
  preselect()

  if (!isModalActive()) {
    const background = getBackground()
    const window = createWindow()
      .add('.library-editor')
      .css({
        '--fbg-tabletop-color': background.color,
        '--fbg-tabletop-image': url(background.image),
        '--fbg-tabletop-grid': url(background.gridFile)
      })

    window.xy = xy

    _('#window .window-header').innerHTML = `
      <h3 class="modal-title">Library editor</h3>
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

registerObserver('LibraryManager', HOOK_LIBRARY_EDIT, () => selection && modalEdit(selection))
registerObserver('LibraryManager', HOOK_LIBRARY_RELOAD, () => showSpinner())

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
  lastHash = null
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
 * @returns {_} FreeDOM node of generated (sub)tree.
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
    entry.asset = asset
    entry.innerHTML = assetToLabel(asset)
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

  const color = getColorLabel(asset.bg)

  browser.innerHTML = `
    <h1>${assetToLabel(asset)}</h1>
    <table class="table-key-value">
      <tbody>
        <tr>
          <td rowspan="4" class="is-preview">
          </td>
          <th>ID</th>
          <td><code>${asset.id}</code></td>
        </tr>
        <tr>
          <th>Color</th>
          <td>${color.startsWith('#') ? `<code>${color}</code>` : color}</td>
        </tr>
        <tr>
          <th>Material</th>
          <td>${prettyName(asset.tx ?? 'none')}</td>
        </tr>
        <tr>
          <th>Actions</th>
          <td>
          <button id="asset-edit" class="btn btn-xs btn-primary">Edit</button>
          <button id="asset-delete" class="btn btn-xs btn-primary">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  `
  updatePreview(asset, 0)
  browser.add(assetToTable(asset))

  _('.browser .side').on('mouseenter', mouseenter => updatePreview(asset, parseInt(mouseenter.target.id.substr(9))))
  _('#asset-edit').on('click', () => triggerEvent(HOOK_LIBRARY_EDIT))
  _('#asset-delete').on('click', () => modalDelete(asset))
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
 * @returns {_} FreeDOM node of generated table.
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
        <td>Side ${fakeTabularNums(`${index + 1}`)}</td>
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
 * Get an HTML label for an asset, that looks like 'MyName (12) 2x2'.
 *
 * @param {object} asset An asset.
 * @returns {string} Formatted label/HTML snippet.
 */
function assetToLabel (asset) {
  if (asset.media.length > 2) {
    const html = `${prettyName(asset.name)} (${asset.media.length}) <span class="is-faded-more">${asset.w}x${asset.h}</span>`
    return fakeTabularNums(html)
  } else {
    const html = `${prettyName(asset.name)} <span class="is-faded-more">${asset.w}x${asset.h}</span>`
    return fakeTabularNums(html)
  }
}
