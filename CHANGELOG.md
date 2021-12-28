# FreeBeeGee CHANGELOG

Download current and previous versions from [https://github.com/ludus-leonis/FreeBeeGee/releases](https://github.com/ludus-leonis/FreeBeeGee/releases).

## v0.13.0 - Colorful Cobra

### Notable changes

* added predefined piece colors - library entries now can have pre-set default colors
* added measure mode / line-of-sight tool - press m to toggle
* added more damage status icons for RPG/Hex templates (acid, fire, ...)
* added grid option minor (dots) or major (lines) to settings

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
