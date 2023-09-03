/**
 * @file Handles the library edit-asset modal.
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

import _ from '../../../../lib/FreeDOM.mjs'

import {
  DEMO_MODE
} from '../../../../api/index.mjs'

import {
  createModalConfirm,
  getModal
} from '../../../../view/room/modal.mjs'

import {
  getLibrary,
  getSetup,
  updateAsset
} from '../../../../state/index.mjs'

import {
  PATTERN_ASSET_NAME,
  PATTERN_COLOR,
  prettyName,
  unprettyName,
  generateAnimal
} from '../../../../lib/utils.mjs'

import {
  HOOK_LIBRARY_RELOAD,
  triggerEvent
} from '../../../../lib/events.mjs'

import {
  modalDisabled
} from '../../../../view/room/modal/disabled.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the asset editor modal.
 *
 * @param {string} asset Asset to be edited.
 */
export function modalEdit (asset) {
  const setup = getSetup()

  createModalConfirm(
    '<h3 class="modal-title">Edit asset</h3>',
    `
      <form class="container modal-edit modal-edit-token">
        <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
        <div class="row">
          <div class="col-12">
            <label for="asset-name">Name</label>
            <input id="asset-name" name="asset-name" type="text" maxlength="64" pattern="${PATTERN_ASSET_NAME}" placeholder="e.g. '${generateAnimal()}'" required>
          </div>
          <div class="col-6 col-md-3">
            <label for="asset-x">Width</label>
            <select id="asset-x" name="asset-x"></select>
          </div>
          <div class="col-6 col-md-3">
            <label for="asset-y">Height</label>
            <select id="asset-y" name="asset-y"></select>
          </div>
          <div class="col-12 col-md-6">
            <label for="asset-material">Material</label>
            <select id="asset-material" name="asset-material"></select>
          </div>
          <div class="col-12 col-md-6">
            <label for="asset-color">Color</label>
            <select id="asset-color" name="asset-color"></select>
          </div>
          <div class="col-12 col-md-6">
            <label for="asset-rgb">Color value</label>
            <input id="asset-rgb" name="asset-rgb" type="text" maxlength="7" pattern="${PATTERN_COLOR}" placeholder="#808080" required disabled>
          </div>
        </div>
      </form>
      <p class="server-feedback"></p>
    `,
    'Save',
    asset,
    asset => ok(asset)
  )

  // name
  const name = _('#asset-name')
  name.value = prettyName(asset.name, false)

  // size
  const width = _('#asset-x')
  const height = _('#asset-y')
  for (let i = 1; i <= 32; i++) {
    const w = _('option').create(i)
    w.value = i
    if (i === asset.w) w.selected = true
    width.add(w)

    const h = _('option').create(i)
    h.value = i
    if (i === asset.h) h.selected = true
    height.add(h)
  }

  // material
  const materials = _('#asset-material')
  for (const material of getLibrary().material) {
    const option = _('option').create(prettyName(material.name))
    option.value = material.name
    if (material.name === (asset.tx ?? 'none')) option.selected = true
    materials.add(option)
  }

  // colors
  const colors = _('#asset-color')
  const none = _('option').create('None')
  none.value = 0
  if ((asset.bg ?? 0) === 0) none.selected = true
  colors.add(none)
  for (let c = 1; c <= setup.colors.length; c++) {
    const option = _('option').create(setup.colors[c - 1].name)
    option.value = c
    if (`${c}` === asset.bg) {
      _('#asset-rgb').value = setup.colors[c - 1].value
      option.selected = true
    }
    colors.add(option)
  }
  const manual = _('option').create('Manual')
  manual.value = 'Manual'
  if (asset.bg.match(/^#/)) {
    manual.selected = true
    _('#asset-rgb').value = asset.bg
    _('#asset-rgb').disabled = false
  }
  colors.add(manual)

  updateColor(asset)
  colors.on('change', change => updateColor(asset))
}

// --- internal ----------------------------------------------------------------

/**
 * Update the color-value input field based on the selected color mode.
 *
 * @param {string} asset Asset being viewed.
 */
function updateColor (asset) {
  const value = _('#asset-color').value ?? '0'
  switch (value) {
    case '0':
      _('#asset-rgb').value = '#808080'
      _('#asset-rgb').disabled = true
      break
    case 'Manual':
      _('#asset-rgb').value = asset.bg.match(/^#/) ? asset.bg : '#808080'
      _('#asset-rgb').disabled = false
      break
    default:
      _('#asset-rgb').value = getSetup().colors[parseInt(value) - 1].value
      _('#asset-rgb').disabled = true
  }
}

/**
 * Validate form and send infos to API.
 *
 * @param {string} asset Asset being viewed.
 */
function ok (asset) {
  const input = _('#asset-name')
  if (!input.validity.valid) {
    input.focus()
    return
  }

  const material = _('#asset-material')
  const color = _('#asset-color').value
  if (material === 'None' && !material.validity.valid) {
    material.focus()
    return
  }

  const patch = {}
  const name = unprettyName(_('#asset-name').value)
  if (asset.name !== name) patch.name = name
  const x = parseInt(_('#asset-x').value)
  if (asset.w !== x) patch.w = x
  const y = parseInt(_('#asset-y').value)
  if (asset.h !== y) patch.h = y
  if ((asset.tx ?? 'none') !== material.value) patch.tx = material.value
  const colorValue = color === 'Manual' ? _('#asset-rgb').value : color
  if (asset.bg !== colorValue) patch.bg = colorValue

  if (Object.keys(patch).length > 0) {
    patch.id = asset.id
  } else {
    getModal().hide()
  }

  if (DEMO_MODE) {
    getModal().hide()
    modalDisabled('would have edited your asset by now')
    return
  }

  updateAsset(patch)
    .then(api => {
      switch (api._error) {
        case 'ASSET_ID_CONFLICT':
          _('.server-feedback').add('.show').innerHTML = 'This asset already exists.'
          break
        case 'NOT_FOUND':
          _('.server-feedback').add('.show').innerHTML = 'Someone just removed/renamed this asset. Please reload the library.'
          break
        default: // no error - proceed
          getModal().hide()
          triggerEvent(HOOK_LIBRARY_RELOAD)
      }
    })
}
