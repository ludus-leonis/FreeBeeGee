/**
 * @file Common screen handling.
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

import _ from './FreeDOM.js'

/**
 * Display a card-style page on dark background. Replaces the current body content.
 *
 * @param {String} headline Text for the headline area of the box.
 * @param {String} content HTML for the .card-body part of the box.
 * @param {String} footer Optional HTML to be shown as .p-small footer below the card.
 * @return {FreeDom} FreeDOM object with preselected body for customizatons.
 */
export function createScreen (headline, content, footer = '') {
  const body = _('body')
  _('body').add('.page-boxed').innerHTML = `
    <div class="container is-small">
      <div class="row">
        <div class="col-12 is-content">
        <a class="a-invisible" href="./"><img src="img/freebeegee-logo.svg" alt="FreeBeeGee"></a>
          <p class="spacing-none">Your game. Your data.</p>
          <form class="card spacing-large">
            <div class="card-header"><h1 id="title" class="h3">${headline}</h1></div>
            <div id="content" class="card-body">${content}</div>
          </form>
          <p id="footer" class="p-small is-faded is-center">${footer}</p>
          <p class="p-tiny is-faded spacing-medium copyright"><a href="https://freebeegee.org/">FreeBeeGee</a> v$VERSION$, ©2021 Ludus Leonis · <a href="terms">Terms of use</a> · <a href="privacy">Privacy Policy</a></p>
        </div>
      </div>
    </div>
  `

  return body
}

/**
 * Show a server feedback (error message).
 *
 * @param {String} message Message to show.
 */
export function serverFeedback (message) {
  _('.server-feedback').add('.show').innerHTML = message
}
