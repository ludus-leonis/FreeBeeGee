/**
 * @file shrinkr - Gulp image minify plugin.
 * @copyright 2021-2023 Markus Leupold-Löwenthal
 * @license AGPL-3.0-or-later
 *
 * shrinkr is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * shrinkr is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with shrinkr. If not, see <https://www.gnu.org/licenses/>.
 */
import through from 'through2'
import fancyLog from 'fancy-log'
import colors from 'ansi-colors'
import execBuffer from 'exec-buffer'
import path from 'path'

import isJpg from 'is-jpg'
import isPng from 'is-png'
import isSvg from 'is-svg'
import svgo from 'svgo'

export default (options = {}) => through.obj(async (file, encoding, callback) => {
  if (file.isNull()) return callback(null, file)
  if (file.isStream()) return callback(new Error('streaming not implemented'))

  const buffer = file.contents
  let shrunk

  if (isJpg(buffer)) {
    shrunk = await shrinkJPG1(buffer, options.jpg?.quality ?? 5)
    shrunk = await shrinkJPG2(shrunk)
  } else if (isPng(buffer)) {
    shrunk = await shrinkPNG2(buffer)
    shrunk = await shrinkPNG3(shrunk)
  } else if (isSvg('' + buffer)) {
    shrunk = await shrinkSVG(buffer)
  } else {
    shrunk = buffer
  }

  if (shrunk.length < buffer.length) {
    const pct = `${Math.round(shrunk.length * 100 / buffer.length)}`.padStart(3, ' ')
    fancyLog.info('shrinkr:', colors.green(`${pct}%`), file.path)
    file.contents = shrunk
  } else {
    fancyLog.info('shrinkr:', colors.gray('100%'), file.path)
  }

  callback(null, file)
}, callback => {
  callback()
})

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
    ['--strip', '--quality', 'medium', '--min', 40, '--max', 80], // 0
    ['--strip', '--quality', 'medium', '--min', 40, '--max', 80], // 1
    ['--strip', '--quality', 'medium', '--min', 40, '--max', 80], // 2
    ['--strip', '--quality', 'medium', '--min', 40, '--max', 80], // 3
    ['--strip', '--quality', 'medium', '--min', 40, '--max', 80], // 4
    ['--strip', '--quality', 'medium', '--min', 40, '--max', 80], // 5
    ['--strip', '--quality', 'high', '--min', 60, '--max', 85], // 6
    ['--strip', '--quality', 'high', '--min', 60, '--max', 85], // 7
    ['--strip', '--quality', 'high', '--min', 60, '--max', 85], // 8
    ['--strip', '--quality', 'veryhigh', '--min', 70, '--max', 90] // 9
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
 * @param {number} quality Quality 1=low, 9=high.
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
