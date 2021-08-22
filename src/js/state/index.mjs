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
  clampToTableSize
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
 * Until we support multiple rooms, this is always the template of room 0.
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
 * Update the current template.
 *
 * Supports partial updates.
 *
 * @param {Object} template (Partial) new template data.
 */
export function updateTemplate (template) {
  return apiPatchTemplate(room.name, template)
    .catch(error => errorUnexpected404(error))
    .finally(() => {
      syncNow()
    })
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
 * Create a new room on the server.
 *
 * @param {Object} room The room object to send to the API.
 * @param {Object} snapshot File input or null if no snapshot is to be uploaded.
 * @return {Object} Promise of created room metadata object.
 */
export function createRoom (room, snapshot) {
  return apiPostRoom(room, snapshot)
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {String} pref Setting to obtain.
 * @return {String} The setting's value.
 */
export function getRoomPreference (pref) {
  return getStoreValue('g' + room.id.substr(0, 8), pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {String} pref Setting to set.
 * @param {String} value The value to set.
 */
export function setRoomPreference (pref, value) {
  setStoreValue('g' + room.id.substr(0, 8), pref, value)
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
  patchPiece(pieceId, {
    x: x != null ? x : undefined,
    y: y != null ? y : undefined,
    z: z != null ? z : undefined
  })
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
  patchPiece(pieceId, {
    n: no
  })
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
 * Remove a piece from the current table (from the room, not from the library).
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to remove.
 */
export function deletePiece (id) {
  apiDeletePiece(room.name, getTableNo(), id)
    .catch(error => errorUnexpected(error))
    .finally(() => {
      syncNow()
    })
}

/**
 * Update the table state to the a new one.
 *
 * Will replace the existing table.
 *
 * @param {Array} table Array of pieces.
 */
export function updateTable (table) {
  apiPutTable(room.name, getTableNo(), table)
    .catch(error => errorUnexpected(error))
    .finally(() => {
      syncNow()
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
 * @param {Array} selectIds Ids to select when done. Auto-populated in recursion.
 */
export function createPieces (pieces, selected = false, selectIds = []) {
  let final = false

  if (!pieces || pieces.length <= 0) return
  const piece = pieces.shift()
  return createPiece(clampToTableSize(piece), false)
    .then(id => {
      selectIds.push(id)
      if (pieces.length === 0) final = true
      if (pieces.length > 0) return createPieces(pieces, selected, selectIds)
    })
    .finally(() => {
      if (final) {
        syncNow(selected ? selectIds : [], true)
      }
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
 * @param {Object} poll Optional. If true (default), the table will be
 *                 polled after the patch.
 * @return {Object} Promise of the API request.
 */
function patchPiece (pieceId, patch, poll = true) {
  return apiPatchPiece(room.name, getTableNo(), pieceId, patch)
    .catch(error => errorUnexpected404(error))
    .finally(() => {
      if (poll) syncNow()
    })
}

/**
 * Update a piece on the server.
 *
 * @param {Object} patch Array of partial object of fields to send. Must include ids!
 * @param {Object} poll Optional. If true (default), the table will be
 *                 polled after the patch.
 * @return {Object} Promise of the API request.
 */
function patchPieces (patches, poll = true) {
  return apiPatchPieces(room.name, getTableNo(), patches)
    .catch(error => errorUnexpected404(error))
    .finally(() => {
      if (poll) syncNow()
    })
}

/**
 * Create a piece on the server.
 *
 * @param {Object} piece The full piece to send to the server.
 * @param {Object} poll Optional. If true (default), the table will be
 *                 polled after the create.
 * @return {Object} Promise of the ID of the new piece.
 */
function createPiece (piece, poll = true) {
  return apiPostPiece(room.name, getTableNo(), stripPiece(piece))
    .then(piece => {
      return piece.id
    })
    .catch(error => errorUnexpected(error))
    .finally(() => {
      if (poll) syncNow()
    })
}
