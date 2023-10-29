/**
 * @file Various generic utility helpers.
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
 * along with FreeBeeGee. If not, see https://www.gnu.org/licenses/.
 */

export const PATTERN_ROOM_NAME =
  '^[a-zA-Z0-9]{8,48}$'
export const PATTERN_ASSET_NAME =
  '^(_|[a-zA-Z0-9\\-]+( [a-zA-Z0-9\\-]+)*)(, [a-zA-Z0-9\\-]+)?( [a-zA-Z0-9\\-]+)*$'
export const PATTERN_COLOR =
  '^#[a-zA-Z0-9]{6}$'

// --- Arrays ------------------------------------------------------------------

/**
 * Check if all items of an array fullfill something.
 *
 * @param {Array} items Array of items to check.
 * @param {Function} check Callback (item) => {}. Supposed to return true or false.
 * @returns {boolean} True, if all items check out. False if not.
 */
export function isAll (items, check) {
  for (const item of items) {
    if (!check(item)) return false
  }
  return true
}

/**
 * Check if any item of an array fullfills something.
 *
 * @param {Array} items Array of items to check.
 * @param {Function} check Callback (item) => {}. Supposed to return true or false.
 * @returns {boolean} True, if one items check out. False if not.
 */
export function isAny (items, check) {
  for (const item of items) {
    if (check(item)) return true
  }
  return false
}

/**
 * Check if no item of an array fullfills something.
 *
 * @param {Array} items Array of items to check.
 * @param {Function} check Callback (item) => {}. Supposed to return true or false.
 * @returns {boolean} True, if no items check out. False if not.
 */
export function isNone (items, check) {
  for (const item of items) {
    if (check(item)) return false
  }
  return true
}

/**
 * Shuffle an array using Durstenfeld shuffle.
 *
 * @param {Array} array Array to shuffle. Will be modified!
 * @returns {Array} Will also return the shuffled array for convenience.
 */
export function shuffle (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Find most occuring element in array.
 *
 * Based on https://stackoverflow.com/questions/1053843
 *
 * @param {Array} array Array to check.
 * @returns {*} Most occuring item in array.
 */
export function mode (array = []) {
  return array.sort((a, b) =>
    array.filter(v => v === a).length - array.filter(v => v === b).length
  ).pop()
}

// --- math --------------------------------------------------------------------

/**
 * A modulo operation that does not produce negative results.
 *
 * @param {number} n Number to modulo.
 * @param {number} m Number to modulo by.
 * @returns {number} Modulo value.
 */
export function mod (n, m) {
  return ((n % m) + m) % m
}

/**
 * Clamp a value to be between a min and a max value.
 *
 * @param {number} min Minimum number.
 * @param {number} value Value to clamp.
 * @param {number} max Maximum number.
 * @returns {number} Clamped value within [min, max].
 */
export function clamp (min, value, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}

/**
 * Find closest point in an array of points.
 *
 * @param {number} x X-coordinate to match.
 * @param {number} y Y-coordiante to match.
 * @param {number} points Array of {x, y} points.
 * @returns {object} Closest point of array to original x/y as {x, y, d}.
 */
function findClosestPoint (x, y, points) {
  const closest = {
    d: 999999999.0,
    x: 0,
    y: 0
  }
  for (const point of points) {
    const delta = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
    if (delta < closest.d) {
      closest.d = delta
      closest.x = point.x
      closest.y = point.y
    }
  }
  return closest
}

/**
 * Snap a coordinate to the closest snap position / grid.
 *
 * @param {number} x X-coordinate to snap.
 * @param {number} y Y-coordiante to snap.
 * @param {number} snap Grid size, originates in 0/0.
 * @param {number} lod Optional level of detail (1 = centers, 2 = also
 *                     corners, 3 = also side centers). Defaults to 1.
 * @returns {object} Closest grid vertex to original x/y as {x, y}.
 */
export function snapGrid (x, y, snap, lod = 1) {
  if (lod <= 1) { // tile centers
    return {
      x: Math.floor(x / snap) * snap + snap / 2,
      y: Math.floor(y / snap) * snap + snap / 2
    }
  }
  if (lod >= 3) { // tile centers, corners and sides
    snap = snap / 2
    return {
      x: Math.floor((x + snap / 2) / snap) * snap,
      y: Math.floor((y + snap / 2) / snap) * snap
    }
  }

  // lod 2: centers + corners
  const points = []
  points.push({ x: 0, y: 0 })
  points.push({ x: snap, y: 0 })
  points.push({ x: 0, y: snap })
  points.push({ x: snap, y: snap })
  points.push({ x: snap / 2, y: snap / 2 })
  const closest = findClosestPoint(mod(x, snap), mod(y, snap), points)
  return {
    x: Math.round(Math.floor(x / snap) * snap + closest.x),
    y: Math.round(Math.floor(y / snap) * snap + closest.y)
  }
}

/**
 * Snap a coordinate to the closest hex position / grid.
 *
 * @param {number} x X-coordinate to snap.
 * @param {number} y Y-coordiante to snap.
 * @param {number} snap Grid size, originates in 0/0.
 * @param {number} lod Optional level of detail (1 = hex centers, 2 = also hex
 *                     corners, 3 = also side centers). Defaults to 1.
 * @returns {object} Closest grid vertex to original x/y as {x, y}.
 */
export function snapHex (x, y, snap, lod = 1) {
  const hexTileX = snap * 1.71875 // 110x64
  const hexTileY = snap
  const hexSide = 37
  const modX = mod(x, hexTileX)
  const modY = mod(y, hexTileY)
  const tileX = Math.floor(x / hexTileX)
  const tileY = Math.floor(y / hexTileY)

  const points = []

  // add potential snap points
  if (lod >= 1) { // hex centers
    if (modX < hexTileX / 2) {
      points.push({ x: 0, y: 0 })
      points.push({ x: 0, y: hexTileY })
      points.push({ x: hexTileX / 2, y: hexTileY / 2 })
    } else {
      points.push({ x: hexTileX / 2, y: hexTileY / 2 })
      points.push({ x: hexTileX, y: 0 })
      points.push({ x: hexTileX, y: hexTileY })
    }
  }
  if (lod >= 2) { // hex corners
    if (modX < hexTileX / 2) {
      points.push({ x: hexSide, y: 0 })
      points.push({ x: hexSide / 2, y: hexTileY / 2 })
      points.push({ x: hexSide, y: hexTileY })
    } else {
      points.push({ x: hexTileX - hexSide, y: 0 })
      points.push({ x: hexTileX - hexSide / 2, y: hexTileY / 2 })
      points.push({ x: hexTileX - hexSide, y: hexTileY })
    }
  }
  if (lod >= 3) { // side centers
    if (modX < hexTileX / 2) {
      points.push({ x: hexTileX / 2, y: 0 })
      points.push({ x: hexSide * 3 / 4, y: hexTileY / 4 })
      points.push({ x: 0, y: hexTileY / 2 })
      points.push({ x: hexSide * 3 / 4, y: hexTileY * 3 / 4 })
      points.push({ x: hexTileX / 2, y: hexTileY })
    } else {
      points.push({ x: hexTileX / 2, y: 0 })
      points.push({ x: hexTileX - hexSide * 3 / 4, y: hexTileY / 4 })
      points.push({ x: hexTileX, y: hexTileY / 2 })
      points.push({ x: hexTileX - hexSide * 3 / 4, y: hexTileY * 3 / 4 })
      points.push({ x: hexTileX / 2, y: hexTileY })
    }
  }

  const closest = findClosestPoint(modX, modY, points)

  return {
    x: Math.round(tileX * hexTileX + closest.x),
    y: Math.round(tileY * hexTileY + closest.y)
  }
}

/**
 * Snap a coordinate to the closest hex2 position / grid.
 *
 * hex2 grids have pointy hexes up/down.
 *
 * @param {number} x X-coordinate to snap.
 * @param {number} y Y-coordiante to snap.
 * @param {number} snap Grid size, originates in 0/0.
 * @param {number} lod Optional level of detail (1 = hex centers, 2 = also hex
 *                     corners, 3 = also side centers). Defaults to 1.
 * @returns {object} Closest grid vertex to original x/y as {x, y}.
 */
export function snapHex2 (x, y, snap, lod = 1) {
  const snapped = snapHex(y, x, snap, lod) // hex2 is actually a 90° rotated hex
  return {
    x: snapped.y,
    y: snapped.x
  }
}

/**
 * Determine if two rectacles intersect / overlap.
 *
 * @param {object} rect1 First rect, containing of top/left/bottom/right.
 * @param {object} rect2 Second rect, containing of top/left/bottom/right.
 * @returns {boolean} True if they intersect.
 */
export function intersect (rect1, rect2) {
  return (rect1.left <= rect2.right &&
    rect2.left <= rect1.right &&
    rect1.top <= rect2.bottom &&
    rect2.top <= rect1.bottom)
}

/**
 * Determine if one rectacle is 100% within another.
 *
 * @param {object} larger Rect, containing of top/left/bottom/right.
 * @param {object} smaller Rect, containing of top/left/bottom/right.
 * @returns {boolean} True if they intersect.
 */
export function contains (larger, smaller) {
  return (smaller.left >= larger.left &&
    smaller.right <= larger.right &&
    smaller.top >= larger.top &&
    smaller.bottom <= larger.bottom)
}

/**
 * Calculate the width and height of the bounding box of a rotated rectangle.
 *
 * @param {number} w Width of original rectangle.
 * @param {number} h Height of original rectangle.
 * @param {number} r Angle to rotate to.
 * @returns {object} '{ w: ..., h: ...}' of transformed rectangle.
 */
export function getDimensionsRotated (w, h, r) {
  // basic rotations don't need long transformation
  switch (r) {
    case 0:
    case 180:
      return { w, h }
    case 90:
    case 270:
      return { h: w, w: h }
    default:
  }

  // transform all other rotations
  const x0 = w / 2 // origin-x
  const y0 = h / 2 // origin-y
  const rs = Math.sin(r * (Math.PI / 180))
  const rc = Math.cos(r * (Math.PI / 180))
  const x1 = x0 + (0 - x0) * rc + (0 - y0) * rs
  const y1 = y0 - (0 - x0) * rs + (0 - y0) * rc
  const x2 = x0 + (0 - x0) * rc + (h - y0) * rs
  const y2 = y0 - (0 - x0) * rs + (h - y0) * rc
  const x3 = x0 + (w - x0) * rc + (0 - y0) * rs
  const y3 = y0 - (w - x0) * rs + (0 - y0) * rc
  const x4 = x0 + (w - x0) * rc + (h - y0) * rs
  const y4 = y0 - (w - x0) * rs + (h - y0) * rc
  return { // compensate for rounding errors but ensure upper bounds
    w: Math.ceil(Math.max(x1, x2, x3, x4) - Math.min(x1, x2, x3, x4) - 0.001),
    h: Math.ceil(Math.max(y1, y2, y3, y4) - Math.min(y1, y2, y3, y4) - 0.001)
  }
}

// --- date --------------------------------------------------------------------

/**
 * Get seconds since epoch.
 *
 * @param {number} delta Optional delta in seconds to apply.
 * @returns {number} Seconds since epoch.
 */
export function epoch (delta = 0) {
  return Math.floor(new Date().getTime() / 1000) + delta
}

// --- data structures ---------------------------------------------------------

/**
 * Compare two items as JSON.
 *
 * Useful to compare arrays.
 *
 * @param {*} a Item A.
 * @param {*} b Item B.
 * @returns {boolean} True, of JSON representations of a and b are string-equal.
 */
export function equalsJSON (a, b) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
}

// --- time & timestamps -------------------------------------------------------

export const timeRecords = []

/**
 * Record an execution time in a stats array.
 *
 * Will keep up to 10 values.
 *
 * @param {string} name Named record to add this time.
 * @param {object} value Value to add, if > 0.
 * @returns {number} Recorded timestamp in ms.
 */
export function recordTime (name, value) {
  timeRecords[name] = timeRecords[name] ?? [0]
  while (timeRecords[name].length >= 10) timeRecords[name].shift()
  if (value > 0) timeRecords[name].push(value)
  return timeRecords[name]
}

// --- misc --------------------------------------------------------------------

/**
 * Generate a username like 'L. Lion'.
 *
 * @returns {string} Random user name consisting of initial and name.
 */
export function generateUsername () {
  return letters[Math.floor(Math.random() * letters.length)] + '. ' +
  animals[Math.floor(Math.random() * animals.length)]
}

/**
 * Generate a name like 'hilariousGazingPenguin'.
 *
 * @returns {string} Random name constisting of 3 parts (adjective, verb, noun).
 */
export function generateName () {
  return adjectives[Math.floor(Math.random() * adjectives.length)] +
  verbs[Math.floor(Math.random() * verbs.length)] +
  generateAnimal()
}

/**
 * Generate a name like 'hilariousGazingPenguin'.
 *
 * @returns {string} Random name constisting of 3 parts (adjective, verb, noun).
 */
export function generateAnimal () {
  return animals[Math.floor(Math.random() * animals.length)]
}

/** An array of all the letters A-Z. */
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

/** An array of mostly positive adjectives. */
const adjectives = ['adorable', 'adventurous', 'amused', 'attractive', 'average', 'beautiful', 'better', 'bewildered', 'black', 'bloody', 'blue', 'brave', 'breakable', 'bright', 'busy', 'calm', 'careful', 'cautious', 'charming', 'cheerful', 'clean', 'clever', 'cloudy', 'clumsy', 'colorful', 'comfortable', 'concerned', 'confused', 'cooperative', 'courageous', 'crazy', 'creepy', 'curious', 'cute', 'dangerous', 'dark', 'delightful', 'determined', 'difficult', 'distinct', 'dizzy', 'dull', 'eager', 'easy', 'elegant', 'enchanting', 'encouraging', 'energetic', 'enthusiastic', 'envious', 'evil', 'excited', 'faithful', 'famous', 'fancy', 'fantastic', 'fierce', 'fine', 'foolish', 'fragile', 'frail', 'frantic', 'friendly', 'frightened', 'funny', 'gentle', 'gifted', 'glamorous', 'gleaming', 'glorious', 'good', 'gorgeous', 'graceful', 'grieving', 'grotesque', 'grumpy', 'handsome', 'happy', 'healthy', 'helpful', 'helpless', 'hilarious', 'homely', 'horrible', 'hungry', 'important', 'impossible', 'inexpensive', 'innocent', 'inquisitive', 'itchy', 'jealous', 'jolly', 'kind', 'lazy', 'light', 'lively', 'lonely', 'long', 'lovely', 'lucky', 'magnificent', 'misty', 'modern', 'motionless', 'mysterious', 'nervous', 'nice', 'odd', 'open', 'outstanding', 'perfect', 'plain', 'pleasant', 'poised', 'poor', 'powerful', 'precious', 'proud', 'puzzled', 'quaint', 'real', 'rich', 'scary', 'selfish', 'shiny', 'shy', 'silly', 'sleepy', 'smiling', 'smoggy', 'sparkling', 'splendid', 'strange', 'successful', 'super', 'talented', 'tame', 'tasty', 'tender', 'tense', 'terrible', 'thankful', 'thoughtful', 'tired', 'tough', 'troubled', 'ugly', 'unusual', 'uptight', 'vast', 'victorious', 'wandering', 'weary', 'wicked', 'wild', 'witty', 'worried', 'zealous']

/** An array of mostly positive verbs. */
const verbs = ['Accepting', 'Adding', 'Admiring', 'Admiting', 'Advising', 'Affording', 'Agreeing', 'Alerting', 'Allowing', 'Amusing', 'Announcing', 'Annoying', 'Answering', 'Arguing', 'Arriving', 'Asking', 'Attaching', 'Attending', 'Avoiding', 'Backing', 'Baking', 'Baning', 'Beging', 'Blinding', 'Bowing', 'Bruising', 'Bumping', 'Burying', 'Calculating', 'Calling', 'Causing', 'Challenging', 'Changing', 'Chewing', 'Claping', 'Cliping', 'Collecting', 'Concerning', 'Copying', 'Curing', 'Cycling', 'Damaging', 'Delaying', 'Delighting', 'Delivering', 'Detecting', 'Developing', 'Disarming', 'Discovering', 'Draining', 'Dreaming', 'Driping', 'Drying', 'Earning', 'Emptying', 'Ending', 'Enjoying', 'Escaping', 'Examining', 'Exciting', 'Existing', 'Expecting', 'Explaining', 'Facing', 'Fastening', 'Fencing', 'Filing', 'Flooding', 'Flowing', 'Fooling', 'Forcing', 'Frying', 'Gathering', 'Gazing', 'Grabing', 'Grining', 'Guiding', 'Hammering', 'Handing', 'Happening', 'Harming', 'Hovering', 'Huging', 'Hunting', 'Identifying', 'Impressing', 'Including', 'Intending', 'Inviting', 'Itching', 'Jailing', 'Joining', 'Joking', 'Jumping', 'Kicking', 'Killing', 'Kissing', 'Kniting', 'Knoting', 'Labeling', 'Lasting', 'Laughing', 'Learning', 'Liing', 'Liking', 'Loading', 'Loving', 'Maning', 'Managing', 'Mating', 'Mattering', 'Melting', 'Mixing', 'Mourning', 'Moving', 'Muging', 'Naming', 'Needing', 'Noding', 'Noting', 'Noticing', 'Numbering', 'Obeying', 'Occuring', 'Offering', 'Opening', 'Ordering', 'Overflowing', 'Owing', 'Painting', 'Parting', 'Passing', 'Pasting', 'Phoning', 'Placing', 'Playing', 'Polishing', 'Presenting', 'Pressing', 'Pressing', 'Pretending', 'Protecting', 'Pulling', 'Pushing', 'Racing', 'Raining', 'Reaching', 'Realising', 'Recording', 'Refusing', 'Rejecting', 'Relaxing', 'Remaining', 'Reminding', 'Removing', 'Reporting', 'Retiring', 'Returning', 'Risking', 'Rolling', 'Sacking', 'Scaring', 'Signing', 'Signaling', 'Sining', 'Soothing', 'Sounding', 'Sparking', 'Spilling', 'Spoiling', 'Stoping', 'Stuffing', 'Suffering', 'Suggesting', 'Suspecting', 'Talking', 'Taping', 'Terrifying', 'Thanking', 'Tracing', 'Traping', 'Troubling', 'Trusting', 'Trying', 'Tuging', 'Vanishing', 'Wailing', 'Wandering', 'Wanting', 'Washing', 'Wasting', 'Whining', 'Whispering', 'Winking', 'Wondering', 'Wraping', 'Yawning', 'Yelling', 'Ziping', 'Zooming']

/** An array of animals. */
const animals = ['Aardvark', 'Albatross', 'Alligator', 'Alpaca', 'Anole', 'Ant', 'Anteater', 'Antelope', 'Ape', 'Armadillo', 'Baboon', 'Badger', 'Barracuda', 'Bat', 'Bear', 'Beaver', 'Bee', 'Bird', 'Bison', 'Bluebird', 'Boar', 'Bobcat', 'Buffalo', 'Butterfly', 'Camel', 'Capybara', 'Caracal', 'Caribou', 'Cassowary', 'Cat', 'Caterpillar', 'Cheetah', 'Chicken', 'Chimpanzee', 'Chinchilla', 'Chough', 'Coati', 'Cobra', 'Cockroach', 'Cormorant', 'Cougar', 'Coyote', 'Crab', 'Crane', 'Cricket', 'Crocodile', 'Crow', 'Cuckoo', 'Curlew', 'Deer', 'Dhole', 'Dingo', 'Dinosaur', 'Dog', 'Dolphin', 'Donkey', 'Dove', 'Dragonfly', 'Duck', 'Dugong', 'Dunlin', 'Eagle', 'Echidna', 'Eel', 'Eland', 'Elephant', 'Elk', 'Emu', 'Falcon', 'Ferret', 'Finch', 'Fish', 'Fisher', 'Flamingo', 'Fly', 'Flycatcher', 'Fox', 'Frog', 'Gaur', 'Gazelle', 'Gecko', 'Genet', 'Gerbil', 'Giraffe', 'Gnat', 'Gnu', 'Goat', 'Goldfinch', 'Goosander', 'Goose', 'Gorilla', 'Goshawk', 'Grasshopper', 'Grouse', 'Guanaco', 'Gull', 'Hamster', 'Hare', 'Hawk', 'Hedgehog', 'Heron', 'Herring', 'Hippopotamus', 'Hoatzin', 'Hoopoe', 'Hornet', 'Horse', 'Human', 'Hummingbird', 'Hyena', 'Ibex', 'Ibis', 'Iguana', 'Impala', 'Jackal', 'Jaguar', 'Jay', 'Jellyfish', 'Jerboa', 'Kangaroo', 'Kingbird', 'Kingfisher', 'Kinkajou', 'Kite', 'Koala', 'Kodkod', 'Kookaburra', 'Kouprey', 'Kudu', 'Langur', 'Lapwing', 'Lark', 'Lechwe', 'Lemur', 'Leopard', 'Lion', 'Lizard', 'Llama', 'Lobster', 'Locust', 'Loris', 'Louse', 'Lynx', 'Lyrebird', 'Macaque', 'Macaw', 'Magpie', 'Mallard', 'Mammoth', 'Manatee', 'Mandrill', 'Margay', 'Marmoset', 'Marmot', 'Meerkat', 'Mink', 'Mole', 'Mongoose', 'Monkey', 'Moose', 'Mosquito', 'Mouse', 'Myna', 'Narwhal', 'Newt', 'Nightingale', 'Nilgai', 'Ocelot', 'Octopus', 'Okapi', 'Oncilla', 'Opossum', 'Orangutan', 'Oryx', 'Ostrich', 'Otter', 'Ox', 'Owl', 'Oyster', 'Panther', 'Parrot', 'Panda', 'Partridge', 'Peafowl', 'Penguin', 'Pheasant', 'Pig', 'Pigeon', 'Pika', 'Pony', 'Porcupine', 'Porpoise', 'Pug', 'Quail', 'Quelea', 'Quetzal', 'Rabbit', 'Raccoon', 'Rat', 'Raven', 'Reindeer', 'Rhea', 'Rhinoceros', 'Rook', 'Saki', 'Salamander', 'Salmon', 'Sandpiper', 'Sardine', 'Sassaby', 'Seahorse', 'Seal', 'Serval', 'Shark', 'Sheep', 'Shrew', 'Shrike', 'Siamang', 'Skink', 'Skipper', 'Skunk', 'Sloth', 'Snail', 'Snake', 'Spider', 'Spoonbill', 'Squid', 'Squirrel', 'Starling', 'Stilt', 'Swan', 'Tamarin', 'Tapir', 'Tarsier', 'Termite', 'Thrush', 'Tiger', 'Toad', 'Topi', 'Toucan', 'Trout', 'Turaco', 'Turkey', 'Turtle', 'Unicorn', 'Urchin', 'Vicuna', 'Vinegaroon', 'Viper', 'Vulture', 'Wallaby', 'Walrus', 'Wasp', 'Waxwing', 'Weasel', 'Whale', 'Wobbegong', 'Wolf', 'Wolverine', 'Wombat', 'Woodpecker', 'Worm', 'Wren', 'Yak', 'Zebra', 'Zokor']
