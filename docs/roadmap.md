# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.17 - ??? ???

* [X] faq: reporting bugs
* [X] faq: own templates
* [X] faq: installing templates
* [X] engine: set default table other than 1 in template
* [X] engine: set default enabled layers in template
* [X] engine: specify default template in server.json
* [X] ui: shift-drag to disable grid snap
* [X] ui: animate rotations
* [X] ui: library: pick material during uploads
* [X] ui: library: set default type to tile for larger uploads
* [ ] ui: password wrong message
* [ ] ui: ellipsis for long labels
* [ ] pre-release
  * [ ] bump dependencies
  * [ ] bugfixes + refactoring
    * [ ] popup closes when other player interacts with table
    * [ ] creating notes not resetting selection
    * [X] simplify engine version change + unit tests
    * [X] empty goblin label in RPG template
    * [X] no grid visible in low quality mode
    * [X] simplify/automate more deployment steps
    * [ ] automated deployment tests for new zip/tgz packages after build
    * [ ] bug: MMB drag sometimes sticks / cursor fix
  * [ ] review docs
  * [ ] review + run tests
  * [ ] review tutorial
  * [ ] bump engine, version/codename & update CHANGELOG
  * [ ] update screenshots

## Backlog

### rather sooner (before v1)

* [ ] ui: clipboard ctrl+c/v/x between tables
* [ ] engine: option to rotate group vs individual pieces
* [ ] engine: protect api objects in JS code
* [ ] simplify/automate more deployment steps (ongoing)
* [ ] ui: move dice more
* [ ] unify wording snapshot + template
* [ ] ui: show edit form when creating new notes
* [ ] ui: library: tooltip explanation for '3x3:3' in library window
* [ ] table: native zoom function
* [ ] library: delete assets UI
* [ ] library: edit asset UI
* [ ] library: show/indicate backside/all sides in tile browser
* [ ] bug: png maps make pieces flicker when cursor changes
* [ ] pieces: inline-edit notes
* [ ] when dragging pieces, move those on top of the original piece too
* [ ] dedicated HP/Mana/Value field(s)
* [ ] engine: overlay-grid-on-tile flag
* [ ] piece: supply heap
* [ ] piece: cards / card-decks
  * [ ] shuffle deck/stack
* [ ] player secrets (e.g. for goal cards, hidden rolling, ...)
* [ ] reduce impact of "back" button
* [ ] dicemat: randomize button
* [ ] dicemat: don't roll dice on transparent parts
* [ ] dicemat: count dice values
* [ ] ui: doubleclick handling?
* [ ] concurrent drag-n-drop (first mover wins) via hash/deprecation header
* [ ] system: password-protect assets, too
* [ ] docs how to make table/template `.zip`s
* [ ] API: check sides correspond to asset
* [ ] API: hide .../data/... from URLs (via .htaccess)
* [ ] API: obfuscate/hash room name
* [ ] repo: generate average piece color
* [ ] API: catch all unhandled warnings/exceptions in PHP API and return 500
* [ ] docs: API Docs
* [ ] Firefox: filter + 180° bug

### rather later (unsorted, after v1)

* better sticky notes (auto-size text)
* bulk manipulation of assets (delete, edit, change type)
* show even more infos in media browser
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
* rename room
* custom, faster tooltips
* use left-right keys to switch tabs in modals
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
