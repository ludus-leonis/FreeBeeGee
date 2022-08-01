# FreeBeeGee datamodel

This document is part of the [FreeBeeGee documentation](DOCS.md). It describes the FreeBeeGee (FBG) JSON data model.

It is not necessary to read/understand this to use FBG. This information is here for developers who would like to contribute code or extend FBG.

## IDs

Various objects have IDs. FreeBeeGee uses compact random 8-character-strings composed of uppercase and lowercase letters, digits, '_' and '-'. That's 64 possible characters and roughly 10^14 combinations. For maximum browser compatibility, IDs always start with a letter. E.g.:

```
"id": "FpO1J-Tg"
```

IDs are only considered unique within their *room*.

## Assets

An *asset* describes a single, possibly multi-sided graphical element that is available in the table's *library* and will be used by a *piece*. Each *asset* is unique and can't be directly placed on the table - it does not have a state like position, rotation, scale, ...

A minimal example:

```json
{
  "id": "FpO1J-Tg",
  "name": "room",
  "type": "tile",
  "media": [
    "room.4x4x1.808674.jpg",
    "room.4x4x2.8E947E.jpg"
  ]
}
```

Mandatory fields:

`id`
: The ID of the *asset*. While this ID follows the general 8-character-string scheme, it is not randomly generated but derived from the asset filename (excluding color and extension).

`name`
: The name of the *asset*. Used e.g. in the *library*.

`type`
: The type of the *asset*. Can be `tile`, `token`, `overlay` or `other`. This will usually define the type of *piece* this *asset* will use.

`media`
: An array of media files. Supported are `*.png`, `*.svg` and `*.jpg`. Which of those is shown when depends on the data object using this *asset* (usually a *piece*).

Optional fields:

`w`
: The default width for a *piece* using this *asset*, in grid spaces. Defaults to `1`.

`h`
: The default height for a *piece* using this *asset*, in grid spaces. Defaults to `w`.

`bg`
: The background color of the *asset*. Defaults to '#808080'. See *Media filenames* below for possible values.

`tx`
: The texture of the *asset*. Defaults to 'none'. See *Media filenames* below for possible values.

`mask`
: An image to be used as alpha-mask during rendering. Allows arbitrary shapes or even partly-transparent assets.

### Media filenames

Media (image) files should be named using the following scheme. This allows FBG to sort them automatically into the *library* and set their meta data.

```
mainName[.secondaryName].{x}x{y}x{s}[.bg[-texture]].{ext}
```

`mainName`
: A camelcase name of the *asset* for the *library*. Will be reformated as e.g. `Main Name`.

`secondaryName`
: An optional secondary camelcase name to be shown after a comma in the *library* if present. Will be reformated e.g. as `Main Name, Secondary Name`.

`x`
: The X-size of the tile/token in grid spaces.

`y`
: The Y-size of the tile/token in grid spaces.

`s`
: The side this file represents, typically `1` or `2`, but an *asset* can have more than that - e.g. dice sides or enemy/color variants. FBG will cycle through those when a *piece* gets flipped.

`bg`
: An optional background color/style for this *asset*. Will be visible as placeholder during image loading, and shine thrugh in transparent areas of the asset (if the image format supports alpha). Can be set to `transparent`, a number (the color set by the user for a *piece* in the edit dialog) or a six-digit HTML hex color (e.g. `bf40bf`, without a hash). If missing, it defaults to `0`.

`texture`
: An optional texture for the *asset*. If present, an additional shade/texture will be applied on top of the media image to give it a rougher look. Can be `none`, `paper` or `wood`.

### Base images

Sometimes it is useful for an *asset* to have a common base layer and the individual media shown on top of that, e.g. dice often use a `png` background (the shape of the die) and a `svg` media on top (the die value).

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

## Library

The *library* object holds information about each *asset*, sorted by *asset* type.

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
  "badge": [
    ... assets ...
  ]
}
```

If a *room*'s *library* does not have any *asset* of a particular type, the entry will be missing.

## Pieces

When an *asset* is displayed on a table and become 'tangible', and is called *piece*. A *piece* extends its *asset* information by data like position, rotation, etc. More than one *piece* can use the same *asset*.

A minimal *piece* contains the following information:

```json
{
  "id": "r8PY_21s",
  "l": 5,
  "a": "FpO1J-Tg",
  "x": 1216,
  "y": 640,
  "z": 10
}
```

`id`
: The ID of the *piece*. The following IDs have a special meaning: 'ZZZZZZZZ' represents the pointer, 'ZZZZZZZY' represents the LOS line.

`l`
: The layer (number) to show the *piece* in. `1` = tile, `2` = overlay, `3` = note, `4` = token, '5' = other. In theory the *asset* type does not have to match the layer it is shown in, but currently e.g. only a tile *asset* is used in the tile layer.

`a`
: The ID of the *asset*.

`x`
: The x-coordinate of the center of the *piece* on the table, in px.

`y`
: The y-coordinate of the center of the *piece* on the table, in px.

`z`
: The z-coordinate (z-index) within the layer.

In addition, a *piece* can have the following optional properties. If omitted, they default to certain values.

`w`
: The size/width of the *piece*, in grid spaces. Defaults to `1`.

`h`
: The height of the *piece*, in grid spaces. Defaults to `w` so pieces that only have a width but no height are considered squares.

`r`
: The rotation of the *piece*. Can be `0`, `60`, `90`, `120`, `180`, `240`, `270`  or `300`. Defaults to `0`.

`s`
: The side of the *piece* currently shown, usually one of its *asset* media files. Defaults to `0`.

`n`
: The number of the *piece*. This is a small digit displayed on the *piece* to distinguish multiple token with the same artwork (e.g. different Goblins). Can be `0`..`15`. Defaults to `0` = none.

`c`
: An array of colors, mostly one. Each number in this array is an index of the of the colors defined in the *room*'s *template*. Can be 0..?. Defaults to `[0]`. It depends on the type of *piece* what these colors are used for (e.g. border, background, ...).

`t`
: An array of optional texts of a *piece*. Currently only the first entry in the array is used. Is used as note's text or as small label next to the *piece* for other types. Defaults to `[]`.

`b`
: An array of IDs of *piece*. Each entry corresponds to one asset of type `badge`. Those are usually displayed in their label.

`f`
: An bitarray of flags of a *piece*. Depending on the *piece* the bits can represent different options/features/modes active for it.

### Special pieces

A *piece* with `id` and `a` set to `ZZZZZZZZ` represents the (laser)pointer. There can only be one on the table.

A *piece* with `id` and `a` set to `ZZZZZZZY` represents the LOS line. There can only be one on the table. The `x`/`y` do not represent the center of this piece, but the center of the starting point of the line. `w` and `h` represent the width and height in px of the line's bounding box. It will always be drawn to the opposite corner. Width and height can be negative, extending the box to the left or upwards from the starting point.

Special pieces feature the following additional fields:

`expires`
: Timestamp in seconds-since-epoch when this *piece* expires. It should no longer displayed if that time is reached. Clients should compare it with the `Servertime` HTTP header and not with a local clock value. No `expires` field means no expiration.


## Templates

A *template*, a.k.a. snapshot, describes a table setup for a particular game.

```json
{
  "type": "grid-square",
  "version": "1.0.1",
  "engine": "1.0.0",

  "colors": [
    { "name":"black","value":"#000000" },
    { "name":"white","value":"#ffffff" }
  ],

  "borders": [
    { "name":"black","value":"#000000" },
    { "name":"white","value":"#ffffff" }
  ],

  "gridSize": 64,
  "gridWidth": 48,
  "gridHeight": 32
}
```

`type`
: The type of table this *template* uses. Can be either `grid-square` or `grid-hex`.

`version`
: The version of the *template* / snapshot itself. Uses [Semantic Versioning](https://semver.org/). A downloaded snapshot will always contain the same version as the FBG version.

`engine`
: The FBG engine this *template* should work with. Uses [Semantic Versioning](https://semver.org/), and npm-style caret ranges to define version-x-or-higher.

`colors`
: An array of (background) colors available to pieces on the table. Key-Value pairs with `name` and a `value` / RGB hex code. If empty, pieces can't have dynamic colors.

`borders`
: An (optional) series of border colors available to pieces. Key-Value pairs with `name` and a `value` / RGB hex code. If empty/missing, pieces can't have dynamic colors.

The remaining *template* properties depend on the game type.

### `grid-square` entries

A *template* using the `grid-square` type also have the following properties:

`gridSize`
: The grid / minimum tile size in px.

`gridHeight`
: The height of this *template*/table in grid spaces.

`gridWidth`
: The width of this *template*/table in grid spaces.

`snap`
: Optional boolean property. If set to `false`, grid-snapping will be disabled for this *template*. It is on per default.

### `grid-hex` entries

A *template* using the `grid-hex` use hexes oriented with their flat sides up/down. They have the following additional properties:

`gridSize`
: The grid / minimum tile size in px. This equals the height of one hex (side-to-side).

`gridHeight`
: The height of this *template*/table in grid spaces.

`gridWidth`
: The width of this *template*/table in grid spaces.

`snap`
: Optional boolean property. If set to `false`, grid-snapping will be disabled for this *template*. It is on per default.

Hex-tiles are a bit complicated, as hex-forms usually do not fill squares. Tile images should therefore transparent PNGs with the hex shape placed in its center. The images sould have the smallest possible multiple of 'gridSize' that can hold that hex shape. For example, a 1x1 hex needs a 2x1 canvas.

## Rooms

This JSON describes a whole *room*.

```json
{
  "id": "O1JsTFpg",
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
: The ID of this *room*. Generated by the server.

`name`
: The public name of this *room*. Same as in the URL. Minimum 8 characters, can contain only [a-zA-Z0-9].

`engine`
: The version of the game engine this FBG server is running. Usually differs from the FBG version itself.

`backgrounds`
: An array of backgrounds available for this *room*. `name` is the name to be displayed in the settings. `image` is the path to the file within the FBG installation. `color` is the average color of the bitmap to be used while loading or as fallback. `scroller` is a suitable secondary color to be used for the scrollbar.

`library`
: The *room*'s *library*. Format is specified above.

`templage`
: The *room*'s *template*. Format is specified above.

`credits`
: A Markdown string to be shown in the about modal.

`width`
: Width of the *room*'s tables, in px.

`height`
: Height of the *room*'s tables, in px.
