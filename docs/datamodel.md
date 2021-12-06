# FreeBeeGee datamodel

This document is part of the [FreeBeeGee documentation](DOCS.md). It describes the FreeBeeGee JSON data model.

It is not necessary to read/understand this to create templates. This information is here for developers who would like to contribute code or extend FreeBeeGee.

## Assets

An asset describes a single, possibly multi-sided graphical element that is
available in the table's library and will be used by the *Pieces*. Assets are unique and are not directly placed
on the table - they do not have a state like position, rotation, scale, ...

A basic example:

```json
{
  "id": "e786f024af997f9c",
  "alias": "room",
  "media": [
    "room.4x4x1.808674.jpg",
    "room.4x4x2.8E947E.jpg"
  ],
  "w": 4,
  "h": 4,
  "bg": "#808674",
  "type": "tile"
}
```

`id`
: The ID of the asset (16-digit hex).

`alias`
: The name of the asset if shown e.g. in the library.

`media`
: An array of media files. Supported are `*.png`, `*.svg` and `*.jpg`. Which of those is shown when depends on the data object using this asset (usually a *Piece*).

`w`
: The default width of the asset in grid spaces.

`h`
: The default height of the asset in grid spaces.

`bg`
: The background color of the asset. Will be visible while loading the media and in it's transparent parts. Can be an RGB code, `transparent` or `piece`. Piece-colored assets will use their UI/border color (if any) as background color.

`type`
: The type of the asset. Can be `tile`, `token`, `overlay` or `other`. This will usually define the type of piece this asset will use.

### Base images

For some assets it is useful to have a common base layer and the individual media shown on top of that, e.g. dice often use a `png` background (the shape of the die) and a `svg` media on top (the die value).

```json
  {
  "media": [
    "d4.magenta.1x1x1.svg",
    "d4.magenta.1x1x2.svg",
    "d4.magenta.1x1x3.svg",
    "d4.magenta.1x1x4.svg"
  ],
  ...
  "base": "d4.magenta.1x1x0.png"
}
```

`base`
: When present, this field indicates a media file (not necessarily listed in `media`) to be rendered, too.

### Default back sides

Single-sided assets can have a default back side (showing the FreeBeeGee logo), so they can be flipped over. This is done by using `##BACK##` as image name:

```json
{
  ...
  "sides": [
    "room.4x4x1.808674.jpg",
    "###BACK###"
  ],
  ...
}
```

## Library

The library object holds information about all known assets, sorted by type.

```json
{
  "overlay": [
    ... assets ...
  ],
  "tile": [
    ... assets ...
  ],
  "token": [
    ... assets ...
  ],
  "other": [
    ... assets ...
  ],
  "note": [
    ... assets ...
  ]
}
```

## Pieces

When assets are displayed on a table and become 'tangible', they are called pieces. Pieces extend the asset information by data like position, rotation, etc. Multiple pieces can share the same  asset.

A minimal piece contains the following information:

```json
{
  "id": "ec0dfce0d35d657a",
  "layer": "other",
  "asset": "0c6175be538f8b32",
  "x": 1216,
  "y": 640,
  "z": 10
}
```

`id`
: The ID of the piece.

`layer`
: The type of piece / layer to show it in. Usually the type of the asset, but that is not mandatory.

`asset`
: The ID of the asset.

`x`
: The x-coordinate of the center of the piece on the table, in px.

`y`
: The y-coordinate of the center of the piece on the table, in px.

`z`
: The z-coordinate (z-index) within the layer.

In addition, pieces can have the following properties. If omitted, they default to certain values.

`w`
: The width of the piece, in grid spaces. Defaults to 1.

`h`
: The height of the piece, in grid spaces. Defaults to 1.

`r`
: The rotation of the piece. Can be 0, 90, 180 or 270. Defaults to 0.

`side`
: The side of the piece currently shown, usually one of the asset's media files. Defaults to 0.

`n`
: The number of the piece. This is a small digit displayed on the piece to distinguish multiple pieces with the same artwork (e.g. different Goblins). Can be 0..15. Defaults to 0 = none.

`color`
: The index of the border/background-color/style. Can be 0..? and depends on the available styles in the template. Defaults to 0.

`label`
: A short text to be displayed on/next to the piece. Defaults to '' (empty string).

`expires`
: Timestamp in seconds-since-epoch when this piece expires. It should no longer displayed if that time is reached. Clients should compare it with the `Servertime` HTTP header and not with a local clock value. No `expires` field means no expiration.

## Templates

A template, a.k.a. snapshot, describes a table setup for a particular game.

```json
{
  "type": "grid-square",
  "version": "1.0.1",
  "engine": "^0.4.0",

  "colors": [{
    "name":"black","value":"#000000"
  }, {
    "name":"white","value":"#ffffff"
  }],

  "gridSize": 64,
  "gridWidth": 48,
  "gridHeight": 32
}
```

`type`
: The type of table this template uses. Can be either `grid-square` or `grid-hex`.

`version`
: The version of the template / snapshot itself. Uses [Semantic Versioning](https://semver.org/). Saved templates will contain the same version as the FreeBeeGee version, but you can use your own version in custom templates.

`engine`
: The FreeBeeGee engine this template should work with. Uses [Semantic Versioning](https://semver.org/), and npm-style caret ranges to define version-x-or-higher.

`colors`
: A series of colors available as border-colors etc. on the table. Key-Value pairs with `name` and a `value` / RGB hex code. Minimum 1 required.

`snap`
: Optional boolean property. If set to `false`, grid-snapping will be disabled for this template. It is on per default.

The remaining template properties depend on the game type.

### `grid-square` entries

Templates using the `grid-square` type also have the following properties:

`gridSize`
: The grid / minimum tile size in px.

`gridHeight`
: The height of this template/table in grid spaces.

`gridWidth`
: The width of this template/table in grid spaces.

### `grid-hex` entries

Templates using the `grid-hex` use hexes oriented with their flat sides up/down. They have the following additional properties:

`gridSize`
: The grid / minimum tile size in px. This equals the height of one hex (side-to-side).

`gridHeight`
: The height of this template/table in grid spaces.

`gridWidth`
: The width of this template/table in grid spaces.

Tiles for hex-templates are a bit complicated, as hex-forms usually do not fill squares. Tile images should therefore transparent PNGs with the hex shape placed in it's center. The images sould have the smallest possible tile-size that can hold that hex shape. For example, a 1x1 hex needs a 2x1 canvas.

## Rooms

TBD
