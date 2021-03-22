/**
 * @file Holds and manages a game's data objects. Does not know about or
 *       manipulate HTML/DOM. Might cache some values in the browser store.
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

import { setPiece, deletePiece, getAllPiecesIds } from '.'
import { updateMenu } from './mouse.js'
import {
  getStoreValue,
  setStoreValue
} from '../../utils.js'
import {
  apiHeadState,
  apiGetStateSave,
  apiGetState,
  apiPutState,
  apiGetGame,
  apiPostGame,
  apiPatchPiece,
  apiDeletePiece,
  apiPostPiece,
  UnexpectedStatus
} from '../../api.js'
import { runError } from '../error.js'

let gameStateTimeout = -1 /** setTimeout handle of sync method */
const gameStateRefreshMin = 1000 /** minimum syncing interval in ms */
const gameStateRefreshMax = 5000 /** maximum syncing interval in ms */
const gameStateRefreshNever = 365 * 24 * 60 * 60 * 1000 /** actually in a year */
let lastDigest = '' /** last obtained hash/digest of state JSON */
let gameStateRefresh = gameStateRefreshMin /** current, growing syncing interval */
let game = {} /** stores the game meta info JSON */

// --- public ------------------------------------------------------------------

/**
 * Get the current game's metadata (cached).
 *
 * @return {Object} Game's metadata.
 */
export function getGame () {
  return game
}

/**
 * Get the current game's table (cached).
 *
 * Until we support multiple tables, this is always table 0.
 *
 * @return {Object} Current game's template metadata.
 */
export function getTable () {
  return getGame()?.tables[0]
}

/**
 * Get the current game's template (cached).
 *
 * Until we support multiple tables, this is always the template of table 0.
 *
 * @return {Object} Current game's template metadata.
 */
export function getTemplate () {
  return getTable()?.template
}

/**
 * Get the current game's template (cached).
 *
 * Until we support multiple tables, this is always the template of table 0.
 *
 * @return {Object} Current game's template metadata.
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
  return { // create dummy asset
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
 * (Re)Fetch the game's state from the API and trigger the UI update.
 *
 * @param {String} name The current game name.
 * @return {Object} Promise of game metadata object.
 */
export function loadGameState (name) {
  return apiGetGame(name)
    .then(remoteGame => {
      game = remoteGame
      return game
    })
    .catch((error) => { // invalid game
      runError('GAME_GONE', name, error)
      return null
    })
}

/**
 * Create a new game on the server.
 *
 * @param {Object} game The game object to send to the API.
 * @param {Object} snapshot File input or null if no snapshot is to be uploaded.
 * @return {Object} Promise of created game metadata object.
 */
export function createGame (game, snapshot) {
  return apiPostGame(game, snapshot)
}

/**
 * Get a setting from the browser HTML5 store. Automatically scoped to active
 * game.
 *
 * @param {String} pref Setting to obtain.
 * @return {String} The setting's value.
 */
export function stateGetGamePref (pref) {
  return getStoreValue('g' + game.id.substr(0, 8), pref)
}

/**
 * Set a setting in the browser HTML5 store. Automatically scoped to active
 * game.
 *
 * @param {String} pref Setting to set.
 * @param {String} value The value to set.
 */
export function stateSetGamePref (pref, value) {
  setStoreValue('g' + game.id.substr(0, 8), pref, value)
}

export const pollTimes = [25]

/**
 * Poll the current game's state and trigger UI updates.
 *
 * Will first do a HEAD request to detect changes, and only do a GET/update if
 * needed.
 *
 * @param {?String} selectId Optional ID of an selected piece. Will be re-
 *                           selected after successfull update.
 */
export function pollGameState (
  selectId = null
) {
  clearTimeout(gameStateTimeout)
  const pollTime = new Date().getMilliseconds()
  apiHeadState(game.name)
    .then(headers => {
      const digest = headers.get('digest')
      if (lastDigest !== digest) {
        syncState(selectId, digest)
        gameStateRefresh = gameStateRefreshMin
      }
    })
    .catch(error => {
      if (error instanceof UnexpectedStatus) {
        gameStateRefresh = gameStateRefreshNever // stop polling
        runError('GAME_GONE', game.name, error)
      } else {
        runError('UNEXPECTED', error)
      }
    })
    .finally(() => {
      gameStateTimeout = setTimeout(() => pollGameState(false), gameStateRefresh)
      gameStateRefresh = Math.floor(Math.min(
        gameStateRefresh * 1.05,
        gameStateRefreshMax
      ) + Math.random() * 250)

      while (pollTimes.length >= 10) pollTimes.shift()
      const ms = new Date().getMilliseconds() - pollTime
      if (ms > 0) pollTimes.push(ms)
    })
}

/**
 * Set the label of a piece of the current game.
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
 * Set the x/y/z of a piece of the current game.
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
 * Rotate a piece of the current game.
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
 * Flip a piece of the current game and show another side of it.
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
 * Edit multiple properties of a piece of the current game.
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
 * Remove a piece from the current game (from the table, not from the library).
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {String} pieceId ID of piece to remove.
 */
export function stateDeletePiece (id) {
  apiDeletePiece(game.name, id)
    .catch(error => {
      runError('UNEXPECTED', error)
    })
    .finally(() => {
      pollGameState()
    })
}

/**
 * Edit multiple properties of a piece of the current game.
 *
 * Will only do an API call and rely on later sync to get the change back to the
 * data model.
 *
 * @param {Object} piece Full piece to be created.
 * @param {Boolean} selected If true, the piece should be selected after
 *                           creating it. Defaults to false.
 */
export function stateCreatePiece (piece, selected = false) {
  let selectid = null
  apiPostPiece(game.name, piece)
    .then(piece => {
      selectid = piece.id
    })
    .catch(error => {
      runError('UNEXPECTED', error)
    })
    .finally(() => {
      pollGameState(selected ? selectid : null)
    })
}

/**
 * Update the game state to the a new one.
 *
 * Will replace the existing state.
 *
 * @param {Array} state Array of pieces (game state).
 */
export function updateState (state) {
  apiPutState(game.name, state)
    .catch(error => {
      runError('UNEXPECTED', error)
    })
    .finally(() => {
      pollGameState()
    })
}

/**
 * Restore a saved table state.
 *
 * @param {Number} index Integer index of state, 0 = initial.
 */
export function restoreState (index) {
  apiGetStateSave(game.name, index)
    .then(state => {
      apiPutState(game.name, state)
        .catch(error => {
          runError('UNEXPECTED', error)
        })
        .finally(() => {
          pollGameState()
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
  const piece = pieces.shift()
  patchPiece(piece.id, piece, false)
    .then(() => {
      if (pieces.length > 0) updatePieces(pieces)
    })
    .finally(() => {
      if (pieces.length === 0) pollGameState()
    })
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
  return apiPatchPiece(game.name, pieceId, patch)
    .catch(error => {
      if (error instanceof UnexpectedStatus && error.status === 404) {
        // we somewhat expected this situation. silently ignore it.
        console.info('Piece ' + pieceId + ' got deleted - no need to PATCH it.')
      } else {
        runError('UNEXPECTED', error) // *that* was unexpected
      }
    })
    .finally(() => {
      if (poll) pollGameState()
    })
}

export const syncTimes = [75]

/**
 * Download the current game state and trigger updates on change.
 *
 * @param {String} selectId ID of piece to select after update.
 * @param {String} digest Hash of last seen state to detect changes.
 */
function syncState (selectId, digest) {
  const syncTime = new Date().getMilliseconds()

  apiGetState(game.name)
    .then(state => {
      lastDigest = digest
      const keepIds = []
      for (const item of state) {
        setItem(item, selectId)
        keepIds.push(item.id)
      }
      removeObsoletePieces(keepIds)
      updateMenu()
    })
    .catch((error) => { // invalid game
      console.error(error)
      document.location = './?game=' + game.name
    })
    .finally(() => {
      while (syncTimes.length >= 10) syncTimes.shift()
      const ms = new Date().getMilliseconds() - syncTime
      if (ms > 0) syncTimes.push(ms)
    })
}

/**
 * Detect deleted pieces and remove them from the game.
 *
 * @param {String[]} keepIds IDs of pieces to keep.
 */
function removeObsoletePieces (keepIds) {
  // get all piece IDs from dom
  let ids = getAllPiecesIds()
  ids = Array.isArray(ids) ? ids : [ids]

  // remove ids from list that are still there
  for (const id of keepIds) {
    ids = ids.filter(item => item !== id)
  }

  // remove ids from list that are dragndrop targets
  ids = ids.filter(item => !item.endsWith('-drag'))

  // delete ids that are still left
  for (const id of ids) {
    deletePiece(id)
  }
}

/**
 * Trigger UI update for new/changed items.
 *
 * @param {Object} piece Piece to add/update.
 * @param {String} selectId ID of piece to select after update.
 */
function setItem (piece, selectId) {
  switch (piece.layer) {
    case 'tile':
    case 'token':
    case 'overlay':
    case 'other':
      setPiece(piece, selectId === piece.id)
      break
    default:
  }
}

// const requestCache = [] /** stores cached server requests */
//
// /**
//  * Cache server GET requests.
//  *
//  * Will serve data from an client cache if it is already present and only do the
//  * API call only if not.
//  *
//  * @param {String} key The name/key for this cache item.
//  * @param {Boolean} forced Always (re)fetch from API if true.
//  * @param {function} call Has to return the actual fetch() promise when called.
//  */
// function getCached (key, forced, call) {
//   if (forced) requestCache[key] = null
//   if (requestCache[key]) {
//     return new Promise((resolve, reject) => {
//       resolve(requestCache[key])
//     })
//   } else {
//     return call()
//       .then(data => {
//         requestCache[key] = data
//         return requestCache[key]
//       })
//   }
// }
