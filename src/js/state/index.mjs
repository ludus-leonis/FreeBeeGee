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

import Api from '../api/index.mjs'
import Browser from '../lib/util-browser.mjs'
import Content from '../view/room/tabletop/content.mjs'
import Error from '../view/error.mjs'
import Event from '../lib/event.mjs'
import Selection from '../view/room/tabletop/selection.mjs'

// -----------------------------------------------------------------------------

const SERVERLESS = ('true' === '$SERVERLESS$')

const PREF = {
  BACKGROUND: { name: 'background', default: 'Wood' },
  DISCLAIMER: { name: 'disclaimer', default: false },
  GRID: { name: 'grid', default: 0 },
  LAYERnote: { name: 'layer3', default: undefined },
  LAYERother: { name: 'layer5', default: undefined },
  LAYERsticker: { name: 'layer2', default: undefined },
  LAYERtile: { name: 'layer1', default: undefined },
  LAYERtoken: { name: 'layer4', default: undefined },
  MODE: { name: 'mode', default: 'MAIN' },
  PIECE_ROTATE: { name: 'pieceRotate', default: undefined },
  QUALITY: { name: 'quality', default: 3 },
  SCROLL: { name: 'scroll', default: {} },
  SNAPSHOT: { name: 'snapshot', default: undefined },
  TAB_HELP: { name: 'tabHelp', default: 'tab-1' },
  TAB_LIBRARY: { name: 'tabLibrary', default: 'tab-1' },
  TAB_SETTINGS: { name: 'tabSettings', default: 'tab-1' },
  TABLE: { name: 'table', default: null },
  TOKEN: { name: 'token', default: '00000000-0000-0000-0000-000000000000' },
  ZOOM: { name: 'zoom', default: 1.0 }
}

export default {
  PREF,
  SERVERLESS,

  addAsset,
  addRoom,
  cleanupStore,
  createPieces,
  deleteAsset,
  deleteRoom,
  editPiece,
  fetchTable,
  getBackground,
  getColorLabel,
  getGridFile,
  getLayer,
  getLibrary,
  getPreference,
  getRoom,
  getRoomPreference,
  getServerInfo,
  getServerPreference,
  getSetup,
  getTable,
  getTableNo,
  getTablePreference,
  getToken,
  isLayerActive,
  isTabActive,
  loadRoom,
  movePieces,
  patchPieces,
  patchSetup,
  reloadRoom,
  remove,
  setPreference,
  setRoomPassword,
  setRoomPreference,
  setServerInfo,
  setServerPreference,
  setTabActive,
  setTableNo,
  setTablePreference,
  undo,
  updateAsset,
  updatePieces,
  updateTable,

  _private: {
    setRoom,
    setTable
  }
}

// --- public ------------------------------------------------------------------

/**
 * Get the current serverInfo object from the client cache.
 *
 * @returns {object} The cached server metadata object.
 */
function getServerInfo () {
  return serverInfo
}

/**
 * Set the current serverInfo object in the client cache.
 *
 * @param {object} info The serverInfo meta object.
 */
function setServerInfo (info) {
  serverInfo = info
}

/**
 * Get the current API token.
 *
 * @returns {object} Token
 */
function getToken () {
  return token
}

/**
 * Get the current table's metadata (cached).
 *
 * @returns {object} Room's metadata.
 */
function getRoom () {
  return room
}

/**
 * Get the current table's setup (cached).
 *
 * @returns {object} Current room's setup metadata.
 */
function getSetup () {
  return getRoom()?.setup
}

/**
 * Get the currently visible table number.
 *
 * @returns {number} Table number.
 */
function getTableNo () {
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
function setTableNo (no, sync = true) {
  if (no >= 1 && no <= 9) {
    tableNo = no
    setRoomPreference(PREF.TABLE, tableNo)
    if (sync) Event.trigger(Event.HOOK.SYNCNOW, true)
  }
}

/**
 * Get (cached) state for a given slot/table.
 *
 * @param {number} no Table slot 1..9. Defaults to current one.
 * @returns {object} Table array.
 */
function getTable (no = getTableNo()) {
  return tables[no]
}

/**
 * Get (cached) state for a given layer in a slot/table.
 *
 * @param {string} layer Name of layer.
 * @param {number} no Table slot 1..9. Defaults to current one.
 * @returns {object} Layer array.
 */
function getLayer (layer, no = getTableNo()) {
  return tables[no].filter(p => p.l === layer)
}

/**
 * Determine proper grid file.
 *
 * @param {string} bgcolor HTML color to find highest-contrast grid file for.
 * @param {string} strength Grid style (major/minor)
 * @returns {string} The grid image file.
 */
function getGridFile (bgcolor, strength) {
  const bright = Browser.brightness(bgcolor)
  let color = 5
  const window = 52
  if (bright <= 128 - window) color = 1
  if (bright >= 128 + window) color = 9

  switch (room.setup?.type) {
    case Content.GRID.HEX:
      return `img/grid-hex-${strength}-${color}.svg`
    case Content.GRID.HEX2:
      return `img/grid-hex2-${strength}-${color}.svg`
    default:
      return `img/grid-square-${strength}-${color}.svg`
  }
}

/**
 * Get current background image data.
 *
 * @returns {object} Current table background.
 */
function getBackground () {
  const bgName = getServerPreference(PREF.BACKGROUND)
  const background = serverInfo.backgrounds.find(b => b.name === bgName) ?? serverInfo.backgrounds.find(b => b.name === 'Wood') ?? serverInfo.backgrounds[0]

  if (!background.grid) { // determine matching grid file on the fly
    const gridType = getRoomPreference(PREF.GRID)
    background.gridFile = getGridFile(background.color, gridType > 1 ? 'major' : 'minor')
  }

  return background
}

/**
 * Get a human readable name for an asset's bg value.
 *
 * @param {any} backgroundColor A bg value.
 * @returns {string} Label for the UI.
 */
function getColorLabel (backgroundColor) {
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

  return '#808080' // default color
}

/**
 * Get the current table's library (cached).
 *
 * @returns {object} Current room's library metadata.
 */
function getLibrary () {
  return getRoom()?.library
}

/**
 * Determine if a layer is currently active.
 *
 * @param {string} layer Name of layer.
 * @returns {boolean} True if active.
 */
function isLayerActive (layer) {
  return getRoomPreference(PREF['LAYER' + layer])
}

/**
 * Set a known preference in the HTML store.
 *
 * @param {string} key HTML store key.
 * @param {string} pref Property name in object stored in that key.
 * @param {object} value Object to store in the property.
 */
function setPreference (key, pref, value) {
  if (!pref.name) console.error('unknown pref', pref)
  Browser.setStoreValue(key, pref.name, value)
}

/**
 * Get a known preference from the HTML store.
 *
 * @param {string} key HTML store key.
 * @param {string} pref Property name in object stored in that key.
 * @returns {object} value Object stored in the property.
 */
function getPreference (key, pref) {
  if (!pref.name) console.error('unknown pref', pref)
  return Browser.getStoreValue(key, pref.name) ?? pref.default
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to current server.
 *
 * @param {string} pref Setting to obtain.
 * @returns {string} The setting's value.
 */
function getServerPreference (pref) {
  return getPreference('freebeegee', pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to current server.
 *
 * @param {string} pref Setting to set.
 * @param {string} value The value to set.
 */
function setServerPreference (pref, value) {
  setPreference('freebeegee', pref, value)
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {string} pref Setting to obtain.
 * @returns {string} The setting's value.
 */
function getRoomPreference (pref) {
  return getPreference(`freebeegee-${room.id}`, pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * room.
 *
 * @param {string} pref Setting to set.
 * @param {string} value The value to set.
 */
function setRoomPreference (pref, value) {
  setPreference(`freebeegee-${room.id}`, pref, value)
  Browser.setStoreValue(`freebeegee-${room.id}`, 't', Math.floor(new Date().getTime() / 1000)) // touch
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * room + table no.
 *
 * @param {string} pref Setting to obtain.
 * @param {number} no Table number. Defaults to curren table.
 * @returns {string} The setting's value.
 */
function getTablePreference (pref, no = getTableNo()) {
  const table = Browser.getStoreValue(`freebeegee-${room.id}`, `table${no}`) ?? {}
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
function setTablePreference (pref, value, no = getTableNo()) {
  const table = Browser.getStoreValue(`r${room.id}`, `table${no}`) ?? {}
  table[pref.name] = value
  Browser.setStoreValue(`freebeegee-${room.id}`, `table${no}`, table)
  Browser.setStoreValue(`freebeegee-${room.id}`, 't', Math.floor(new Date().getTime() / 1000)) // touch
}

/**
 * Remove old and unused entries (rooms) from the HTML local store.
 */
function cleanupStore () {
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
function reloadRoom () {
  return loadRoom(room.name, token)
}

/**
 * (Re)Fetch the room's state from the API and cache it
 *
 * @param {string} name The current table name.
 * @param {string} t The current API token.
 * @returns {Promise<object>} Room data object.
 */
function loadRoom (name, t) {
  token = t
  return Api.getRoom(name, getToken(), true)
    .then(response => {
      if (response.status === 400) {
        Error.runError('ROOM_INVALID', name)
      } else if (response.status === 200) {
        setRoom(response.body)
        return response
      } else {
        Error.apiError(new Api.UnexpectedStatus(response.status, response.body), name)
      }
    })
    .catch(error => Error.apiError(error, name))
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
function patchSetup (setup, sync = true) {
  return Api.patchSetup(room.name, setup, getToken())
    .catch(error => Error.apiError(error, room.name, [404]))
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
}

/**
 * Create a new room on the server.
 *
 * @param {object} room The room object to send to the API.
 * @param {object} snapshot File input or null if no snapshot is to be uploaded.
 * @returns {Promise<object>} The created room metadata object.
 */
function addRoom (room, snapshot) {
  return Api.postRoom(room, snapshot, getToken())
}

/**
 * Undo one history step.
 *
 * @param {number} no The table number to undo on.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<void>} Promise of execution.
 */
function undo (no = getTableNo(), sync = true) {
  return Api.postUndo(room.name, no, getToken())
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
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
function movePiecePatch (pieceId, x = null, y = null, z = null) {
  const patch = { id: pieceId }
  if (x != null) patch.x = x
  if (y != null) patch.y = y
  if (z != null) {
    if (Content.findPiece(pieceId)?._meta?.feature === Content.FEATURE.DICEMAT) {
      if (x || y) {
        // ignore z on move
      } else {
        patch.z = z // don't ignore z if only z changes
      }
    } else {
      patch.z = z
    }
  }

  return Content.sanitizePiecePatch(patch)
}

/**
 * Set the x/y/z of a piece of the current table.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {object[]} moves Array of objects {id, x, y, z}.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<object[]>} The modified pieces.
 */
function movePieces (moves, sync = true) {
  const patches = []
  for (const move of moves) {
    patches.push(movePiecePatch(move.id, move.x, move.y, move.z))
  }
  return patchPieces(patches, sync)
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
function editPiece (pieceId, updates, sync = true) {
  if (Object.keys(updates).length > 0) {
    return patchPiece(pieceId, Content.sanitizePiecePatch(updates, pieceId), sync)
  }
  return Promise.resolve({}) // nothing to do
}

/**
 * Remove/delete a piece from the current table (from the room, not from the library).
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {object[]} pieces Pieces to remove (id field mandatory).
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise<void>} Promise of completion.
 */
function remove (pieces, sync = true) {
  const ids = []
  for (const piece of pieces) {
    ids.push(piece.id)
  }
  if (ids.length <= 0) return Promise.resolve() // nothing to do!
  return Api.deletePieces(room.name, getTableNo(), ids, getToken())
    .catch(error => Error.apiError(error, room.name))
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
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
function updateAsset (asset, sync = true) {
  return Api.patchAsset(room.name, asset, getToken())
    .catch(error => Error.apiError(error, room.name))
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
}

/**
 * Remove an asset from the library. Will keep referencing pieces on the table (which
 * will get a placeholder image).
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {string} assetId ID of asset to remove.
 * @param {object} sync Optional. If true (default), trigger table sync.
 * @returns {Promise} Promise of execution.
 */
function deleteAsset (assetId, sync = true) {
  return Api.deleteAsset(room.name, assetId, getToken())
    .catch(error => Error.apiError(error, room.name))
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
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
function updateTable (table, sync = true) {
  return Api.putTable(room.name, getTableNo(), table, getToken())
    .catch(error => Error.apiError(error, room.name))
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
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
function updatePieces (pieces, sync = true) {
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
function createPieces (pieces, select = false, sync = true) {
  if (!pieces || pieces.length <= 0) return Promise.resolve([])

  const toSend = []
  for (let piece of pieces) {
    if (piece.l) piece.l = Content.nameToLayer(piece.l)
    if (piece.a !== Content.ID.LOS) piece = Content.clampToTableSize(piece)
    toSend.push(stripPiece(piece))
  }

  return Api.postPieces(room.name, getTableNo(), toSend, getToken())
    .then(reply => {
      const pieces = reply.data?.body ? JSON.parse(reply.data.body) : reply // map test mode reply
      const ids = []
      for (const piece of pieces) {
        if (select) Selection.select(piece.id, true)
        ids.push(piece.id)
      }
      return reply
    })
    .catch(error => Error.apiError(error, room.name))
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
}

/**
 * Add a new asset to the library.
 *
 * @param {object} asset The asset to add/upload.
 * @returns {Promise<object>} The created asset.
 */
function addAsset (asset) {
  return Api.postAsset(room.name, asset, getToken())
}

/**
 * Delete the current table for good.
 *
 * @returns {Promise} Promise of execution.
 */
function deleteRoom () {
  return Api.deleteRoom(room.name, getToken())
}

/**
 * Set/change the current room password.
 *
 * @param {string} password The new password.
 * @returns {Promise} Promise of execution.
 */
function setRoomPassword (password) {
  return Api.patchRoomAuth(room.name, {
    password
  }, getToken())
}

/**
 * Fetch a table and cache it for future use.
 *
 * @param {number} no Number of table 0..9.
 * @returns {Promise} Promise of a table object.
 */
function fetchTable (no) {
  return Api.getTable(room.name, no, getToken(), true)
    .then(table => {
      setTable(no, Content.populatePiecesDefaults(table.body, table.headers))
      return table
    })
    .catch(error => Error.apiError(error, room.name))
}

// --- HTTP error handling -----------------------------------------------------

/**
 * Is the browser/tab currently active/visible?
 *
 * @returns {boolean} True if yes.
 */
function isTabActive () {
  return tabActive
}

/**
 * Store the browser/tab activity state.
 *
 * Will trigger sync if tab became active.
 *
 * @param {boolean} state New browser tab state.
 */
function setTabActive (state) {
  tabActive = state
  if (state && room) Event.trigger(Event.HOOK.SYNCNOW)
}

// --- internal ----------------------------------------------------------------

let serverInfo = null /** stores the server meta info JSON */
let token = null /** stores the API token for this room */
let room = null /** stores the room meta info JSON */
let tableNo = 1 /** stores the currently visible table index */
const tables = [[], [], [], [], [], [], [], [], [], []] /** caches the tables 0..9 */
let tabActive = true /** is the current tab/window active/maximized? */

/**
 * Internal: Set a table to given data.
 *
 * Only exposed for unit testing.
 *
 * @param {number} no Table number.
 * @param {object} data Table data.
 */
function setTable (no, data) {
  tables[no] = data
}

/**
 * Internal: Set a room metadata to given data.
 *
 * Only exposed for unit testing.
 *
 * @param {object} data Room data.
 */
function setRoom (data) {
  if (data) {
    data.setup = Content.populateSetupDefaults(data.setup)
    data.library = Content.populateLibraryDefaults(data.library)
  }
  room = data
}

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
  if (patch.l) patch.l = Content.nameToLayer(patch.l)
  return Api.patchPiece(room.name, getTableNo(), pieceId, patch, getToken())
    .catch(error => Error.apiError(error, room.name, [404]))
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
}

/**
 * Update pieces on the server.
 *
 * @param {object[]} patches Array of partial object of fields to send. Must include ids!
 * @param {object} sync If true (default), trigger table sync.
 * @returns {Promise<object>} Promise of the API request.
 */
function patchPieces (patches, sync = true) {
  const sane = []
  for (const patch of patches) {
    if (patch.l) patch.l = Content.nameToLayer(patch.l)
    sane.push(Content.sanitizePiecePatch(patch, patch.id))
  }
  if (sane.length <= 0) return Promise.resolve() // nothing to do!
  return Api.patchPieces(room.name, getTableNo(), sane, getToken())
    .catch(error => Error.apiError(error, room.name, [404]))
    .finally(() => { if (sync) Event.trigger(Event.HOOK.SYNCNOW) })
}
