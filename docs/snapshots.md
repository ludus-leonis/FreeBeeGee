# FreeBeeGee snapshot format

This document is part of the [FreeBeeGee documentation](DOCS.md). It explains how FreeBeeGee (FBG) game snapshots are structured.


## About snapshots

Snapshots are Save-Game `*.zip`s you can obtain by downloading them from any room you have joined. When creating a new room - even on another FBG server - you can provide such a snapshot to recreate and continue a game.

Snapshots do not only serve as Save-Games and backups, but can also be used as pre-setup game templates and shared with other players/servers. While you can do most of the setup in the FreeBeeGee UI, there are some things that require you editing the `zip` file.


## Basic snapshot layout

Snapshots are ordinary `*.zip` files with a strict following folder structure. A minimal working snapshot (without any content to play) contains:

```
/
├─ template.json
└─ LICENSE.md
```

Note that all files have to be in the root folder of the `ZIP`! Usually you want to also add assets (media) and table states, so a more realistic example contains:

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
│  ├─ tag/
│  │  ├─ stunned.png
│  │  └─ invisible.png
│  └─ other/
│     ├─ d6.1x1x1.png
│     ├─ ...
│     └─ d6.1x1x6.png
└─ tables/
   └─ 1.json
```

To protect the server and the players, FreeBeeGee is picky when validating snapshots. Unknown or invalid files/folders will be ignored and silently dropped.


## `template.json`

The `template.json` contains meta-information for the game engine in [JSON](https://en.wikipedia.org/wiki/JSON) format. The content of this file is described in the [datamodel](datamodel.md#templates) documentation.


## `LICENSE.md`

The copyright and license / usage conditions if this template in [Markdown](https://en.wikipedia.org/wiki/Markdown) format. Will be shown in the help dialog. Also a good place to give credit for the used artwork. May only contain markdown markup, but no HTML tags (they will be disabled during rendering).


## Assets

Assets are the images users can see in the library window.

All assets must be placed in an `assets/` folder. Inside that folder there may be subfolders for each asset type: `token`, `overlay`, `tile` and `other`, plus a `tag` folder for condition icons used in token labels. Images within those subfolders (but not sub-subfolders) will automatically be sorted in the corresponding library category. You can omit folders if your snapshot does not need them.

Asset filenames should follow a certain naming pattern so that FreeBeeGee can populate default meta fields (e.g. size, side, ...) automatically. The pattern is described in the [datamodel](datamodel.md#media-filenames) documentation. If the pattern is not followed, assets will still be used but default meta values will be set (e.g. size 1x1).


## Tables

A contains one numberd file per table 1-9, e.g. `1.json`, `2.json`. Omitted files are considered empty tables. Table files are in [JSON](https://en.wikipedia.org/wiki/JSON) format. The content of a table file is an array (`[]`) of pieces. Their format is described in the [datamodel](datamodel.md#pieces) documentation.
