/**
 * @copyright 2021-2023 Markus Leupold-Löwenthal
 *
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

import url from 'url'
import fs from 'fs'
import path from 'path'

// -----------------------------------------------------------------------------

// HINT: testdata here is API data, not JS/populateDefaults() data

const pieceMinimal = () => ({
  l: 1,
  a: 'p9Hr0300', // _.bead
  x: 2,
  y: 3,
  z: 4
})

const pieceFull = () => ({
  id: 'Ta3RTTni',
  l: 4,
  a: 'ye4mx100', // _.number
  x: 11,
  y: 22,
  z: 33,
  w: 2,
  h: 3,
  s: 1,
  c: [1, 2],
  n: 2,
  r: 60,
  b: ['badge-id'],
  t: ['some text'],
  expires: 1234567890
})

const noteFull = () => ({
  l: 3,
  x: 960,
  y: 1280,
  z: 3,
  w: 3,
  h: 2,
  id: 'A8JWIH0K',
  t: ['Note content']
})

const serverRaw = fs.readFileSync(
  path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'server.json'),
  'UTF-8'
)

const roomRaw = fs.readFileSync(
  path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'room.json'),
  'UTF-8'
)

const roomHexRaw = fs.readFileSync(
  path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'room-hex.json'),
  'UTF-8'
)

const roomHex2Raw = fs.readFileSync(
  path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'room-hex2.json'),
  'UTF-8'
)

const tableRaw = fs.readFileSync(
  path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'table.json'),
  'UTF-8'
)

export default {
  pieceMinimal,
  pieceFull,
  noteFull,

  server: function () { return JSON.parse(serverRaw) },
  room: function () { return JSON.parse(roomRaw) },
  roomHex: function () { return JSON.parse(roomHexRaw) },
  roomHex2: function () { return JSON.parse(roomHex2Raw) },
  table: function () { return JSON.parse(tableRaw) }
}
