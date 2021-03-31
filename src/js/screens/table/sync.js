/**
 * @file Logic to poll/sync the server regularily and update the local state on
 *       changes.
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
import { getTable } from './state.js'
import {
  apiHeadState,
  apiGetState,
  UnexpectedStatus
} from '../../api.js'
import { runError } from '../error.js'
import { clamp } from '../../utils.js'
import { modalInactive } from './modals/inactive.js'

// --- public ------------------------------------------------------------------

export const syncTimes = [75]
export const pollTimes = [25]

/**
 * Do a sync and start the automatic polling in the background.
 *
 * @param {Function} handler Optonal handler / callback to run after first sync.
 */
export function startAutoSync (handler = null) {
  stopAutoSync()
  syncNow()
    .then(() => {
      if (handler) handler()
      scheduleSync(calculateNextSyncTime())
    })
}

/**
 * Trigger a poll, independent of time that passed since last poll.
 *
 * @param {String[]} selectId List of IDs to be re-selected after successfull
 *                            update.
 */
export function syncNow (selectedIds = []) {
  if (isAutoSync()) {
    stopAutoSync()
    return doTheSync(selectedIds)
      .then(() => scheduleSync(calculateNextSyncTime()))
  } else {
    return doTheSync(selectedIds)
  }
}

/**
 * Stop/pause the automatic polling in the background.
 */
export function stopAutoSync () {
  setTimeout(() => {
    syncNextMs = -1
    clearTimeout(syncTimeout)
  }, 0) // run outside potential Promises
}

/**
 * Get the current table's metadata (cached).
 *
 * @param {?Boolean} remote If true, the remote timestamp is touched. Otherwise
 *                          the local is.
 * @return {Object} Table's metadata.
 */
export function touch (remote = false) {
  if (remote) {
    lastRemoteActivity = Date.now()
  } else {
    lastLocalActivity = Date.now()
    if (syncNextMs > hidSyncMax) { // only reschedule slower polls
      syncNextMs = hidSyncMax
      scheduleSync(Math.min(0, lastNetworkActivity + hidSyncMax - lastLocalActivity))
    }
  }
}

// --- internal ----------------------------------------------------------------

let lastDigest = '' /** last obtained hash/digest of state JSON */

const fastestSynctime = 800 /** minimum sync ever */
const hidSyncMax = 1250 /** maximum sync when there is HID activity */

let syncTimeout = -1 /** getTimeout handler for sync job */
let syncNextMs = fastestSynctime /** ms when to run again, or -1 for off */
let tabActive = true /** is the current tab/window active/maximized? */

let lastLocalActivity = Date.now() /** ms when last time user moved the mouse or clicked */
let lastRemoteActivity = Date.now() /** ms when last time something changed on the server */
let lastNetworkActivity = Date.now() /** ms when last time an update was foreced */

/**
 * Check if the auto-sync job is active.
 *
 * @return {Boolean} True if job is active, false if it is disabled.
 */
function isAutoSync () {
  return syncNextMs >= 0
}

/**
 * Execute one autosync interation in the future.
 *
 * Will re-schedule the next iteration, too.
 */
function scheduleSync (ms) {
  clearTimeout(syncTimeout) // safety
  syncTimeout = setTimeout(() => {
    clearTimeout(syncTimeout)
    checkForSync()
      .then((dirty) => {
        if (dirty) {
          return doTheSync()
        }
      })
      .finally(() => {
        scheduleSync(calculateNextSyncTime())
      })
  }, ms)
}

/**
 * Detect deleted pieces and remove them from the table.
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
 * Check via HEAD call if we need to sync, and sync afterwards if necessary.
 *
 *
 */
function checkForSync (
  selectIds = []
) {
  const table = getTable()
  const start = Date.now()
  lastNetworkActivity = Date.now()
  return apiHeadState(table.name)
    .then(headers => {
      const digest = headers.get('digest')
      recordTime(pollTimes, Date.now() - start)
      if (lastDigest !== digest) { // we need to refresh the state
        touch(true)
        return true
      }
      return false
    })
    .catch(error => {
      if (error instanceof UnexpectedStatus) {
        runError('TABLE_GONE', table.name, error)
        stopAutoSync()
      } else {
        runError('UNEXPECTED', error)
      }
    })
}

/**
 * The acutal syncing code.
 *
 * Is in charge of updating the state once on changes, but not of (re)scheduling
 * itself.
 *
 * @param {String[]} selectIds IDs of items to (re)select after sync.
 */
function doTheSync (
  selectIds = []
) {
  const table = getTable()
  const start = Date.now()

  lastNetworkActivity = start
  return apiGetState(table.name, true)
    .then(state => {
      lastDigest = state.headers.get('digest')
      const keepIds = []
      for (const item of state.body) {
        setItem(item, selectIds.includes(item.id))
        keepIds.push(item.id)
      }
      removeObsoletePieces(keepIds)
      updateMenu()
      recordTime(syncTimes, Date.now() - start)
    })
    .catch(error => {
      if (error instanceof UnexpectedStatus) {
        runError('TABLE_GONE', table.name, error)
        stopAutoSync()
      } else {
        runError('UNEXPECTED', error)
      }
    })
}

/**
 * Trigger UI update for new/changed items.
 *
 * @param {Object} piece Piece to add/update.
 * @param {Boolean} selected If true, this item will be selected.
 */
function setItem (piece, selected) {
  switch (piece.layer) {
    case 'tile':
    case 'token':
    case 'overlay':
    case 'other':
      setPiece(piece, selected)
      break
    default:
      // ignore unkown piece type
  }
}

/**
 * Determine when next sync should happen.
 *
 * Semi-intelligent: takes remote and local activity plus UI activity (mouse)
 * into account.
 *
 * @return {Number} Time in ms when to poll again.
 */
function calculateNextSyncTime () {
  const remote = Date.now() - lastRemoteActivity
  const local = Date.now() - lastLocalActivity

  if (local > 10 * 60 * 1000) { // 10min
    modalInactive()
  }

  let maxTime = tabActive
    ? (remote < 1000 ? fastestSynctime : 5000) // max 5s
    : 60000 // max 60s

  // overide on recent HID activity
  if (local < hidSyncMax) {
    maxTime = Math.min(maxTime, hidSyncMax)
  }

  syncNextMs = clamp(
    fastestSynctime,
    Math.floor(syncNextMs * (tabActive ? 1.05 : 1.5)),
    maxTime
  )

  // add a little jitter to distribute load / avoid perfect sync
  const jitter = 200 // ms
  return syncNextMs - jitter / 2 + Math.random() * jitter
}

/**
 * Record an execution time in a stats array.
 *
 * Will keep up to 10 values.
 *
 * @param {Array} data Array to add to.
 * @param {Object} value Value to add, if > 0.
 */
function recordTime (data, value) {
  while (data.length >= 10) data.shift()
  if (value > 0) data.push(value)
}

// setup a visibility change listener
document.addEventListener('visibilitychange', (visibilitychange) => {
  if (document.hidden) {
    tabActive = false
  } else {
    tabActive = true
    syncNow()
  }
})
