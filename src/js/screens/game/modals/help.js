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
import { stateGetGamePref, stateSetGamePref } from '../state.js'

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
    _('#modal-body').innerHTML = `
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
            <p>FreeBeeGee is a shared, virtual gaming tabletop. Everyone who joins a game will see the same table and all the gaming pieces on it. If someone adds, moves or removes pieces, the other players will see this immediately.</p>

            <p>On our table, everyone is equal. There is no game master or superuser. Everyone can manipulate what's there. Please be polite.</p>

            <h2 class="h3">Layers</h2>

            <p>Your game has three different layers, containing pieces of a specific type each. From top to bottom the layers are:</p>
            <ul>
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
          </div>
          <div class="hotkeys">
            <p>The following hotkeys are available at any time on the gaming table:</p>
            <p><span class="key">1</span> Toggle token layer.</p>
            <p><span class="key">2</span> Toggle overlay layer.</p>
            <p><span class="key">3</span> Toggle tile layer.</p>
            <p><span class="key">a</span> Add a new piece / show library. Hint: The new piece will be added at the position your mouse cursor was before the library window opened.</p>
            <p><span class="key">h</span> Show this help.</p>
            <p>The following hotkeys are available when pieces are selected:</p>
            <p><span class="key">e</span> Edit selected piece.</p>
            <p><span class="key">r</span> Rotate piece.</p>
            <p><span class="key">f</span> Flip over piece. Some pieces have more than two sides.</p>
            <p><span class="key">t</span> Move selected piece to the top of its layer.</p>
            <p><span class="key">b</span> Move selected piece to the bottom of its layer.</p>
            <p><span class="key">c</span> Clone selected piece to the current mouse cursor position.</p>
            <p><span class="key">Del</span> Delete selected piece.</p>
          </div>
          <div class="copyright">
            <h3>FreeBeeGee</h3>

            <p>Copyright 2021 Markus Leupold-Löwenthal</p>

            <p>FreeBeeGee is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</p>

            <p>FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the <a href="https://www.gnu.org/licenses/">GNU Affero General Public License</a> for more details.</p>

            <h3>Icons</h3>

            <p>UI icons are MIT licensed by <a href="https://feathericons.com/">feathericons.com</a> and <a href="https://iconsvg.xyz/">iconsvg.xyz</a>.</p>

            <p>The <strong>default</strong> game template contains various icons from <a href="https://game-icons.net/">game-icons.net</a>. They are licensed <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a> by their respective authors.</p>

            <h3>Backgrounds</h3>

            <p>One or more textures on this map have been created with images from Goodtextures.com. These images may not be redistributed by default. Please visit <a href="www.goodtextures.com">www.goodtextures.com</a> for more information.</p>
          </div>
        </div>
      </div>
    `

    _('#modal-footer').innerHTML = `
      <div></div>
      <button id='btn-close' type="button" class="btn btn-primary">Close</button>
    `

    _('input[name="tabs"]').on('change', change => {
      stateSetGamePref('modalHelpTab', change.target.id)
    })

    const preselect = stateGetGamePref('modalHelpTab') ?? 'tab-1'
    _('#' + preselect).checked = true

    _('#btn-close').on('click', () => getModal().hide())
    _('#modal').on('hidden.bs.modal', () => modalClose())

    getModal().show()
  }
}
