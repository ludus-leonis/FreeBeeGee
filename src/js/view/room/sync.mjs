/**
 * @file Logic to poll/sync the server regularily and update the local state on
 *       changes.
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
  getToken,
  getRoom,
  reloadRoom,
  getTableNo,
  fetchTable,
  isTabActive
} from '../../state/index.mjs'

import {
  apiGetRoomDigest
} from '../../api/index.mjs'

import {
  clamp,
  recordTime
} from '../../lib/utils.mjs'

import {
  HOOK_SYNCNOW,
  HOOK_LIBRARY_UPDATE,
  registerObserver,
  triggerEvent
} from '../../lib/events.mjs'

import {
  apiError
} from '../../view/error/index.mjs'

import {
  updateRoom
} from '../../view/room/index.mjs'

import {
  updateTabletop
} from '../../view/room/tabletop/index.mjs'

import {
  findExpiredPieces
} from '../../view/room/tabletop/tabledata.mjs'

import {
  modalInactive
} from '../../view/room/modal/inactive.mjs'

// --- events ------------------------------------------------------------------

/**
 * Trigger a poll, independent of time that passed since last poll.
 *
 * @param {Function} forceUIUpdate Do UI update even if digest didn't change.
 */
registerObserver('Sync', HOOK_SYNCNOW, (forceUIUpdate = false) => {
  if (isAutoSync()) {
    if (forceUIUpdate) {
      scheduleSync(0, () => {
        updateTabletop(getTableNo())
      })
    } else {
      scheduleSync(0)
    }
  } else {
    fetchAndUpdateTable(getTableNo())
  }
})

// --- public ------------------------------------------------------------------

/**
 * Do a sync and start the automatic polling in the background.
 *
 * @param {Function} callback Optional function to call after first sync.
 */
export function startAutoSync (callback = null) {
  touch()
  scheduleSync(0, callback)
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
 * Record activity in the room / browser.
 *
 * @param {?boolean} remote If true, the remote timestamp is touched. Otherwise
 *                          the local is.
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

const lastDigests = {
  'room.json': 'crc32:none',
  'setup.json': 'crc32:none',
  'tables/1.json': 'crc32:none',
  'tables/2.json': 'crc32:none',
  'tables/3.json': 'crc32:none',
  'tables/4.json': 'crc32:none',
  'tables/5.json': 'crc32:none',
  'tables/6.json': 'crc32:none',
  'tables/7.json': 'crc32:none',
  'tables/8.json': 'crc32:none',
  'tables/9.json': 'crc32:none'
}

const fastestSynctime = 800 /** minimum sync ever */
const hidSyncMax = 1250 /** maximum sync when there is HID activity */

let syncTimeout = -1 /** getTimeout handler for sync job */
let syncNextMs = -1 /** ms when to run again, or -1 for off */

let lastLocalActivity = Date.now() /** ms when last time user moved the mouse or clicked */
let lastRemoteActivity = Date.now() /** ms when last time something changed on the server */
let lastNetworkActivity = Date.now() /** ms when last time an update was foreced */

/**
 * Check if the auto-sync job is active.
 *
 * @returns {boolean} True if job is active, false if it is disabled.
 */
function isAutoSync () {
  return syncNextMs >= 0
}

/**
 * Execute one autosync interation in the future.
 *
 * Will re-schedule the next iteration, too.
 *
 * @param {number} ms Milliseconds to wait till execution, defaults to 0.
 * @param {Function} callback Function to call after first sync.
 */
function scheduleSync (ms = 0, callback = null) {
  clearTimeout(syncTimeout) // safety
  syncTimeout = setTimeout(() => {
    clearTimeout(syncTimeout)
    checkRoomDigests()
      .then((dirtyTable) => {
        if (dirtyTable > 0) {
          return fetchAndUpdateTable(dirtyTable)
        }
      })
      .finally(() => {
        scheduleSync(calculateNextSyncTime())
        if (callback) callback()
      })
  }, ms)
}

/**
 * Check via digest call if we need to sync. Sync afterwards if necessary.
 *
 * @returns {Promise} Promise of an integer. 0 = no sync, 1+ = table to sync.
 */
function checkRoomDigests () {
  const room = getRoom()
  const start = Date.now()
  lastNetworkActivity = Date.now()
  return apiGetRoomDigest(room.name, getToken())
    .then(digest => {
      const table = getTableNo()
      recordTime('sync-network', Date.now() - start)

      // verify room metadata
      if (digest['room.json'] !== lastDigests['room.json']) {
        return syncRoom().then(() => {
          touch(true)
          triggerEvent(HOOK_LIBRARY_UPDATE)
          return table
        })
      }

      // verify currently active table hasn't changed
      if (
        digest[`tables/${table}.json`] !== lastDigests[`tables/${table}.json`] ||
        findExpiredPieces(table).length > 0
      ) {
        touch(true)
        return table
      }

      // verify all (other) tables and trigger sync for first wrong one
      for (let i = 1; i <= 9; i++) {
        if (
          digest[`tables/${i}.json`] !== lastDigests[`tables/${i}.json`] ||
          findExpiredPieces(i).length > 0
        ) {
          touch(true)
          return i
        }
      }

      return 0
    })
    .catch(error => apiError(error, room.name))
}

/**
 * The acutal table syncing code.
 *
 * Is in charge of updating the table once on changes, but not of (re)scheduling
 * itself.
 *
 * @param {number} dirtyTableNo Number of table to fetch.
 * @returns {Promise} Promise of execution.
 */
function fetchAndUpdateTable (dirtyTableNo) {
  lastNetworkActivity = Date.now()
  return fetchTable(dirtyTableNo)
    .then(table => {
      lastDigests[`tables/${dirtyTableNo}.json`] = table.headers.get('digest')

      if (dirtyTableNo === getTableNo()) {
        updateTabletop(dirtyTableNo) // use cleanedup data
      }
    })
}

/**
 * The room syncinc.
 *
 * Is in charge of fetching the current room state and trigger data/UI updates,
 * but not of scheduling itself.
 *
 * @returns {Promise} Promise of execution.
 */
function syncRoom () {
  lastNetworkActivity = Date.now()
  return reloadRoom()
    .then(room => {
      lastDigests['room.json'] = room.headers.get('digest')
      updateRoom()
      return false
    })
    .catch(error => apiError(error, getRoom().name))
}

/**
 * Determine when next sync should happen.
 *
 * Semi-intelligent: takes remote and local activity plus UI activity (mouse)
 * into account.
 *
 * @returns {number} Time in ms when to poll again.
 */
function calculateNextSyncTime () {
  const remote = Date.now() - lastRemoteActivity
  const local = Date.now() - lastLocalActivity

  if (local > 15 * 60 * 1000) { // 15min
    stopAutoSync()
    modalInactive(() => {
      touch()
      startAutoSync()
    })
  }

  let maxTime = isTabActive()
    ? (remote < 1000 ? fastestSynctime : 5000) // max 5s
    : 60000 // max 60s

  // overide on recent HID activity
  if (local < hidSyncMax) {
    maxTime = Math.min(maxTime, hidSyncMax)
  }

  syncNextMs = clamp(
    fastestSynctime,
    Math.floor(syncNextMs * (isTabActive() ? 1.05 : 1.5)),
    maxTime
  )

  // add a little jitter to distribute load / avoid perfect sync
  const jitter = 200 // ms
  return syncNextMs - jitter / 2 + Math.random() * jitter
}
