/**
 * @file Holds and manages a room's data objects, a.k.a. state. Propagates
 *       changes to the API but is not in charge of syncing the state back.
 *       Might cache some values in the browser store.
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

import {
  brightness
} from '../lib/utils.mjs'

import {
  getStoreValue,
  setStoreValue
} from '../lib/utils-html.mjs'

import {
  DEMO_MODE,
  UnexpectedStatus,
  apiGetTable,
  apiPutTable,
  apiGetRoom,
  apiPostRoom,
  apiDeleteRoom,
  apiPatchSetup,
  apiPatchPiece,
  apiPatchPieces,
  apiDeletePiece,
  apiPatchAsset,
  apiPostPiece,
  apiPostAsset,
  apiDeleteAsset,
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
  ID,
  FEATURE_DICEMAT,
  TYPE_HEX,
  TYPE_HEX2,
  findPiece,
  populatePiecesDefaults,
  populateSetupDefaults,
  clampToTableSize,
  nameToLayer,
  getRoomMediaURL,
  sanitizePiecePatch
} from '../view/room/tabletop/tabledata.mjs'

import {
  selectionAdd
} from '../view/room/tabletop/selection.mjs'

// --- public ------------------------------------------------------------------

/**
 * Get the current serverInfo object from the client cache.
 *
 * @returns {object} The cached server metadata object.
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
 * @returns {object} Token
 */
export function getToken () {
  return token
}

/**
 * Get the current table's metadata (cached).
 *
 * @returns {object} Room's metadata.
 */
export function getRoom () {
  return room
}

/**
 * Get the current table's setup (cached).
 *
 * @returns {object} Current room's setup metadata.
 */
export function getSetup () {
  return getRoom()?.setup
}

/**
 * Get the currently visible table number.
 *
 * @returns {number} Table number.
 */
export function getTableNo () {
  return tableNo
}

/**
 * Switch to another table.
 *
 * Triggers API fetch & updates table.
 *
 * @param {number} no Table to set (1..9).
 * @param {boolean} sync Force sync after setting status. Unit tests might disable that.
 */
export function setTableNo (no, sync = true) {
  if (no >= 1 && no <= 9) {
    tableNo = no
    setRoomPreference(PREFS.TABLE, tableNo)
    if (sync) syncNow(true)
  }
}

/**
 * Get (cached) state for a given slot/table.
 *
 * @param {number} no Table slot 0..9. Defaults to current one.
 * @returns {object} Table array.
 */
export function getTable (no = getTableNo()) {
  return tables[no]
}

/**
 * Get current background image data.
 *
 * @returns {object} Current table background.
 */
export function getBackground () {
  const bgName = getServerPreference(PREFS.BACKGROUND)
  const background = serverInfo.backgrounds.find(b => b.name === bgName) ?? serverInfo.backgrounds.find(b => b.name === 'Wood') ?? serverInfo.backgrounds[0]

  if (!background.grid) { // determine matching grid file on the fly
    const gridType = getRoomPreference(PREFS.GRID)
    const color = brightness(background.color) < 92 ? 'white' : 'black'
    const style = gridType > 1 ? 'major' : 'minor'

    switch (room.setup?.type) {
      case TYPE_HEX:
        background.gridFile = `img/grid-hex-${style}-${color}.svg`
        break
      case TYPE_HEX2:
        background.gridFile = `img/grid-hex2-${style}-${color}.svg`
        break
      default:
        background.gridFile = `img/grid-square-${style}-${color}.svg`
    }
  }

  return background
}

/**
 * Get the material media path for a material name.
 *
 * Reverts to first = no material if not found.
 *
 * @param {string} name The material's name, e.g. 'wood'.
 * @returns {string} Media path, e.g. 'api/data/rooms/roomname/assets/material/wood.png'
 */
export function getMaterialMedia (name) {
  const material = getLibrary()?.material?.find(m => m.name === name)
  const filename = material?.media[0] ?? 'none.png'
  return getRoomMediaURL(getRoom()?.name, 'material', filename, DEMO_MODE)
}

/**
 * Get a human readable name for an asset's bg value.
 *
 * @param {any} backgroundColor A bg value.
 * @returns {string} Label for the UI.
 */
export function getColorLabel (backgroundColor) {
  if (backgroundColor.match(/^#/)) {
    return `${backgroundColor}`
  }

  const colors = getSetup().colors
  const parsed = Number.parseInt(backgroundColor)
  if (`${parsed}` === backgroundColor) {
    return colors[(parsed - 1 + colors.length) % colors.length]?.name ?? 'unknown'
  }

  if (backgroundColor === 'transparent') {
    return 'transparent'
  }

  // TODO: piece?

  return '#808080' // default color
}

/**
 * Get the current table's library (cached).
 *
 * @returns {object} Current room's library metadata.
 */
export function getLibrary () {
  return getRoom()?.library
}

/**
 * Determine if a layer is currently active.
 *
 * @param {string} layer Name of layer.
 * @returns {boolean} True if active.
 */
export function isLayerActive (layer) {
  return getRoomPreference(PREFS['LAYER' + layer])
}

export const PREFS = {
  TOKEN: { name: 'token', default: '00000000-0000-0000-0000-000000000000' },
  TABLE: { name: 'table', default: null },
  LAYERother: { name: 'layer5', default: undefined },
  LAYERtoken: { name: 'layer4', default: undefined },
  LAYERnote: { name: 'layer3', default: undefined },
  LAYERoverlay: { name: 'layer2', default: undefined },
  LAYERtile: { name: 'layer1', default: undefined },
  GRID: { name: 'grid', default: 0 },
  LOS: { name: 'los', default: false },
  SCROLL: { name: 'scroll', default: {} },
  ZOOM: { name: 'zoom', default: 1.0 },
  PIECE_ROTATE: { name: 'pieceRotate', default: undefined },
  BACKGROUND: { name: 'background', default: 'Wood' },
  QUALITY: { name: 'quality', default: 3 },
  DISCLAIMER: { name: 'disclaimer', default: false },
  TAB_HELP: { name: 'tabHelp', default: 'tab-1' },
  TAB_LIBRARY: { name: 'tabLibrary', default: 'tab-1' },
  TAB_SETTINGS: { name: 'tabSettings', default: 'tab-1' }
}

/**
 * Set a known preference in the HTML store.
 *
 * @param {string} key HTML store key.
 * @param {string} pref Property name in object stored in that key.
 * @param {object} value Object to store in the property.
 */
export function setPreference (key, pref, value) {
  if (!pref.name) console.error('unknown pref', pref)
  setStoreValue(key, pref.name, value)
}

/**
 * Get a known preference from the HTML store.
 *
 * @param {string} key HTML store key.
 * @param {string} pref Property name in object stored in that key.
 * @returns {object} value Object stored in the property.
 */
export function getPreference (key, pref) {
  if (!pref.name) console.error('unknown pref', pref)
  return getStoreValue(key, pref.name) ?? pref.default
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to current server.
 *
 * @param {string} pref Setting to obtain.
 * @returns {string} The setting's value.
 */
export function getServerPreference (pref) {
  return getPreference('freebeegee', pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to current server.
 *
 * @param {string} pref Setting to set.
 * @param {string} value The value to set.
 */
export function setServerPreference (pref, value) {
  setPreference('freebeegee', pref, value)
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {string} pref Setting to obtain.
 * @returns {string} The setting's value.
 */
export function getRoomPreference (pref) {
  return getPreference(`freebeegee-${room.id}`, pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {string} pref Setting to set.
 * @param {string} value The value to set.
 */
export function setRoomPreference (pref, value) {
  setPreference(`freebeegee-${room.id}`, pref, value)
  setStoreValue(`freebeegee-${room.id}`, 't', Math.floor(new Date().getTime() / 1000)) // touch
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * room + table no.
 *
 * @param {string} pref Setting to obtain.
 * @param {number} no Table number. Defaults to curren table.
 * @returns {string} The setting's value.
 */
export function getTablePreference (pref, no = getTableNo()) {
  const table = getStoreValue(`freebeegee-${room.id}`, `table${no}`) ?? {}
  return table[pref.name] ?? pref.default
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * room + table number.
 *
 * @param {string} pref Setting to set.
 * @param {string} value The value to set.
 * @param {number} no Table number. Defaults to curren table.
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
      entries.push({ key, t: JSON.parse(store.getItem(key)).t })
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
 * @returns {Promise} Promise of room data object.
 */
export function reloadRoom () {
  return loadRoom(room.name, token)
}

/**
 * (Re)Fetch the room's state from the API and cache it
 *
 * @param {string} name The current table name.
 * @param {string} t The current API token.
 * @returns {Promise<object>} Room data object.
 */
export function loadRoom (name, t) {
  token = t
  return apiGetRoom(name, getToken(), true)
    .then(response => {
      if (response.status === 400) {
        runError('ROOM_INVALID', name)
      } else if (response.status === 200) {
        _setRoom(response.body)
        return response
      } else {
        apiError(new UnexpectedStatus(response.status, response.body), name)
      }
    })
    .catch(error => apiError(error, name))
}

/**
 * Update the current setup.
 *
 * Supports partial updates.
 *
 * @param {object} setup (Partial) new setup data.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} Updated setup object.
 */
export function patchSetup (setup, sync = true) {
  return apiPatchSetup(room.name, setup, getToken())
    .catch(error => apiError(error, room.name, [404]))
    .finally(() => { if (sync) syncNow() })
}

/**
 * Create a new room on the server.
 *
 * @param {object} room The room object to send to the API.
 * @param {object} snapshot File input or null if no snapshot is to be uploaded.
 * @returns {Promise<object>} The created room metadata object.
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
 * @param {string} pieceId ID of piece to change.
 * @param {?number} x New x. Will not be changed if null.
 * @param {?number} y New y. Will not be changed if null.
 * @param {?number} z New z. Will not be changed if null.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified piece.
 */
export function movePiece (pieceId, x = null, y = null, z = null, sync = true) {
  return patchPiece(pieceId, movePiecePatch(pieceId, x, y, z), sync)
}

/**
 * Set the x/y/z of a piece of the current table.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {object[]} moves Array of objects {id, x, y, z} like movePiece().
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object[]>} The modified pieces.
 */
export function movePieces (moves, sync = true) {
  const patches = []
  for (const move of moves) {
    patches.push(movePiecePatch(move.id, move.x, move.y, move.z))
  }
  return patchPieces(patches, sync)
}

/**
 * Rotate a piece of the current table.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {string} pieceId ID of piece to change.
 * @param {number} r New rotation (0, 60, 90, 120, 180, 260, 270).
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified piece.
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
 * @param {string} pieceId ID of piece to change.
 * @param {number} n New number (0..27).
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified piece.
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
 * @param {string} pieceId ID of piece to change.
 * @param {number} side New side. Zero-based.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified piece.
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
 * @param {string} pieceId ID of piece to change.
 * @param {number} color1 New color index. Zero-based.
 * @param {number} color2 New color index. Zero-based.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified piece.
 */
export function colorPiece (pieceId, color1 = 0, color2 = 0, sync = true) {
  return patchPiece(
    pieceId,
    sanitizePiecePatch({ c: [color1, color2] }, pieceId),
    sync
  )
}

export const FLAGS = {
  NO_DELETE: 0b00000001,
  NO_CLONE: 0b00000010,
  NO_MOVE: 0b00000100,
  NOTE_TOPLEFT: 0b10000000
}

/**
 * Update the falgs of a piece/token.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {string} pieceId ID of piece to change.
 * @param {number} f New flag bits.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified piece.
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
 * @param {string} pieceId ID of piece to change.
 * @param {object} updates All properties to be changed. Unchanged properties
 *                         should be omitted.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified piece.
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
 * @param {string} pieceId ID of piece to remove.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The deleted piece.
 */
export function deletePiece (pieceId, sync = true) {
  if (findPiece(pieceId)?.f & FLAGS.NO_DELETE) return Promise.resolve() // can't delete those
  return apiDeletePiece(room.name, getTableNo(), pieceId, getToken())
    .catch(error => apiError(error, room.name))
    .finally(() => { if (sync) syncNow() })
}

/**
 * Update (patch) an asset in the library.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {object} asset Partial asset patch to update. id field is mandatory.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified asset.
 */
export function updateAsset (asset, sync = true) {
  return apiPatchAsset(room.name, asset, getToken())
    .catch(error => apiError(error, room.name))
    .finally(() => { if (sync) syncNow() })
}

/**
 * Remove an asset from the library. Will keep referencing pices on the table (which
 * will get a placeholder image).
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {string} assetId ID of asset to remove.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise} Promise of execution.
 */
export function deleteAsset (assetId, sync = true) {
  return apiDeleteAsset(room.name, assetId, getToken())
    .catch(error => apiError(error, room.name))
    .finally(() => { if (sync) syncNow() })
}

/**
 * Update the table state to the a new one.
 *
 * Will replace the existing table.
 *
 * @param {object[]} table Array of pieces.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The modified table.
 */
export function updateTable (table, sync = true) {
  return apiPutTable(room.name, getTableNo(), table, getToken())
    .catch(error => apiError(error, room.name))
    .finally(() => { if (sync) syncNow() })
}

/**
 * Update (patch) a series of pieces.
 *
 * Will do only one state refresh after updating all items in the list.
 *
 * @param {object[]} pieces (Partial) pieces to patch.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object[]>} The modified pieces.
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
 * @param {object[]} pieces (Full) pieces to crate.
 * @param {boolean} select Optional. If false (default), created pieces will not be selected.
 * @param {boolean} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object>} The created pieces.
 */
export function createPieces (pieces, select = false, sync = true) {
  let final = false

  if (!pieces || pieces.length <= 0) return Promise.resolve({})
  let piece = pieces.shift()
  if (piece.a !== ID.LOS) piece = clampToTableSize(piece)
  return createPiece(piece, select, false)
    .then(id => {
      if (pieces.length === 0) final = true
      if (pieces.length > 0) return createPieces(pieces, select, sync)
    })
    .finally(() => {
      if (final && sync) syncNow(true)
    })
}

/**
 * Add a new asset to the library.
 *
 * @param {object} asset The asset to add/upload.
 * @returns {Promise<object>} The created asset.
 */
export function addAsset (asset) {
  return apiPostAsset(room.name, asset, getToken())
}

/**
 * Delete the current table for good.
 *
 * @returns {Promise} Promise of execution.
 */
export function deleteRoom () {
  return apiDeleteRoom(room.name, getToken())
}

/**
 * Set/change the current room password.
 *
 * @param {string} password The new password.
 * @returns {Promise} Promise of execution.
 */
export function setRoomPassword (password) {
  return apiPatchRoomAuth(room.name, {
    password
  }, getToken())
}

/**
 * Fetch a table and cache it for future use.
 *
 * @param {number} no Number of table 0..9.
 * @returns {Promise} Promise of a table object.
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
 * @returns {boolean} True if yes.
 */
export function isTabActive () {
  return tabActive
}

/**
 * Store the browser/tab activity state.
 *
 * Will trigger sync if tab became active.
 *
 * @param {boolean} state New browser tab state.
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
 *
 * @param {number} no Table number.
 * @param {object} data Table data.
 */
export function _setTable (no, data) {
  tables[no] = data
}

/**
 * Internal: Set a room metadata to given data.
 *
 * Only exposed for unit testing.
 *
 * @param {object} data Room data.
 */
export function _setRoom (data) {
  if (data) {
    data.setup = populateSetupDefaults(data.setup)
  }
  room = data
}

// --- internal ----------------------------------------------------------------

let serverInfo = null /** stores the server meta info JSON */
let token = null /** stores the API token for this room */
let room = null /** stores the room meta info JSON */
let tableNo = 1 /** stores the currently visible table index */
const tables = [[], [], [], [], [], [], [], [], [], []] /** caches the tables 0..9 */
let tabActive = true /** is the current tab/window active/maximized? */

/**
 * Strip client-side properties from pieces that would confuse the API.
 *
 * Removes all properties starting with '_'.
 *
 * @param {object} piece A piece to cleanup.
 * @returns {object} The stripped piece.
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
 * @param {string} pieceId ID of piece to change.
 * @param {object} patch Partial object of fields to send.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {object} Promise of the API request.
 */
function patchPiece (pieceId, patch, sync = true) {
  if (patch.l) patch.l = nameToLayer(patch.l)
  return apiPatchPiece(room.name, getTableNo(), pieceId, patch, getToken())
    .catch(error => apiError(error, room.name, [404]))
    .finally(() => { if (sync) syncNow() })
}

/**
 * Update a piece on the server.
 *
 * @param {object[]} patches Array of partial object of fields to send. Must include ids!
 * @param {object} sync If true (default), trigger table sync.
 * @returns {Promise<object>} Promise of the API request.
 */
function patchPieces (patches, sync = true) {
  const sane = []
  if (patches.length <= 0) return Promise.resolve() // nothing to do!
  for (const patch of patches) {
    if (patch.l) patch.l = nameToLayer(patch.l)
    sane.push(sanitizePiecePatch(patch, patch.id))
  }
  return apiPatchPieces(room.name, getTableNo(), sane, getToken())
    .catch(error => apiError(error, room.name, [404]))
    .finally(() => { if (sync) syncNow() })
}

/**
 * Create a piece on the server.
 *
 * @param {object} piece The full piece to send to the server.
 * @param {boolean} select Optional. If false (default), piece will not get selected.
 * @param {boolean} sync Optional. If true (default), trigger table sync.
 * @returns {object} Promise of the ID of the new piece.
 */
function createPiece (piece, select = false, sync = true) {
  if (piece.l) piece.l = nameToLayer(piece.l)
  return apiPostPiece(room.name, getTableNo(), stripPiece(piece), getToken())
    .then(piece => {
      if (select) selectionAdd(piece.id, true)
      return piece.id
    })
    .catch(error => apiError(error, room.name))
    .finally(() => { if (sync) syncNow() })
}

/**
 * Create a patch object for a piece move.
 *
 * @param {string} pieceId ID of piece to change.
 * @param {?number} x New x. Will not be changed if null.
 * @param {?number} y New y. Will not be changed if null.
 * @param {?number} z New z. Will not be changed if null.
 * @returns {object} A JSON piece patch ready to be sent to the API.
 */
export function movePiecePatch (pieceId, x = null, y = null, z = null) {
  const patch = { id: pieceId }
  if (x != null) patch.x = x
  if (y != null) patch.y = y
  if (z != null) {
    if (findPiece(pieceId)?._meta?.feature === FEATURE_DICEMAT) {
      if (x || y) {
        // ignore z on move
      } else {
        patch.z = z // don't ignore z if only z changes
      }
    } else {
      patch.z = z
    }
  }

  return sanitizePiecePatch(patch)
}
