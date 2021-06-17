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

import {
  updateTable,
  updateTabletop
} from '.'
import {
  getTable,
  reloadTable,
  getState,
  getStateNo,
  fetchTableState,
  errorTableGone
} from './state.js'
import {
  apiGetTableDigest
} from '../../api.js'
import {
  clamp,
  recordTime
} from '../../utils.js'
import {
  modalInactive
} from './modals/inactive.js'

// --- public ------------------------------------------------------------------

/**
 * Do a sync and start the automatic polling in the background.
 *
 * @param {Function} callback Optional function to call after first sync.
 */
export function startAutoSync (callback = null) {
  scheduleSync(0, callback)
}

/**
 * Trigger a poll, independent of time that passed since last poll.
 *
 * @param {String[]} selectId List of IDs to be re-selected after successfull
 *                            update.
 * @param {Function} forceUIUpdate Do UI update even if digest didn't change.
 */
export function syncNow (selectedIds = [], forceUIUpdate = false) {
  if (isAutoSync()) {
    if (forceUIUpdate) {
      scheduleSync(0, () => {
        updateTabletop(getState(getStateNo()))
      })
    } else {
      scheduleSync(0)
    }
  } else {
    fetchAndUpdateState(getStateNo(), selectedIds)
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
 * Record activity on the table.
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

const lastDigests = {
  'table.json': 'crc32:none',
  'template.json': 'crc32:none',
  'states/0.json': 'crc32:none',
  'states/1.json': 'crc32:none',
  'states/2.json': 'crc32:none',
  'states/3.json': 'crc32:none',
  'states/4.json': 'crc32:none',
  'states/5.json': 'crc32:none',
  'states/6.json': 'crc32:none',
  'states/7.json': 'crc32:none',
  'states/8.json': 'crc32:none',
  'states/9.json': 'crc32:none'
}

const fastestSynctime = 800 /** minimum sync ever */
const hidSyncMax = 1250 /** maximum sync when there is HID activity */

let syncTimeout = -1 /** getTimeout handler for sync job */
let syncNextMs = -1 /** ms when to run again, or -1 for off */
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
 *
 * @param {Number} ms Milliseconds to wait till execution, defaults to 0.
 * @param {Function} callback Function to call after first sync.
 */
function scheduleSync (ms = 0, callback = null) {
  clearTimeout(syncTimeout) // safety
  syncTimeout = setTimeout(() => {
    clearTimeout(syncTimeout)
    checkDigests()
      .then((dirtyState) => {
        if (dirtyState > 0) {
          return fetchAndUpdateState(dirtyState)
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
 * @return {Promise} Promise of an integer. 0 = no sync, 1+ = state to sync.
 */
function checkDigests (
  selectIds = []
) {
  const table = getTable()
  const start = Date.now()
  lastNetworkActivity = Date.now()
  return apiGetTableDigest(table.name)
    .then(digest => {
      const state = getStateNo()
      recordTime('sync-network', Date.now() - start)

      // verify table metadata
      if (digest['table.json'] !== lastDigests['table.json']) {
        return syncTable(selectIds).then(() => { touch(true); return state })
      }

      // verify currently active state
      if (digest[`states/${state}.json`] !== lastDigests[`states/${state}.json`]) {
        touch(true)
        return state
      }

      // verify all (other) states and trigger sync for first wrong one
      for (let i = 1; i <= 9; i++) {
        if (digest[`states/${i}.json`] !== lastDigests[`states/${i}.json`]) {
          touch(true)
          return i
        }
      }

      return 0
    })
    .catch(error => errorTableGone(error))
}

/**
 * The acutal state syncing code.
 *
 * Is in charge of updating the state once on changes, but not of (re)scheduling
 * itself.
 *
 * @param {String[]} selectIds IDs of items to (re)select after sync.
 */
function fetchAndUpdateState (
  dirtyState,
  selectIds = []
) {
  lastNetworkActivity = Date.now()
  return fetchTableState(dirtyState)
    .then(state => {
      lastDigests[`states/${dirtyState}.json`] = state.headers.get('digest')

      if (dirtyState === getStateNo()) {
        updateTabletop(state.body, selectIds)
      }
    })
}

/**
 * The table (metadata) syncinc.
 *
 * Is in charge of fetching the current state and trigger data/UI updates, but
 * not of scheduling itself.
 *
 * @param {String[]} selectIds IDs of items to (re)select after sync.
 */
function syncTable (
  selectIds = []
) {
  lastNetworkActivity = Date.now()
  return reloadTable()
    .then(tabledata => {
      lastDigests['table.json'] = tabledata.headers.get('digest')
      updateTable()
      return false
    })
    .catch(error => errorTableGone(error))
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

  if (local > 15 * 60 * 1000) { // 15min
    stopAutoSync()
    modalInactive(() => {
      touch()
      startAutoSync()
    })
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

// setup a visibility change listener
document.addEventListener('visibilitychange', (visibilitychange) => {
  if (document.hidden) {
    tabActive = false
  } else {
    tabActive = true
    syncNow()
  }
})
