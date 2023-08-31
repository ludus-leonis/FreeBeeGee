/**
 * @file An observer pattern / event propagation lib.
 * @module
 * @copyright 2021-2023 Markus Leupold-Löwenthal
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
 * along with FreeBeeGee. If not, see https://www.gnu.org/licenses/.
 */

export const HOOK_LIBRARY_EDIT = 'HOOK_LIBRARY_EDIT'
export const HOOK_LIBRARY_UPDATE = 'HOOK_LIBRARY_UPDATE'
export const HOOK_LIBRARY_RELOAD = 'HOOK_LIBRARY_RELOAD'

/**
 * Register an observer.
 *
 * @param {string} who Name of the observer. Re-registering an observer removes the old entry first.
 * @param {string} what HOOK_* event to listen for.
 * @param {function} callback Function to call when corresponding event is triggered.
 */
export function registerObserver (who, what, callback) {
  if (!observers[what]) {
    observers[what] = []
  }
  observers[what] = observers[what].filter(observer => observer.who !== who) // remove existing
  observers[what].push({
    who,
    callback
  })
}

/**
 * Register an observer.
 *
 * @param {string} who Name of the observer. Re-registering an observer removes the old entry first.
 * @param {string} what HOOK_* event to listen for.
 * @param {function} callback Function to call when corresponding event is triggered.
 */
export function unregisterObserver (who, what) {
  if (!observers[what]) {
    observers[what] = []
  }
  observers[what] = observers[what].filter(observer => observer.who !== who) // remove existing
}

/**
 * Trigger / propagate an event.
 *
 * Will call callback() on every observer registered for a given event.
 *
 * @param {string} what HOOK_* event to trigger.
 */
export function triggerEvent (what) {
  for (const observer of observers[what] ?? []) {
    observer.callback()
  }
}

// -----------------------------------------------------------------------------

const observers = {}
