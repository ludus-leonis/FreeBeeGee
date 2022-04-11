/**
 * @file Holds and manages a room's data objects, a.k.a. state. Propagates
 *       changes to the API but is not in charge of syncing the state back.
 *       Might cache some values in the browser store.
 * @module
 * @copyright 2021-2022 Markus Leupold-Löwenthal
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
  apiPatchRoomAuth
} from '../api/index.mjs'

import {
  syncNow
} from '../view/room/sync.mjs'

import {
  runError,
  apiError
} from '../view/error/index.mjs'

import {
  findPiece,
  populatePiecesDefaults,
  populateTemplateDefaults,
  clampToTableSize,
  nameToLayer,
  sanitizePiecePatch,
  ID
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
 * Get the current API token.
 *
 * @return {Object} Token
 */
export function getToken () {
  return token
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
    setRoomPreference(PREFS.TABLE, tableNo)
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
 * Determine if a layer is currently active.
 *
 * @param {String} layer Name of layer.
 * @return {Boolean} True if active.
 */
export function isLayerActive (layer) {
  return getRoomPreference(PREFS['LAYER' + layer])
}

export const PREFS = {
  TOKEN: { name: 'token', default: '00000000-0000-0000-0000-000000000000' },
  TABLE: { name: 'table', default: 1 },
  LAYERother: { name: 'layer5', default: true },
  LAYERtoken: { name: 'layer4', default: true },
  LAYERnote: { name: 'layer3', default: false },
  LAYERoverlay: { name: 'layer2', default: false },
  LAYERtile: { name: 'layer1', default: false },
  GRID: { name: 'grid', default: 0 },
  LOS: { name: 'los', default: false },
  SCROLL: { name: 'scroll', default: {} },
  BACKGROUND: { name: 'background', default: 7 }, // wood
  QUALITY: { name: 'quality', default: 3 },
  DISCLAIMER: { name: 'disclaimer', default: false },
  TAB_HELP: { name: 'tabHelp', default: 'tab-1' },
  TAB_LIBRARY: { name: 'tabLibrary', default: 'tab-1' },
  TAB_SETTINGS: { name: 'tabSettings', default: 'tab-1' }
}

export function setPreference (key, pref, value) {
  if (!pref.name) console.error('unknown pref', pref)
  setStoreValue(key, pref.name, value)
}

export function getPreference (key, pref) {
  if (!pref.name) console.error('unknown pref', pref)
  return getStoreValue(key, pref.name) ?? pref.default
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to current server.
 *
 * @param {String} pref Setting to obtain.
 * @return {String} The setting's value.
 */
export function getServerPreference (pref) {
  return getPreference('freebeegee', pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to current server.
 *
 * @param {String} pref Setting to set.
 * @param {String} value The value to set.
 */
export function setServerPreference (pref, value) {
  setPreference('freebeegee', pref, value)
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {String} pref Setting to obtain.
 * @return {String} The setting's value.
 */
export function getRoomPreference (pref) {
  return getPreference(`freebeegee-${room.id}`, pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {String} pref Setting to set.
 * @param {String} value The value to set.
 */
export function setRoomPreference (pref, value) {
  setPreference(`freebeegee-${room.id}`, pref, value)
  setStoreValue(`freebeegee-${room.id}`, 't', Math.floor(new Date().getTime() / 1000)) // touch
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
  const table = getStoreValue(`freebeegee-${room.id}`, `table${no}`) ?? {}
  return table[pref.name] ?? pref.default
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
  const table = getStoreValue(`r${room.id}`, `table${no}`) ?? {}
  table[pref.name] = value
  setStoreValue(`freebeegee-${room.id}`, `table${no}`, table)
  setStoreValue(`freebeegee-${room.id}`, 't', Math.floor(new Date().getTime() / 1000)) // touch
}

/**
 * Remove old and unused entries (rooms) from the HTML local store.
 */
export function cleanupStore () {
  const store = globalThis.localStorage

  // clean obsolete entries
  for (const key of Object.keys(store)) {
    if (!key.startsWith('freebeegee')) store.removeItem(key)
  }

  // keep 16 newest entries
  const entries = []
  for (const key of Object.keys(store)) {
    if (key.startsWith('freebeegee-')) {
      entries.push({ key: key, t: JSON.parse(store.getItem(key)).t })
    }
  }
  entries.sort((a, b) => a.t - b.t)
  for (let i = 0; i < entries.length - 16; i++) {
    store.removeItem(entries[i].key)
  }
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
  return loadRoom(room.name, token)
}

/**
 * (Re)Fetch the room's state from the API and cache it
 *
 * @param {String} name The current table name.
 * @param {String} t The current API token.
 * @return {Promise} Promise of room data object.
 */
export function loadRoom (name, t) {
  token = t
  return apiGetRoom(name, getToken(), true)
    .then(response => {
      if (response.status === 400) {
        runError('ROOM_INVALID', name)
      } else {
        _setRoom(response.body)
        return response
      }
    })
    .catch(error => apiError(error, room.name))
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
  return apiPatchTemplate(room.name, template, getToken())
    .catch(error => apiError(error, room.name, [404]))
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
  return apiPostRoom(room, snapshot, getToken())
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

export const FLAG_NO_DELETE = 0b00000001
export const FLAG_NO_CLONE = 0b00000010
export const FLAG_NO_MOVE = 0b00000100

/**
 * Update the falgs of a piece/token.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to change.
 * @param {Number} f New flag bits.
 * @param {Object} sync Optional. If true (default), trigger table sync.
 */
export function flagPiece (pieceId, f = 0, sync = true) {
  return patchPiece(pieceId, sanitizePiecePatch({ f }), sync)
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
  if (findPiece(pieceId)?.f & FLAG_NO_DELETE) return Promise.resolve() // can't delete those
  return apiDeletePiece(room.name, getTableNo(), pieceId, getToken())
    .catch(error => apiError(error, room.name))
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
  return apiPutTable(room.name, getTableNo(), table, getToken())
    .catch(error => apiError(error, room.name))
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
  let piece = pieces.shift()
  if (piece.a !== ID.LOS) piece = clampToTableSize(piece)
  return createPiece(piece, false)
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
  return apiPostAsset(room.name, data, getToken())
}

/**
 * Delete the current table for good.
 *
 * @return {Promise} Promise of deletion to wait for.
 */
export function deleteRoom () {
  return apiDeleteRoom(room.name, getToken())
}

/**
 * Set/change the current room password.
 *
 * @return {Promise} Promise of change to wait for.
 */
export function setRoomPassword (password) {
  return apiPatchRoomAuth(room.name, {
    password: password
  }, getToken())
}

/**
 * Fetch a table and cache it for future use.
 *
 * @param {Number} no Number of table 0..9.
 * @return {Promise} Promise of a table object.
 */
export function fetchTable (no) {
  return apiGetTable(room.name, no, getToken(), true)
    .then(table => {
      _setTable(no, populatePiecesDefaults(table.body, table.headers))
      return table
    })
    .catch(error => apiError(error, room.name))
}

// --- HTTP error handling -----------------------------------------------------

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
  if (state && room) syncNow()
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
  if (data) {
    data.template = populateTemplateDefaults(data.template)
  }

  room = data
}

// --- internal ----------------------------------------------------------------

let serverInfo = null /** stores the server meta info JSON */
let token = null /** stores the API token for this room */
let room = null /** stores the room meta info JSON */
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
  return apiPatchPiece(room.name, getTableNo(), pieceId, patch, getToken())
    .catch(error => apiError(error, room.name, [404]))
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
  return apiPatchPieces(room.name, getTableNo(), sane, getToken())
    .catch(error => apiError(error, room.name, [404]))
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
  return apiPostPiece(room.name, getTableNo(), stripPiece(piece), getToken())
    .then(piece => {
      return piece.id
    })
    .catch(error => apiError(error, room.name))
    .finally(() => {
      if (sync) syncNow()
    })
}
