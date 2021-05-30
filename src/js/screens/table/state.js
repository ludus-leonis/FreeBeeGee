/**
 * @file Holds and manages a table's data objects, a.k.a. state. Propagates
 *       changes to the API but is not in charge of syncing the state back.
 *       Might cache some values in the browser store.
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
  getStoreValue,
  setStoreValue
} from '../../utils.js'
import {
  apiGetState,
  apiPutState,
  apiGetTable,
  apiPostTable,
  apiDeleteTable,
  apiPatchTableTemplate,
  apiPatchPiece,
  apiPatchPieces,
  apiDeletePiece,
  apiPostPiece,
  apiPostAsset,
  UnexpectedStatus
} from '../../api.js'
import { syncNow } from './sync.js'
import { runError } from '../error.js'

let table = {} /** stores the table meta info JSON */

// --- public ------------------------------------------------------------------

/**
 * (Re)Fetch the table's state from the API and cache it
 *
 * @param {String} name The current table name.
 * @return {Promise} Promise of table data object.
 */
export function loadTable (name) {
  return apiGetTable(name, true)
    .then(remoteTable => {
      table = remoteTable.body
      return remoteTable
    })
    .catch((error) => { // invalid table
      runError('TABLE_GONE', name, error)
      return null
    })
}

/**
 * Reload the current table information.
 *
 * Usefull to update the asset library.
 *
 * @return {Promise} Promise of table data object.
 */
export function reloadTable () {
  return loadTable(table.name)
}

/**
 * Get the current table's metadata (cached).
 *
 * @return {Object} Table's metadata.
 */
export function getTable () {
  return table
}

/**
 * Get the current table's template (cached).
 *
 * Until we support multiple tables, this is always the template of table 0.
 *
 * @return {Object} Current table's template metadata.
 */
export function getTemplate () {
  return getTable()?.template
}

/**
 * Update the current template.
 *
 * Supports partial updates.
 *
 * @param {Object} template (Partial) new template data.
 */
export function updateTemplate (template) {
  return apiPatchTableTemplate(table.name, template)
    .catch(error => {
      if (error instanceof UnexpectedStatus && error.status === 404) {
        // no need to patch already deleted pieces - silently ignore
      } else {
        runError('UNEXPECTED', error) // *that* was unexpected
      }
    })
    .finally(() => {
      syncNow()
    })
}

/**
 * Get the current table's template (cached).
 *
 * Until we support multiple tables, this is always the template of table 0.
 *
 * @return {Object} Current table's template metadata.
 */
export function getLibrary () {
  return getTable()?.library
}

/**
 * Get an asset from the asset cache.
 *
 * @param {String} id Asset ID.
 * @return {Object} Asset or null if it is unknown.
 */
export function getAsset (id) {
  let asset
  asset = getLibrary()?.token?.find(asset => asset.id === id)
  if (asset) return asset
  asset = getLibrary()?.tile?.find(asset => asset.id === id)
  if (asset) return asset
  asset = getLibrary()?.overlay?.find(asset => asset.id === id)
  if (asset) return asset
  asset = getLibrary()?.other?.find(asset => asset.id === id)
  if (asset) return asset

  // create dummy asset
  return {
    assets: ['invalid.svg'],
    width: 1,
    height: 1,
    color: '40bfbf',
    alias: 'invalid',
    type: 'tile',
    id: '0000000000000000'
  }
}

/**
 * Create a new table on the server.
 *
 * @param {Object} table The table object to send to the API.
 * @param {Object} snapshot File input or null if no snapshot is to be uploaded.
 * @return {Object} Promise of created table metadata object.
 */
export function createTable (table, snapshot) {
  return apiPostTable(table, snapshot)
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * table.
 *
 * @param {String} pref Setting to obtain.
 * @return {String} The setting's value.
 */
export function stateGetTablePref (pref) {
  return getStoreValue('g' + table.id.substr(0, 8), pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * table.
 *
 * @param {String} pref Setting to set.
 * @param {String} value The value to set.
 */
export function stateSetTablePref (pref, value) {
  setStoreValue('g' + table.id.substr(0, 8), pref, value)
}

/**
 * Set the label of a piece of the current table.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {String} label New label text.
 */
export function stateLabelPiece (pieceId, label) {
  patchPiece(pieceId, { label: label })
}

/**
 * Set the x/y/z of a piece of the current table.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {?Number} x New x. Will not be changed if null.
 * @param {?Number} y New y. Will not be changed if null.
 * @param {?Number} z New z. Will not be changed if null.
 */
export function stateMovePiece (pieceId, x = null, y = null, z = null) {
  const patch = {
    x: x != null ? x : undefined,
    y: y != null ? y : undefined,
    z: z != null ? z : undefined
  }
  patchPiece(pieceId, patch)
}

/**
 * Rotate a piece of the current table.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} r New rotation (0, 90, 180, 270).
 */
export function stateRotatePiece (pieceId, r) {
  patchPiece(pieceId, { r: r })
}

/**
 * Update the number/letter of a piece/token.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} no New number (0..27).
 */
export function stateNumberPiece (pieceId, no) {
  patchPiece(pieceId, { no: no })
}

/**
 * Flip a piece of the current table and show another side of it.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} side New side. Zero-based.
 */
export function stateFlipPiece (pieceId, side) {
  patchPiece(pieceId, {
    side: side
  })
}

/**
 * Change the outline/border color.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} border New border. Zero-based.
 */
export function stateBorderPiece (pieceId, border) {
  patchPiece(pieceId, {
    border: border
  })
}

/**
 * Edit multiple properties of a piece of the current table.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Object} updates All properties to be changed. Unchanged properties
 *                         should be omitted.
 */
export function statePieceEdit (pieceID, updates) {
  if (Object.keys(updates).length > 0) {
    patchPiece(pieceID, updates)
  }
}

/**
 * Remove a piece from the current table (from the table, not from the library).
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to remove.
 */
export function stateDeletePiece (id) {
  apiDeletePiece(table.name, 1, id)
    .catch(error => {
      runError('UNEXPECTED', error)
    })
    .finally(() => {
      syncNow()
    })
}

/**
 * Update the table state to the a new one.
 *
 * Will replace the existing state.
 *
 * @param {Array} state Array of pieces (table state).
 */
export function updateState (state) {
  apiPutState(table.name, 1, state)
    .catch(error => {
      runError('UNEXPECTED', error)
    })
    .finally(() => {
      syncNow()
    })
}

/**
 * Restore a saved table state.
 *
 * @param {Number} index Integer index of state, 0 = initial.
 */
export function restoreState (index) {
  apiGetState(table.name, index)
    .then(state => {
      apiPutState(table.name, 1, state)
        .catch(error => {
          runError('UNEXPECTED', error)
        })
        .finally(() => {
          syncNow()
        })
    })
    .catch(error => {
      runError('UNEXPECTED', error)
    })
}

/**
 * Update (patch) a series of pieces.
 *
 * Will do only one state refresh after updating all items in the list.
 *
 * @param {Array} pieces (Partial) pieces to patch.
 */
export function updatePieces (pieces) {
  patchPieces(pieces, true)
}

/**
 * Create (post) a series of pieces.
 *
 * Will do only one state refresh after creating all items in the list.
 *
 * @param {Array} pieces (Full) pieces to crate.
 * @param {Boolean} selected If true, the pieces should be selected after
 *                           creating them. Defaults to false.
 */
export function createPieces (pieces, selected = false, selectIds = []) {
  let final = false

  if (!pieces || pieces.length <= 0) return
  const piece = pieces.shift()
  return createPiece(piece, false)
    .then(id => {
      selectIds.push(id)
      if (pieces.length === 0) final = true
      if (pieces.length > 0) return createPieces(pieces, selected, selectIds)
    })
    .finally(() => {
      if (final) {
        syncNow(selected ? selectIds : [])
      }
    })
}

export function addAsset (data) {
  return apiPostAsset(table.name, data)
}

/**
 * Delete the current table for good.
 *
 * @return {Promise} Promise of deletion to wait for.
 */
export function deleteTable () {
  return apiDeleteTable(table.name)
}

// --- internal ----------------------------------------------------------------

/**
 * Update a piece on the server.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Object} patch Partial object of fields to send.
 * @param {Object} poll Optional. If true (default), the table state will be
 *                 polled after the patch.
 * @return {Object} Promise of the API request.
 */
function patchPiece (pieceId, patch, poll = true) {
  return apiPatchPiece(table.name, 1, pieceId, patch)
    .catch(error => {
      if (error instanceof UnexpectedStatus && error.status === 404) {
        // no need to patch already deleted pieces - silently ignore
      } else {
        runError('UNEXPECTED', error) // *that* was unexpected
      }
    })
    .finally(() => {
      if (poll) syncNow()
    })
}

/**
 * Update a piece on the server.
 *
 * @param {Object} patch Array of partial object of fields to send. Must include ids!
 * @param {Object} poll Optional. If true (default), the table state will be
 *                 polled after the patch.
 * @return {Object} Promise of the API request.
 */
function patchPieces (patches, poll = true) {
  return apiPatchPieces(table.name, 1, patches)
    .catch(error => {
      if (error instanceof UnexpectedStatus && error.status === 404) {
        // no need to patch already deleted pieces - silently ignore
      } else {
        runError('UNEXPECTED', error) // *that* was unexpected
      }
    })
    .finally(() => {
      if (poll) syncNow()
    })
}

/**
 * Create a piece on the server.
 *
 * @param {Object} piece The full piece to send to the server.
 * @param {Object} poll Optional. If true (default), the table state will be
 *                 polled after the create.
 * @return {Object} Promise of the ID of the new piece.
 */
function createPiece (piece, poll = true) {
  return apiPostPiece(table.name, 1, piece)
    .then(piece => {
      return piece.id
    })
    .catch(error => {
      runError('UNEXPECTED', error)
    })
    .finally(() => {
      if (poll) syncNow()
    })
}
