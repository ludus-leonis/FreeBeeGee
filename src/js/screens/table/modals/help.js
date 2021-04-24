/**
 * @file Handles the help/about modal.
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

import _ from '../../../FreeDOM.js'

import { createModal, getModal, modalActive, modalClose } from '../../../modal.js'
import { getTabletop, stateGetTablePref, stateSetTablePref } from '../state.js'
import marked from 'marked'

// --- public ------------------------------------------------------------------

/**
 * Show the help window.
 *
 * Contains basis help, shortcuts and an About section.
 */
export function modalHelp () {
  if (!modalActive()) {
    createModal(true)

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">FreeBeeGee v$VERSION$ “$CODENAME$”</h3>
    `
    _('#modal-body').add('.is-maximizied').innerHTML = `
      <div id="tabs-library" class="tabs">
        <input id="tab-1" type="radio" name="tabs">
        <input id="tab-2" type="radio" name="tabs">
        <input id="tab-3" type="radio" name="tabs">
        <div class="tabs-tabs">
          <label for="tab-1" class="tabs-tab">Primer</label>
          <label for="tab-2" class="tabs-tab">Hotkeys</label>
          <label for="tab-3" class="tabs-tab">About</label>
        </div>
        <div class="tabs-content">
          <div class="primer">
            <p>FreeBeeGee is a shared, virtual gaming tabletop. Everyone who joins a table will see the same gaming pieces on it. If someone adds, moves or removes pieces, the other players will see this immediately.</p>

            <p>On our table, everyone is equal. There is no game master or superuser. Everyone can manipulate what's there. Please be polite.</p>

            <h2 class="h3">Layers</h2>

            <p>Your table has different layers, containing pieces of a specific type each. From top to bottom the layers are:</p>
            <ul>
              <li><strong>Dice</strong> are your friendly random number generators.</li>
              <li><strong>Tokens</strong> are round player figures, usually heroes and monsters.</li>
              <li><strong>Overlays</strong> help you mark areas of interest.</li>
              <li><strong>Tiles</strong> are assembled to form your game board. They can be rooms, caves and more.</li>
            </ul>

            <p>Use your <strong>browser zoom</strong> buttons to zoom-in and zoom-out.</p>

            <h2 class="h3">Pieces</h2>

            <p>To <strong>select</strong> a piece, left-click on it. It will get highlighted. However, you can only select pieces if their layer is currently active. Use the top three buttons in the menu to (de)activate layers. To <strong>move</strong> a selected piece, just drag'n'drop it.</p>

            <p>To edit a piece, either select it and use the menu-icons on your left, or right-click the piece and use the context menu.</p>

            <p>You can <strong>rotate</strong>, <strong>flip</strong>, <strong>clone</strong> and <strong>delete</strong> a selected piece. You can also open the <strong>edit</strong> window for a selected piece to change its properties as well as to <strong>set its label</strong>.</p>

            <p>If a piece has only one side, flipping it will have no effect. Some pieces may have more than one side - in this case flipping will cycle through them.</p>

            <p>If a piece got hidden behind another piece, you can use the <strong>to&nbsp;top</strong> and <strong>to&nbsp;bottom</strong> buttons to change the order of pieces within their layer.</p>

            <h2 class="h3">Dice</h2>

            <p>To roll dice, add them from the library to your table. Then <strong>select</strong> the die you want to roll and press <span class="key">#</span>.</p>

            <p>If you want to roll multiple dice at once, add a <strong>Dicemat</strong> from the library to your table. Then move your dice onto the dicemat, <strong>select</strong> the dicemat and press <span class="key">#</span>.</p>

          </div>
          <div class="hotkeys">
            <p>The following hotkeys are available on the <strong>table</strong>:</p>
            <p><span class="key">1</span> / <span class="key">2</span> / <span class="key">3</span> / <span class="key">4</span> Toggle dice/token/overlay/tile layer.</p>
            <p><span class="key">l</span> Show library. Hint: The new piece will be added at the position the mouse cursor was before the library window opened.</p>
            <p><span class="key">n</span> Add a new sticky note. Hint: The note will be added at the position the mouse cursor is.</p>
            <p><span class="key">S</span> Show the table statistics &amp; settings.</p>
            <p><span class="key">h</span> Show this help.</p>
            <p>The following hotkeys are available for <strong>selected pieces</strong>:</p>
            <p><span class="key">e</span> Edit selected piece.</p>
            <p><span class="key">r</span> Rotate piece.</p>
            <p><span class="key">f</span> Flip over piece. Some pieces have more than two sides.</p>
            <p><span class="key">o</span> Change outline/border color (token only).</p>
            <p><span class="key">#</span> Shuffle/roll piece / all dice on dicetrays.</p>
            <p><span class="key">t</span> Move selected piece to the top of its layer.</p>
            <p><span class="key">b</span> Move selected piece to the bottom of its layer.</p>
            <p><span class="key">c</span> Clone selected piece to the current mouse cursor position.</p>
            <p><span class="key">Del</span> Delete selected piece.</p>
            <p><span class="key">&lt;</span> / <span class="key">&gt;</span> Decrease/increase token letter. Hint: Only works for tokens!</p>

          </div>
          <div class="copyright">
            <h3>FreeBeeGee</h3>

            <p>Copyright 2021 Markus Leupold-Löwenthal</p>

            <p>FreeBeeGee is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</p>

            <p>FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the <a href="https://www.gnu.org/licenses/">GNU Affero General Public License</a> for more details.</p>

            <h3>UI assets</h3>

            <p>UI icons are MIT licensed by <a href="https://feathericons.com/">feathericons.com</a> and <a href="https://iconsvg.xyz/">iconsvg.xyz</a>. One or more table background textures have been created with images from Goodtextures.com. These images may not be redistributed by default. Please visit <a href="www.goodtextures.com">www.goodtextures.com</a> for more information.</p>

            <h3>Table assets</h3>

            ${marked(getTabletop().credits.replaceAll('<', '&lt;').replaceAll('>', '&gt;'))}
          </div>
        </div>
      </div>
    `

    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn btn-primary">Close</button>
    `

    _('input[name="tabs"]').on('change', change => {
      stateSetTablePref('modalHelpTab', change.target.id)
    })

    const preselect = stateGetTablePref('modalHelpTab') ?? 'tab-1'
    _('#' + preselect).checked = true

    _('#btn-close').on('click', () => getModal().hide())
    _('#modal').on('hidden.bs.modal', () => modalClose())

    getModal().show()
  }
}
