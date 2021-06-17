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
import {
  syncNow,
  stopAutoSync
} from './sync.js'
import {
  runError
} from '../error.js'
import {
  populatePiecesDefaults
} from './tabledata.js'

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
    .catch(error => errorTableGone(error))
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
 * Get the currently visible (sub)table a.k.a. state number.
 */
export function getStateNo () {
  return stateNo
}

/**
 * Switch to another state.
 *
 * Triggers API fetch & updates table state.
 *
 * @param {Number} no State to set (1..9).
 * @param {Boolean} sync Force sync after setting status.
 */
export function setStateNo (no, sync = true) {
  if (no >= 1 && no <= 9) {
    stateNo = no
    setTablePreference('subtable', stateNo)
    if (sync) syncNow()
  }
}

/**
 * Get (cached) state for a given slot/subtable.
 *
 * @param {Number} no State slot 0..9.
 * @return {Object} State array.
 */
export function getState (no) {
  return states[no]
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
    .catch(error => errorUnexpected404(error))
    .finally(() => {
      syncNow()
    })
}

/**
 * Get the current table's template (cached).
 *
 * @return {Object} Current table's template metadata.
 */
export function getLibrary () {
  return getTable()?.library
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
export function getTablePreference (pref) {
  return getStoreValue('g' + table.id.substr(0, 8), pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * table.
 *
 * @param {String} pref Setting to set.
 * @param {String} value The value to set.
 */
export function setTablePreference (pref, value) {
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
export function movePiece (pieceId, x = null, y = null, z = null) {
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
 * @param {Number} x New x/rotation point.
 * @param {Number} y New y/rotation point.
 */
export function rotatePiece (pieceId, r, x, y) {
  patchPiece(pieceId, {
    r: r,
    x: x,
    y: y
  })
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
export function numberPiece (pieceId, no) {
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
export function flipPiece (pieceId, side) {
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
export function borderPiece (pieceId, border) {
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
export function deletePiece (id) {
  apiDeletePiece(table.name, getStateNo(), id)
    .catch(error => errorUnexpected(error))
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
  apiPutState(table.name, getStateNo(), state)
    .catch(error => errorUnexpected(error))
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
      apiPutState(table.name, getStateNo(), state)
        .catch(error => errorUnexpected(error))
        .finally(() => {
          syncNow()
        })
    })
    .catch(error => errorUnexpected(error))
}

/**
 * Update (patch) a series of pieces.
 *
 * Will do only one state refresh after updating all items in the list.
 *
 * @param {Array} pieces (Partial) pieces to patch.
 */
export function updatePieces (pieces) {
  if (pieces && pieces.length > 0) patchPieces(pieces, true)
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

/**
 * Fetch a server state and cache it for future use.
 *
 * @param {Number} no Number of state 0..9.
 * @return {Promise} Promise of a state object.
 */
export function fetchTableState (no) {
  return apiGetState(table.name, no, true)
    .then(state => {
      states[no] = populatePiecesDefaults(state.body)
      return state
    })
    .catch(error => errorTableGone(error))
}

// --- HTTP error handling -----------------------------------------------------

export function errorUnexpected (error) {
  runError('UNEXPECTED', error)
  return null
}

export function errorUnexpected404 (error) {
  if (error instanceof UnexpectedStatus && error.status === 404) {
    // 404 are semi-expected, silently ignore them
  } else {
    errorUnexpected(error)
  }
  return null
}

export function errorTableGone (error) {
  if (error instanceof UnexpectedStatus) {
    runError('TABLE_GONE', table.name, error)
    stopAutoSync()
  } else {
    errorUnexpected(error)
  }
  return null
}

// --- internal ----------------------------------------------------------------

let table = {} /** stores the table meta info JSON */
let stateNo = 1 /** stores the currently visible sub-table */
const states = [[], [], [], [], [], [], [], [], [], []] /** caches the states 0..9 **/

/**
 * Strip client-side properties from pieces that would confuse the API.
 *
 * Removes all properties starting with '_'.
 *
 * @param {Object} piece A piece to cleanup.
 * @return {Object} The stripped piece.
 */
function stripPiece (piece) {
  const p = {}

  for (const key in piece) {
    if (key[0] !== '_') {
      p[key] = piece[key]
    }
  }

  return p
}

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
  return apiPatchPiece(table.name, getStateNo(), pieceId, patch)
    .catch(error => errorUnexpected404(error))
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
  return apiPatchPieces(table.name, getStateNo(), patches)
    .catch(error => errorUnexpected404(error))
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
  return apiPostPiece(table.name, getStateNo(), stripPiece(piece))
    .then(piece => {
      return piece.id
    })
    .catch(error => errorUnexpected(error))
    .finally(() => {
      if (poll) syncNow()
    })
}
