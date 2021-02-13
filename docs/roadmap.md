# Roadmap

Here is a list what might happen next. However, priorities might change.

## v0.3

* click-to-edit (doubleclick or right-click)
* download-as-zip any game you have created or joined
* turn-counter token
* middle button drag-scroll
* remove hardcoded game values from client
  * tile size
  * border colors / names
  * background / scroller colors
* refactor game json
  * game meta info & version
  * (current) game state/history
  * use asset uuis as references / reduce duplicate information
  * refactor state.js into state.js + library.js
* more API integration tests (CRUD)
* technical FAQ/docs
* bundle setup docs in release archives

## v0.4

* overlay-grid-on-tile option
* docs how to make game/template `.zip`s
* upload-zip as template during game create
* game reset / restart / re-init
* better tablet / touch support
* fancier implementation for dynamic poll intervalls
  * show "you have been inactive" dialog after 10min
  * decrease poll intervall on mouse/keyboard activity
  * let others know via HEAD request
* image optimization during build (resize, compress)
* generate average tile color during build
* show artwork copyright somewhere
* template GDRP privacy statement

## v0.5

* URL mapping for example.org/roomname -> example.org/#/game/roomname
* upload custom images for tiles & tokens
* add more classic game boards: go, backgammon, mills, solitaire
* color.sh: detect dominant piece color instead of average color

## Backlog (unsorted)

### rather sooner

* multi-select stuff
* join-passwords
* randomize side (a.k.a. dice-tokens)
* shuffle stack/square
* I18N
* show backside/all sides in tile browser
* show even more infos in media browser
* full-screen key
* dedicated HP/Mana/Value field(s)
* LOS-ruler
* tbletop settings (e.g. change background, size, grid)
* snap-to-borders
* token status (blind, poison, prone, dazed, ...)
* auto-center
  * re-center button
  * origin 0/0 = middle
  * re-size desk if needed
* undo (limited)
* pinboard for handouts
* text token ("A")
* API Docs

### rather later

* point-somewhere feature
* move stuff via cursor keys
* rename game
* arbitrary snap (e.g. 1px)
* tabs / multiple desks
* multi-panes / splitscreen / split.js
* measure range (in fields)
* delay dragndrop till min 2px are moved to avoid jigging
* auto-z based on tile position
* better fix dragndrop when 'drop' outside
* dark mode css
* library window usability
  * add without closing
  * nicer cards/selection
  * multiselect + create
  * asset adding: (re)set token size 2x2->3x4
* dicetray (separate dice window/pane)
* FreeDOM: Emmet '~' support
* shared notepad / scratchpad / piece of paper / postits
* users + roles
  * admins, players, spectators
  * vote for new admin / gm
* cache/resuse/symlink same assets in different game folders (via sha256?)
* common shadow layer for tile layer
* download map/table as PDF for printing
* cutcenes / message panels
* labels looking like piece of paper sticking out
* hex mode
