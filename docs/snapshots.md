# FreeBeeGee snapshot format

This document is part of the [FreeBeeGee documentation](DOCS.md). It explains how FreeBeeGee game snapshots are structured.

## About snapshots

Snapshots are Save-Game `*.zip`s you can obtain by downloading them from any table you have joined. When creating a new table, you can provide such a snapshot to recreate and continue a game.

Snapshots do not only serve as Save-Games and backups, but can also be used as pre-setup game templates and shared with other players/servers. While you can do most of the setup in the FreeBeeGee UI, there are some things that require you editing the `zip` file.

## Basic snapshot layout

Snapshots are ordinary `*.zip` files with a strict following folder structure. A minimal working snapshot (without any content to play) contains:

```
/
├─ template.json
└─ LICENSE.md
```

Note that all files have to be in the root folder of the `ZIP`! Usually you want to also add assets (media) and states (table setups), so a more realistic example contains:

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

To protect the server and the players, FreeBeeGee is picky when validating snapshots. Unknown or invalid files/folders will be ignored and silently dropped.

## `template.json`

A contains `template.json` meta-information for the game engine in [JSON](https://en.wikipedia.org/wiki/JSON) format.

The content of this file is described in the [datamodel](datamodel.md#templates) documentation.

## `LICENSE.md`

TBD

## Assets

Assets are the images users can see in the library window.

All assets must be placed in an `assets/` folder. Inside that folder there may be subfolders for each asset type: `token`, `overlay`, `tile` and `other`. Images within those subfolders (but not sub-subfolders) will automatically be sorted in the corresponding library category. You can omit folders if your snapshot does not need them.

TBD

## States

TBD
