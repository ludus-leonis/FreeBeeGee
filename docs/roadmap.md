# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.14 - Verbose Vicuna

* [X] add support for multiple icons/badges per token
* [X] change RPG template tiles to paper material
* [X] add more PHP unit tests for room/template parsing
* [X] move backgrounds from room to server
* [X] add option to force-upgrade snapshots during upload
* [X] auto-migrate rooms from compatible engine versions
* [X] add better feedback when uploading incompatible templates
* [X] add better feedback when snapshot upload fails
* [X] add better feedback when existing rooms fail after server updates
* [X] add better feedback when library upload fails
* [X] serverless demo mode
* [X] PHP 8.1 support
* [X] add _.zip system template - always added to each template/snapshot
* [X] add right-click popup for table (add piece, change table)
* [ ] pre-release
  * [X] bump dependencies
  * [X] bugfixes + refactoring
    * [X] fix isSolid image loading
    * [X] check write permissions in data folder
    * [X] use shorter IDs
    * [X] update all templates to new IDs
    * [X] internally rename tag -> badge
  * [X] review docs
    * [X] install + write access
  * [X] review + run tests
  * [ ] bump version/codename & update CHANGELOG
  * [X] update screenshots

## Backlog

### rather sooner (before v1)

* [ ] table: dragging some pieces should not change z (e.g. dicemat)
* [ ] table: native zoom function
* [ ] content: more classic game boards - backgammon, mills, solitaire, ...
* [ ] content: more helper/marker overlays (arrows, areas, )
* [ ] snapshot: set default/start table other than 1 in template
* [ ] system: table passwords
* [ ] library: select-border sometimes cutoff
* [ ] library: delete assets UI
* [ ] library: edit asset UI
* [ ] library: show/indicate backside/all sides in tile browser
* [ ] system: template colors as masks (dice, areas)
* [ ] when dragging pieces, move those on top of the original piece too
* [ ] multi-select stuff
* [ ] move / copy setups between tables
* [ ] protect pieces (no-delete, no-move)
* [ ] dedicated HP/Mana/Value field(s)
* [ ] piece: supply heap
* [ ] piece: cards / card-decks
  * [ ] shuffle deck/stack
* [ ] player secrets (e.g. for goal cards, hidden rolling, ...)
* [ ] reduce impact of "back" button
* [ ] "layer not active" hint when dragging nothing
* [ ] dicemat: randomize button
* [ ] dicemat: don't roll dice on transparent parts
* [ ] dicemat: count dice values
* [ ] concurrent drag-n-drop (first mover wins) via hash/deprecation header
* [ ] API: hide .../data/... from URLs (via .htaccess)
* [ ] API: obfuscate/hash room name
* [ ] docs how to make table/template `.zip`s
* [ ] API: check sides correspond to asset
* [ ] build: generate average piece color
* [ ] build: automated deployment tests for new zip/tgz packages after build
* [ ] API: catch all unhandled warnings/exceptions in PHP API and return 500
* [ ] docs: API Docs

### rather later (unsorted, after v1)

* better sticky notes (auto-size text)
* bulk manipulation of assets (delete, edit, change type)
* show even more infos in media browser
* overlay-grid-on-tile option
* sounds
  * dice-roll
  * shuffle
  * object selection
  * moving
* I18N
* rotate desk 180°
* pinboard for handouts
* undo (limited)
* better tablet / touch support
  * zooming
  * moving pieces
* color.sh: detect dominant piece color instead of average color
* compile js for older browsers (<globalThis)
* arbitrary layers via template configuration
* link to subtable in url via /roomname#1
* game rules / metainfos (pdf) links in help
* send to previous position for pieces
* detail-pane to the right for selected item
* move stuff via cursor keys
* rename table
* custom, faster tooltips
* use left-right keys to switch tabs in modals
* arbitrary snap (e.g. 1px)
* multi-panes / splitscreen / split.js
* measure range (in fields)
* auto-z based on tile position
* better fix dragndrop when 'drop' outside
* dark mode css
* library window usability
  * add without closing
  * nicer cards/selection
  * asset adding: (re)set token size 2x2->3x4
* FreeDOM: Emmet '~' support
* shared notepad / scratchpad / piece of paper / postits
* users + roles
  * admins, players, spectators
  * vote for new admin / gm
* cache/resuse/symlink same assets in different table folders (via sha256?)
* download map/table as PDF for printing
* cutcenes / message panels
* labels looking like piece of paper sticking out
* lobby / room browser
