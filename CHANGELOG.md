# FreeBeeGee CHANGELOG

Download current and previous releases from [https://github.com/ludus-leonis/FreeBeeGee/releases](https://github.com/ludus-leonis/FreeBeeGee/releases).

## v0.22.0 - Remorseful Reindeer

### Notable changes

* added undo via ctrl-z or settings dialog
* added select-all via ctrl-a
* added Snow and Ice backgrounds

### Other changes

* fixed asset no longer selected after rename in library editor
* fixed selection lost after clone/copy in demo mode
* fixed wrong piece color '0'
* fixed room auto upgrade do not recreating mandatory folders
* refactored internal asset ID calculation
* refactored test exports to use _test object


## v0.21.0 - Wailing Woodpecker

### Notable changes

* added option to edit asset name / size / material / color to library editor
* added copy/cut/paste between tables in a room
* added paper background for windows and cards
* added half-rotations via settings (45° for square, 30° for hex)
* added wooden cubes (small, medium, large) to default snapshot library
* changed tile+token sides to be shown as individual pieces in library
* changed docker image to PHP 8.2
* renamed library manager to library editor

### Other changes

* added pre-selection of asset based on selected token when library is opened
* added tabular numbers for library editor tree/preview
* added JSDoc linting and moved linting from gulp to npm
* added GitHub Actions for automated build
* added error message when snapshot list is empty
* fixed texture bug on masked non-square assets
* fixed click on icon in popup does not trigger function
* changed new-note to show the edit window first instead of creating an empty note
* improved server-delete timespan display to show days and weeks
* improved information on docker installation and volume mounting
* replaced gulp-image with custom image shrinker plugin
* replaced sass-lint with stylelint


## v0.20.0 - Advising Antelope

### Notable changes

* added library manager - press shift+L to open
* added pile feature
* added PHP 8.3 support
* added inch-indicators to LOS-line
* added shift-disables-snapping for LOS-line

### Other changes

* fixed token border won't scale with zoom
* fixed non-square token/tile images alignment off
* fixed button spinner not always hiding label
* refactored piece editor modals into separate files
* removed obsolete test.php


## v0.19.0 - Frying Frog

### Notable changes

* added 'rough' and 'linen' material for pieces
* added support for G-Z as token 'number'
* added PHP 8.2 support

### Other changes

* added automated tests for zip/tgz packages after build
* added setup variant variant grid-hex2 for hexes rotated 90°
* added assets/material folder to snapshots
* added autocomplete of side in asset name (allow 1x1 instead of 1x1x1)
* fixed trailing slash in apache config confuses FBG
* fixed docker build not pulling latest php baseimage
* fixed token selection not properly working when clicking through transparent dicemap
* refactored api tests in all/latest
* refactored FreeBeeGeeAPI globals into consts
* removed minimizing of pre-minimized snapshot assets


## v0.18.0 - Zooming Zokor

### Notable changes

* added zoom - via '+'/'-' or the [S]ettings
* added 'Cardboard', 'Dark', 'Leather', 'Paper', 'Sand' and 'Space' backgrounds
* added markdown support to notes, increased max. length to 256
* added default token backsides (again)

### Other changes

* added plain token
* added a bcrypt tool for easier setup at URL `/tools`
* removed raw HTML support in notes
* improved library previews
* improved grids
* improved background image quality
* improved duplicate asset handling
* improved monospace typography
* fixed LOS selected
* fixed wrong cursor on notes in measure mode
* fixed asset filenames
* fixed wrong color names in autoconverted snapshots
* fixed spinner button text
* fixed drag cursor sometimes sticks
* fixed sync stops when modal is open too long
* refactored wording 'template'/'snapshot' to 'snapshot' only

## v0.17.0 - Rotating Rook

### Notable changes

* added shift-drag to disable snapping while dragging
* added animation to rotating pieces
* added option to pick piece material (paper, wood) during image upload

### Other changes

* added autodetection of piece type and size based on image dimensions in upload modal
* added defaultTemplate setting to server.json
* added layersEnabled setting to template.json
* added initial table setting to template.json
* added infos how to file bugs to the docs
* added infos how to use snapshots and templates to the docs
* added password-wrong message on login screen
* added ellipsis for long piece label texts
* fixed adding notes does not reset selection
* fixed popup closing when other player interacts with table
* fixed no grid visible in low quality mode
* fixed empty goblin label in RPG template
* fixed hardcoded engine versions in integration tests


## v0.16.0 - Selecting Seal

### Notable changes

* added multi-select
* added circle & wall overlay
* removed default backsides for pieces

### Other changes

* fixed area overlays are hard to select
* fixed snapshot download not working with password rooms
* fixed laser-pointer / los-line selectable
* fixed no grab-cursor when grabbing notes & popups
* fixed npm build / removed broken gulp-svg2png
* changed gulpfile.js to use imports & bumped dependencies


## v0.15.0 - Protecting Porpoise

### Notable changes

* added table passwords
* added protected pieces - prevent delete, clone and/or move
* added dice in 13 colors
* added area, pin and zone overlays in 13 colors
* added Backgammon, Mills, Solitaire, Oware, Pachisi and TicTacToe to Classic template

### Other changes

* added Docker build
* added multicolor / colormask assets
* added random material offsets
* fixed dragging some pieces should not change z (e.g. dicemat)
* fixed disable-rotate for other-pieces
* fixed _ assets not counting against room size limit


## v0.14.0 - Verbose Vicuna

This is a breaking release, changing IDs. Old snapshots/rooms will (probably) no longer work.

### Notable changes

* added support for multiple icons/badges per token - toggle them in the edit window
* added right-click-popup for table - to access the library and settings
* added more table backgrounds
* added PHP 8.1 support (7.2 and 7.3 are deprecated now but should still work)
* improved feedback on configuration issues (server permissions, upload limits)

### Other changes

* added number token (0..9)
* added auto-migration of rooms from compatible engine versions
* added option to force-migrate rooms from incompatible engine versions
* added better feedback when uploading incompatible templates/snapshots
* added better feedback when uploading too large snapshots
* added better feedback when existing rooms fail after server updates
* added better feedback when library upload fails
* added to tutorial: laser-pointer, settings, measure mode
* added check for write permissions in data folder during setup/room create
* added _.zip system template - always added to each template/snapshot
* added demo mode - separate build necessary
* added more unit and API integration tests
* fixed pieces sometimes getting selected when clicking in transparent areas
* fixed loading of rooms of older versions
* changed default max room size to 16MB and max room count to 32 - customize them in server.json
* changed IDs to 8-digit 64-base strings
* changed RPG template tiles to paper material
* changed RPG letter/symbol token into two
* changed API - backgrounds now part of server JSON, not room JSON
* changed 'tag' to 'badge'


## v0.13.0 - Colorful Cobra

### Notable changes

* added predefined piece colors - library entries now can have pre-set default colors
* added measure mode / line-of-sight tool - press m to toggle
* added more damage status icons for RPG/Hex templates (acid, fire, ...)
* added grid option minor (dots) or major (lines) to settings
* improved piece rendering - nicer highlights & material texture

### Other changes

* added color support and "?", "!" and "↑" sides to the generic A-Z piece
* added hotkeys F/R to flip/rotate backwards
* added automatic generation of average piece color during uploads
* added separate color sets in templates for piece borders and backgrounds
* added unit test docs and added `Dockerfile` for test webservers
* changed all JS-CSS injections to use custom properties
* changed all JS imports to be relative to src/js/
* changed background settings from room to server setting
* fixed "RPG" template glass tiles transparency
* fixed default piece backsides counting as side in library
* fixed piece.h default handling (now equals w, not 0)
* fixed browser caching artwork from previous template in same room
* fixed user preferences to have global default values and ttl
* fixed rotating border highlights
* fixed upload form sometimes resets selection


## v0.12.0 - Hexing Heron

This is a breaking release, changing internal data structures. Old snapshots/rooms will no longer work.

### Notable changes

* added hex mode for templates
* added 'Hex' game template
* added multiple table background images (change via settings)
* added setting and hotkey to toggle grid overlay (g, initially hidden)
* added hotkey to toggle fullscreen (F11)
* improved token borders, token now have a no-border option
* improved generic game token / Go piece / bead (now in 8 colors)

### Other changes

* added `snap` property to templates to turn on/off snapping - defaults to true=on
* added click-thru for transparent parts of tiles (png)
* added detection of existing but incompatible room versions
* fixed outline of backsides of irregular-shaped pieces
* fixed tokens sometimes shifting when selecting them
* fixed library search sometimes missing / ok not working
* improved readablity of piece numbers on bright borders
* improved build speed by caching generated files
* improved template/engine mismatch detection
* changed piece/asset data model to be more compact and future proof
* changed drag'n'drop 'ghost' image to snap to possible positions
* changed grid indicators from pngs to crisper svgs
* updated datamodel docs
* removed `gridSize` from templates - templates snap to their grid size if snapping is on


## v0.11.0 - Troubled Trout

This is a breaking release, changing internal data structures. Old snapshots/rooms will no longer work.

### Notable changes

* added error reporting on missing PHP requirements
* added error message on missing .htaccess support during setup
* added sticky note colors
* added tutorial template

### Other changes

* changed sticky note max text length to 128
* fixed piece position when adding them via (+)
* improved classic template
* improved scroll position handling when switching tables
* added auto-center view for empty tables
* added troubleshooting guide
* added different, slight offsets for table 1..9 textures
* fixed API tests
* updated docs
* refactored pieces border->color


## v0.10.0 - Pointing Pony

This is a breaking release, changing internal data structures. Old snapshots/rooms will no longer work.

### Notable changes

* added laser-pointer feature
* added status icons/tags for pieces
* added individual edit windows per piece types
* added glass tiles to RPG template for brighter/darker tiles

### Other changes

* fixed snapshot filename to match client timezone
* fixed php8 compatibility issue
* fixed image/piece upload
* fixed search field not focused on library open
* fixed sticky note rotation
* tweaked spacings + font sizes
* refactored refactored wording table->room, subtable->table, state->table
* refactored JS file layout
* added basic frontend JS unit tests
* added more technical documentation & TOC


## v0.9.0 - Happy Hamster

### Notable changes

* added subtable support (alt-1..9, ctrl-1..9)
* added small clock in lower right corner
* moved note layer below token layer (put token on notes now!)
* added php8 support

### Other changes

* tweaked selected-piece outline
* fixed clone-focus-lost bug
* fixed svg-token-number-color bug
* fixed clone-outside-table bug
* tweaked settings dialog
* refactored DOM handling to reuse elements a bit more
* refactored frontend data model from dataset to objects
* refactored fetch() error handlers
* bumped dependencies & fixed scss deprecations
* removed reset-table feature (now obsolete due to subtables)


## v0.8.0 - Resizing Rhinoceros

### Noteable changes

* added table resize feature
* added table content alignment feature
* improved snapshot upload: ignore extra files in ZIP instead of rejecting them
* added more room types and assets to RPG template

### Other changes

* added default back side for all 1-sided pieces
* fixed popup menu sometimes cut-off
* fixed rotated pieces placement next to table border
* fixed uploaded token border color bug
* docs/requirements update


## v0.7.0 - Uploading Unicorn

### Noteable changes

* added image upload tab in library modal
* added search/filter to library
* added new dungeon tiles by 2minutetabletop.com to RPG template
* added 200+ monster token by game-icons.net to RPG template
* added Go boards by github.com/svenja to Classic template

### Other changes

* added random movement to single die rolls
* added piece size indicator backgrounds in library modal
* improved sticky note text sizes
* improved cyan dice
* improved piece shadows
* improved navigating create-screen via keyboard
* fixed invalid new-piece placement outside table bounds
* fixed missing colors when cycling borders
* fixed token-border bug
* added draft of snapshot docs
* updated docs & screenshots
* updated unit tests

## v0.6.1

* fixed missing animation for moving pieces
* added IfModule for PHP-instructions in .htaccess'


## v0.6 - Sticky Starling

### Notable changes

* added sticky notes (hotkey: n)
* added FATE dice to RPG template
* added multiselect in library modal (add multiple pieces)
* added customizable snap positions (& RPG template snaps to half-grid now)
* added auto-scroll-to-action after joining/reloading a table
* added border-color hotkey "o"
* added delete-table button to settings
* added support for discard piles (shuffle tile stacks)
* added GDRP template
* changed table URLs from anchors to folders (example.org/#/fancyPony -> example.org/fancyPony)

### Other changes

* changed wording game->table
* added tabs to settings dialog
* improved polling logic & interval
* improved mouse cursor in modals
* improved piece select indicator
* disabled random UQ rotation for big tiles (8+)
* changed library hotkey to l
* added loading indicator to create game
* added support for partially transparent tiles (PNG alpha)
* fixed drag-n-drop z position
* changed state json for more optional fields
* changed state json x/y coordinates to px
* refactored state / slot handling, added multiple states to templates
* fixed integration tests
* fixed same z-index when multiple pieces are added
* fixed dicemat bug
* reduced border radius for pieces
* fixed popup hidden behind tiles in low quality mode
* fixed no-badge for tokens
* moved some filters to ultra quality
* fixed reset/clean table bug in Firefox


## v0.5 - Random Rabbit

### Notable changes

* added support for rolling dice on your table
* added d4, d6, d8, d10, d12 and d20 in 4 colors
* improved general rendering speed
* added render-quality slider to settings dialog

### Other changes

* added randomize icon/popup menu
* tweaked preview-size of pieces in library dialog
* fixed z position for cloned pieces
* improved piece shadows
* fixed upload limits and upload problem verbosity
* updated unit tests
* updated help dialog


## v0.4.2

* fixed create-table error due case-sensitive http headers for POST requests


## v0.4.1

* fixed piece-delete bug


## v0.4.0 - Zipping Zebra

* added more unit/integration tests
* added reset-table feature
* added clear-table feature
* added snapshot uploads
* disabled flip menu for single-sided pieces
* added template credits / license information to about modal
* replaced png assets with svgs in default templates
* improved handling of missing assets
* added settings dialog
* added token numbers (letters)
* added logo icon to readme
* fixed logo font


## v0.3.0 - Clicking Crab

* added logo
* improved create game dialog UX
* added more integration tests
* added INSTALL.md to release archives
* added svg favicon
* added timestamp to snapshot zips, removed unnecessary files from snapshot
* refactored asset handling in JSON files
* added technical FAQ
* added game snapshot downloads
* added right-click context menu for pieces
* added scroll-on-grab for middle mouse button
* moved hardcoded values from client into API/templates
* added generic A-Z and 0-9 tokens, added gulp-image to minimize images
* improved game-does-not-exist error handling
* fixed dragndrop-hang issue
* improved label readability
* fixed maximum tile size in editor, added F2 editor hotkey
* updated dependencies


## v0.2.0 - Public Parrot

* first public release


## v0.1.0 - Internal Ibis

* internal test release
