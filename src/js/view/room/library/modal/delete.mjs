/**
 * @file Handles the library delete-asset modal.
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

import {
  createModalConfirm,
  getModal
} from '../../../../view/room/modal.mjs'

import {
  deleteAsset
} from '../../../../state/index.mjs'

import {
  countAssets
} from '../../../../view/room/tabletop/tabledata.mjs'

import {
  prettyName
} from '../../../../lib/utils.mjs'

import {
  HOOK_LIBRARY_RELOAD,
  triggerEvent
} from '../../../../lib/events.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the confirmation modal to delete an asset.
 *
 * @param {string} asset Asset to be deleted.
 */
export function modalDelete (asset) {
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
    asset => ok(asset)
  )
}

// --- internal ----------------------------------------------------------------

/**
 * Send infos to API.
 *
 * @param {string} asset Asset being viewed.
 */
function ok (asset) {
  deleteAsset(asset.id)
    .then(() => {
      getModal().hide()
      triggerEvent(HOOK_LIBRARY_RELOAD)
    })
}
