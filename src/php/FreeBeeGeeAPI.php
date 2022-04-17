<?php

/**
 * Copyright 2021-2022 Markus Leupold-Löwenthal
 *
 * @license This file is part of FreeBeeGee.
 *
 * FreeBeeGee is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

namespace com\ludusleonis\freebeegee;

/**
 * FreeBeeGeeAPI - The tabletop backend.
 *
 * JSON/REST backend for FreeBeeGee.
 */
class FreeBeeGeeAPI
{
    private $ID_ASSET_POINTER = 'ZZZZZZZZ';
    private $ID_ASSET_LOS     = 'ZZZZZZZY';
    private $ID_ASSET_NONE    = 'NO_ASSET';
    private $ID_ACCESS_ANY    = '00000000-0000-0000-0000-000000000000';
    private $REGEXP_ID    = '^[0-9a-zA-Z_-]{8}$';
    private $REGEXP_COLOR = '^#[0-9a-fA-F]{6}$';
    private $version = '$VERSION$';
    private $engine = '$ENGINE$';
    private $api = null; // JSONRestAPI instance
    private $minRoomGridSize = 16;
    private $maxRoomGridSize = 256;
    private $maxAssetSize = 1024 * 1024;
    private $types = ['grid-square', 'grid-hex'];
    private $assetTypes = ['overlay', 'tile', 'token', 'other', 'badge'];
    private $stickyNotes = ['yellow', 'orange', 'green', 'blue', 'pink'];

    private $FLAG_NO_DELETE = 0b00000001;
    private $FLAG_NO_CLONE  = 0b00000010;
    private $FLAG_NO_MOVE   = 0b00000100;

    /**
     * Constructor - setup our routes.
     */
    public function __construct()
    {
        $this->api = new JSONRestAPI();

        // best ordered by calling frequency within each method to reduce string
        // matching overhead

        // --- GET ---

        $this->api->register('GET', '/rooms/:rid/digest/?', function ($fbg, $data) {
            $meta = $this->getRoomMeta($data['rid']);
            $fbg->getRoomDigest($meta);
        });

        $this->api->register('GET', '/rooms/:rid/?', function ($fbg, $data) {
            $meta = $this->getRoomMeta($data['rid']);
            $fbg->getRoom($meta);
        });

        $this->api->register('GET', '/rooms/:rid/tables/:tid/?', function ($fbg, $data) {
            $meta = $this->getRoomMeta($data['rid']);
            $fbg->getTable($meta, $data['tid']);
        });

        $this->api->register('GET', '/rooms/:rid/tables/:tid/pieces/:pid/?', function ($fbg, $data) {
            $meta = $this->getRoomMeta($data['rid']);
            $fbg->getPiece($meta, $data['tid'], $data['pid']);
        });

        $this->api->register('GET', '/', function ($fbg, $data) {
            $fbg->getServerInfo();
        });

        $this->api->register('GET', '/templates/?', function ($fbg, $data) {
            $fbg->getTemplates();
        });

        $this->api->register('GET', '/rooms/:rid/snapshot/?', function ($fbg, $data) {
            $meta = $this->getRoomMeta($data['rid']);
            $tzo = array_key_exists('tzo', $_GET) ? intval($_GET['tzo']) : 0;
            $fbg->getSnapshot($meta, $tzo);
        });

        $this->api->register('GET', '/issues/', function ($fbg, $data) {
            $fbg->getIssues();
        });

        // --- POST ---

        $this->api->register('POST', '/rooms/:rid/tables/:tid/pieces/?', function ($fbg, $data, $payload) {
            $meta = $this->getRoomMeta($data['rid']);
            $piece = $this->api->assertJSONObject('piece', $payload);
            $fbg->createPiece($meta, $data['tid'], $piece);
        });

        $this->api->register('POST', '/rooms/:rid/assets/?', function ($fbg, $data, $payload) {
            $meta = $this->getRoomMeta($data['rid']);
            $asset = $this->api->assertJSONObject('asset', $payload);
            $fbg->createAssetLocked($meta, $asset);
        });

        $this->api->register('POST', '/rooms/', function ($fbg, $data, $payload) {
            $formData = $this->api->multipartToJSON();
            if ($formData) { // client sent us multipart
                if ($formData === "[]" && $_SERVER['CONTENT_LENGTH'] > 0) {
                    $this->api->sendErrorPHPUploadSize();
                } else {
                    $room = $this->api->assertJSONObject('snapshot room', $formData);
                }
            } else { // client sent us regular JSON
                $room = $this->api->assertJSONObject('room', $payload);
            }
            $fbg->createRoomLocked($room);
        });

        $this->api->register('POST', '/rooms/:rid/auth/?', function ($fbg, $data, $payload) {
            $fbg->auth($data['rid'], $this->api->assertJSONObject('auth', $payload));
        });

        // --- PUT ---

        $this->api->register('PUT', '/rooms/:rid/tables/:tid/pieces/:pid/?', function ($fbg, $data, $payload) {
            $meta = $this->getRoomMeta($data['rid']);
            $piece = $this->api->assertJSONObject('piece', $payload);
            $fbg->replacePiece($meta, $data['tid'], $data['pid'], $piece);
        });

        $this->api->register('PUT', '/rooms/:rid/tables/:tid/?', function ($fbg, $data, $payload) {
            $meta = $this->getRoomMeta($data['rid']);
            $table = $this->api->assertJSONArray('table', $payload);
            $fbg->putTableLocked($meta, $data['tid'], $table);
        });

        // --- PATCH ---

        $this->api->register('PATCH', '/rooms/:rid/tables/:tid/pieces/:pid/?', function ($fbg, $data, $payload) {
            $meta = $this->getRoomMeta($data['rid']);
            $patch = $this->api->assertJSONObject('piece', $payload);
            $fbg->updatePiece($meta, $data['tid'], $data['pid'], $patch);
        });

        $this->api->register('PATCH', '/rooms/:rid/tables/:tid/pieces/', function ($fbg, $data, $payload) {
            $meta = $this->getRoomMeta($data['rid']);
            $patches = $this->api->assertJSONArray('pieces', $payload);
            $fbg->updatePieces($meta, $data['tid'], $patches);
        });

        $this->api->register('PATCH', '/rooms/:rid/template/', function ($fbg, $data, $payload) {
            $meta = $this->getRoomMeta($data['rid']);
            $patch = $this->api->assertJSONObject('template', $payload);
            $fbg->updateRoomTemplateLocked($meta, $patch);
        });

        $this->api->register('PATCH', '/rooms/:rid/auth/', function ($fbg, $data, $payload) {
            $meta = $this->getRoomMeta($data['rid']);
            $patch = $this->api->assertJSONObject('auth', $payload);
            $fbg->updateAuthLocked($meta, $patch);
        });

        // --- DELETE ---

        $this->api->register('DELETE', '/rooms/:rid/tables/:tid/pieces/:pid/?', function ($fbg, $data) {
            $meta = $this->getRoomMeta($data['rid']);
            $fbg->deletePiece($meta, $data['tid'], $data['pid'], true);
        });

        $this->api->register('DELETE', '/rooms/:rid/?', function ($fbg, $data) {
            $meta = $this->getRoomMeta($data['rid']);
            $fbg->deleteRoom($meta);
        });
    }

    /**
     * Set API/temp dir and other values.
     *
     * Only to be used for debugging/unit testing.
     */
    public function setDebug(
        string $dir,
        string $version,
        string $engine
    ) {
        $this->api->debugApiDir($dir);
        $this->version = $version;
        $this->engine = $engine;
    }

    /**
     * Run this application.
     *
     * Will route and execute a single HTTP request.
     */
    public function run(): void
    {
        $this->api->route($this);
    }

    // --- getters -------------------------------------------------------------

    public function getEngine(): string
    {
        return $this->engine;
    }

    // --- helpers -------------------------------------------------------------

    /**
     * Determine the filesystem-path where FreeBeeGee is installed in.
     *
     * This is one level up the tree from where the API script is located.
     *
     * @return string Full path to our install folder.
     */
    private function getAppFolder(): string
    {
        return $scriptDir = dirname(dirname(__FILE__)) . '/'; // app is in our parent folder
    }

    /**
     * Determine the filesystem-path where data for a particular room is stored.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @return type Full path to room data folder, including trailing slash.
     */
    private function getRoomFolder(
        string $roomName
    ): string {
        return $this->api->getDataDir("rooms/$roomName/");
    }

    /**
     * Obtain server config values.
     *
     * Done by loading server.json from disk.
     *
     * @return object Parsed server.json.
     */
    private function getServerConfig()
    {
        if (is_file($this->api->getDataDir('server.json'))) {
            $config = json_decode(file_get_contents($this->api->getDataDir('server.json')));
            $config->version = '$VERSION$';
            $config->engine = '$ENGINE$';
            $config->maxAssetSize = $this->maxAssetSize;
            return $config;
        } else {
            // config not found - return system values
            return json_decode('
                {
                    "ttl": 48,
                    "maxRooms": 32,
                    "maxRoomSizeMB": 16,
                    "snapshotUploads": false,
                    "passwordCreate": "$2y$12$ZLUoJ7k6JODIgKk6et8ire6XxGDlCS4nupZo9NyJvSnomZ6lgFKGa",
                    "version": "$VERSION$",
                    "engine": "$ENGINE$"
                }
            ');
        }
    }

    /**
     * Do some basic checks on the room (exists, password), then reads meta.json.
     *
     * Terminates execution if something is fishy.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $token Access token.
     * @return object Parsed meta.json.
     */
    public function getRoomMeta(
        string $roomName
    ) {
        $folder = $this->getRoomFolder($roomName);
        if (is_file($folder . 'meta.json')) {
            $meta = json_decode($this->api->fileGetLocked(
                $folder . 'meta.json',
                $folder . '.flock'
            ));
            if (property_exists($meta, 'token')) {
                if ($meta->token !== $this->ID_ACCESS_ANY) {
                    $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
                    $authorized = false;
                    foreach ($headers as $header => $value) {
                        if (strtolower($header) === 'authorization') { // headers are case-insensitive
                            if ($meta->token === $value) {
                                $authorized = true;
                            } else {
                                $this->api->sendError(403, 'forbidden ' . $roomName);
                            }
                            break; // terminate after first unsuccessful authorization header
                        }
                    }
                    if (!$authorized) {
                        $this->api->sendError(401, 'not authorized');
                    }
                }
            }
            $meta->name = $roomName;
            $meta->folder = $folder;
            $meta->lock = $folder . '.flock';
            return $meta;
        }
        $this->api->sendError(404, 'not found: ' . $roomName);
    }

    /**
     * Calculate the available / free rooms on this server.
     *
     * Done by counting the sub-folders in the ../rooms/ folder.
     *
     * @param string $json (Optional) server.json to avoid re-reading it in some cases.
     * @return int Number of currently free rooms.
     */
    private function getFreeRooms(
        $json = null
    ) {
        if ($json === null) {
            $json = $this->getServerConfig();
        }

        // count rooms
        $dir = $this->api->getDataDir('rooms/');
        $count = 0;
        if (is_dir($dir)) {
            $count = sizeof(scandir($this->api->getDataDir('rooms/'))) - 2; // do not count . and ..
        }

        return $json->maxRooms > $count ? $json->maxRooms - $count : 0;
    }

    /**
     * Remove rooms that were inactive too long.
     *
     * Will determine inactivity via modified-timestamp of .flock file in room
     * folder, as every sync of an client touches this.
     *
     * @param int $maxAgeSec Maximum age of inactive room in Seconds.
     */
    private function deleteOldRooms(
        $maxAgeSec
    ) {
        $dir = $this->api->getDataDir('rooms/');
        $now = time();
        if (is_dir($dir)) {
            $rooms = scandir($dir);
            foreach ($rooms as $room) {
                if ($room[0] !== '.') {
                    $modified = filemtime($dir . $room . '/.flock');
                    if ($now - $modified > $maxAgeSec) {
                        $this->api->deleteDir($dir . $room);
                    }
                }
            }
        }
    }

    /**
     * Install a template/snapshot into a room.
     *
     * Will unpack the template .zip into the room folder. Terminates execution
     * on errors. Expects the caller to handle FS locking.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $zipPath Path to snapshot/template zip to install.
     * @param array $validEntries Array of path names (strings) to extract from zip.
     */
    public function installSnapshot(
        string $roomName,
        string $zipPath,
        array $validEntries
    ) {
        $folder = $this->getRoomFolder($roomName);

        // create mandatory folder structure
        if (
            !mkdir($folder . 'tables', 0777, true)
            || !mkdir($folder . 'assets/other', 0777, true)
            || !mkdir($folder . 'assets/overlay', 0777, true)
            || !mkdir($folder . 'assets/tile', 0777, true)
            || !mkdir($folder . 'assets/token', 0777, true)
            || !mkdir($folder . 'assets/badge', 0777, true)
        ) {
            $this->api->sendError(500, 'can\'t write on server');
        }

        // unzip all validated files
        $zip = new \ZipArchive();
        if ($zip->open($zipPath) === true) {
            $zip->extractTo($folder, $validEntries);
            $zip->close();
        } else {
            $this->api->sendError(500, 'can\'t setup template ' . $zipPath);
        }

        // unzip system template next if it exists, possibly overwriting assets
        if (is_file($this->api->getDataDir('templates/_.zip'))) {
            $zip = new \ZipArchive();
            if ($zip->open($this->api->getDataDir('templates/_.zip')) === true) {
                $zip->extractTo($folder);
                $zip->close();
            } else {
                $this->api->sendError(500, 'can\'t setup template ' . $zipPath);
            }
        }

        // recreate potential nonexisting files as fallback
        if (!is_file($folder . 'template.json')) {
            file_put_contents($folder . 'template.json', json_encode($this->getTemplateDefault()));
        }
    }

    /**
     * Assemble a default template file.
     *
     * @return object Template PHP object.
     */
    private function getTemplateDefault(): object
    {
        return (object) [
            'type' => 'grid-square',
            'version' => $this->version,
            'engine' => $this->engine,

            'gridSize' => 64,
            'gridWidth' => 48,
            'gridHeight' => 32,

            'colors' => $this->getColors(),
            'borders' => $this->getColors()
        ];
    }

    /**
     * Assemble our default color array.
     *
     * @return array Default colors for use in templates.
     */
    private function getColors(): array
    {
        return [
            (object) [ 'name ' => 'Black', 'value' => '#202020' ],
            (object) [ 'name ' => 'White', 'value' => '#e8e8e8' ],
            (object) [ 'name ' => 'Red', 'value' => '#b32d35' ],
            (object) [ 'name ' => 'Orange', 'value' => '#b05a11' ],
            (object) [ 'name ' => 'Yellow', 'value' => '#af9700' ],
            (object) [ 'name ' => 'Green', 'value' => '#317501' ],
            (object) [ 'name ' => 'Cyan', 'value' => '#40bfbf' ],
            (object) [ 'name ' => 'Blue', 'value' => '#3387b0' ],
            (object) [ 'name ' => 'Indigo', 'value' => '#2e4d7b' ],
            (object) [ 'name ' => 'Violet', 'value' => '#730fb1' ],
            (object) [ 'name ' => 'Magenta', 'value' => '#bf40bf' ],
            (object) [ 'name ' => 'Gray A', 'value' => '#606060' ],
            (object) [ 'name ' => 'Gray B', 'value' => '#a0a0a0' ],
        ];
    }

    private function getBackgrounds(): array
    {
        return [
            $this->getBackground('Carpet', 'img/desktop-carpet.jpg', '#747e86', '#636f78'),
            $this->getBackground('Casino', 'img/desktop-casino.jpg', '#2e5d3c', '#1b3c25'),
            $this->getBackground('Concrete', 'img/desktop-concrete.jpg', '#646260', '#494540'),
            $this->getBackground('Marble', 'img/desktop-marble.jpg', '#b4a999', '#80725e'),
            $this->getBackground('Metal', 'img/desktop-metal.jpg', '#515354', '#3e3e3e'),
            $this->getBackground('Pinboard', 'img/desktop-pinboard.jpg', '#bc8c6c', '#a2775b'),
            $this->getBackground('Rock', 'img/desktop-rock.jpg', '#5c5d5a', '#393930'),
            $this->getBackground('Wood', 'img/desktop-wood.jpg', '#57514d', '#3e3935'),
        ];
    }

    /**
     * Update a table in the filesystem.
     *
     * Will update the table.json of a table with the new piece. By replacing the
     * corresponding JSON Array item with the new one via ID reference.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param string $tid Table id / number, e.g. 2.
     * @param object $piece The parsed & validated piece to update.
     * @param bool $create If true, this piece must not exist.
     * @param patch $create If true, old and new piece will be merged.
     * @return object The updated piece.
     */
    private function updatePieceTableLocked(
        object $meta,
        string $tid,
        object $piece,
        bool $create,
        bool $patch
    ): object {
        $lock = $this->api->waitForWriteLock($meta->lock);
        $file = $meta->folder . 'tables/' . $tid . '.json';

        $oldTable = [];
        if (is_file($file)) {
            $oldTable = json_decode(file_get_contents($file));
        }
        $result = $piece;

        // rewrite table, starting with new item
        // only latest (first) table item per ID matters
        $now = time();
        $newTable = []; // will get the new, updated/rewritten table
        $ids = []; // the IDs of all pieces that are still in $newTable after all the updates
        if ($create) { // in create mode we inject the new piece
            // add the new piece
            $result = $this->cleanupPiece($piece);
            $newTable[] = $result;

            // re-add all old pieces
            foreach ($oldTable as $tableItem) {
                if ($piece->id === $this->ID_ASSET_LOS && $tableItem->id === $piece->id) {
                    // skip recreated system piece
                } elseif ($piece->id === $this->ID_ASSET_POINTER && $tableItem->id === $piece->id) {
                    // skip recreated system piece
                } elseif (!in_array($tableItem->id, $ids)) {
                    // for newly created items we just copy the current table of the others
                    if ($tableItem->id === $piece->id) {
                        // the ID is already in the history - abort!
                        $this->api->unlockLock($lock);
                        $this->api->sendReply(409, json_encode($piece));
                    }
                    $newTable[] = $tableItem;
                    $ids[] = $tableItem->id;
                }
            }
        } else { // in update mode we lookup the piece by ID and merge the changes
            foreach ($oldTable as $tableItem) {
                if (!in_array($tableItem->id, $ids)) {
                    // this is an update, and we have to patch the item if the ID matches
                    if ($tableItem->id === $piece->id) {
                        // just skip deleted piece
                        if (isset($piece->l) && $piece->l === PHP_INT_MIN) {
                            continue;
                        }
                        if ($patch) {
                            $tableItem = $this->cleanupPiece($this->merge($tableItem, $piece));
                        } else {
                            $tableItem = $this->cleanupPiece($piece);
                        }
                        $result = $tableItem;
                    }
                    if (!isset($tableItem->expires) || $tableItem->expires > time()) {
                        // only add if not expired
                        $newTable[] = $tableItem;
                        $ids[] = $tableItem->id;
                    }
                }
            }
            if (!in_array($piece->id, $ids) && (!isset($piece->l) || $piece->l !== PHP_INT_MIN)) {
                $this->api->unlockLock($lock);
                $this->api->sendError(404, 'not found: ' . $piece->id);
            }
        }
        $this->writeAsJSONAndDigest($meta->folder, 'tables/' . $tid . '.json', $newTable);
        $this->api->unlockLock($lock);

        return $result;
    }

    /**
     * Regenerate a library JSON.
     *
     * Done by iterating over all files in the assets folder.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @return array The generated library JSON data object.
     */
    private function generateLibraryJSON(
        string $roomName
    ): array {
        // generate JSON data
        $roomFolder = $this->getRoomFolder($roomName);
        $assets = [];
        foreach ($this->assetTypes as $type) {
            $assets[$type] = [];
            $lastAsset = null;
            foreach (glob($roomFolder . 'assets/' . $type . '/*') as $filename) {
                $asset = FreeBeeGeeAPI::fileToAsset(basename($filename));

                if (
                    $lastAsset === null
                    || $lastAsset->name !== $asset->name
                    || $lastAsset->w !== $asset->w
                    || $lastAsset->h !== $asset->h
                ) {
                    // this is a new asset. write out the old.
                    if ($lastAsset !== null) {
                        if (count($lastAsset->media) === 1) { // add backside to 1-sided asset
                            $lastAsset->media[] = '##BACK##';
                        }
                        array_push($assets[$type], $lastAsset);
                    }
                    $idBase = $type . '/' . $asset->name . '.' . $asset->w . 'x' . $asset->h . 'x' . $asset->s;
                    $lastAsset = (object) [
                        'id' => $this->generateId(abs(crc32($idBase))), // avoid neg. values on 32bit systems
                        'name' => $asset->name,
                        'type' => $type,
                        'w' => $asset->w,
                        'h' => $asset->h,
                        'bg' => $asset->bg,
                        'media' => []
                    ];
                    if (property_exists($asset, 'tx')) {
                        $lastAsset->tx = $asset->tx;
                    }
                }
                if (preg_match('/^X+$/', $asset->s)) { // this is a mask
                    $lastAsset->mask = $asset->media[0];
                } elseif ((int)$asset->s === 0) { // this is a background layer
                    $lastAsset->base = $asset->media[0];
                } else {
                    // this is another side of the same asset. add it to the existing one.
                    array_push($lastAsset->media, $asset->media[0]);
                }
            }
            if ($lastAsset !== null) { // don't forget the last one!
                if (count($lastAsset->media) === 1) { // add backside to 1-sided asset
                    $lastAsset->media[] = '##BACK##';
                }
                array_push($assets[$type], $lastAsset);
            }
        }

        return $assets;
    }

    /**
     * Write a data object as JSON to a file and generate a digest.
     *
     * Digest will be put into digest.json. Does not do locking.
     *
     * @param string $folder Root folder for file operations, ending in '/'.
     * @param string $filename Relative path within root folder.
     * @param object $object PHP object to write.
     */
    private function writeAsJSONAndDigest(
        $folder,
        $filename,
        $object
    ) {
        // handle data
        $data = json_encode($object);
        file_put_contents($folder . $filename, $data);

        // handle hash
        $digests = json_decode(file_get_contents($folder . 'digest.json'));
        $digests->$filename = 'crc32:' . crc32($data);
        file_put_contents($folder . 'digest.json', json_encode($digests));
    }

    // --- validators ----------------------------------------------------------

    /**
     * Validate a template / snapshot.
     *
     * Does a few sanity checks to see if everything is there we need. Will
     * termiante execution and send a 400 in case of invalid zips.
     *
     * @param string $zipPath Full path to the zip to check.
     * @param bool $ignoreEngine Optional. If true, snapshots will not be rejected on eninge.
     * @param array Array of strings / paths of all valid zip entries to extract.
     */
    public function validateSnapshot(
        string $zipPath,
        bool $ignoreEngine = false
    ): array {
        $valid = [];

        // available room size = config size minus system zip size
        $systemTemplateSize = $this->getZipSize($this->api->getDataDir('templates/_.zip'));
        $sizeLeft = $this->getServerConfig()->maxRoomSizeMB * 1024 * 1024 - $systemTemplateSize;

        // basic sanity tests
        if (filesize($zipPath) > $sizeLeft) {
            // if the zip itself is too large, then its content is probably too
            $this->api->sendError(400, 'snapshot too big', 'ROOM_SIZE', [
                $this->getServerConfig()->maxRoomSizeMB * 1024 * 1024
            ]);
        }

        // iterate over zip entries
        $zip = new \ZipArchive();
        if (!$zip->open($zipPath)) {
            $this->api->sendError(400, 'can\'t open zip', 'ZIP_INVALID');
        }
        for ($i = 0; $i < $zip->numFiles; $i++) {
            // note: the checks below will just 'continue' for invalid/ignored items
            $entry = $zip->statIndex($i);

            switch ($entry['name']) { // filename checks
                case 'LICENSE.md':
                    break; // known, unchecked file
                case 'tables/1.json':
                case 'tables/2.json':
                case 'tables/3.json':
                case 'tables/4.json':
                case 'tables/5.json':
                case 'tables/6.json':
                case 'tables/7.json':
                case 'tables/8.json':
                case 'tables/9.json':
                    break; // known files that will be cleaned up later anyway
                case 'template.json':
                    // only check version, everything else can be cleaned up later
                    if (!$ignoreEngine) {
                        $this->validateTemplateEngineJSON(file_get_contents('zip://' . $zipPath . '#template.json'));
                    }
                    break;
                default: // scan for asset filenames
                    if (
                        !preg_match(
                            '/^assets\/(overlay|tile|token|other|badge)\/[ a-zA-Z0-9_.-]*.(svg|png|jpg)$/',
                            $entry['name']
                        )
                    ) {
                        continue 2; // for
                    }
            }

            if ($entry['size'] > $this->maxAssetSize) { // filesize checks
                continue; // for
            }
            $sizeLeft -= $entry['size'];
            if ($sizeLeft < 0) {
                $this->api->sendError(400, 'content too large', 'ROOM_SIZE', [
                    $this->getServerConfig()->maxRoomSizeMB * 1024 * 1024
                ]);
            }

            // if we got here, no check failed, so the entry is ok!
            $valid[] = $entry['name'];
        }

        return $valid;
    }

    /**
     * Validate the engine version of a template.json.
     *
     * Will try to parse the template JSON first.
     *
     * @param string $json JSON string.
     */
    public function validateTemplateEngineJSON(
        string $json
    ) {
        $template = json_decode($json);
        $template = is_object($template) ? $template : (object) [] ;
        $this->setIfMissing($template, 'engine', '0.0.0');

        if (!is_string($template->engine) || !$this->api->semverSatisfies($this->engine, '^' . $template->engine, true)) {
            $this->api->sendError(400, 'template.json: engine mismatch', 'INVALID_ENGINE', [
                $template->engine, $this->engine
            ]);
        }
    }

    /**
     * Validate a template object sent by the client.
     *
     * @param object $template Template to check.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @param Object The validated object.
     */
    public function validateTemplate(
        object $template,
        bool $checkMandatory = true
    ): object {
        // check the basics and abort on error
        if ($template === null) {
            $this->api->sendError(400, $json . ' - syntax error', 'TEMPLATE_JSON_INVALID');
        }

        if ($checkMandatory) {
            $this->api->assertHasProperties('template', $template, [
                'engine',
                'type'
            ]);
            if ($template->type === 'grid-square') {
                $this->api->assertHasProperties('template', $template, [
                    'gridSize',
                    'gridWidth',
                    'gridHeight',
                    'colors'
                ]);
            } elseif ($template->type === 'grid-hex') {
                $this->api->assertHasProperties('template', $template, [
                    'gridSize',
                    'gridWidth',
                    'gridHeight',
                    'colors'
                ]);
            }
        }

        // check for more stuff
        $validated = new \stdClass();
        foreach ($template as $property => $value) {
            switch ($property) {
                case 'engine':
                    $validated->$property = $this->api->assertSemver('engine', $value);
                    break;
                case 'type':
                    $validated->$property = $this->api->assertEnum('type', $value, $this->types);
                    break;
                case 'version':
                    $validated->$property = $this->api->assertSemver('version', $value);
                    break;
                case 'gridSize':
                    $validated->$property = $this->api->assertInteger('gridSize', $value, 64, 64);
                    break;
                case 'gridWidth':
                    $validated->$property =
                        $this->api->assertInteger('gridWidth', $value, $this->minRoomGridSize, $this->maxRoomGridSize);
                    break;
                case 'gridHeight':
                    $validated->$property =
                        $this->api->assertInteger('gridHeight', $value, $this->minRoomGridSize, $this->maxRoomGridSize);
                    break;
                case 'snap':
                    $validated->$property = $this->api->assertBoolean('snap', $value);
                    break;
                case 'colors':
                    $validated->$property = $this->api->assertObjectArray('colors', $value, 1);
                    break;
                case 'borders':
                    $validated->$property = $this->api->assertObjectArray('borders', $value, 1);
                    break;
                default:
                    // drop extra fields
            }
        }

        return $validated;
    }

    /**
     * Cleanup colors.
     *
     * Can not assume a validated colors.
     *
     * @param string $json JSON string from the filesystem.
     * @return object Cleaned JSON, converted to an object.
     */
    public function cleanupColorJSON(
        string $json
    ): object {
        $color = json_decode($json);
        $color = is_object($color) ? $color : new \stdClass();
        return $this->cleanupColor($color);
    }

    /**
     * Cleanup colors.
     *
     * @param object $color Object to cleanup.
     * @return object New, cleaned object.
     */
    public function cleanupColor(
        object $color,
        bool $newId = false
    ): object {
        $out = new \stdClass();

        // add mandatory properties
        $out->name = 'NoName';
        $out->value = '#808080';

        // remove unnecessary properties
        foreach ($color as $property => $value) {
            switch ($property) {
                case 'name':
                    $out->$property =
                        $this->api->assertString('name', $value, '^[A-Za-z0-9 ]+$', false) ?: 'NoName';
                    break;
                case 'value':
                    $out->$property =
                        $this->api->assertString('value', $value, $this->REGEXP_COLOR, false) ?: '#808080';
                    break;
            }
        }

        return $out;
    }

    /**
     * Cleanup templates by adding mandatory default properties, removing optional
     * properties that contain default values and dropping unknown properties.
     *
     * Can not assume a validated template.
     *
     * @param string $json JSON string from the filesystem.
     * @return object Cleaned JSON, converted to an object.
     */
    public function cleanupTemplateJSON(
        string $json
    ): object {
        $template = json_decode($json);
        $template = is_object($template) ? $template : new \stdClass();
        return $this->cleanupTemplate($template);
    }

    /**
     * Cleanup templates by adding mandatory default properties, removing optional
     * properties that contain default values and dropping unknown properties.
     *
     * Can not assume a validated template.
     *
     * @param object $template Template to check.
     * @param Object The cleaned template object.
     */
    private function cleanupTemplate(
        object $template
    ): object {
        $out = new \stdClass();

        # set defaults
        $out->engine = $this->unpatchSemver($this->engine);
        $out->version = '1.0.0';
        $out->type = 'grid-square';
        $out->gridSize = 64;
        $out->gridWidth = 48;
        $out->gridHeight = 32;
        $out->colors = $this->getColors();
        $out->borders = $this->getColors();

        // check for more stuff
        foreach ($template as $property => $value) {
            switch ($property) {
                case 'engine':
                    // ignore - will be set to current engine
                    break;
                case 'type':
                    $out->$property =
                        $this->api->assertEnum('type', $value, $this->types, false) ?: 'grid-square';
                    break;
                case 'version':
                    $out->$property =
                        $this->api->assertSemver('version', $value, false) ?: '1.0.0';
                    break;
                case 'gridSize':
                    $out->$property =
                        $this->api->assertInteger('gridSize', $value, 64, 64, false) ?: '64';
                    break;
                case 'gridWidth':
                    $out->$property =
                        $this->api->assertInteger(
                            'gridWidth',
                            $value,
                            $this->minRoomGridSize,
                            $this->maxRoomGridSize,
                            false
                        ) ?: '48';
                    break;
                case 'gridHeight':
                    $out->$property =
                        $this->api->assertInteger(
                            'gridHeight',
                            $value,
                            $this->minRoomGridSize,
                            $this->maxRoomGridSize,
                            false
                        ) ?: '32';
                    break;
                case 'snap':
                    $out->$property =
                        $this->api->assertBoolean('snap', $value, false) ?: true;
                    break;
                case 'colors':
                    $out->$property =
                        $this->api->assertObjectArray('colors', $value, 1, 128, false) ?: $this->getColors();
                    for ($i = 0; $i < count($out->$property); $i++) {
                        $out->$property[$i] = $this->cleanupColor($out->$property[$i]);
                    }
                    break;
                case 'borders':
                    $out->$property =
                        $this->api->assertObjectArray('borders', $value, 1, 128, false) ?: $this->getColors();
                    for ($i = 0; $i < count($out->$property); $i++) {
                        $out->$property[$i] = $this->cleanupColor($out->$property[$i]);
                    }
                    break;
                default:
                    // drop extra fields
            }
        }

        return $out;
    }

    /**
     * Validate a template.json.
     *
     * Will populate missing and remove unknown properties. Will termiante
     * execution and send a 400 in case of too basic JSON errors.
     *
     * @param string $json JSON string.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @param Object The parsed & cleaned template object.
     */
    public function validateTemplateJSON(
        string $json,
        bool $checkMandatory = true
    ): object {
        $object = json_decode($json);
        $object = is_object($object) ? $object : new \stdClass();
        return $this->validateTemplate($object, $checkMandatory);
    }

    /**
     * Sanity check uploaded/patched tables.
     *
     * Will termiante execution and send a 400 in case of invalid array.
     *
     * @param string $tid Table ID for error messages.
     * @param array $table Table data (array of pieces).
     */
    private function validateTable(
        string $tid,
        array $table
    ) {
        $msg = 'validating table ' . $tid . '.json failed';
        $validated = [];

        // check the basics and abort on error
        if ($table === null) {
            $this->api->sendError(400, $msg . ' - syntax error', 'STATE_JSON_INVALID');
        }

        // check for more stuff
        $this->api->assertObjectArray($tid . '.json', $table, 0);
        foreach ($table as $piece) {
            $validated[] = $this->validatePiece($piece, true);
        }

        return $validated;
    }

    /**
     * Cleanup tables by cleaning up its pieces.
     *
     * @param string $json JSON string from the filesystem.
     * @return object Validated JSON, converted to an object.
     */
    public function cleanupTableJSON(
        string $json
    ): array {
        $table = json_decode($json);
        $table = is_array($table) ? $table : [];
        return $this->cleanupTable($table);
    }

    /**
     * Cleanup tables by cleaning up its pieces.
     *
     * @param string $json JSON string from the filesystem.
     * @param bool $newId Always assign a new ID.
     * @return object Validated JSON, converted to an object.
     */
    public function cleanupTable(
        array $table,
        bool $newId = false
    ): array {
        $clean = [];
        foreach ($table as $piece) {
            $clean[] = $this->cleanupPiece($piece, $newId);
        }
        return $clean;
    }

    /**
     * Cleanup pieces by adding mandatory default properties, removing optional
     * properties that contain default values and dropping unknown properties.
     *
     * Can not assume a validated piece.
     *
     * @param string $json JSON string from the filesystem.
     * @return object Validated JSON, converted to an object.
     */
    public function cleanupPieceJSON(
        string $json
    ): object {
        $piece = json_decode($json);
        $piece = is_object($piece) ? $piece : new \stdClass();
        return $this->cleanupPiece($piece);
    }

    /**
     * Cleanup pieces by adding mandatory default properties, removing optional
     * properties that contain default values and dropping unknown properties.
     *
     * Can not assume a validated piece.
     *
     * @param object $piece Full piece.
     * @param bool $newId Always assign a new ID.
     * @return object New, cleaned object.
     */
    public function cleanupPiece(
        object $piece,
        bool $newId = false
    ): object {
        $out = new \stdClass();

        // add mandatory properties
        $out->l = isset($piece->l) ? $piece->l : 1;
        $out->x = 0;
        $out->y = 0;
        $out->z = 0;
        if ($out->l !== 3) { // not a note
            $out->a = $this->ID_ASSET_NONE;
        }

        // remove unnecessary properties
        foreach ($piece as $property => $value) {
            switch ($property) {
                case 'id':
                    $out->$property =
                        $this->api->assertString('id', $value, $this->REGEXP_ID, false) ?: $this->generateId();
                    break;
                case 'a':
                    $out->$property =
                        $this->api->assertString('a', $value, $this->REGEXP_ID, false) ?: $this->ID_ASSET_NONE;
                    break;
                case 'l':
                    $out->$property =
                        $this->api->assertInteger('l', $value, 1, 5, false) ?: 1;
                    break;
                case 'x':
                case 'y':
                case 'z':
                    $out->$property =
                        $this->api->assertInteger('x', $value, -100000, 100000, false) ?: 0;
                    break;
                case 'expires':
                    $out->$property =
                        $this->api->assertInteger('expires', $value, 1500000000, 9999999999, false) ?: 0;
                    break;
                case 's':
                    if ($this->api->assertInteger('s', $value, 1, 128, false)) {
                        $out->$property = $value; // 0 = default = don't add
                    }
                    break;
                case 'n':
                    if ($this->api->assertInteger('n', $value, 1, 15, false)) {
                        $out->$property = $value; // 0 = default = don't add
                    }
                    break;
                case 'r':
                    if ($this->api->assertEnum('r', $value, [60, 90, 120, 180, 240, 270, 300], false)) {
                        $out->$property = $value; // 0 = default = don't add
                    }
                    break;
                case 'h':
                case 'w':
                    if (isset($piece->a) && $piece->a === $this->ID_ASSET_LOS) {
                        $out->$property =
                            $this->api->assertInteger('w/h', $value, -100000, 100000, false) ?: 0;
                    } else {
                        $out->$property =
                            $this->api->assertInteger('w/h', $value, 1, 32, false) ?: 1;
                    }
                    break;
                case 't':
                    if ($this->api->assertStringArray('t', $value, '^.*$', 0, 1, false)) {
                        $texts = $this->rtrimArray($value, '');
                        if (sizeof($texts) > 0) {
                            $out->$property = $texts;
                        }
                    }
                    break;
                case 'c':
                    if ($this->api->assertIntegerArray('c', $value, 0, 15, 1, 2, false)) {
                        $texts = $this->rtrimArray($value, 0);
                        if (sizeof($texts) > 0) {
                            $out->$property = $texts;
                        }
                    }
                    break;
                case 'b':
                    if ($this->api->assertStringArray('b', $value, $this->REGEXP_ID, 0, 128, false)) {
                        $badges = $this->rtrimArray($value, '');
                        if (sizeof($badges) > 0) {
                            $out->$property = $badges;
                        }
                    }
                    break;
                case 'f':
                    if ($this->api->assertInteger('f', $value, 0b00000001, 0b11111111, false)) {
                        $out->$property = $value;
                    }
                    break;
            }
        }

        # enforce ID
        if (!isset($out->id) || $newId) {
            $out->id = $this->generateId();
        }

        # width/height default behavior
        if (isset($out->w)) {
            if (isset($out->h) && $out->h === $out->w) {
                unset($out->h);
            }
            if ($out->w === 1) {
                unset($out->w);
            }
        } else {
            if (isset($out->h) && $out->h === 1) {
                unset($out->h);
            }
        }

        return $out;
    }

    /**
     * Sanity check uploaded/patched pieces.
     *
     * Will termiante execution and send a 400 in case of invalid object.
     *
     * @param object $piece Full or partial piece.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object New, validated object.
     */
    public function validatePiece(
        object $piece,
        bool $checkMandatory = true
    ): object {
        $validated = new \stdClass();
        foreach ($piece as $property => $value) {
            switch ($property) {
                case 'id':
                    $validated->id = $this->api->assertString('id', $value, $this->REGEXP_ID);
                    break;
                case 'l':
                    $validated->l = $this->api->assertInteger('l', $value, 1, 5);
                    break;
                case 'a':
                    $validated->a = $this->api->assertString('a', $value, $this->REGEXP_ID);
                    break;
                case 'w':
                    if (property_exists($piece, 'a') && $piece->a === $this->ID_ASSET_LOS) {
                        $validated->w = $this->api->assertInteger('w', $value, -100000, 100000);
                    } else {
                        $validated->w = $this->api->assertInteger('w', $value, 1, 32);
                    }
                    break;
                case 'h':
                    if (property_exists($piece, 'a') && $piece->a === $this->ID_ASSET_LOS) {
                        $validated->h = $this->api->assertInteger('h', $value, -100000, 100000);
                    } else {
                        $validated->h = $this->api->assertInteger('h', $value, 1, 32);
                    }
                    break;
                case 'x':
                    $validated->x = $this->api->assertInteger('x', $value, -100000, 100000);
                    break;
                case 'y':
                    $validated->y = $this->api->assertInteger('y', $value, -100000, 100000);
                    break;
                case 'z':
                    $validated->z = $this->api->assertInteger('z', $value, -100000, 100000);
                    break;
                case 's':
                    $validated->s = $this->api->assertInteger('s', $value, 0, 128);
                    break;
                case 'c':
                    if (property_exists($piece, 'l') && $piece->l === 3) { // 3 = note
                        $validated->c =
                            $this->api->assertIntegerArray('c', $value, 0, sizeof($this->stickyNotes) - 1, 0, 2);
                    } else {
                        $validated->c = $this->api->assertIntegerArray('c', $value, 0, 15, 0, 2);
                    }
                    break;
                case 'n':
                    $validated->n = $this->api->assertInteger('n', $value, 0, 15);
                    break;
                case 'r':
                    $validated->r = $this->api->assertEnum('r', $value, [0, 60, 90, 120, 180, 240, 270, 300]);
                    break;
                case 't':
                    if (property_exists($piece, 'l') && $piece->l === 3) { // 3 = note
                        $validated->t = $this->api->assertStringArray('t', $value, '^[^\n\r]{0,128}$', 0, 1);
                    } else {
                        $validated->t = $this->api->assertStringArray('t', $value, '^[^\n\r]{0,32}$', 0, 1);
                    }
                    break;
                case 'b':
                    $validated->b = $this->api->assertStringArray('b', $value, $this->REGEXP_ID, 0, 128);
                    break;
                case 'f':
                    $validated->f = $this->api->assertInteger('f', $value, 0b00000000, 0b11111111);
                    break;
                case 'expires':
                    // ignore as we do not honor externaly set expires
                default:
                    // ignore extra/unkown fields
            }
        }

        if ($checkMandatory) {
            $this->api->assertHasProperties('piece', $validated, ['l']);
            switch ($validated->l) {
                case 3: // 3 = note
                    $mandatory = ['l', 'x', 'y', 'z'];
                    break;
                default:
                    $mandatory = ['l', 'a', 'x', 'y', 'z'];
            }
            $this->api->assertHasProperties('piece', $validated, $mandatory);
        }

        return $validated;
    }

    /**
     * Validate a room.json.
     *
     * This is usually not the one on the server (which is generated by the API),
     * but a new-room JSON sent by the client.
     *
     * @param string $json JSON string.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @param Object The validated object.
     */
    public function validateRoomJSON(
        string $json,
        bool $checkMandatory = true
    ): object {
        $room = json_decode($json);
        $room = is_object($room) ? $room : new \stdClass();
        return $this->validateRoom($room, $checkMandatory);
    }

    /**
     * Parse incoming JSON for (new) rooms.
     *
     * @param string $json JSON string from the client.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object Validated JSON, convertet to an object.
     */
    private function validateRoom(
        object $incoming,
        bool $checkMandatory
    ): object {
        $validated = new \stdClass();

        if ($checkMandatory) {
            $this->api->assertHasProperties('room', $incoming, ['name']);
        }

        $validated->convert = false;

        foreach ($incoming as $property => $value) {
            switch ($property) {
                case 'id':
                case 'auth':
                    break; // known but ignored fields
                case '_files':
                    $validated->$property = $value;
                    break;
                case 'name':
                    $validated->$property = $this->api->assertString('name', $value, '[A-Za-z0-9]{8,48}');
                    break;
                case 'convert':
                    $validated->$property = $this->api->assertBoolean('convert', $value);
                    break;
                case 'template':
                    $validated->$property = $this->api->assertString('template', $value, '[A-Za-z0-9]{1,99}');
                    break;
                case 'password':
                    $validated->$property = $this->api->assertString('password', $value, '..*');
                    break;
                default:
                    // ignore extra fields
            }
        }

        return $validated;
    }

    /**
     * Parse incoming JSON for (new) assets.
     *
     * @param object $incoming Parsed asset from client.
     * @return object Validated JSON, convertet to an object.
     */
    private function validateAsset(
        object $incoming
    ): object {
        $validated = new \stdClass();

        $this->api->assertHasProperties(
            'asset',
            $incoming,
            ['name', 'format', 'type', 'w', 'h', 'base64', 'bg']
        );

        foreach ($incoming as $property => $value) {
            switch ($property) {
                case 'name':
                    $validated->name = $this->api->assertString(
                        'name',
                        $value,
                        '[A-Za-z0-9-]{1,64}(.[A-Za-z0-9-]{1,64})?'
                    );
                    break;
                case 'format':
                    $validated->format = $this->api->assertEnum('format', $value, ['jpg', 'png']);
                    break;
                case 'type':
                    $validated->type = $this->api->assertEnum('type', $value, $this->assetTypes);
                    break;
                case 'w':
                    $validated->w = $this->api->assertInteger('w', $value, 1, 32);
                    break;
                case 'h':
                    $validated->h = $this->api->assertInteger('h', $value, 1, 32);
                    break;
                case 'base64':
                    $validated->base64 = $this->api->assertBase64('base64', $value, $this->maxAssetSize);
                    break;
                case 'bg':
                    $validated->bg = $this->api->assertString(
                        'bg',
                        $value,
                        '#[a-fA-F0-9]{6}|transparent|piece'
                    );
                    break;
                default:
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' unkown');
            }
        }

        return $validated;
    }

    // --- meta / server endpoints ---------------------------------------------

    /**
     * Send server info JSON to client.
     *
     * Consists of some server.json values, as well as some calculated ones. Will
     * send JSON reply and terminate execution.
     */
    private function getServerInfo()
    {
        $server = $this->getServerConfig();

        // this is a good opportunity for housekeeping
        $this->deleteOldRooms(($server->ttl ?? 48) * 3600);

        // assemble JSON
        $info = new \stdClass();
        $info->version = $server->version;
        $info->engine = $server->engine;
        $info->ttl = $server->ttl;
        $info->snapshotUploads = $server->snapshotUploads;
        $info->freeRooms = $this->getFreeRooms($server);
        $info->root = $this->api->getAPIPath();

        $info->backgrounds = $this->getBackgrounds();

        if ($server->passwordCreate ?? '' !== '') {
            $info->createPassword = true;
        }
        $this->api->sendReply(200, json_encode($info));
    }

    /**
     * Self-detect configuration issues.
     *
     * Usually called on faulty installations to find out what is missing.
     */
    private function getIssues()
    {
        $issues = new \stdClass();

        $version = explode('.', phpversion());
        $issues->v = $version;
        if ($version[0] >= 8 || ($version[0] === '7' && $version[1] >= 3)) {
            $issues->phpOk = true;
        } else {
            $issues->phpOk = false;
        }

        $issues->moduleZip = class_exists('\ZipArchive');

        $this->api->sendReply(200, json_encode($issues));
    }

    /**
     * Sent list of available templates to client.
     *
     * Done by counting the .zip files in the templates folder. Will send JSON
     * reply and terminate execution.
     */
    private function getTemplates()
    {
        $templates = [];
        foreach (glob($this->api->getDataDir('templates/*zip')) as $filename) {
            $zip = pathinfo($filename);
            if ($zip['filename'] != '_') { // don't add system template
                $templates[] = $zip['filename'];
            }
        }
        $this->api->sendReply(200, json_encode($templates));
    }

    /**
     * Create a background object for rooms.
     *
     * @param string $name Name for UI.
     * @param string $image Path to image file, e.g. 'img/desktop-stone.jpg'.
     * @param string $colorAvg Hex fallback color, e.g. '#808080'.
     * @param string $colorScroll Hex color for scrollbar, e.g. '#606060'.
     * @param string $gridColor Checker overlay to use ('white' or 'black').
     * @return stdClass Populated background object.
     */
    private function getBackground(
        string $name,
        string $image,
        string $colorAvg,
        string $colorScroll
    ) {
        $background = new \stdClass();
        $background->name = $name;
        $background->image = $image;
        $background->color = $colorAvg;
        $background->scroller = $colorScroll;
        return $background;
    }

    // --- room handling endpoints ---------------------------------------------

    /**
     * Authenticate / login to a room.
     *
     * Grants access if the room is not protected or the caller knows either the
     * current token or the room password.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param object $payload Parsed auth data from client.
     */
    public function auth(
        string $roomName,
        object $payload
    ) {
        $folder = $this->getRoomFolder($roomName);
        if (is_dir($folder)) {
            $meta = $this->api->jsonGetLocked($folder . 'meta.json', "$folder.flock");
            $token = $this->get($meta, 'token');
            if (
                $token === $this->ID_ACCESS_ANY ||
                $token === $this->get($payload, 'token') ||
                password_verify($this->get($payload, 'password') ?? '', $this->get($meta, 'password') ?? '')
            ) {
                $this->api->sendReply(200, json_encode((object) ['token' => $token]));
            }
            $this->api->sendError(403, "forbidden $roomName");
        }
        $this->api->sendError(404, "not found: $roomName");
    }

    /**
     * Change authentication information. Usually the password.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param object $payload Parsed auth data from client.
     */
    public function updateAuthLocked(
        object $meta,
        object $payload
    ) {
        // currently only password changes are possible
        if (property_exists($payload, 'password')) {
            $meta2 = $this->writeMetaFile($meta->name, $payload->password, $meta->lock);
            $this->api->sendReply(200, json_encode((object) ['token' => $meta2->token]));
        }

        $this->api->sendReply(400, 'invalid request');
    }

    /**
     * Create or update the meta.json.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $password New password, or null/'' to remove current password.
     * @param string $lockfile Optional lock file.
     */
    private function writeMetaFile(
        string $roomName,
        $password,
        $writeLockFile
    ) {
        if ($writeLockFile) {
            $lock = $this->api->waitForWriteLock($writeLockFile);
        }

        $folder = $this->getRoomFolder($roomName);
        $meta = json_decode(
            is_file($folder . 'meta.json')
            ? file_get_contents($folder . 'meta.json')
            : '{}'
        );
        $meta->token = $this->get($meta, 'token') ?? $this->ID_ACCESS_ANY;

        if (!$password || $password === '') { // remove password
            $meta = (object)[
                'token' => $this->ID_ACCESS_ANY,
            ];
        } else { // add/re-set password, keep token if it not the generic one
            $meta->password = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
            if ($meta->token === $this->ID_ACCESS_ANY) {
                $meta->token = $this->api->uuid();
            }
        }

        file_put_contents($folder . 'meta.json', json_encode($meta));

        if ($writeLockFile) {
            $this->api->unlockLock($lock);
        }

        return $meta;
    }

    /**
     * Setup a new room.
     *
     * If there is a free room available, this will create a new room folder and
     * initialize it properly. Will terminate with 201 or an error.
     *
     * @param object $payload Parsed room from client.
     */
    public function createRoomLocked(
        object $payload
    ) {
        // check the password (if required)
        $server = $this->getServerConfig();
        if ($server->passwordCreate ?? '' !== '') {
            if (!password_verify($payload->auth ?? '', $server->passwordCreate)) {
                $this->api->sendError(401, 'valid password required');
            }
        }

        $this->assertFilePermissions();

        // check if we have free rooms left
        if ($this->getFreeRooms($server) <= 0) {
            $this->api->sendError(503, 'no free rooms available');
        }

        // sanitize item by recreating it
        $validated = $this->validateRoom($payload, true);

        $folder = $this->getRoomFolder($validated->name);
        if (is_dir($folder)) {
            $this->api->sendError(409, 'room already exists');
        } else {
            // we need either a template name or an uploaded snapshot
            if (
                isset($validated->template) && isset($validated->_files)
                || (!isset($validated->template) && !isset($validated->_files))
            ) {
                $this->api->sendError(400, 'you need to either specify a template or upload a snapshot');
            }

            // check if upload (if any) was ok
            if (isset($validated->_files)) {
                if (!$server->snapshotUploads) {
                    $this->api->sendError(400, 'snapshot upload is not enabled on this server');
                }
                if ($_FILES[$validated->_files[0]]['error'] > 0) {
                    $error = JSONRestAPI::UPLOAD_ERR[$_FILES[$validated->_files[0]]['error']];
                    switch ($error) {
                        case 'UPLOAD_ERR_INI_SIZE':
                            $this->api->sendErrorPHPUploadSize();
                            break;
                        default:
                            $this->api->sendError(400, 'PHP upload failed', $error);
                    }
                }
                $zipPath = $_FILES[$validated->_files[0]]['tmp_name'] ?? 'invalid';
            } else {
                $zipPath = $this->api->getDataDir("templates/$validated->template.zip");
            }

            // doublecheck template / snapshot
            if (!is_file($zipPath)) {
                $this->api->sendError(400, 'template not available');
            }
            $validEntries = $this->validateSnapshot($zipPath, $validated->convert);

            if (!mkdir($folder, 0777, true)) { // create room folder
                $this->api->sendError(500, 'can\'t write on server');
            }

            $lock = $this->api->waitForWriteLock($folder . '.flock');
            if (property_exists($validated, 'password')) {
                $this->writeMetaFile($validated->name, $validated->password, null);
            }

            $this->installSnapshot($validated->name, $zipPath, $validEntries);
            $room = $this->cleanupRoom($validated->name);
            $this->api->unlockLock($lock);

            $this->api->sendReply(201, json_encode($room), '/api/rooms/' . $validated->name);
        }
    }

    /**
     * Check an existing (or just created) room folder and fix it where necessary.
     *
     * Useful after installing new snapshots or when loading older rooms. Assumes
     * the caller has locked the directory.
     *
     * @param string $name Name of room.
     * @return object Room data.
     */
    public function cleanupRoom(
        string $name
    ) {
        $folder = $this->getRoomFolder($name);
        if (!is_dir($folder)) {
            $this->api->sendError(500, 'cant cleanup room');
        }

        // cleanup or create [1-9].json
        for ($i = 1; $i <= 9; $i++) {
            if (is_file("$folder/tables/$i.json")) {
                $table = $this->cleanupTableJSON(file_get_contents("$folder/tables/$i.json"));
                file_put_contents("$folder/tables/$i.json", json_encode($table));
            }
        }

        // cleanup or create template.json
        $template = is_file($folder . 'template.json')
            ? file_get_contents($folder . 'template.json')
            : '{}';
        $template = $this->cleanupTemplateJSON($template);
        file_put_contents($folder . 'template.json', json_encode($template));

        // enforce mandatory files
        if (!is_file($folder . 'tables/1.json')) {
            file_put_contents($folder . 'tables/1.json', '[]');
        }
        if (!is_file($folder . 'LICENSE.md')) {
            file_put_contents($folder . 'LICENSE.md', 'This template does not provide license information.');
        }
        if (!is_file($folder . 'meta.json')) {
            file_put_contents($folder . 'meta.json', json_encode((object) [
                'token' => $this->ID_ACCESS_ANY,
            ]));
        }

        // (re)create room.json
        $room = (object) [
            'id' => $this->generateId(),
            'name' => $name,
            'engine' => $this->engine,
            'template' => $template,
            'library' => $this->generateLibraryJSON($name),
            'credits' => file_get_contents($folder . 'LICENSE.md'),
            'width' => $template->gridWidth * $template->gridSize,
            'height' => $template->gridHeight * $template->gridSize,
        ];
        file_put_contents($folder . 'room.json', json_encode($room));

        $this->regenerateDigests($folder);

        return $room;
    }

    /**
     * Populate digest.json with up-to-date crc32 hashes.
     *
     * Assumes the caller has locked the directory.
     *
     * @param string $folder Room folder to work in.
     */
    public function regenerateDigests(
        string $folder
    ) {
        $digests = new \stdClass();
        foreach (
            [
                'template.json',
                'room.json',
            ] as $filename
        ) {
            if (is_file($folder . $filename)) {
                $state = file_get_contents($folder . $filename);
            } else {
                $state = '{}';
            }
            $digests->$filename = 'crc32:' . crc32($state);
        }
        foreach (
            [
                'tables/1.json',
                'tables/2.json',
                'tables/3.json',
                'tables/4.json',
                'tables/5.json',
                'tables/6.json',
                'tables/7.json',
                'tables/8.json',
                'tables/9.json',
            ] as $filename
        ) {
            if (is_file($folder . $filename)) {
                $state = file_get_contents($folder . $filename);
            } else {
                $state = '[]';
            }
            $digests->$filename = 'crc32:' . crc32($state);
        }
        file_put_contents($folder . 'digest.json', json_encode($digests));
    }

    /**
     * Change room template values.
     *
     * Will terminate with 200 or an error.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param object $patch Parcial parsed template from client.
     */
    public function updateRoomTemplateLocked(
        object $meta,
        object $patch
    ) {
        $validated = $this->validateTemplate($patch, false);

        // only a few fields may be updated
        $template = new \stdClass();
        foreach ($validated as $property => $value) {
            switch ($property) {
                case 'gridWidth':
                case 'gridHeight':
                    $template->$property = $value;
                    break;
                default:
                    // other attributes are silently ignored
            }
        }

        $lock = $this->api->waitForWriteLock($meta->lock);

        // update template.json
        $templateFS = json_decode(file_get_contents($meta->folder . 'template.json'));
        if (isset($template->gridWidth)) {
            $templateFS->gridWidth = $template->gridWidth;
        }
        if (isset($template->gridHeight)) {
            $templateFS->gridHeight = $template->gridHeight;
        }
        $this->writeAsJSONAndDigest($meta->folder, 'template.json', $templateFS);

        // update room.json
        $roomFS = json_decode(file_get_contents($meta->folder . 'room.json'));
        $roomFS->template = $templateFS;
        $roomFS->width = $templateFS->gridWidth * $templateFS->gridSize;
        $roomFS->height = $templateFS->gridHeight * $templateFS->gridSize;
        $this->writeAsJSONAndDigest($meta->folder, 'room.json', $roomFS);

        $this->api->unlockLock($lock);
        $this->api->sendReply(200, json_encode($templateFS));
    }

    /**
     * Get room data.
     *
     * Will return the room.json from a room's folder. Will also check if room
     * is deprecated and/or can be upgraded on the fly.
     *
     * @param object $meta Room's parsed `meta.json`.
     */
    public function getRoom(
        object $meta
    ) {
        $roomJson = $this->api->fileGetLocked($meta->folder . 'room.json', $meta->lock);
        $room = json_decode($roomJson);
        if (!isset($room->engine) || $room->engine !== $this->engine) {
            // room is from an older FBG version
            if ($this->api->semverSatisfies($this->engine, '^' . $room->template->engine, true)) {
                // room can be converted
                $this->cleanupRoom($meta->name);
                $roomJson = $this->api->fileGetLocked($meta->folder . 'room.json', $meta->lock);
            } else {
                // room can't be converted
                $this->api->sendError(400, 'template.json: engine mismatch', 'INVALID_ENGINE', [
                    $room->template->engine, $this->engine
                ]);
            }
        }
        $this->api->sendReply(200, $roomJson, null, 'crc32:' . crc32($roomJson));
    }

    /**
     * Get room digest / changelog.
     *
     * Will return the digest.json from a room's folder.
     *
     * @param object $meta Room's parsed `meta.json`.
     */
    public function getRoomDigest(
        object $meta
    ) {
        $this->api->sendReply(200, $this->api->fileGetLocked($meta->folder . 'digest.json', $meta->lock));
    }

    /**
     * Delete a whole room.
     *
     * @param object $meta Room's parsed `meta.json`.
     */
    public function deleteRoom(
        object $meta
    ) {
        $this->api->deleteDir($meta->folder);
        $this->api->sendReply(204, '');
    }

    /**
     * Validate a table ID.
     *
     * Will stop execution with a 400 error if the value is not an int 0-9.
     *
     * @param mixed $value Hopefully a table ID, e.g. 2.
     */
    public function assertTableNo(
        $value
    ) {
        $value = intval($value);
        if ($value < 0 || $value > 9) {
            $this->api->sendError(400, 'invalid table: ' . $value);
        }
    }

    /**
     * Make sure FreeBeeGee can access all essential directories and files.
     *
     * @param string $roomName Optional room name, e.g. 'darkEscapingQuelea'.
     */
    public function assertFilePermissions(
        $roomName = null
    ) {
        $roomsDir = $this->api->getDataDir('/rooms/');
        $this->assertWritable('');
        if (is_dir($roomsDir)) {
            $this->assertWritable('rooms/');
        }
        if ($roomName) {
            $this->assertWritable('rooms/' . $roomName . '/');
            $this->assertWritable('rooms/' . $roomName . '/tables/');
            $this->assertWritable('rooms/' . $roomName . '/assets/other/');
            $this->assertWritable('rooms/' . $roomName . '/assets/overlay/');
            $this->assertWritable('rooms/' . $roomName . '/assets/tile/');
            $this->assertWritable('rooms/' . $roomName . '/assets/token/');
            $this->assertWritable('rooms/' . $roomName . '/assets/badge/');
        }
    }

    /**
     * Make sure a api/data/ file/dir is writable.
     *
     * @param string $dataDir Directory within 'api/data/' to check. '' for root.
     */
    public function assertWritable(
        $dataDir
    ) {
        $data = $this->api->getDataDir($dataDir);
        if (is_dir($data) && !is_writable($data)) {
            $this->api->sendError(400, 'api/data' . $dataDir, 'FILE_PERMISSIONS');
        }
    }

    /**
     * Get the content of a table.
     *
     * Returns the [0-9].json containing all pieces on the table.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param int $tid Table id / number, e.g. 2.
     */
    public function getTable(
        object $meta,
        string $tid
    ) {
        $this->assertTableNo($tid);
        $file = $meta->folder . 'tables/' . $tid . '.json';
        $body = is_file($file) ? $this->api->fileGetLocked($file, $meta->lock) : '[]';
        $this->api->sendReply(200, $body, null, 'crc32:' . crc32($body));
    }

    /**
     * Replace the internal state of a table with a new one.
     *
     * Can be used to reset a table or to revert to a save.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param int $tid Table id / number, e.g. 2.
     * @param array $table Parsed new table (array of pieces) from client.
     */
    public function putTableLocked(
        object $meta,
        string $tid,
        array $table
    ) {
        $this->assertTableNo($tid);
        $newTable = $this->validateTable($tid, $table);
        $newTable = $this->cleanupTable($newTable, true);

        $lock = $this->api->waitForWriteLock($meta->lock);
        $this->writeAsJSONAndDigest($meta->folder, 'tables/' . $tid . '.json', $newTable);
        $this->api->unlockLock($lock);

        $this->api->sendReply(200, json_encode($newTable));
    }

    /**
     * Add a new piece to a table.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param string $tid Table id / number, e.g. 2.
     * @param object $data Full parsed piece from client.
     */
    public function createPiece(
        object $meta,
        string $tid,
        object $data
    ) {
        $this->assertTableNo($tid);
        $piece = $this->validatePiece($data, true);
        if (isset($piece->a)) {
            switch ($piece->a) {
                case $this->ID_ASSET_POINTER:
                case $this->ID_ASSET_LOS:
                    $piece->id = $piece->a;
                    $piece->expires = time() + 8;
                    break;
                default:
                    $piece->id = $this->generateId();
            }
        } else {
            $piece->id = $this->generateId();
        }
        $created = $this->updatePieceTableLocked($meta, $tid, $piece, true, false);
        $this->api->sendReply(201, json_encode($created));
    }

    /**
     * Get an individual piece.
     *
     * Not very performant, but also not needed very often ;)
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $pieceId Id of piece.
     */
    public function getPiece(
        object $meta,
        string $tid,
        string $pieceId
    ) {
        $this->assertTableNo($tid);
        $file = $meta->folder . 'tables/' . $tid . '.json';
        $body = is_file($file) ? $this->api->fileGetLocked($file, $meta->lock) : '[]';
        $table = json_decode($body);
        foreach ($table as $piece) {
            if ($piece->id === $pieceId) {
                $this->api->sendReply(200, json_encode($piece));
            }
        }
        $this->api->sendError(404, "not found: piece $pieceId in room $meta->name on table $tid");
    }

    /**
     * Replace a piece.
     *
     * Will discard all old piece data except the ID.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $pieceID ID of the piece to update.
     * @param string $data Parsed piece from the client.
     */
    public function replacePiece(
        object $meta,
        string $tid,
        string $pieceId,
        object $data
    ) {
        $this->assertTableNo($tid);
        $patch = $this->validatePiece($data, false);
        $patch->id = $pieceId; // overwrite with data from URL
        $updatedPiece = $this->updatePieceTableLocked($meta, $tid, $patch, false, false);
        $this->api->sendReply(200, json_encode($updatedPiece));
    }

    /**
     * (Partially) Update a piece.
     *
     * Can overwrite the whole piece or only patch a few fields.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $pieceID ID of the piece to update.
     * @param object $piece Full or parcial parsed piece from client.
     */
    public function updatePiece(
        object $meta,
        string $tid,
        string $pieceId,
        object $piece
    ) {
        $this->assertTableNo($tid);
        $patch = $this->validatePiece($piece, false);
        $patch->id = $pieceId; // overwrite with data from URL
        $updatedPiece = $this->updatePieceTableLocked($meta, $tid, $patch, false, true);
        $this->api->sendReply(200, json_encode($updatedPiece));
    }

    /**
     * Update multiple pieces.
     *
     * Can overwrite a whole piece or only patch a few fields.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param string $tid Table id / number, e.g. 2.
     * @param array $patches Array of full or parcial parsed pieces from client.
     */
    public function updatePieces(
        object $meta,
        string $tid,
        array $patches
    ) {
        $this->assertTableNo($tid);

        // check if we got JSON array of valid piece-patches and IDs
        foreach ($patches as $patch) {
            $piece = $this->validatePiece($patch, false);
            $this->api->assertHasProperties('piece', $patch, ['id']);
        }

        // looks good. do the update(s).
        $updatedPieces = [];
        foreach ($patches as $patch) {
            $updatedPieces[] = $this->updatePieceTableLocked($meta, $tid, $patch, false, true);
        }

        $this->api->sendReply(200, json_encode($updatedPieces));
    }

    /**
     * Delete a piece from a room.
     *
     * Will not remove it from the library.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $pieceID ID of the piece to delete.
     * @param bool $sendReply If true, send a HTTP reply after deletion.
     */
    public function deletePiece(
        object $meta,
        string $tid,
        string $pieceId,
        bool $sendReply
    ) {
        $this->assertTableNo($tid);

        // create a dummy 'delete' object to represent deletion
        $piece = new \stdClass(); // sanitize item by recreating it
        $piece->l = PHP_INT_MIN;
        $piece->id = $pieceId;

        $this->updatePieceTableLocked($meta, $tid, $piece, false, false);
        if ($sendReply) {
            $this->api->sendReply(204, '');
        }
    }

    /**
     * Add a new asset to the library of a room.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param object $data Full paresed asset data from client.
     */
    public function createAssetLocked(
        object $meta,
        object $data
    ) {
        $asset = $this->validateAsset($data);

        // check remaining size
        $folderSize = $this->api->getDirectorySize($meta->folder);
        $maxSize = $this->getServerConfig()->maxRoomSizeMB  * 1024 * 1024;
        $blob = base64_decode($asset->base64);
        if ($folderSize + strlen($blob) > $maxSize) {
            $this->api->sendError(400, 'asset too big', 'ROOM_SIZE', [$maxSize - $folderSize]);
        }

        // determine asset path elements
        $filename = $asset->name . '.' . $asset->w . 'x' . $asset->h . 'x1.' .
            str_replace('#', '', $asset->bg) . '.' . $asset->format;

        // output file data
        $lock = $this->api->waitForWriteLock($meta->lock);
        file_put_contents($meta->folder . 'assets/' . $asset->type . '/' . $filename, $blob);

        // regenerate library JSON
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $room->library = $this->generateLibraryJSON($meta->name);
        $this->writeAsJSONAndDigest($meta->folder, 'room.json', $room);

        // return asset (without large blob)
        $this->api->unlockLock($lock);
        unset($asset->base64);
        $this->api->sendReply(201, json_encode($asset));
    }

    /**
     * Download a room's snapshot.
     *
     * Will zip the room folder and provide that zip.
     *
     * @param object $meta Room's parsed `meta.json`.
     * @param int $timeZone Timezone offset of the client in minutes to UTC,
     *                         as reported by the client.
     */
    public function getSnapshot(
        object $meta,
        int $timeZoneOffset
    ) {
        // get all files to zip and sort them
        $toZip = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($meta->folder),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );
        foreach ($iterator as $filename => $file) {
            if (!$file->isDir()) {
                $absolutePath = $file->getRealPath();
                $relativePath = substr($absolutePath, strlen($meta->folder));
                switch ($relativePath) { // filter those files away
                    case '.flock':
                    case 'snapshot.zip':
                    case 'room.json':
                    case 'meta.json':
                    case 'digest.json':
                        break; // they don't go into the zip
                    default:
                        $toZip[$relativePath] = $absolutePath; // keep all others
                }
            }
        }
        ksort($toZip);

        // now zip them
        $zipName = $meta->folder . 'snapshot.zip';
        $zip = new \ZipArchive();
        $zip->open($zipName, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        foreach ($toZip as $relative => $absolute) {
            $zip->addFile($absolute, $relative);
        }
        $zip->close();

        // create timestamp for zip file
        $time = new \DateTime();
        if ($timeZoneOffset > 0) {
            $time->add(new \DateInterval('PT' . $timeZoneOffset . 'M'));
        } elseif ($timeZoneOffset < 0) {
            $time->sub(new \DateInterval('PT' . ($timeZoneOffset * -1) . 'M'));
        }

        // send and delete temporary file
        header('Content-disposition: attachment; filename=' .
            $meta->name . '.' . $time->format('Y-m-d-Hi') . '.zip');
        header('Content-type: application/zip');
        readfile($zipName);
        unlink($zipName);
        die();
    }

    /**
     * Set an proper exiration date for pieces that expire.
     *
     * @param object $piece Piece to check.
     * @return object Modified piece.
     */
    private function setExpiration(
        object $piece
    ): object {
        if (isset($piece->a)) {
            switch ($piece->a) {
                case $this->ID_ASSET_POINTER:
                case $this->ID_ASSET_LOS:
                    $piece->expires = time() + 8;
                    break;
                default:
                    // nothing
            }
        }
        return $piece;
    }

    /**
     * Generate an ID.
     *
     * Central function so we can change the type of ID easily later on.
     *
     * @return {String} A random ID.
     */
    private function generateId(
        int $seed = null
    ) {
        return JSONRestAPI::id64($seed);
    }

    // --- statics -------------------------------------------------------------

    /**
     * Get a possibly undefined property of an object.
     *
     * To avoid a PHP8 warning.
     *
     * @param stdClass $obj Object.
     * @param string $property Name of property.
     * @return mixed Property value or null if property does not exist.
     */
    public static function get(
        \stdClass $obj,
        string $property
    ) {
        if (property_exists($obj, $property)) {
            return $obj->$property;
        }
        return null;
    }

    /**
     * Set a semvers 3rd number (patch) to 0.
     *
     * @param string $semver Semver to change.
     * @return string Semver with patch set to 0.
     */
    public static function unpatchSemver(
        string $semver
    ): string {
        return preg_replace('/([0-9][0-9]*)\.([0-9][0-9]*)\.([0-9][0-9]*)/', '$1.$2.0', $semver, 1);
    }

    /**
     * Convert an asset's filename into JSON metadata.
     *
     * Will parse files named .myName.1x2x3.ff0000.jpg and split those
     * properties into JSON metadata.
     *
     * @param string $filename Filename to parse
     * @return object Asset object (for JSON conversion).
     */
    public static function fileToAsset(
        $filename
    ) {
        $asset = new \stdClass();
        $asset->media = [$filename];
        if (
            // group.name.1x2x3.808080.png
            preg_match(
                '/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)(\.[^\.-]+)?(-[^\.-]+)?\.[a-zA-Z0-9]+$/',
                $filename,
                $matches
            )
        ) {
            $asset->name = $matches[1];
            $asset->w = (int)$matches[2];
            $asset->h = (int)$matches[3];
            $asset->s = $matches[4];
            $asset->bg = '#808080';

            if (sizeof($matches) >= 6) {
                switch ($matches[5]) {
                    case '.transparent':
                        $asset->bg = substr($matches[5], 1);
                        break;
                    default:
                        if (preg_match('/^\.[a-fA-F0-9]{6}$/', $matches[5])) {
                            $asset->bg = '#' . substr($matches[5], 1);
                        } elseif (preg_match('/^\.[0-9][0-9]?$/', $matches[5])) {
                            $asset->bg = substr($matches[5], 1);
                        }
                }
            }

            if (sizeof($matches) >= 7) {
                switch ($matches[6]) {
                    case '-paper':
                    case '-wood':
                        $asset->tx = substr($matches[6], 1);
                        break;
                    default:
                        // none
                }
            }
        } elseif (
            // group.name.png
            preg_match('/^(.*)\.[a-zA-Z0-9]+$/', $filename, $matches)
        ) {
            $asset->name = $matches[1];
            $asset->w = 1;
            $asset->h = 1;
            $asset->s = 1;
            $asset->bg = '#808080';
        }
        return $asset;
    }

    /**
     * Get a ZIP's extracted size.
     *
     * Counts all included files.
     *
     * @param string $zipPath Path to ZIP.
     * @return int Total size in byte.
     */
    public function getZipSize(
        string $zipPath
    ): int {
        $zipSize = 0;
        if (is_file($zipPath)) {
            $zip = new \ZipArchive();
            if (!$zip->open($zipPath)) {
                $this->api->sendError(400, 'can\'t open zip', 'ZIP_INVALID');
            }
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $zipSize += $zip->statIndex($i)['size'];
            }
        }
        return $zipSize;
    }

    /**
     * Merge two data objects.
     *
     * The second object's properties take precedence.
     *
     * @param object $original The first/source object.
     * @param object $updates An object containing new/updated properties.
     * @return object An object with $original's properties overwritten by $updates's.
     */
    public static function merge(
        object $original,
        object $updates
    ): object {
        return (object) array_merge((array) $original, (array) $updates);
    }

    /**
     * Populate missing object's field with a default value.
     *
     * Will only add missing properties, not empty/null propertes.
     *
     * @param object $o The object.
     * @param string $p The property.
     * @param mixed $v The value.
     */
    public static function setIfMissing(
        object $object,
        string $property,
        $value
    ) {
        if (!isset($object->$property)) {
            $object->$property = $value;
        }
    }

    /**
     * Trim an array right-to-left.
     *
     * If working on a string array, it will also trim() all enties.
     *
     * @param array $array The array to trim, e.g. [1, 2, 0, 3, 0, 0].
     * @param mixed $trim Value to trim, e.g. 0
     * @return array Right-trimmed array, e.g. [1, 2, 0, 3].
     */
    public static function rtrimArray(
        array $array,
        $trim
    ): array {
        $trimmed = [];
        $trimming = true;
        for ($i = sizeof($array) - 1; $i >= 0; $i--) {
            $item = is_string($trim) ? trim($array[$i]) : $array[$i];
            if (!$trimming) {
                array_unshift($trimmed, $item);
            } elseif ($item !== $trim) {
                array_unshift($trimmed, $item);
                $trimming = false;
            }
        }
        return $trimmed;
    }
}
