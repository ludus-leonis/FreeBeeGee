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
import Browser from '../../../lib/util-browser.mjs'
import Content from '../../../view/room/tabletop/content.mjs'
import Dom from '../../../view/room/tabletop/dom.mjs'
import Event from '../../../lib/event.mjs'
import Icon from '../../../lib/icon.mjs'
import Modal from '../../../view/room/modal.mjs'
import ModalDelete from './modal/delete.mjs'
import ModalEdit from './modal/edit.mjs'
import Selection from '../../../view/room/tabletop/selection.mjs'
import State from '../../../state/index.mjs'
import Text from '../../../lib/util-text.mjs'
import Window from '../../../view/room/window.mjs'

// -----------------------------------------------------------------------------

export default {
  open
}

// --- events ------------------------------------------------------------------

Event.register('LibraryManager', Event.HOOK.LIBRARY_EDIT, () => selection && ModalEdit.open(selection))
Event.register('LibraryManager', Event.HOOK.LIBRARY_RELOAD, () => showSpinner())
Event.register('LibraryManager', Event.HOOK.LIBRARY_SELECT, id => { selection = id })

// -----------------------------------------------------------------------------

/**
 * Show the advanced library editor modal.
 *
 * @param {object} xy {x, y} coordinates (tile) where to add.
 */
function open (xy) {
  preselect()

  if (!Modal.isOpen()) {
    const background = State.getBackground()
    const window = Window.create()
      .add('.library-editor')
      .css({
        '--fbg-tabletop-color': background.color,
        '--fbg-tabletop-image': Dom.url(background.image),
        '--fbg-tabletop-grid': Dom.url(background.gridFile)
      })

    window.xy = xy

    _('#window .window-header').innerHTML = `
      <h3 class="modal-title">Library editor</h3>
      <div class="window-header-end">${Icon.CLOSE}</div>
    `

    lastHash = null
    showSpinner()
    updateManager()
    Event.register('LibraryManager', Event.HOOK.LIBRARY_UPDATE, () => updateManager())

    _('.window-header-end').on('click', () => Window.close())
  }
}

let lastHash = null
let selection = null

/**
 * Use table (piece) selection to pre-select an asset (if any).
 */
function preselect () {
  const selected = Selection.getPieces()
  if (selected.length > 0) {
    const asset = Content.findAsset(selected[0].a)
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
  if (Window.isOpen()) {
    Modal.close()

    const library = State.getLibrary()
    const newHash = shajs('sha256').update(JSON.stringify(library)).digest('hex')
    if (lastHash !== newHash) {
      _('#window .window-body')
        .empty()
        .add(_('.filetree').create())
        .add(_('.browser.is-content').create())

      const library = State.getLibrary()

      const node = _('.filetree')
      node.add(createSubtree('Dice', 'other', library.other))
      node.add(createSubtree('Token', 'token', library.token))
      node.add(createSubtree('Stickers', 'sticker', library.sticker))
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

  for (const asset of Text.sortString(assets ?? [], 'name')) {
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

  const color = State.getColorLabel(asset.bg)

  browser.innerHTML = `
    <h1>${assetToLabel(asset)}</h1>
    <table class="table-key-value">
      <tbody>
        <tr>
          <td rowspan="5" class="is-preview">
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
          <td>${Text.prettyName(asset.tx ?? 'none')}</td>
        </tr>
        <tr>
          <th>Shadow</th>
          <td>${asset.d}</td>
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
  _('#asset-edit').on('click', () => Event.trigger(Event.HOOK.LIBRARY_EDIT))
  _('#asset-delete').on('click', () => ModalDelete.open(asset))
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
    .add(Dom.assetToNode(asset, side))
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

  let index = 0
  for (const media of asset.media) {
    content += `
      <tr id="${asset.id}-${index}" class="side">
        <td>Side ${Browser.fakeTabularNums(`${index + 1}`)}</td>
        <td><code>${media}</code></td>
        <td><a href="${Dom.getRoomMediaURL(asset.type, media)}" target="_blank">View</a></td>
      </tr>
    `
    index++
  }
  if (asset.mask) {
    content += `
      <tr>
        <td>Mask</td>
        <td><code>${asset.mask}</code></td>
        <td><a href="${Dom.getRoomMediaURL(asset.type, asset.mask)}" target="_blank">View</a></td>
      </tr>
    `
  }
  if (asset.base) {
    content += `
      <tr>
        <td>Base</td>
        <td><code>${asset.base}</code></td>
        <td><a href="${Dom.getRoomMediaURL(asset.type, asset.base)}" target="_blank">View</a></td>
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
    const html = `${Text.prettyName(asset.name)} (${asset.media.length}) <span class="is-faded-more">${asset.w}x${asset.h}</span>`
    return Browser.fakeTabularNums(html)
  } else {
    const html = `${Text.prettyName(asset.name)} <span class="is-faded-more">${asset.w}x${asset.h}</span>`
    return Browser.fakeTabularNums(html)
  }
}
