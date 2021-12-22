/**
 * @file Holds and manages a room's data objects, a.k.a. state. Propagates
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
} from '../lib/utils.mjs'
import {
  apiGetTable,
  apiPutTable,
  apiGetRoom,
  apiPostRoom,
  apiDeleteRoom,
  apiPatchTemplate,
  apiPatchPiece,
  apiPatchPieces,
  apiDeletePiece,
  apiPostPiece,
  apiPostAsset,
  UnexpectedStatus
} from '../api/index.mjs'
import {
  syncNow,
  stopAutoSync
} from '../view/room/sync.mjs'
import {
  runError
} from '../view/error/index.mjs'
import {
  populatePiecesDefaults,
  clampToTableSize,
  nameToLayer,
  sanitizePiecePatch
} from '../view/room/tabletop/tabledata.mjs'

// --- public ------------------------------------------------------------------

/**
 * Get the current serverInfo object from the client cache.
 *
 * @return {Object} The cached server metadata object.
 */
export function getServerInfo () {
  return serverInfo
}

/**
 * Set the current serverInfo object in the client cache.
 *
 * @param {object} info The serverInfo meta object.
 */
export function setServerInfo (info) {
  serverInfo = info
}

/**
 * Get the current table's metadata (cached).
 *
 * @return {Object} Room's metadata.
 */
export function getRoom () {
  return room
}

/**
 * Get the current table's template (cached).
 *
 * @return {Object} Current room's template metadata.
 */
export function getTemplate () {
  return getRoom()?.template
}

/**
 * Get the currently visible table number.
 */
export function getTableNo () {
  return tableNo
}

/**
 * Switch to another table.
 *
 * Triggers API fetch & updates table.
 *
 * @param {Number} no Table to set (1..9).
 * @param {Boolean} sync Force sync after setting status.
 */
export function setTableNo (no, sync = true) {
  if (no >= 1 && no <= 9) {
    tableNo = no
    setRoomPreference('table', tableNo)
    if (sync) syncNow([], true)
  }
}

/**
 * Get (cached) state for a given slot/table.
 *
 * @param {Number} no Table slot 0..9. Defaults to current one.
 * @return {Object} Table array.
 */
export function getTable (no = getTableNo()) {
  return tables[no]
}

/**
 * Get the current table's template (cached).
 *
 * @return {Object} Current room's template metadata.
 */
export function getLibrary () {
  return getRoom()?.library
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {String} pref Setting to obtain.
 * @param {String} defaultValue Fallback value if not set/found.
 * @return {String} The setting's value.
 */
export function getRoomPreference (pref, defaultValue) {
  return getStoreValue('r' + room.id.substr(0, 8), pref) ?? defaultValue
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {String} pref Setting to set.
 * @param {String} value The value to set.
 */
export function setRoomPreference (pref, value) {
  setStoreValue('r' + room.id.substr(0, 8), pref, value)
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * room + table no.
 *
 * @param {String} pref Setting to obtain.
 * @param {Number} no Table number. Defaults to curren table.
 * @return {String} The setting's value.
 */
export function getTablePreference (pref, no = getTableNo()) {
  return getStoreValue(`r${room.id.substr(0, 8)}.t${no}`, pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * room + table number.
 *
 * @param {String} pref Setting to set.
 * @param {String} value The value to set.
 * @param {Number} no Table number. Defaults to curren table.
 */
export function setTablePreference (pref, value, no = getTableNo()) {
  setStoreValue(`r${room.id.substr(0, 8)}.t${no}`, pref, value)
}

// --- API calls ---------------------------------------------------------------

/**
 * Reload the current table information.
 *
 * Usefull to update the asset library.
 *
 * @return {Promise} Promise of room data object.
 */
export function reloadRoom () {
  return loadRoom(room.name)
}

/**
 * (Re)Fetch the room's state from the API and cache it
 *
 * @param {String} name The current table name.
 * @return {Promise} Promise of room data object.
 */
export function loadRoom (name) {
  return apiGetRoom(name, true)
    .then(remoteRoom => {
      _setRoom(remoteRoom.body)
      return remoteRoom
    })
    .catch(error => errorRoomGone(error))
}

/**
 * Update the current template.
 *
 * Supports partial updates.
 *
 * @param {Object} template (Partial) new template data.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function patchTemplate (template, sync = true) {
  return apiPatchTemplate(room.name, template)
    .catch(error => errorUnexpected404(error))
    .finally(() => {
      if (sync) syncNow()
    })
}

/**
 * Create a new room on the server.
 *
 * @param {Object} room The room object to send to the API.
 * @param {Object} snapshot File input or null if no snapshot is to be uploaded.
 * @return {Object} Promise of created room metadata object.
 */
export function addRoom (room, snapshot) {
  return apiPostRoom(room, snapshot)
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
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function movePiece (pieceId, x = null, y = null, z = null, sync = true) {
  const patch = {}
  if (x != null) patch.x = x
  if (y != null) patch.y = y
  if (z != null) patch.z = z
  return patchPiece(pieceId, sanitizePiecePatch(patch), sync)
}

/**
 * Rotate a piece of the current table.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} r New rotation (0, 60, 90, 120, 180, 260, 270).
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function rotatePiece (pieceId, r = 0, sync = true) {
  return patchPiece(pieceId, sanitizePiecePatch({ r }), sync)
}

/**
 * Update the number/letter of a piece/token.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} n New number (0..27).
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function numberPiece (pieceId, n = 0, sync = true) {
  return patchPiece(pieceId, sanitizePiecePatch({ n }), sync)
}

/**
 * Flip a piece of the current table and show another side of it.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} side New side. Zero-based.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function flipPiece (pieceId, side, sync = true) {
  return patchPiece(pieceId, sanitizePiecePatch({ s: side }, pieceId))
}

/**
 * Change the piece/outline/border color.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} color1 New color index. Zero-based.
 * @param {Number} color2 New color index. Zero-based.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function colorPiece (pieceId, color1 = 0, color2 = 0, sync = true) {
  return patchPiece(
    pieceId,
    sanitizePiecePatch({ c: [color1, color2] }, pieceId),
    sync
  )
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
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function editPiece (pieceId, updates, sync = true) {
  if (Object.keys(updates).length > 0) {
    return patchPiece(pieceId, sanitizePiecePatch(updates, pieceId), sync)
  }
  return Promise.resolve({}) // nothing to do
}

/**
 * Remove a piece from the current table (from the room, not from the library).
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to remove.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function deletePiece (pieceId, sync = true) {
  return apiDeletePiece(room.name, getTableNo(), pieceId)
    .catch(error => errorUnexpected(error))
    .finally(() => {
      if (sync) syncNow()
    })
}

/**
 * Update the table state to the a new one.
 *
 * Will replace the existing table.
 *
 * @param {Array} table Array of pieces.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function updateTable (table, sync = true) {
  return apiPutTable(room.name, getTableNo(), table)
    .catch(error => errorUnexpected(error))
    .finally(() => {
      if (sync) syncNow()
    })
}

/**
 * Update (patch) a series of pieces.
 *
 * Will do only one state refresh after updating all items in the list.
 *
 * @param {Array} pieces (Partial) pieces to patch.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function updatePieces (pieces, sync = true) {
  if (pieces && pieces.length > 0) return patchPieces(pieces, sync)
  return Promise.resolve({}) // nothing to do
}

/**
 * Create (post) a series of pieces.
 *
 * Will do only one state refresh after creating all items in the list.
 *
 * @param {Array} pieces (Full) pieces to crate.
 * @param {Boolean} selected If true, the pieces should be selected after
 *                           creating them. Defaults to false.
 * @param {Array} selectIds Ids to select when done. Auto-populated in recursion.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function createPieces (pieces, selected = false, selectIds = [], sync = true) {
  let final = false

  if (!pieces || pieces.length <= 0) return Promise.resolve({})
  const piece = pieces.shift()
  return createPiece(clampToTableSize(piece), false)
    .then(id => {
      selectIds.push(id)
      if (pieces.length === 0) final = true
      if (pieces.length > 0) return createPieces(pieces, selected, selectIds, sync)
    })
    .finally(() => {
      if (final && sync) syncNow(selected ? selectIds : [], true)
    })
}

export function addAsset (data) {
  return apiPostAsset(room.name, data)
}

/**
 * Delete the current table for good.
 *
 * @return {Promise} Promise of deletion to wait for.
 */
export function deleteRoom () {
  return apiDeleteRoom(room.name)
}

/**
 * Fetch a table and cache it for future use.
 *
 * @param {Number} no Number of table 0..9.
 * @return {Promise} Promise of a table object.
 */
export function fetchTable (no) {
  return apiGetTable(room.name, no, true)
    .then(table => {
      _setTable(no, populatePiecesDefaults(table.body, table.headers))
      return table
    })
    .catch(error => errorRoomGone(error))
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

export function errorRoomGone (error) {
  if (error instanceof UnexpectedStatus) {
    runError('TABLE_GONE', room.name, error)
    stopAutoSync()
  } else {
    errorUnexpected(error)
  }
  return null
}

/**
 * Is the browser/tab currently active/visible?
 *
 * @return {Boolean} True if yes.
 */
export function isTabActive () {
  return tabActive
}

/**
 * Store the browser/tab activity state.
 *
 * Will trigger sync if tab became active.
 *
 * @return {Boolean} state True if yes.
 */
export function setTabActive (state) {
  tabActive = state
  if (state) syncNow()
}

// --- internal, but exposed for unit testing ----------------------------------

/**
 * Internal: Set a table to given data.
 *
 * Only exposed for unit testing.
 */
export function _setTable (no, data) {
  tables[no] = data
}

/**
 * Internal: Set a room metadata to given data.
 *
 * Only exposed for unit testing.
 */
export function _setRoom (data) {
  // add often used meta-infos
  if (data?.template) {
    data.template._meta = {
      widthPx: data.template.gridWidth * data.template.gridSize,
      heightPx: data.template.gridHeight * data.template.gridSize
    }
  }

  room = data
}

// --- internal ----------------------------------------------------------------

let serverInfo = {} /** stores the server meta info JSON */
let room = {} /** stores the room meta info JSON */
let tableNo = 1 /** stores the currently visible table index */
const tables = [[], [], [], [], [], [], [], [], [], []] /** caches the tables 0..9 **/
let tabActive = true /** is the current tab/window active/maximized? */

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
 * @param {Object} sync Optional. If true (default), trigger table sync.
 * @return {Object} Promise of the API request.
 */
function patchPiece (pieceId, patch, sync = true) {
  if (patch.l) patch.l = nameToLayer(patch.l)
  return apiPatchPiece(room.name, getTableNo(), pieceId, patch)
    .catch(error => errorUnexpected404(error))
    .finally(() => {
      if (sync) syncNow()
    })
}

/**
 * Update a piece on the server.
 *
 * @param {Object} patch Array of partial object of fields to send. Must include ids!
 * @param {Object} sync Optional. If true (default), trigger table sync.
 * @return {Object} Promise of the API request.
 */
function patchPieces (patches, sync = true) {
  const sane = []
  for (const patch of patches) {
    if (patch.l) patch.l = nameToLayer(patch.l)
    sane.push(sanitizePiecePatch(patch, patch.id))
  }
  return apiPatchPieces(room.name, getTableNo(), sane)
    .catch(error => errorUnexpected404(error))
    .finally(() => {
      if (sync) syncNow()
    })
}

/**
 * Create a piece on the server.
 *
 * @param {Object} piece The full piece to send to the server.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 * @return {Object} Promise of the ID of the new piece.
 */
function createPiece (piece, sync = true) {
  if (piece.l) piece.l = nameToLayer(piece.l)
  return apiPostPiece(room.name, getTableNo(), stripPiece(piece))
    .then(piece => {
      return piece.id
    })
    .catch(error => errorUnexpected(error))
    .finally(() => {
      if (sync) syncNow()
    })
}
