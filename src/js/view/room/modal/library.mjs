/**
 * @file Handles the library modal.
 * @module
 * @copyright 2021-2022 Markus Leupold-Löwenthal
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

import _ from '../../../lib/FreeDOM.mjs'

import {
  DEMO_MODE,
  UnexpectedStatus
} from '../../../api/index.mjs'

import {
  toTitleCase,
  prettyName,
  unprettyName,
  sortByString,
  resizeImage,
  bytesToIso,
  generateAnimal
} from '../../../lib/utils.mjs'

import {
  createModal,
  getModal,
  isModalActive,
  modalClose
} from '../../../view/room/modal.mjs'

import {
  getLibrary,
  createPieces,
  PREFS,
  getRoomPreference,
  setRoomPreference,
  addAsset,
  reloadRoom,
  getSetup,
  getBackground,
  getMaterialMedia
} from '../../../state/index.mjs'

import {
  LAYER_TILE,
  LAYER_OVERLAY,
  LAYER_TOKEN,
  createPieceFromAsset,
  populatePieceDefaults,
  splitAssetFilename,
  snap
} from '../../../view/room/tabletop/tabledata.mjs'

import {
  pieceToNode,
  url
} from '../../../view/room/tabletop/index.mjs'

import {
  selectionClear
} from '../../../view/room/tabletop/selection.mjs'

import {
  modalDisabled
} from '../../../view/room/modal/disabled.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the pieces library modal.
 *
 * @param {Object} tile {x, y} coordinates (tile) where to add.
 */
export function modalLibrary (xy) {
  if (!isModalActive()) {
    const node = createModal(true)
    node.xy = xy

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">Library</h3>
    `
    _('#modal-body').add('.is-maximizied').innerHTML = `
      <div class="has-spinner">Loading</div>
    `
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>

      <span class="search">${iconSearch}<input id='input-search' type="text" class="search" placeholder="search ..." maxlength="8"></span>

      <button id='btn-ok' type="button" class="btn btn-primary">Add</button>
    `

    _('#modal').add('.modal-library').on('hidden.bs.modal', () => modalClose())

    _('#modal-body').innerHTML = `
      <div id="tabs-library" class="tabs">
        <input id="tab-1" type="radio" name="tabs" value="tile">
        <input id="tab-2" type="radio" name="tabs" value="overlay">
        <input id="tab-3" type="radio" name="tabs" value="token">
        <input id="tab-4" type="radio" name="tabs" value="other">
        <input id="tab-5" type="radio" name="tabs" value="upload">
        <div class="tabs-tabs">
          <label for="tab-1" class="tabs-tab">Tiles</label>
          <label for="tab-2" class="tabs-tab">Overlays</label>
          <label for="tab-3" class="tabs-tab">Token</label>
          <label for="tab-4" class="tabs-tab">Dice</label>
          <label for="tab-5" class="tabs-tab">Upload</label>
        </div>
        <div class="tabs-content">
          <div class="container"><div id="tab-tiles" class="row"></div></div>
          <div class="container"><div id="tab-overlays" class="row"></div></div>
          <div class="container"><div id="tab-tokens" class="row"></div></div>
          <div class="container"><div id="tab-other" class="row"></div></div>
          <form class="container spacing-small"><div id="tab-upload" class="row">
            <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
            <div class="col-12 col-lg-6">
              <label for="upload-name">Name</label>
              <input id="upload-name" name="name" type="text" placeholder="e.g. '${generateAnimal()}'" minlength="1" maxlength="64" pattern="^[a-zA-Z0-9-]+( [a-zA-Z0-9-]+)*(, [a-zA-Z0-9-]+)?( [a-zA-Z0-9-]+)*$">
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
              <p class="fbg-error"></p>
            </div>
          </div></form>
        </div>
      </div>
    `

    // bg image
    const background = getBackground()
    _('#modal').css({
      '--fbg-tabletop-color': background.color,
      '--fbg-tabletop-image': url(background.image),
      '--fbg-tabletop-grid': url(background.gridFile)
    })

    // store/retrieve selected tab
    _('input[name="tabs"]').on('change', change => {
      setRoomPreference(PREFS.TAB_LIBRARY, change.target.id)
    })
    const preselect = getRoomPreference(PREFS.TAB_LIBRARY)
    _('#' + preselect).checked = true

    refreshTabs()
    setupTabUpload()
    setupFooter()
    getModal().show()
    _('#input-search').focus()

    // adapt footer on change
    _('[name="tabs"]').on('change', click => {
      setupFooter()
    })
  }
}

// --- internal ----------------------------------------------------------------

let prevSearch = ''

/**
 * Get a fresh dataset from the state and populate the tabs with the items.
 */
function refreshTabs () {
  const library = getLibrary()

  // add items to their tab
  const tiles = _('#tab-tiles').empty()
  for (const asset of sortByString(library.tile ?? [], 'name')) {
    tiles.add(assetToPreview(asset))
  }
  const overlays = _('#tab-overlays').empty()
  for (const asset of sortByString(library.overlay ?? [], 'name')) {
    overlays.add(assetToPreview(asset))
  }
  const tokens = _('#tab-tokens').empty()
  for (const asset of sortByString(library.token ?? [], 'name')) {
    tokens.add(assetToPreview(asset))
  }
  const other = _('#tab-other').empty()
  for (const asset of sortByString(library.other ?? [], 'name')) {
    other.add(assetToPreview(asset))
  }

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
    _('#btn-close').on('click', () => getModal().hide())
    _('#btn-ok').on('click', () => modalUpload())
  } else {
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <span class="search">${iconSearch}<input id='input-search' type="text" class="search" placeholder="search ..." maxlength="8"></span>
      <button id='btn-ok' type="button" class="btn btn-primary">Add</button>
    `
    _('#input-search').on('keyup', () => filter()).value = prevSearch
    filter()
    _('#input-search').focus()

    _('#btn-close').on('click', () => getModal().hide())
    _('#btn-ok').on('click', () => modalOk())
  }
}

/**
 * Calculate the average color in an upload image.
 *
 * Will set the determined value in the upload form.
 *
 * @param {String} dataUrl Raw base65 data of uploaded image.
 */
function averageColor (dataUrl) {
  _('#upload-color').value = '#808080' // color detection is async, so use interim-default
  const image = new Image() // eslint-disable-line no-undef
  image.onload = function () {
    // shrink in 2 steps for more accurate average
    const canvas8 = resizeImage(image, 8)
    const canvas1 = resizeImage(canvas8, 1)

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
  const errorMessage = _('#modal-body .fbg-error')
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
    if (DEMO_MODE) {
      getModal().hide()
      modalDisabled('would have uploaded your piece to the library by now')
      return
    }

    const type = _('#upload-type').value
    const data = {
      name: unprettyName(name.value),
      format: file.type === 'image/png' ? 'png' : 'jpg',
      type,
      w: Number(_('#upload-w').value),
      h: Number(_('#upload-h').value),
      base64: _('.is-preview-upload .piece').node().style.backgroundImage
        .replace(/^.*,/, '')
        .replace(/".*/, '')
    }

    const material = _('#upload-material').value
    if (material && material !== 'none') {
      data.tx = material
    }

    // set bg color
    if (type === LAYER_TOKEN || data.format === 'jpg') {
      data.bg = _('#upload-color').value
    } else {
      data.bg = 'transparent'
    }

    addAsset(data)
      .then(() => {
        reloadRoom()
          .then(() => {
            refreshTabs()
            switch (data.type) {
              case LAYER_TILE:
                _('#tab-1').checked = true
                break
              case LAYER_OVERLAY:
                _('#tab-2').checked = true
                break
              case LAYER_TOKEN:
                _('#tab-3').checked = true
                break
              default:
            }
            setupFooter()
          })
      })
      .catch(error => {
        _('#ok').remove('.is-spinner')
        if (error instanceof UnexpectedStatus) {
          switch (error.status) {
            case 400:
              if (error?.body?._error === 'UPLOAD_SIZE') {
                uploadFailed(`Assets are limited to ${bytesToIso(error.body._messages[1])}.`)
              } else if (error?.body?._error === 'ROOM_SIZE') {
                uploadFailed(`Room limit exceeded - ${bytesToIso(error.body._messages[1])} left.`)
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
 */
function uploadFailed (why) {
  _('#modal-body .fbg-error').innerHTML = `Upload failed: ${why}`
}

/**
 * Add everything needed to the upload tab.
 */
function setupTabUpload () {
  // width
  const type = _('#upload-type')
  for (const l of [LAYER_TOKEN, LAYER_OVERLAY, LAYER_TILE]) {
    const option = _('option').create(toTitleCase(l))
    option.value = l
    if (l === LAYER_TOKEN) option.selected = true
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
  for (const material of getLibrary().material) {
    const option = _('option').create(prettyName(material.name))
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
 */
function updatePreview (parseImage = false) {
  const file = _('#upload-file').files[0]

  if (file && parseImage) {
    const parts = splitAssetFilename(file.name)
    if (parts.w) _('#upload-w').value = parts.w
    if (parts.h) _('#upload-h').value = parts.h
    if (parts.name) {
      _('#upload-name').value = prettyName(parts.name)
    }
    if (['wood', 'paper'].includes(parts.tx)) {
      _('#upload-material').value = parts.tx
    } else {
      _('#upload-material').value = 'none'
    }
    if ([LAYER_TILE, LAYER_TOKEN].includes(parts.type)) {
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
              _('#upload-type').value = LAYER_TOKEN
              _('#upload-w').value = tilesX
              _('#upload-h').value = tilesX
            } else {
              _('#upload-type').value = LAYER_TILE
              _('#upload-w').value = Math.min(tilesX, 32)
              _('#upload-h').value = Math.min(tilesY, 32)
            }
          } else {
            _('#upload-type').value = LAYER_TILE
            _('#upload-w').value = Math.min(tilesX, 32)
            _('#upload-h').value = Math.min(tilesY, 32)
          }
          updatePreviewDOM(blob)
        }
      } else {
        updatePreviewDOM(blob)
      }
    }, false)
    reader.readAsDataURL(file)
  } else {
    updatePreviewDOM(blob)
  }
}

/**
 * Create a new preview piece.
 */
function updatePreviewDOM (blob) {
  const preview = _('.modal-library .is-preview-upload').remove('.is-*').add('.is-preview-upload')
  preview.innerHTML = ''

  const type = _('#upload-type').value
  const material = _('#upload-material').value
  const w = _('#upload-w').value
  const h = _('#upload-h').value

  if (w % 2 === 0) preview.add('.is-even-x')
  if (h % 2 === 0) preview.add('.is-even-y')

  // add piece to DOM
  const piece = _(`.piece.piece-${type}.is-w-${w}.is-h-${h}`).create()
  if (type === LAYER_OVERLAY || type === LAYER_TILE) {
    piece.css({ '--fbg-color': 'rgba(0,0,0,.05)' })
  } else {
    piece.css({ '--fbg-color': '#202020' })
  }
  if (type === LAYER_TOKEN) {
    piece.add('.has-highlight')
  }
  piece.css({ '--fbg-material': url(getMaterialMedia(material)) })

  if (w > 16 || h > 16) {
    preview.add('.is-deflate-4x')
  } else if (w > 12 || h > 12) {
    preview.add('.is-deflate-3x')
  } else if (w > 8 || h > 8) {
    preview.add('.is-deflate-2x')
  } else if (w > 2 || h > 2) {
    // nothing
  } else {
    preview.add('.is-inflate-2x')
  }

  // asdf grid offset odd/even

  if (blob) { // image loaded
    piece.css({
      backgroundImage: `var(--fbg-material), url("${blob}")`,
      backgroundSize: '256px, cover'
    })
  } else { // show upload placeholder
    piece.css({
      backgroundImage: url('img/upload.svg'),
      backgroundRepeat: 'no-repeat'
    })
    if (w <= 1 || h <= 1) {
      piece.css({ backgroundSize: '32px' })
    } else if (w <= 8 || h <= 8) {
      piece.css({ backgroundSize: '64px' })
    } else {
      piece.css({ backgroundSize: '128px' })
    }
  }

  preview.add(piece)
}

/**
 * Convert a library entry to a preview DOM element.
 *
 * @param {Object} assetJson The asset to convert.
 * @return {HTMLElement} Node for the modal.
 */
function assetToPreview (asset) {
  const piece = populatePieceDefaults({
    id: 'x' + asset.id,
    a: asset.id,
    s: 0
  })

  const node = pieceToNode(piece).add(
    '.is-w-' + asset.w,
    '.is-h-' + asset.h
  )
  node.dataset.a = asset.id

  if (piece._meta.hasColor) {
    const colors = getSetup().colors
    piece.c[0] = Number.parseInt(asset.bg) % colors.length
    if (piece.c[0] !== 0) {
      node.css({ '--fbg-color': colors[piece.c[0] - 1].value })
    }
  }

  const max = _('.is-preview').create(node)
  if (asset.w % 2 === 0) max.add('.is-even-x')
  if (asset.h % 2 === 0) max.add('.is-even-y')

  const card = _('.col-6.col-sm-4.col-md-3.col-lg-2.col-card').create(max)
  max.add('.is-max-' + Math.max(asset.w, asset.h))
  let tag = ''
  if (asset.w > 2 || asset.h > 2) {
    tag = `${asset.w}x${asset.h}`
  }
  if (asset.media.length > 1) {
    tag += `:${asset.media.length}`
  }
  if (tag !== '') max.add(_('.tag.tr').create().add(tag))
  card.add(_('p').create().add(prettyName(asset.name)))
  return card
}

/**
 * Hides modal and adds the selected piece after user clicks OK.
 */
function modalOk () {
  const modal = document.getElementById('modal')
  const pieces = []
  const snapped = snap(modal.xy.x, modal.xy.y)
  let offsetZ = 0
  _('#tabs-library .is-selected .piece').each(item => {
    const piece = createPieceFromAsset(item.dataset.a, snapped.x, snapped.y)

    piece.z = piece.z + offsetZ
    pieces.push(piece)
    offsetZ += 1
  })
  if (pieces.length > 0) {
    selectionClear()
    createPieces(pieces, true)
    getModal().hide()
  }
}

/**
 * Filter items in the library by string entered in the bottom input field.
 */
function filter () {
  const filter = _('#input-search').value.trim().toLowerCase()

  _('#tabs-library .col-card p').each(p => {
    if (!p.innerText.toLowerCase().includes(filter)) {
      p.parentNode.classList.add('is-gone')
    } else {
      p.parentNode.classList.remove('is-gone')
    }
  })
}

const iconSearch = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
