<?php

/**
 * Copyright 2021 Markus Leupold-Löwenthal
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
    private $ID_POINTER = 'ffffffffffffffff';
    private $version = '$VERSION$';
    private $engine = '$ENGINE$';
    private $api = null; // JSONRestAPI instance
    private $minRoomGridSize = 16;
    private $maxRoomGridSize = 256;
    private $maxAssetSize = 1024 * 1024;
    private $layers = ['overlay', 'tile', 'token', 'other', 'note'];
    private $assetTypes = ['overlay', 'tile', 'token', 'other', 'tag'];
    private $stickyNotes = ['yellow', 'orange', 'green', 'blue', 'pink'];

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
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->getRoomDigest($data['rid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('GET', '/rooms/:rid/?', function ($fbg, $data) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->getRoom($data['rid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('GET', '/rooms/:rid/tables/:tid/?', function ($fbg, $data) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->getTable($data['rid'], $data['tid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('GET', '/', function ($fbg, $data) {
            $fbg->getServerInfo();
        });

        $this->api->register('GET', '/templates/?', function ($fbg, $data) {
            $fbg->getTemplates();
        });

        $this->api->register('GET', '/rooms/:rid/snapshot/?', function ($fbg, $data) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->getSnapshot($data['rid'], intval($_GET['tzo']));
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('GET', '/rooms/:rid/tables/:tid/pieces/:pid/?', function ($fbg, $data) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->getPiece($data['rid'], $data['tid'], $data['pid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('GET', '/issues/', function ($fbg, $data) {
            $fbg->getIssues();
        });

        // --- POST ---

        $this->api->register('POST', '/rooms/:rid/tables/:tid/pieces/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->createPiece($data['rid'], $data['tid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('POST', '/rooms/:rid/assets/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->createAssetLocked($data['rid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('POST', '/rooms/', function ($fbg, $data, $payload) {
            $formData = $this->api->multipartToJson();
            if ($formData) { // client sent us multipart
                $fbg->createRoomLocked($formData);
            } else { // client sent us regular json
                $fbg->createRoomLocked($payload);
            }
        });

        // --- PUT ---

        $this->api->register('PUT', '/rooms/:rid/tables/:tid/pieces/:pid/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->updatePiece($data['rid'], $data['tid'], $data['pid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('PUT', '/rooms/:rid/tables/:tid/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->putTableLocked($data['rid'], $data['tid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        // --- PATCH ---

        $this->api->register('PATCH', '/rooms/:rid/tables/:tid/pieces/:pid/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->updatePiece($data['rid'], $data['tid'], $data['pid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('PATCH', '/rooms/:rid/tables/:tid/pieces/', function ($fbg, $data, $payload) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->updatePieces($data['rid'], $data['tid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('PATCH', '/rooms/:rid/template/', function ($fbg, $data, $payload) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->updateRoomTemplateLocked($data['rid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        // --- DELETE ---

        $this->api->register('DELETE', '/rooms/:rid/tables/:tid/pieces/:pid/?', function ($fbg, $data) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->deletePiece($data['rid'], $data['tid'], $data['pid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });

        $this->api->register('DELETE', '/rooms/:rid/?', function ($fbg, $data) {
            if (is_dir($this->getRoomFolder($data['rid']))) {
                $fbg->deleteRoom($data['rid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['rid']);
        });
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
        return $this->api->getDataDir() . 'rooms/' . $roomName . '/';
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
        $config = json_decode(file_get_contents($this->api->getDataDir() . 'server.json'));
        $config->version = '$VERSION$';
        $config->engine = '$ENGINE$';
        $config->maxAssetSize = $this->maxAssetSize;
        return $config;
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
        $dir = $this->api->getDataDir() . 'rooms/';
        $count = 0;
        if (is_dir($dir)) {
            $count = sizeof(scandir($this->api->getDataDir() . 'rooms/')) - 2; // do not count . and ..
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
    private function deleteOldRooms($maxAgeSec)
    {
        $dir = $this->api->getDataDir() . 'rooms/';
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
     * Merge two data objects.
     *
     * The second object's properties take precedence.
     *
     * @param object $original The first/source object.
     * @param object $updates An object containing new/updated properties.
     * @return object An object with $original's properties overwritten by $updates's.
     */
    private function merge(
        object $original,
        object $updates
    ): object {
        return (object) array_merge((array) $original, (array) $updates);
    }

    /**
     * Validate a template / snapshot.
     *
     * Does a few sanity checks to see if everything is there we need. Will
     * termiante execution and send a 400 in case of invalid zips.
     *
     * @param string $zipPath Full path to the zip to check.
     * @param array Array of strings / paths of all valid zip entries to extract.
     */
    private function validateSnapshot(
        string $zipPath
    ): array {
        $issues = [];
        $valid = [];
        $sizeLeft = $this->getServerConfig()->maxRoomSizeMB  * 1024 * 1024;

        // basic sanity tests
        if (filesize($zipPath) > $sizeLeft) {
            // if the zip itself is too large, then it's content is probably too
            $this->api->sendError(400, 'zip too large', 'SIZE_EXCEEDED', $issues);
        }

        // iterate over zip entries
        $zip = new \ZipArchive();
        if (!$zip->open($zipPath)) {
            $this->api->sendError(400, 'can\'t open zip', 'ZIP_INVALID', $issues);
        }
        for ($i = 0; $i < $zip->numFiles; $i++) {
            // note: the checks below will just 'continue' for invalid/ignored items
            $entry = $zip->statIndex($i);

            switch ($entry['name']) { // filename checks
                case 'LICENSE.md':
                    break; // known, unchecked file
                case 'template.json':
                    $this->validateTemplateJson(file_get_contents('zip://' . $zipPath . '#template.json'));
                    break;
                case 'tables/1.json':
                case 'tables/2.json':
                case 'tables/3.json':
                case 'tables/4.json':
                case 'tables/5.json':
                case 'tables/6.json':
                case 'tables/7.json':
                case 'tables/8.json':
                case 'tables/9.json':
                    $this->validateTableJson('', file_get_contents('zip://' . $zipPath . '#' . $entry['name']));
                    break;
                default: // scan for asset filenames
                    if (
                        !preg_match(
                            '/^assets\/(overlay|tile|token|other|tag)\/[a-zA-Z0-9_.-]*.(svg|png|jpg)$/',
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
                $this->api->sendError(400, 'zip content too large', 'SIZE_EXCEEDED', $issues);
            }

            // if we got here, no check failed, so the entry is ok!
            $valid[] = $entry['name'];
        }

        return $valid;
    }

    /**
     * Validate a template.json.
     *
     * Will termiante execution and send a 400 in case of invalid JSON.
     *
     * @param string $json JSON string.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @param Object The parsed template object.
     */
    private function validateTemplateJson(
        string $json,
        bool $checkMandatory = true
    ): object {
        $msg = 'validating template.json failed';
        $template = json_decode($json);

        // check the basics and abort on error
        if ($template === null) {
            $this->api->sendError(400, $json . ' - syntax error', 'TEMPLATE_JSON_INVALID');
        }

        if ($checkMandatory) {
            if (!isset($template->engine) || !$this->api->semverSatisfies($this->engine, $template->engine)) {
                $this->api->sendError(400, 'template.json: game engine mismatch', 'TEMPLATE_JSON_INVALID_ENGINE', [
                    $template->engine, $this->engine
                ]);
            }
            $this->api->assertHasProperties(
                'template.json',
                $template,
                ['type', 'gridSize', 'snapSize', 'version', 'engine', 'gridWidth', 'gridHeight', 'colors']
            );
        }

        // check for more stuff
        foreach ($template as $property => $value) {
            switch ($property) {
                case 'engine':
                    break; // was checked above
                case 'type':
                    $this->api->assertString('type', $value, 'grid-square');
                    break;
                case 'snapSize':
                    $this->api->assertInteger('snapSize', $value, 1, 64);
                    break;
                case 'version':
                    $this->api->assertSemver('version', $value);
                    break;
                case 'gridSize':
                    $this->api->assertInteger('gridSize', $value, 64, 64);
                    break;
                case 'gridWidth':
                    $this->api->assertInteger('gridWidth', $value, $this->minRoomGridSize, $this->maxRoomGridSize);
                    break;
                case 'gridHeight':
                    $this->api->assertInteger('gridHeight', $value, $this->minRoomGridSize, $this->maxRoomGridSize);
                    break;
                case 'colors':
                    $this->api->assertObjectArray('colors', $value, 1);
                    break;
                default:
                    $this->api->sendError(400, 'invalid template.json: ' . $property . ' unkown');
            }
        }

        return $template;
    }

    /**
     * Validate a table.json.
     *
     * Will termiante execution and send a 400 in case of invalid JSON.
     *
     * @param string $tid Table ID for error messages.
     * @param string $json JSON string.
     */
    private function validateTableJson(
        string $tid,
        string $json
    ) {
        $msg = 'validating table ' . $tid . '.json failed';
        $table = json_decode($json);
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
     * Install a template/snapshot into a room.
     *
     * Will unpack the template .zip into the room folder. Terminates execution
     * on errors. Expects the caller to handle FS locking.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $zipPath Path to snapshot/template zip to install.
     * @param array $validEntries Array of path names (strings) to extract from zip.
     */
    private function installSnapshot(
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

        // recreate potential nonexisting files as fallback
        if (!is_file($folder . 'template.json')) {
            file_put_contents($folder . 'template.json', json_encode($this->getTemplateDefault()));
        }
        if (!is_file($folder . 'tables/1.json')) {
            file_put_contents($folder . 'tables/1.json', '[]');
        }
        if (!is_file($folder . 'LICENSE.md')) {
            file_put_contents($folder . 'LICENSE.md', 'This snapshot does not provide license information.');
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
            'engine' => '^' . $this->engine,
            'gridSize' => 64,
            'gridWidth' => 48,
            'gridHeight' => 32,
            'snapSize' => 32,
            'colors' => [
                (object) [ 'name ' => 'black', 'value' => '#0d0d0d' ],
                (object) [ 'name ' => 'white', 'value' => '#ffffff' ],
            ]
        ];
    }

    /**
     * Update a table in the filesystem.
     *
     * Will update the table.json of a table with the new piece. By replacing the
     * corresponding JSON Array item with the new one via ID reference.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $tid Table id / number, e.g. 2.
     * @param object $piece The parsed & validated piece to update.
     * @param bool $create If true, this piece must not exist.
     * @return object The updated piece.
     */
    private function updatePieceTableLocked(
        string $roomName,
        string $tid,
        object $piece,
        bool $create
    ): object {
        $folder = $this->getRoomFolder($roomName);
        $lock = $this->api->waitForWriteLock($folder . '.flock');

        $oldTable = [];
        if (is_file($folder . 'tables/' . $tid . '.json')) {
            $oldTable = json_decode(file_get_contents($folder . 'tables/' . $tid . '.json'));
        }
        $result = $piece;

        // rewrite table, starting with new item
        // only latest (first) table item per ID matters
        $now = time();
        $newTable = []; // will get the new, updated/rewritten table
        $ids = []; // the IDs of all pieces that are still in $newTable after all the updates
        if ($create) { // in create mode we inject the new piece
            // add the new piece
            $newTable[] = $this->removeDefaultsFromPiece($piece);

            // re-add all old pieces
            foreach ($oldTable as $tableItem) {
                if ($piece->id === $this->ID_POINTER && $tableItem->id === $piece->id) {
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
                        if (isset($piece->layer) && $piece->layer === 'delete') {
                            continue;
                        }
                        $tableItem = $this->removeDefaultsFromPiece($this->merge($tableItem, $piece));
                        $this->validatePiece($tableItem, true); // double-check that the merged item is fine
                        $result = $tableItem;
                    }
                    if (!isset($tableItem->expires) || $tableItem->expires > time()) {
                        // only add if not expired
                        $newTable[] = $tableItem;
                        $ids[] = $tableItem->id;
                    }
                }
            }
            if (!in_array($piece->id, $ids) && (!isset($piece->layer) || $piece->layer !== 'delete')) {
                $this->api->unlockLock($lock);
                $this->api->sendError(404, 'not found: ' . $piece->id);
            }
        }
        $this->writeAsJsonAndDigest($folder, 'tables/' . $tid . '.json', $newTable);
        $this->api->unlockLock($lock);

        return $result;
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
    private function fileToAsset(
        $filename
    ) {
        $asset = new \stdClass();
        $asset->media = [$filename];
        if (
            // group.name.1x2x3.808080.png
            preg_match(
                '/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.([a-fA-F0-9]{6}|transparent|piece)\.[a-zA-Z0-9]+$/',
                $filename,
                $matches
            )
        ) {
            $asset->w = (int)$matches[2];
            $asset->h = (int)$matches[3];
            $asset->side = $matches[4];
            switch ($matches[5]) {
                case 'transparent':
                case 'piece':
                    $asset->bg = $matches[5];
                    break;
                default:
                    $asset->bg = '#' . $matches[5];
            }
            $asset->alias = $matches[1];
        } elseif (
            // group.name.1x2x3.png
            preg_match(
                '/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.[a-zA-Z0-9]+$/',
                $filename,
                $matches
            )
        ) {
            $asset->w = (int)$matches[2];
            $asset->h = (int)$matches[3];
            $asset->side = $matches[4];
            $asset->bg = '#808080';
            $asset->alias = $matches[1];
        } elseif (
            // group.name.png
            preg_match('/^(.*)\.[a-zA-Z0-9]+$/', $filename, $matches)
        ) {
            $asset->w = 1;
            $asset->h = 1;
            $asset->side = 1;
            $asset->bg = '#808080';
            $asset->alias = $matches[1];
        }
        return $asset;
    }

    /**
     * Regenerate a library JSON.
     *
     * Done by iterating over all files in the assets folder.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @return array The generated library JSON data object.
     */
    private function generateLibraryJson(
        string $roomName
    ): array {
        // generate json data
        $roomFolder = $this->getRoomFolder($roomName);
        $assets = [];
        foreach ($this->assetTypes as $type) {
            $assets[$type] = [];
            $lastAsset = null;
            foreach (glob($roomFolder . 'assets/' . $type . '/*') as $filename) {
                $asset = $this->fileToAsset(basename($filename));
                $asset->type = $type;

                // this ID only has to be unique within the room, but should be reproducable
                // therefore we use a fast hash and even only use parts of it
                $idBase = $type . '/' . $asset->alias . '.' . $asset->w . 'x' . $asset->h . 'x' . $asset->side;
                $asset->id = substr(hash('md5', $idBase), -16);

                if (
                    $lastAsset === null
                    || $lastAsset->alias !== $asset->alias
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
                    if (preg_match('/^X+$/', $asset->side)) { // this is a back side
                        $asset->back = $asset->media[0];
                        $asset->media = [];
                    } elseif ((int)$asset->side === 0) { // this is a background layer
                        $asset->base = $asset->media[0];
                        $asset->media = [];
                    }
                    unset($asset->side); // we don't keep the side in the json data
                    $lastAsset = $asset;
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
    private function writeAsJsonAndDigest(
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
     * Parse incoming JSON for pieces.
     *
     * @param string $json JSON string from the client.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object Validated JSON, converted to an object.
     */
    private function validatePieceJson(
        string $json,
        bool $checkMandatory
    ): object {
        $piece = $this->api->assertJson($json);
        return $this->validatePiece($piece, $checkMandatory);
    }

    /**
     * Remove properties that are at their default values from a piece. Add
     * 'expires' fields for pieces that are short-lived.
     *
     * Saves some space in the JSON later on.
     *
     * @param object $piece Full piece.
     * @return object New, reduced object.
     */
    private function removeDefaultsFromPiece(
        object $piece
    ): object {
        if (isset($piece->w) && $piece->w === 1) {
            unset($piece->w);
        }
        if (isset($piece->h) && $piece->h === 1) {
            unset($piece->h);
        }
        if (isset($piece->r) && $piece->r === 0) {
            unset($piece->r);
        }
        if (isset($piece->side) && $piece->side === 0) {
            unset($piece->side);
        }
        if (isset($piece->n) && $piece->n === 0) {
            unset($piece->n);
        }
        if (isset($piece->color) && $piece->color === 0) {
            unset($piece->color);
        }
        if (isset($piece->label) && $piece->label === '') {
            unset($piece->label);
        }
        if (isset($piece->tag) && $piece->tag === '') {
            unset($piece->tag);
        }
        if (isset($piece->asset) && $piece->asset === $this->ID_POINTER) {
            $piece->expires = time() + 8;
        }
        return $piece;
    }

    /**
     * Sanity check for pieces.
     *
     * @param object $piece Full or partial piece.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object New, validated object.
     */
    private function validatePiece(
        object $piece,
        bool $checkMandatory
    ): object {
        $validated = new \stdClass();
        foreach ($piece as $property => $value) {
            switch ($property) {
                case 'id':
                    $validated->id = $this->api->assertString('id', $value, '^[0-9a-f]{16}$');
                    break;
                case 'layer':
                    $validated->layer = $this->api->assertEnum('layer', $value, $this->layers);
                    break;
                case 'asset':
                    $validated->asset = $this->api->assertString('asset', $value, '^[0-9a-f]{16}$');
                    break;
                case 'w':
                    $validated->w = $this->api->assertInteger('w', $value, 1, 32);
                    break;
                case 'h':
                    $validated->h = $this->api->assertInteger('h', $value, 1, 32);
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
                case 'side':
                    $validated->side = $this->api->assertInteger('side', $value, 0, 128);
                    break;
                case 'color':
                    if (property_exists($piece, 'layer') && $piece->layer === 'note') {
                        $validated->color = $val = $this->api->assertInteger(
                            'color',
                            $value,
                            0,
                            sizeof($this->stickyNotes) - 1
                        );
                    } else {
                        $validated->color = $val = $this->api->assertInteger('color', $value, 0, 15);
                    }
                    break;
                case 'n':
                    $validated->n = $this->api->assertInteger('n', $value, 0, 15);
                    break;
                case 'r':
                    $validated->r = $this->api->assertEnum('r', $value, [0, 90, 180, 270]);
                    break;
                case 'label':
                    if (property_exists($piece, 'layer') && $piece->layer !== 'note') {
                        $validated->label = trim($this->api->assertString('label', $value, '^[^\n\r]{0,32}$'));
                    } else {
                        $validated->label = trim($this->api->assertString('label', $value, '^[^\n\r]{0,128}$'));
                    }
                    break;
                case 'tag':
                    $validated->tag = trim($this->api->assertString('tag', $value, '^[^\n\r]{0,32}$'));
                    break;
                case 'expires':
                    $validated->expires = 0; // we always override externaly provides expiry dates on create/update
                    break;
                default:
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' unkown');
            }
        }

        if ($checkMandatory) {
            switch ($validated->layer) {
                case 'note':
                    $mandatory = ['layer', 'x', 'y', 'z'];
                    break;
                default:
                    $mandatory = ['layer', 'asset', 'x', 'y', 'z'];
            }
            $this->api->assertHasProperties('piece', $validated, $mandatory);
        }

        return $validated;
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
        string $json,
        bool $checkMandatory
    ): object {
        $incoming = $this->api->assertJson($json);
        $validated = new \stdClass();

        if ($checkMandatory) {
            $this->api->assertHasProperties('room', $incoming, ['name']);
        }

        foreach ($incoming as $property => $value) {
            switch ($property) {
                case 'id':
                case 'auth':
                    break; // we accept but ignore these
                case '_files':
                    $validated->_files = $value;
                    break;
                case 'name':
                    $validated->name = $this->api->assertString('name', $value, '[A-Za-z0-9]{8,48}');
                    break;
                case 'template':
                    $validated->template = $this->api->assertString('template', $value, '[A-Za-z0-9]{1,99}');
                    break;
                default:
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' unkown');
            }
        }

        return $validated;
    }

    /**
     * Parse incoming JSON for (new) assets.
     *
     * @param string $json JSON string from the client.
     * @return object Validated JSON, convertet to an object.
     */
    private function validateAsset(
        string $json
    ): object {
        $incoming = $this->api->assertJson($json);
        $validated = new \stdClass();

        $this->api->assertHasProperties(
            'asset',
            $incoming,
            ['name', 'format', 'layer', 'w', 'h', 'base64', 'bg']
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
                case 'layer':
                    $validated->layer = $this->api->assertEnum('layer', $value, $this->layers);
                    break;
                case 'w':
                    $validated->w = $this->api->assertInteger('w', $value, 1, 32);
                    break;
                case 'h':
                    $validated->h = $this->api->assertInteger('h', $value, 1, 32);
                    break;
                case 'base64':
                    $validated->base64 = $this->api->assertBase64('base64', $value);
                    break;
                case 'bg':
                    $validated->bg = $this->api->assertString('bg', $value, '#[a-fA-F0-9]{6}|transparent|piece');
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

        // assemble json
        $info = new \stdClass();
        $info->version = $server->version;
        $info->engine = $server->engine;
        $info->ttl = $server->ttl;
        $info->snapshotUploads = $server->snapshotUploads;
        $info->freeRooms = $this->getFreeRooms($server);
        $info->root = $this->api->getAPIPath();

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
        foreach (glob($this->api->getDataDir() . 'templates/*zip') as $filename) {
            $zip = pathinfo($filename);
            $templates[] = $zip['filename'];
        }
        $this->api->sendReply(200, json_encode($templates));
    }

    // --- room handling endpoints ---------------------------------------------

    /**
     * Setup a new room.
     *
     * If there is a free room available, this will create a new room folder and
     * initialize it properly. Will terminate with 201 or an error.
     *
     * @param string $payload Room JSON from client.
     */
    public function createRoomLocked(
        string $payload
    ) {
        $item = $this->api->assertJson($payload);

        // check the password (if required)
        $server = $this->getServerConfig();
        if ($server->passwordCreate ?? '' !== '') {
            if (!password_verify($item->auth ?? '', $server->passwordCreate)) {
                $this->api->sendError(401, 'valid password required');
            }
        }

        // check if we have free rooms left
        if ($this->getFreeRooms($server) <= 0) {
            $this->api->sendError(503, 'no free rooms available');
        }

        // sanitize item by recreating it
        $validated = $this->validateRoom($payload, true);

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
                $this->api->sendError(400, 'PHP upload failed', JSONRestAPI::UPLOAD_ERR[
                    $_FILES[$validated->_files[0]]['error']
                ]);
            }
            $zipPath = $_FILES[$validated->_files[0]]['tmp_name'] ?? 'invalid';
        } else {
            $zipPath = $this->api->getDataDir() . 'templates/' . $validated->template . '.zip';
        }

        // doublecheck template / snapshot
        if (!is_file($zipPath)) {
            $this->api->sendError(400, 'template not available');
        }
        $validEntries = $this->validateSnapshot($zipPath);

        // create a new room
        $newRoom = new \stdClass();
        $newRoom->id = $this->generateId();
        $newRoom->name = $validated->name;
        $newRoom->engine = $this->engine;
        $newRoom->background = new \stdClass();
        $newRoom->background->color = '#423e3d';
        $newRoom->background->scroller = '#2b2929';
        $newRoom->background->image = 'img/desktop-wood.jpg';

        $folder = $this->getRoomFolder($newRoom->name);
        if (!is_dir($folder)) {
            if (!mkdir($folder, 0777, true)) { // create room folder
                $this->api->sendError(500, 'can\'t write on server');
            }

            $lock = $this->api->waitForWriteLock($folder . '.flock');
            $this->installSnapshot($newRoom->name, $zipPath, $validEntries);
            $newRoom->library = $this->generateLibraryJson($newRoom->name);

            $this->regenerateDigests($folder);

            // add/overrule some template.json infos into the room.json
            $newRoom->template = json_decode(file_get_contents($folder . 'template.json'));
            if (is_file($folder . 'LICENSE.md')) {
                $newRoom->credits = file_get_contents($folder . 'LICENSE.md');
            } else {
                $newRoom->credits = 'Your template does not provide license information.';
            }

            // specific for 'grid-square'
            $newRoom->width = $newRoom->template->gridWidth * $newRoom->template->gridSize;
            $newRoom->height = $newRoom->template->gridHeight * $newRoom->template->gridSize;

            $this->writeAsJsonAndDigest($folder, 'room.json', $newRoom);
            $this->api->unlockLock($lock);

            $this->api->sendReply(201, json_encode($newRoom), '/api/rooms/' . $newRoom->name);
        }
        $this->api->sendReply(409, json_encode($newRoom));
    }

    /**
     * Populate digest.json with up-to-date crc32 hashes.
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
     * Will terminate with 201 or an error.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $payload Parcial template JSON from client.
     */
    public function updateRoomTemplateLocked(
        string $roomName,
        string $payload
    ) {
        $template = $this->validateTemplateJson($payload, false);

        $folder = $this->getRoomFolder($roomName);
        $lock = $this->api->waitForWriteLock($folder . '.flock');

        // update template.json
        $templateFS = json_decode(file_get_contents($folder . 'template.json'));
        if (isset($template->gridWidth)) {
            $templateFS->gridWidth = $template->gridWidth;
        }
        if (isset($template->gridHeight)) {
            $templateFS->gridHeight = $template->gridHeight;
        }
        $this->writeAsJsonAndDigest($folder, 'template.json', $templateFS);

        // update room.json
        $roomFS = json_decode(file_get_contents($folder . 'room.json'));
        $roomFS->template = $templateFS;
        $roomFS->width = $templateFS->gridWidth * $templateFS->gridSize;
        $roomFS->height = $templateFS->gridHeight * $templateFS->gridSize;
        $this->writeAsJsonAndDigest($folder, 'room.json', $roomFS);

        $this->api->unlockLock($lock);
        $this->api->sendReply(201, json_encode($templateFS));
    }

    /**
     * Get room metadata.
     *
     * Will return the room.json from a room's folder.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     */
    public function getRoom(
        string $roomName
    ) {
        $folder = $this->getRoomFolder($roomName);
        if (is_dir($folder)) {
            $body = $this->api->fileGetContentsLocked(
                $folder . 'room.json',
                $folder . '.flock'
            );
            $this->api->sendReply(200, $body, null, 'crc32:' . crc32($body));
        }
        $this->api->sendError(404, 'not found: ' . $roomName);
    }

    /**
     * Get room digest / changelog.
     *
     * Will return the digest.json from a room's folder.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     */
    public function getRoomDigest(
        string $roomName
    ) {
        $folder = $this->getRoomFolder($roomName);
        if (is_dir($folder)) {
            $this->api->sendReply(200, $this->api->fileGetContentsLocked(
                $folder . 'digest.json',
                $folder . '.flock'
            ));
        }
        $this->api->sendError(404, 'not found: ' . $roomName);
    }

    /**
     * Delete a whole room.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     */
    public function deleteRoom(
        string $roomName
    ) {
        $this->api->deleteDir($this->getRoomFolder($roomName));

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
     * Get the content of a table.
     *
     * Returns the [0-9].json containing all pieces on the table.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param int $tid Table id / number, e.g. 2.
     */
    public function getTable(
        string $roomName,
        string $tid
    ) {
        $this->assertTableNo($tid);
        $folder = $this->getRoomFolder($roomName);
        if (is_dir($folder)) {
            $body = '[]';
            if (is_file($folder . 'tables/' . $tid . '.json')) {
                $body = $this->api->fileGetContentsLocked(
                    $folder . 'tables/' . $tid . '.json',
                    $folder . '.flock'
                );
            }
            $this->api->sendReply(200, $body, null, 'crc32:' . crc32($body));
        }
        $this->api->sendError(404, 'not found: ' . $roomName);
    }

    /**
     * Replace the internal state of a table with a new one.
     *
     * Can be used to reset a table or to revert to a save.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param int $tid Table id / number, e.g. 2.
     * @param string $json New table JSON from client.
     */
    public function putTableLocked(
        string $roomName,
        string $tid,
        string $json
    ) {
        $this->assertTableNo($tid);
        $folder = $this->getRoomFolder($roomName);
        $newTable = $this->validateTableJson($tid, $json);

        $lock = $this->api->waitForWriteLock($folder . '.flock');
        $this->writeAsJsonAndDigest($folder, 'tables/' . $tid . '.json', $newTable);
        $this->api->unlockLock($lock);

        $this->api->sendReply(200, json_encode($newTable));
    }

    /**
     * Add a new piece to a table.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $json Full piece JSON from client.
     */
    public function createPiece(
        string $roomName,
        string $tid,
        string $json
    ) {
        $this->assertTableNo($tid);
        $piece = $this->validatePieceJson($json, true);
        if (isset($piece->asset) && $piece->asset === $this->ID_POINTER) {
            // there can only be one pointer and it has a fixed ID
            $piece->id = $this->ID_POINTER;
        } else {
            $piece->id = $this->generateId();
        }
        $this->updatePieceTableLocked($roomName, $tid, $piece, true);
        $this->api->sendReply(201, json_encode($piece));
    }

    /**
     * Get an individual piece.
     *
     * Not very performant, but also not needed very often ;)
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $pieceId Id of piece.
     */
    public function getPiece(
        string $roomName,
        string $tid,
        string $pieceId
    ) {
        $this->assertTableNo($tid);
        $folder = $this->getRoomFolder($roomName);

        if (is_file($folder . 'tables/' . $tid . '.json')) {
            $table = json_decode($this->api->fileGetContentsLocked(
                $folder . 'tables/' . $tid . '.json',
                $folder . '.flock'
            ));

            foreach ($table as $piece) {
                if ($piece->id === $pieceId) {
                    $this->api->sendReply(200, json_encode($piece));
                }
            }
        }

        $this->api->sendError(404, 'not found: piece ' . $pieceId . ' in room ' . $roomName . ' on table ' . $tid);
    }

    /**
     * Update a piece.
     *
     * Can overwrite the whole piece or only patch a few fields.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $pieceID ID of the piece to update.
     * @param string $json Full or parcial piece JSON from client.
     */
    public function updatePiece(
        string $roomName,
        string $tid,
        string $pieceId,
        string $json
    ) {
        $this->assertTableNo($tid);
        $patch = $this->validatePieceJson($json, false);
        $patch->id = $pieceId; // overwrite with data from URL
        $updatedPiece = $this->updatePieceTableLocked($roomName, $tid, $patch, false);
        $this->api->sendReply(200, json_encode($updatedPiece));
    }

    /**
     * Update multiple pieces.
     *
     * Can overwrite a whole piece or only patch a few fields.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $json Array of full or parcial pieces JSON from client.
     */
    public function updatePieces(
        string $roomName,
        string $tid,
        string $json
    ) {
        $this->assertTableNo($tid);

        // check if we got JSON array of valid piece-patches and IDs
        $patches = $this->api->assertJsonArray($json);
        $toPatch = [];
        foreach ($patches as $patch) {
            $piece = $this->validatePiece($patch, false);
            $this->api->assertHasProperties('piece', $patch, ['id']);
        }

        // looks good. do the update(s).
        foreach ($patches as $patch) {
            $updatedPiece = $this->updatePieceTableLocked($roomName, $tid, $patch, false);
        }

        $this->api->sendReply(200, json_encode($patches));
    }

    /**
     * Delete a piece from a room.
     *
     * Will not remove it from the library.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $tid Table id / number, e.g. 2.
     * @param string $pieceID ID of the piece to delete.
     */
    public function deletePiece(
        string $roomName,
        string $tid,
        string $pieceId
    ) {
        $this->assertTableNo($tid);

        // create a dummy 'delete' object to represent deletion
        $piece = new \stdClass(); // sanitize item by recreating it
        $piece->layer = 'delete';
        $piece->id = $pieceId;

        $this->updatePieceTableLocked($roomName, $tid, $piece, false);
        $this->api->sendReply(204, '');
    }

    /**
     * Add a new asset to the library of a room.
     *
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param string $json Full asset JSON from client.
     */
    public function createAssetLocked(
        string $roomName,
        string $json
    ) {
        $asset = $this->validateAsset($json);

        // determine asset path elements
        $folder = $this->getRoomFolder($roomName);
        $filename = $asset->name . '.' . $asset->w . 'x' . $asset->h . 'x1.' .
            str_replace('#', '', $asset->bg) . '.' . $asset->format;

        // output file data
        $lock = $this->api->waitForWriteLock($folder . '.flock');
        file_put_contents($folder . 'assets/' . $asset->layer . '/' . $filename, base64_decode($asset->base64));

        // regenerate library json
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $room->library = $this->generateLibraryJson($roomName);
        $this->writeAsJsonAndDigest($folder, 'room.json', $room);

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
     * @param string $roomName Room name, e.g. 'darkEscapingQuelea'.
     * @param int $timeZone Timezone offset of the client in minutes to UTC,
     *                         as reported by the client.
     */
    public function getSnapshot(
        string $roomName,
        int $timeZoneOffset
    ) {
        $folder = realpath($this->getRoomFolder($roomName));

        // get all files to zip and sort them
        $toZip = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($folder),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );
        foreach ($iterator as $filename => $file) {
            if (!$file->isDir()) {
                $absolutePath = $file->getRealPath();
                $relativePath = substr($absolutePath, strlen($folder) + 1);
                switch ($relativePath) { // filter those files away
                    case '.flock':
                    case 'snapshot.zip':
                    case 'room.json':
                    case 'digest.json':
                        break; // they don't go into the zip
                    default:
                        $toZip[$relativePath] = $absolutePath; // keep all others
                }
            }
        }
        ksort($toZip);

        // now zip them
        $zipName = $folder . '/snapshot.zip';
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
            $roomName . '.' . $time->format('Y-m-d-Hi') . '_' . $timeZoneOffset . '.zip');
        header('Content-type: application/zip');
        readfile($zipName);
        unlink($zipName);
        die();
    }

    /**
     * Generate an ID.
     *
     * Central function so we can change the type of ID easily later on.
     *
     * @return {String} A random ID.
     */
    private function generateId()
    {
        return JSONRestAPI::id();
    }
}
