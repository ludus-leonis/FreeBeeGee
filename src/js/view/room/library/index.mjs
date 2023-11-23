/**
 * @file Handles the library modal.
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

import _ from '../../../lib/FreeDOM.mjs'
import * as Api from '../../../api/index.mjs'
import * as Browser from '../../../lib/util-browser.mjs'
import * as Content from '../../../view/room/tabletop/content.mjs'
import * as Dom from '../../../view/room/tabletop/dom.mjs'
import * as Icon from '../../../lib/icon.mjs'
import * as Modal from '../../../view/room/modal.mjs'
import * as ModalDisabled from '../../../view/room/modal/disabled.mjs'
import * as Selection from '../../../view/room/tabletop/selection.mjs'
import * as State from '../../../state/index.mjs'
import * as Text from '../../../lib/util-text.mjs'
import * as Util from '../../../lib/util.mjs'
import * as WindowLibrary from './editor.mjs'

/**
 * Show the pieces library modal.
 *
 * @param {object} xy {x, y} coordinates (tile) where to add.
 */
export function open (xy) {
  if (!Modal.isOpen()) {
    const node = Modal.create(true)
    node.xy = xy

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">Library</h3>
      <div class="modal-header-end" title="Library editor">${Icon.EDIT}</div>
    `
    _('#modal-body').add('.is-maximizied').innerHTML = `
      <div class="has-spinner">Loading</div>
    `
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>

      <span class="search">${Icon.SEARCH}<input id='input-search' type="text" class="search" placeholder="search ..." maxlength="8"></span>

      <button id='btn-ok' type="button" class="btn btn-primary">Add</button>
    `

    _('#modal').add('.modal-library')

    _('#modal-body').innerHTML = `
      <div id="tabs-library" class="tabs">
        <input id="tab-1" type="radio" name="tabs" value="tile">
        <input id="tab-2" type="radio" name="tabs" value="sticker">
        <input id="tab-3" type="radio" name="tabs" value="token">
        <input id="tab-4" type="radio" name="tabs" value="other">
        <input id="tab-5" type="radio" name="tabs" value="upload">
        <div class="tabs-tabs">
          <label for="tab-1" class="tabs-tab">Tiles</label>
          <label for="tab-2" class="tabs-tab">Sticker</label>
          <label for="tab-3" class="tabs-tab">Token</label>
          <label for="tab-4" class="tabs-tab">Dice</label>
          <label for="tab-5" class="tabs-tab">Upload</label>
        </div>
        <div class="tabs-content">
          <div class="container"><div id="tab-tiles" class="row"></div></div>
          <div class="container"><div id="tab-stickers" class="row"></div></div>
          <div class="container"><div id="tab-tokens" class="row"></div></div>
          <div class="container"><div id="tab-other" class="row"></div></div>
          <form class="container spacing-small"><div id="tab-upload" class="row">
            <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
            <div class="col-12 col-lg-6">
              <label for="upload-name">Name</label>
              <input id="upload-name" name="name" type="text" placeholder="e.g. '${Util.generateAnimal()}'" minlength="1" maxlength="64" pattern="${Util.REGEXP.ASSET_NAME}">
            </div>
            <div class="col-6 col-lg-1">
              <label for="upload-w">Width</label>
              <select id="upload-w" name="width"></select>
            </div>
            <div class="col-6 col-lg-1">
              <label for="upload-h">Height</label>
              <select id="upload-h" name="height"></select>
            </div>
            <div class="col-6 col-lg-2">
              <label for="upload-type">Type</label>
              <select id="upload-type" name="type"></select>
            </div>
            <div class="col-6 col-lg-2">
              <label for="upload-h">Material</label>
              <select id="upload-material" name="material"></select>
            </div>
            <div class="col-12">
              <label class="upload-group" for="upload-file">
                <div class="is-preview-upload" title="Click to upload"></div>
                <input id="upload-file" type="file" accept=".jpg,.jpeg,.png", class="is-hidden">
                <input id="upload-color" type="hidden" class="is-hidden">
              </label>
            </div>
            <div class="col-6">
              <p class="is-error"></p>
            </div>
          </div></form>
        </div>
      </div>
    `

    // bg image
    const background = State.getBackground()
    _('#modal').css({
      '--fbg-tabletop-color': background.color,
      '--fbg-tabletop-image': Dom.url(background.image),
      '--fbg-tabletop-grid': Dom.url(background.gridFile)
    })

    // store/retrieve selected tab
    _('input[name="tabs"]').on('change', change => {
      State.setRoomPreference(State.PREF.TAB_LIBRARY, change.target.id)
    })
    const preselect = State.getRoomPreference(State.PREF.TAB_LIBRARY)
    _('#' + preselect).checked = true

    refreshTabs()
    setupTabUpload()
    setupFooter()
    Modal.open()
    _('#input-search').focus()

    // adapt footer on change
    _('[name="tabs"]').on('change', click => {
      setupFooter()
    })

    _('.modal-header-end').on('click', click => {
      Modal.close()
      WindowLibrary.open(xy)
    })
  }
}

// --- internal ----------------------------------------------------------------

let prevSearch = ''

/**
 * Sort library items for display in the tab(s).
 *
 * @param {string} label Label/title for the separator.
 * @param {_} tab Tab node to populate.
 * @param {object[]} assets Array of assets to add.
 * @param {boolean} expand If True, all asset sides will be added.
 * @param {boolean} sideCount If True, a 'x/x' side count label will be added.
 */
function sortPieces (label, tab, assets, expand = false, sideCount = true) {
  const systemTiles = []
  const regularTiles = []
  for (const asset of Text.sortString(assets ?? [], 'name')) {
    const folder = asset.name.match(/^_\./) ? systemTiles : regularTiles
    if (expand) {
      for (let i = 0; i < (asset.media?.length ?? 1); i++) {
        folder.push(assetToPreview(asset, i, sideCount))
      }
    } else {
      folder.push(assetToPreview(asset, 0, sideCount))
    }
  }
  if (regularTiles.length > 0) {
    tab.add(regularTiles)
    tab.add(_('label.col-12.is-center').create(`----- System ${label} -----`))
  }
  tab.add(systemTiles)
}

/**
 * Get a fresh dataset from the state and populate the tabs with the items.
 */
function refreshTabs () {
  const library = State.getLibrary()

  // add items to their tab, sort system assets (_) last
  sortPieces('Tiles', _('#tab-tiles').empty(), library.tile, true)
  sortPieces('Sticker', _('#tab-stickers').empty(), library.sticker)
  sortPieces('Token', _('#tab-tokens').empty(), library.token, true)
  sortPieces('Dice', _('#tab-other').empty(), library.other, false, false)

  // enable selection
  _('#tabs-library .is-preview').on('click', click => {
    _(click.target).toggle('.is-selected')

    // update add button
    const count = _('#tabs-library .is-selected').count()
    let label
    switch (count) {
      case 0:
        label = 'Add'
        break
      case 1:
        label = 'Add 1'
        break
      default:
        label = 'Add ' + count
    }
    _('#btn-ok').innerHTML = label

    click.preventDefault()
  })
}

/**
 * Setup the footer / buttons.
 *
 * Varies between upload form and all the other tabs.
 */
function setupFooter () {
  prevSearch = _('#input-search').value ?? prevSearch

  if (_('input[name="tabs"]:checked').value === 'upload') {
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <button id='btn-ok' type="button" class="btn btn-primary">Upload</button>
    `
    _('#btn-close').on('click', () => Modal.close())
    _('#btn-ok').on('click', () => modalUpload())
  } else {
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <span class="search">${Icon.SEARCH}<input id='input-search' type="text" class="search" placeholder="search ..." maxlength="8"></span>
      <button id='btn-ok' type="button" class="btn btn-primary">Add</button>
    `
    _('#input-search').on('keyup', () => filter()).value = prevSearch
    filter()
    _('#input-search').focus()

    _('#btn-close').on('click', () => Modal.close())
    _('#btn-ok').on('click', () => modalOk())
  }
}

/**
 * Calculate the average color in an upload image.
 *
 * Will set the determined value in the upload form.
 *
 * @param {string} dataUrl Raw base65 data of uploaded image.
 */
function averageColor (dataUrl) {
  _('#upload-color').value = '#808080' // color detection is async, so use interim-default
  const image = new Image() // eslint-disable-line no-undef
  image.onload = function () {
    // shrink in 2 steps for more accurate average
    const canvas8 = Browser.resizeImage(image, 8)
    const canvas1 = Browser.resizeImage(canvas8, 1)

    let [r, g, b] = canvas1.getContext('2d').getImageData(0, 0, 1, 1).data
    r = r.toString(16).padStart(2, '0')
    g = g.toString(16).padStart(2, '0')
    b = b.toString(16).padStart(2, '0')
    _('#upload-color').value = `#${r}${g}${b}`
  }
  image.src = dataUrl
}

/**
 * Execute the upload form.
 */
function modalUpload () {
  _('#btn-ok').add('.is-spinner')

  // reset error
  const errorMessage = _('#modal-body .is-error')
  errorMessage.innerHTML = ''

  // do sanity checks
  const name = _('#upload-name')
  if (name.value.length <= 0 || _('#upload-name:invalid').exists()) {
    errorMessage.innerHTML += 'Invalid name. '
    name.focus()
  }
  const file = _('#upload-file').files[0]
  if (file) {
    if (file.size > 512 * 1024 * 1024) {
      errorMessage.innerHTML += 'Image filesize too large (> 512kB). '
    }
    switch (file.type) {
      case 'image/jpeg':
      case 'image/png':
        // whitelisted ok
        break
      default:
        errorMessage.innerHTML += 'Unsupported file format. '
    }
  } else {
    errorMessage.innerHTML += 'No image selected. '
  }

  // upload stuff if checks were ok
  if (errorMessage.innerHTML === '') {
    if (State.SERVERLESS) {
      Modal.close()
      ModalDisabled.open('would have uploaded your piece to the library by now')
      return
    }

    const type = _('#upload-type').value
    const data = {
      name: Text.unprettyName(name.value),
      format: file.type === 'image/png' ? 'png' : 'jpg',
      type,
      w: Number(_('#upload-w').value),
      h: Number(_('#upload-h').value),
      d: ['tile', 'token'].includes(type) ? 2 : 0, // default depth
      base64: _('.is-preview-upload .piece').node().style.backgroundImage
        .replace(/^.*,/, '')
        .replace(/".*/, '')
    }

    const material = _('#upload-material').value
    if (material && material !== 'none') {
      data.tx = material
    }

    // set bg color
    if (type === Content.LAYER.TOKEN || data.format === 'jpg') {
      data.bg = _('#upload-color').value
    } else {
      data.bg = 'transparent'
    }

    State.addAsset(data)
      .then(() => {
        State.reloadRoom()
          .then(() => {
            refreshTabs()
            switch (data.type) {
              case Content.LAYER.TILE:
                _('#tab-1').checked = true
                break
              case Content.LAYER.STICKER:
                _('#tab-2').checked = true
                break
              case Content.LAYER.TOKEN:
                _('#tab-3').checked = true
                break
              default:
            }
            setupFooter()
          })
      })
      .catch(error => {
        _('#ok').remove('.is-spinner')
        if (error instanceof Api.UnexpectedStatus) {
          switch (error.status) {
            case 400:
              if (error?.body?._error === 'UPLOAD_SIZE') {
                uploadFailed(`Assets are limited to ${Text.bytesToIso(error.body._messages[1])}.`)
              } else if (error?.body?._error === 'ROOM_SIZE') {
                uploadFailed(`Room limit exceeded - ${Text.bytesToIso(error.body._messages[1])} left.`)
              } else {
                uploadFailed('Invalid file (400).')
              }
              break
            case 413:
              uploadFailed('Webserver rejected the file (too large - 413).')
              break
            default:
              uploadFailed(`(${error.status})`)
          }
        } else {
          console.error(error)
        }
        _('#btn-ok').remove('.is-spinner')
      })
  } else {
    _('#btn-ok').remove('.is-spinner')
  }
}

/**
 * Show an upload failed error message.
 *
 * @param {string} why Info for user why the upload failed.
 */
function uploadFailed (why) {
  _('#modal-body .is-error').innerHTML = `Upload failed: ${why}`
}

/**
 * Add everything needed to the upload tab.
 */
function setupTabUpload () {
  // width
  const type = _('#upload-type')
  for (const l of [Content.LAYER.TOKEN, Content.LAYER.STICKER, Content.LAYER.TILE]) {
    const option = _('option').create(Text.toTitleCase(l))
    option.value = l
    if (l === Content.LAYER.TOKEN) option.selected = true
    type.add(option)
  }
  type.on('change', change => updatePreview())

  // width
  const width = _('#upload-w')
  for (let w = 1; w <= 32; w++) {
    const option = _('option').create(w)
    option.value = w
    if (w === 1) option.selected = true
    width.add(option)
  }
  width.on('change', change => updatePreview())

  // height
  const height = _('#upload-h')
  for (let h = 1; h <= 32; h++) {
    const option = _('option').create(h)
    option.value = h
    if (h === 1) option.selected = true
    height.add(option)
  }
  height.on('change', change => updatePreview())

  // material
  const materials = _('#upload-material')
  for (const material of State.getLibrary().material) {
    const option = _('option').create(Text.prettyName(material.name))
    option.value = material.name
    if (material.name === 'none') option.selected = true
    materials.add(option)
  }
  materials.on('change', change => updatePreview())

  _('#upload-color').value = '#808080'

  _('#upload-file').on('change', change => updatePreview(true))
  blob = null

  updatePreview()
}

let blob = null

/**
 * Update the upload WYSIWYG preview based on the selected infos.
 *
 * @param {boolean} parseFilename If true, the filename will be split & used to populate the form fields.
 */
function updatePreview (parseFilename = false) {
  const file = _('#upload-file').files[0]

  if (file && parseFilename) {
    const parts = Content.splitAssetFilename(file.name)
    if (parts.w) _('#upload-w').value = parts.w
    if (parts.h) _('#upload-h').value = parts.h
    if (parts.name) {
      _('#upload-name').value = Text.prettyName(parts.name)
    }
    if (['wood', 'paper'].includes(parts.tx)) {
      _('#upload-material').value = parts.tx
    } else {
      _('#upload-material').value = 'none'
    }
    if ([Content.LAYER.TILE, Content.LAYER.TOKEN].includes(parts.type)) {
      _('#upload-type').value = parts.type
    }

    const reader = new FileReader()
    reader.addEventListener('load', event => {
      blob = event.target.result

      _('#upload-color').value = averageColor(blob)

      // guess type/dimensions if no info was in filename
      if (!parts.w) {
        const image = new Image() // eslint-disable-line no-undef
        image.src = blob
        image.onload = () => {
          const tilesize = 64 // in px
          const aspect = image.width / image.height
          const square = aspect > 0.9 && aspect < 1.1
          const tilesX = Math.round(image.width / tilesize) || 1
          const tilesY = Math.round(image.height / tilesize) || 1
          if (square) {
            if (tilesX <= 4) {
              _('#upload-type').value = Content.LAYER.TOKEN
              _('#upload-w').value = tilesX
              _('#upload-h').value = tilesX
            } else {
              _('#upload-type').value = Content.LAYER.TILE
              _('#upload-w').value = Math.min(tilesX, 32)
              _('#upload-h').value = Math.min(tilesY, 32)
            }
          } else {
            _('#upload-type').value = Content.LAYER.TILE
            _('#upload-w').value = Math.min(tilesX, 32)
            _('#upload-h').value = Math.min(tilesY, 32)
          }
          Dom.updatePreviewDOM(blob)
        }
      } else {
        Dom.updatePreviewDOM(blob)
      }
    }, false)
    reader.readAsDataURL(file)
  } else {
    Dom.updatePreviewDOM(blob)
  }
}

/**
 * Convert a library entry to a preview DOM element.
 *
 * @param {object} asset The asset to convert.
 * @param {number} side Side to show, 0-based.
 * @param {boolean} sideCount Show side 'x/y' label.
 * @returns {HTMLElement} Node for the modal.
 */
function assetToPreview (asset, side = 0, sideCount = true) {
  const max = _('.is-preview').create(Dom.assetToNode(asset, side))
  if (asset.w % 2 === 0) max.add('.is-even-x')
  if (asset.h % 2 === 0) max.add('.is-even-y')

  const card = _('.col-6.col-sm-4.col-md-3.col-lg-2.col-card').create(max)
  max.add('.is-max-' + Math.max(asset.w, asset.h))
  let tag = ''
  if (asset.w > 2 || asset.h > 2) {
    tag = `${asset.w}x${asset.h}`
  }

  if (tag !== '') max.add(_('.tag.tr').create().add(tag))
  let name = Text.prettyName(asset.name)
  if (sideCount && asset.media.length > 1) name += ` <span class="is-faded-more">${side + 1}/${asset.media.length}</span>`
  const label = _('p').create()
  label.innerHTML = name
  card.add(label)
  return card
}

/**
 * Hides modal and adds the selected piece after user clicks OK.
 */
function modalOk () {
  const modal = document.getElementById('modal')
  const pieces = []
  const snapped = Content.snap(modal.xy.x, modal.xy.y)
  let offsetZ = 0
  _('#tabs-library .is-selected .piece').each(item => {
    const piece = Content.createPieceFromAsset(item.asset.id, snapped.x, snapped.y)

    piece.z = piece.z + offsetZ
    piece.s = item.side
    pieces.push(piece)
    offsetZ += 1
  })
  if (pieces.length > 0) {
    Selection.clear()
    State.createPieces(pieces, true)
    Modal.close()
  }
}

/**
 * Filter items in the library by string entered in the bottom input field.
 */
function filter () {
  const filter = _('#input-search').value.trim().toLowerCase()

  _('#tabs-library .col-card p').each(p => {
    if (!p.innerText.toLowerCase().includes(filter)) {
      p.parentNode.classList.add('d-none')
    } else {
      p.parentNode.classList.remove('d-none')
    }
  })
}
