# FreeBeeGee datamodel

This document is part of the [FreeBeeGee documentation](DOCS.md). It describes the FreeBeeGee (FBG) JSON data model.

It is not necessary to read/understand this to create templates. This information is here for developers who would like to contribute code or extend FBG.

## Assets

An asset describes a single, possibly multi-sided graphical element that is
available in the table's library and will be used by the *Pieces*. Assets are unique and are not directly placed
on the table - they do not have a state like position, rotation, scale, ...

A basic example:

```json
{
  "id": "e786f024af997f9c",
  "name": "room",
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

`name`
: The name of the asset. Used e.g. in the library.

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

Single-sided assets can have a default back side (showing the FBG logo), so they can be flipped over. This is indicated by using `##BACK##` as image name:

```json
{
  ...
  "media": [
    "room.4x4x1.808674.jpg",
    "###BACK###"
  ],
  ...
}
```

## Library

The library object holds information about all known assets, sorted by asset type.

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
  "tag": [
    ... assets ...
  ]
}
```

If a room's library does not have assets of a particular type, the entry will be missing.

## Pieces

When assets are displayed on a table and become 'tangible', they are called pieces. Pieces extend the asset information by data like position, rotation, etc. Multiple pieces can share the same asset.

A minimal piece contains the following information:

```json
{
  "id": "ec0dfce0d35d657a",
  "l": 5,
  "a": "0c6175be538f8b32",
  "x": 1216,
  "y": 640,
  "z": 10
}
```

`id`
: The ID of the piece.

`l`
: The layer (number) to show the piece in. `1` = tile, `2` = overlay, `3` = note, `4` = token, '5' = other. In theory the asset type does not have to match the layer it is shown in, but currently e.g. only tile assets are used in the tile layer.

`a`
: The ID of the asset.

`x`
: The x-coordinate of the center of the piece on the table, in px.

`y`
: The y-coordinate of the center of the piece on the table, in px.

`z`
: The z-coordinate (z-index) within the layer.

In addition, pieces can have the following optional properties. If omitted, they default to certain values.

`w`
: The width of the piece, in grid spaces. Defaults to `1`.

`h`
: The height of the piece, in grid spaces. Defaults to `1`.

`r`
: The rotation of the piece. Can be `0`, `60`, `90`, `120`, `180`, `240`, `270`  or `300`. Defaults to `0`.

`side`
: The side of the piece currently shown, usually one of the asset's media files. Defaults to `0`.

`n`
: The number of the piece. This is a small digit displayed on the piece to distinguish multiple pieces with the same artwork (e.g. different Goblins). Can be `0`..`15`. Defaults to `0` = none.

`c`
: An array of colors, mostly one. Each number in this array is an index of the of the colors defined in the room's tempalte. Can be 0..?. Defaults to `[0]`. It depends on the type of piece what these colors are used for (e.g. border, background, ...).

`t`
: An array of optional texts of a piece. Currently only the first entry in the array is used. Is used as note's text or as small label next to the piece for other types. Defaults to `[]`.

`expires`
: Timestamp in seconds-since-epoch when this piece expires. It should no longer displayed if that time is reached. Clients should compare it with the `Servertime` HTTP header and not with a local clock value. No `expires` field means no expiration.

## Templates

A template, a.k.a. snapshot, describes a table setup for a particular game.

```json
{
  "type": "grid-square",
  "version": "1.0.1",
  "engine": "1.0.0",

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
: The version of the template / snapshot itself. Uses [Semantic Versioning](https://semver.org/). Saved templates will contain the same version as the FBG version, but you can use your own version in custom templates.

`engine`
: The FBG engine this template should work with. Uses [Semantic Versioning](https://semver.org/), and npm-style caret ranges to define version-x-or-higher.

`colors`
: A series of colors available as border-colors etc. on the table. Key-Value pairs with `name` and a `value` / RGB hex code. Minimum 1 required.

The remaining template properties depend on the game type.

### `grid-square` entries

Templates using the `grid-square` type also have the following properties:

`gridSize`
: The grid / minimum tile size in px.

`gridHeight`
: The height of this template/table in grid spaces.

`gridWidth`
: The width of this template/table in grid spaces.

`snap`
: Optional boolean property. If set to `false`, grid-snapping will be disabled for this template. It is on per default.

### `grid-hex` entries

Templates using the `grid-hex` use hexes oriented with their flat sides up/down. They have the following additional properties:

`gridSize`
: The grid / minimum tile size in px. This equals the height of one hex (side-to-side).

`gridHeight`
: The height of this template/table in grid spaces.

`gridWidth`
: The width of this template/table in grid spaces.

`snap`
: Optional boolean property. If set to `false`, grid-snapping will be disabled for this template. It is on per default.

Tiles for hex-templates are a bit complicated, as hex-forms usually do not fill squares. Tile images should therefore transparent PNGs with the hex shape placed in it's center. The images sould have the smallest possible multiple of 'gridSize' that can hold that hex shape. For example, a 1x1 hex needs a 2x1 canvas.

## Rooms

This JSON describes a whole room.

```
{
  "id": "570216835fdebd3c",
  "name": "openExaminingBear",
  "engine": "1.0.0",

  "backgrounds": [{
		"name": "Casino",
		"image": "img/desktop-casino.jpg",
		"color": "#2e5d3c",
		"scroller": "#1b3c25"
	},
  ...
  ],

  "library": {
    ... library JSON ...
  },
  "template": {
    ... template JSON ...
  },

  "credits": "(c) ACME Inc.",
  "width": 2048,
  "height": 1024
}
```

`id`
: The ID of this room. Generated by the server.

`name`
: The public name of this room. Same as in the URL. Minimum 8 characters, can contain only [a-zA-Z0-9].

`engine`
: The version of the game engine this FBG server is running. Usually differs from the FBG version itself.

`backgrounds`
: An array of backgrounds available for this room. `name` is the name to be displayed in the settings. `image` is the path to the file within the FBG installation. `color` is the average color of the bitmap to be used while loading or as fallback. `scroller` is a suitable secondary color to be used for the scrollbar.

`library`
: The room's library. Format is specified above.

`templage`
: The room's template. Format is specified above.

`credits`
: A Markdown string to be shown in the about modal.

`width`
: Width of the room's tables, in px.

`height`
: Height of the room's tables, in px.
