/**
 * @file gulp-shrinkr - Gulp image minify plugin.
 * @copyright 2021-2023 Markus Leupold-Löwenthal
 * @license AGPL-3.0-or-later
 *
 * gulp-shrinkr is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * gulp-shrinkr is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with gulp-shrinkr. If not, see <https://www.gnu.org/licenses/>.
 */

import fs from 'fs'
import path from 'path'

import through from 'through2'
import fancyLog from 'fancy-log'
import colors from 'ansi-colors'
import execBuffer from 'exec-buffer'
import sharp from 'sharp'

import isJpg from 'is-jpg'
import isPng from 'is-png'
import isSvg from 'is-svg'
import svgo from 'svgo'

const dirs = {
  root: path.resolve('./')
}

export default (options = {}) => through.obj(async function (file, encoding, callback) {
  if (file.isNull()) return callback(null, file)
  if (file.isStream()) return callback(new Error('streaming not implemented'))

  for (const replaceRegexp of (options.replaceRegexp ?? [])) {
    file.path = file.path.replace(replaceRegexp[0], replaceRegexp[1])
  }

  const cacheFile = `${dirs.root}/${options.cacheDir ?? '.cache'}/${file.path.substr(file._base.length)}`
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
  const cacheStat = fs.existsSync(cacheFile) ? fs.statSync(cacheFile) : {}

  if (cacheStat.mtimeMs > file.stat.mtimeMs) {
    const shrunk = fs.readFileSync(cacheFile)
    if (shrunk.length < file.contents.length) {
      const pct = `${Math.round(shrunk.length * 100 / file.contents.length)}`.padStart(3, ' ')
      if (options.verbose) fancyLog.info('shrinkr:', colors.green(`${pct}%`), file.path, '[CACHED]')
      file.contents = shrunk
    } else {
      if (options.verbose) fancyLog.info('shrinkr:', colors.gray('100%'), file.path, '[CACHED]')
    }
  } else {
    const shrunk = await shrink(file.contents, options)
    if (shrunk.length < file.contents.length) {
      const pct = `${Math.round(shrunk.length * 100 / file.contents.length)}`.padStart(3, ' ')
      fancyLog.info('shrinkr:', colors.green(`${pct}%`), file.path)
      fs.writeFileSync(cacheFile, shrunk)
      file.contents = shrunk
    } else {
      fancyLog.info('shrinkr:', colors.gray('100%'), file.path)
      fs.writeFileSync(cacheFile, file.contents)
    }
  }

  await responsive(this, file, cacheFile, options)

  callback(null, file)
}, callback => {
  callback()
})

/**
 * Generate responsive (smaller) image variants.
 *
 * Will generate a 180w, 360w, 720w and 1280w to cover all typical bootstrap cols.
 *
 * @param {Buffer} pipe The pipe/stream to add to.
 * @param {File} file Original file in pipe.
 * @param {string} cacheFile Filename of cached resized image.
 * @param {object} options Plugin options.
 */
async function responsive (pipe, file, cacheFile, options) {
  // add responsive images
  if (cacheFile.match(/\.(png|jpg|jpeg)$/i)) {
    for (const size of (options.sizes ?? [])) {
      const filename = cacheFile.replace(/\.([a-zA-Z]+)$/, `.${size}w.$1`)
      let buffer
      if (fs.existsSync(filename)) {
        buffer = fs.readFileSync(filename)
      } else {
        buffer = await shrink(await resize(file.contents, size), options)
        fs.writeFileSync(filename, buffer)
      }

      const clone = file.clone()
      clone.path = file.path.replace(/\.([a-zA-Z]+)$/, `.${size}w.$1`)
      clone.contents = buffer
      pipe.push(clone)
    }
  }
}

/**
 * Resize image to a max width/height.
 *
 * @param {Buffer} buffer Image raw content.
 * @param {number} size Max image size w/h.
 * @returns {Buffer} Resized buffer.
 */
async function resize (buffer, size = 512) {
  return sharp(buffer) // todo width only?
    .resize(size, size * 2, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toBuffer()
}

/**
 * Shrink an image (buffer) depending on the file format.
 *
 * @param {Buffer} buffer The file content buffer.
 * @param {object} options Compression options.
 * @returns {Buffer} New, hopefully smaller buffer.
 */
async function shrink (buffer, options) {
  let shrunk = buffer
  if (isJpg(buffer)) {
    shrunk = await shrinkJPG1(buffer, options.jpg?.quality ?? 5)
    shrunk = await shrinkJPG2(shrunk)
  } else if (isPng(buffer)) {
    shrunk = await shrinkPNG2(buffer)
    shrunk = await shrinkPNG3(shrunk)
  } else if (isSvg('' + buffer)) {
    shrunk = await shrinkSVG(buffer)
  }
  return shrunk
}

/**
 * Shrink SVG.
 *
 * @param {Buffer} buffer The file content buffer.
 * @returns {Buffer} New, hopefully smaller buffer.
 */
function shrinkSVG (buffer) {
  return Buffer.from(svgo.optimize(buffer, {}).data)
}

/**
 * Shrink JPG.
 *
 * @param {Buffer} buffer The file content buffer.
 * @param {number} quality Quality 1=low, 9=high.
 * @returns {Buffer} New, hopefully smaller buffer.
 */
function shrinkJPG1 (buffer, quality = 5) {
  const settings = [
    ['--strip', '--quality', 'medium', '--min', 10, '--max', 80], // 0
    ['--strip', '--quality', 'medium', '--min', 10, '--max', 80], // 1
    ['--strip', '--quality', 'medium', '--min', 20, '--max', 80], // 2
    ['--strip', '--quality', 'medium', '--min', 30, '--max', 80], // 3
    ['--strip', '--quality', 'medium', '--min', 40, '--max', 80], // 4
    ['--strip', '--quality', 'medium', '--min', 50, '--max', 80], // 5
    ['--strip', '--quality', 'high', '--min', 60, '--max', 85], // 6
    ['--strip', '--quality', 'high', '--min', 70, '--max', 85], // 7
    ['--strip', '--quality', 'high', '--min', 80, '--max', 90], // 8
    ['--strip', '--quality', 'veryhigh', '--min', 90, '--max', 95] // 9
  ]

  return execBuffer({
    input: buffer,
    bin: path.dirname(import.meta.url.substr(7)) + '/vendor/jpeg-recompress',
    args: [...settings[quality], execBuffer.input, execBuffer.output]
  })
}

/**
 * Shrink JPG.
 *
 * @param {Buffer} buffer The file content buffer.
 * @returns {Buffer} New, hopefully smaller buffer.
 */
function shrinkJPG2 (buffer) {
  return execBuffer({
    input: buffer,
    bin: path.dirname(import.meta.url.substr(7)) + '/vendor/mozjpeg',
    args: ['-optimize', '-progressive', '-outfile', execBuffer.output, execBuffer.input]
  })
}

/**
 * Shrink PNG.
 *
 * @param {Buffer} buffer The file content buffer.
 * @returns {Buffer} New, hopefully smaller buffer.
 */
function shrinkPNG2 (buffer) {
  return execBuffer({
    input: buffer,
    bin: path.dirname(import.meta.url.substr(7)) + '/vendor/pngquant',
    args: ['--speed=1', '--force', 256, '--output', execBuffer.output, execBuffer.input]
  })
}

/**
 * Shrink PNG.
 *
 * @param {Buffer} buffer The file content buffer.
 * @returns {Buffer} New, hopefully smaller buffer.
 */
function shrinkPNG3 (buffer) {
  return execBuffer({
    input: buffer,
    bin: path.dirname(import.meta.url.substr(7)) + '/vendor/zopflipng',
    args: ['-y', '--splitting=3', '--lossy_8bit', '--lossy_transparent', execBuffer.input, execBuffer.output]
  })
}
