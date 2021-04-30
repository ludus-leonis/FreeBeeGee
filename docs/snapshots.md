# FreeBeeGee snapshot format

This document explains how FreeBeeGee game snapshots are structured.

## Basic snapshot layout

Snapshots are ordinary `*.zip` files with a strict following folder structure. A minimal working snapshot (without much content to play with) contains:

```
/
├─ template.json
└─ LICENSE.md
```

Note that all files have to be in the root folder of the `ZIP`. Usually you want to also add assets (images) and states (table setups), so a more realistic example is:

```
/
├─ template.json
├─ LICENSE.md
├─ assets/
│  ├─ token/
│  │  ├─ orc.1x1x1.png
│  │  ├─ fighter.1x1x1.png
│  │  └─ wizard.1x1x1.png
│  ├─ overlay/
│  │  ├─ door.2x1x1.png
│  │  └─ table.3x2x1.png
│  ├─ tile/
│  │  ├─ corridor.4x1x1.png
│  │  └─ room.6x6x1.png
│  └─ other/
│     ├─ d6.1x1x1.png
│     ├─ ...
│     └─ d6.1x1x6.png
└─ states/
   ├─ 0.json
   └─ 1.json
```

To protect the server and the players, FreeBeeGee is very picky when validating snapshots. They **must not** include any additional files or they will be rejected. Be careful not to add (hidden) files or directories your operating system might automatically add, like `Thumbs.db`, `.DS_Store`  or `__MACOSX/`.

## `template.json`

A contains `template.json` meta-information for the game engine in [JSON](https://en.wikipedia.org/wiki/JSON) format.

```json
{
  "type": "grid-square",
  "version": "$VERSION$",
  "engine": "^$ENGINE$",

  "gridSize": 64,
  "gridWidth": 48,
  "gridHeight": 32,
  "snapSize": 32,

  "colors": {
    "black": "#000000",
    "white": "#ffffff"
  }
}
```

TBD

## `LICENSE.md`

TBD

## Assets

Assets are the images users can see in the library window.

All assets must be placed in an `assets/` folder. Inside that folder there may be subfolders for each asset type: `token`, `overlay`, `tile` and `other`. Images within those subfolders will automatically be sorted in the corresponding library category. You can omit each of these folders if your snapshot does not need them. However, you **must not** add other types/subfolders.

TBD

## States

TBD
