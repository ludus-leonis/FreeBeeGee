<?php

/**
 * Copyright 2021-2023 Markus Leupold-Löwenthal
 *
 * @license AGPL-3.0-or-later
 *
 * This file is part of FreeBeeGee.
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

use PHPUnit\Framework\TestCase;

require_once 'src/php/FreeBeeGeeAPI.php';

/**
 * FreeBeeGeeAPI - unit tests for FreeBeeGeeAPI.
 *
 * Can only test helper methods that do not require a webserver or
 * filesystem access.
 */
final class FreeBeeGeeAPITest extends TestCase
{
    private $p = null;
    private $fbg = null;
    private $tempDir = null;

    private $REGEXP_ID = '/^[a-zA-Z0-9_-]{8}$/';
    private $REGEXP_SEMVER = '/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*).(0|[1-9][0-9]*)$/';

    // --- setup & helper ------------------------------------------------------

    protected function setUp(): void
    {
        $this->p = json_decode(file_get_contents(dirname(__FILE__, 4) . '/package.json'));
        $this->fbg = $this->createApi(true);
    }

    private function createApi(
        $fs = false, // if true, the API will be modified to write into a temp dir
        $docroot = '/src/php'
    ): object {
        global $_SERVER;
        $_SERVER['DOCUMENT_ROOT'] = dirname(__FILE__, 4) . $docroot;
        $fbg = new FreeBeeGeeAPI();
        $fbg->setDebug(sys_get_temp_dir() . '/php-fbg/', $this->p->version, $this->p->versionEngine);
        if ($fs) {
            $this->tempDir = sys_get_temp_dir() . '/php-fbg/' . time() . '/';
            if (!is_dir($this->tempDir)) {
                mkdir($this->tempDir, 0777, true);
            }
            $fbg->setDebug($this->tempDir, $this->p->version, $this->p->versionEngine);
        }
        return $fbg;
    }

    private function pathToTestData($relative)
    {
        return dirname(__FILE__, 2) . '/data/' . $relative;
    }

    private function pathToCache($relative)
    {
        return dirname(__FILE__, 4) . '/.cache/' . $relative;
    }

    private function assertHTTPStatus(callable $testcode, int $status, string $match = '')
    {
        try {
            $testcode();
            $this->assertFalse(true, 'assertHTTPStatus - no exception thrown');
        } catch (\Exception $e) {
            if ($e->getCode() < 100) {
                $this->assertEquals($status, $e->getMessage());
            }
            $this->assertEquals($status, $e->getCode());
            if ($match !== '') {
                $this->assertMatchesRegularExpression($match, $e->getMessage());
            }
            return $e; // for optional further tests
        }
    }

    private function semver(string $original, $major, $minor, $patch)
    {
        $parts = explode('.', $original);
        return (is_string($major) ? $major : (intval($parts[0]) + $major))
            . '.' . (is_string($minor) ? $minor : (intval($parts[1]) + $minor))
            . '.' . (is_string($patch) ? $patch : (intval($parts[2]) + $patch));
    }

    // --- tests ---------------------------------------------------------------

    public function testGenerateAssetId()
    {
        $this->assertEquals('v-e4E300', FreeBeeGeeAPI::generateAssetId('tile', 'door', 1, 2));
        $this->assertEquals('v-e4E300', FreeBeeGeeAPI::generateAssetId('tile', 'door', '1', '2'));
        $this->assertEquals('UqGF9300', FreeBeeGeeAPI::generateAssetId('sticker', 'door', 1, 2));
        $this->assertEquals('v2AC0200', FreeBeeGeeAPI::generateAssetId('tile', 'wall.broken', 1, 2));
        $this->assertEquals('etAlG300', FreeBeeGeeAPI::generateAssetId('tile', 'door', 2, 2));
        $this->assertEquals('YrLnN100', FreeBeeGeeAPI::generateAssetId('tile', 'door', 2, 1));
    }

    public function testValidateSnapshot()
    {
        $validEntries = $this->fbg->validateSnapshot($this->pathToCache('snapshots/empty.zip'));
        $this->assertEqualsCanonicalizing([], $validEntries);

        $validEntries = $this->fbg->validateSnapshot($this->pathToCache('snapshots/extra.zip'));
        $this->assertEqualsCanonicalizing([
            'setup.json',
            'LICENSE.md',
            'tables/1.json'
        ], $validEntries);

        $validEntries = $this->fbg->validateSnapshot($this->pathToCache('snapshots/full.zip'));
        $this->assertEqualsCanonicalizing([
            'setup.json',
            'LICENSE.md',
            'assets/badge/extra.svg',
            'assets/material/extra.svg',
            'assets/sticker/aab.1x1.1x1x1.svg',
            'assets/other/aaa.4x4x1.transparent.wood.jpg',
            'assets/tile/aac.9x9x1.svg',
            'assets/token/aad.plain.1x1x1.ffffff.svg',
            'assets/token/aad.plain.1x1x2.0d0d0d.svg',
            'tables/1.json',
            'tables/2.json',
        ], $validEntries);
    }

    public function testValidateRoomJSON()
    {
        $room = $this->fbg->validateRoomJSON('{}', false);
        $this->assertEqualsCanonicalizing(['convert'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);

        $room = $this->fbg->validateRoomJSON('[]', false);
        $this->assertEqualsCanonicalizing(['convert'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);

        $room = $this->fbg->validateRoomJSON('I am not JSON.', false);
        $this->assertEqualsCanonicalizing(['convert'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);

        $room = $this->fbg->validateRoomJSON('["invalid", "array"]', false);
        $this->assertEqualsCanonicalizing(['convert'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);

        $this->assertHTTPStatus(function () {
            $room = $this->fbg->validateRoomJSON('{}');
        }, 400, '/ name missing/');

        $room = $this->fbg->validateRoomJSON('{
            "name": "testroom"
        }');
        $this->assertEqualsCanonicalizing(['convert', 'name'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);
        $this->assertEquals('testroom', $room->name);

        $room = $this->fbg->validateRoomJSON('{
            "id": "testroom"
        }', false);
        $this->assertEqualsCanonicalizing(['convert'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);

        $room = $this->fbg->validateRoomJSON('{
            "auth": "testroom"
        }', false);
        $this->assertEqualsCanonicalizing(['convert'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);

        $room = $this->fbg->validateRoomJSON('{
            "_files": "some"
        }', false);
        $this->assertEqualsCanonicalizing(['convert', '_files'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);
        $this->assertEquals('some', $room->_files);

        $room = $this->fbg->validateRoomJSON('{
            "name": "somename"
        }', false);
        $this->assertEqualsCanonicalizing(['convert', 'name'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);
        $this->assertEquals('somename', $room->name);

        $room = $this->fbg->validateRoomJSON('{
            "snapshot": "some"
        }', false);
        $this->assertEqualsCanonicalizing(['convert', 'snapshot'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);
        $this->assertEquals('some', $room->snapshot);

        $room = $this->fbg->validateRoomJSON('{
            "extra": "some"
        }', false);
        $this->assertEqualsCanonicalizing(['convert'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);
    }

    public function testValidateSetupJSON()
    {
        $setup = $this->fbg->validateSetupJSON('{}', false);
        $this->assertEqualsCanonicalizing([], array_keys((array)$setup));

        $setup = $this->fbg->validateSetupJSON('I am not JSON.', false);
        $this->assertEqualsCanonicalizing([], array_keys((array)$setup));

        $setup = $this->fbg->validateSetupJSON('["invalid", "array"]', false);
        $this->assertEqualsCanonicalizing([], array_keys((array)$setup));

        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{}');
        }, 400, '/ engine missing/');

        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "engine": "x"
            }');
        }, 400, '/ type missing/');

        // --- grid-square ---

        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "engine": "x",
                "type": "grid-square"
            }');
        }, 400, '/ gridSize missing/');

        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "engine": "x",
                "type": "grid-square",
                "gridSize": 8
            }');
        }, 400, '/ gridWidth missing/');

        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "engine": "x",
                "type": "grid-square",
                "gridSize": 8,
                "gridWidth": 8
            }');
        }, 400, '/ gridHeight missing/');

        // --- grid-hex ---

        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "engine": "x",
                "type": "grid-hex"
            }');
        }, 400, '/ gridSize missing/');

        $setup = $this->fbg->validateSetupJSON('{
            "type": "grid-hex",
            "extra": "some",
            "version": "1.1.1",
            "engine": "0.1.2",

            "gridSize": 64,
            "gridWidth": 128,
            "gridHeight": 129,

            "colors": [
              { "name": "Black", "value": "#202020" },
              { "name": "Räd", "value": "#g01c16", "extra": 1 }
            ],

            "borders": [
              { "value": "#202020" },
              { "name": "Orange" }
            ]
          }
        ');

        // --- grid-hex2 ---

        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "engine": "x",
                "type": "grid-hex2"
            }');
        }, 400, '/ gridSize missing/');

        $setup = $this->fbg->validateSetupJSON('{
            "type": "grid-hex2",
            "extra": "some",
            "version": "1.1.1",
            "engine": "0.1.2",

            "gridSize": 64,
            "gridWidth": 128,
            "gridHeight": 129,

            "colors": [
              { "name": "Black", "value": "#202020" },
              { "name": "Räd", "value": "#g01c16", "extra": 1 }
            ],

            "borders": [
              { "value": "#202020" },
              { "name": "Orange" }
            ]
          }
        ');

        // --- other ---

        $setup = $this->fbg->validateSetupJSON('{
            "type": "grid-square"
        }', false);
        $this->assertEqualsCanonicalizing(['type'], array_keys((array)$setup));
        $this->assertEquals('grid-square', $setup->type);
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "type": []
            }', false);
        }, 400, '/ type invalid/');
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "type": "some"
            }', false);
        }, 400, '/ type invalid/');

        $setup = $this->fbg->validateSetupJSON('{
            "engine": "1.2.3"
        }', false);
        $this->assertEqualsCanonicalizing(['engine'], array_keys((array)$setup));
        $this->assertEquals('1.2.3', $setup->engine);
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "engine": []
            }', false);
        }, 400, '/ engine is not a Semver/');
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "engine": "some"
            }', false);
        }, 400, '/ engine is not a Semver/');

        $setup = $this->fbg->validateSetupJSON('{
            "version": "1.2.3"
        }', false);
        $this->assertEqualsCanonicalizing(['version'], array_keys((array)$setup));
        $this->assertEquals('1.2.3', $setup->version);
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "version": []
            }', false);
        }, 400, '/ version is not a Semver/');
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "version": "some"
            }', false);
        }, 400, '/ version is not a Semver/');

        $setup = $this->fbg->validateSetupJSON('{
            "gridSize": 64
        }', false);
        $this->assertEquals(64, $setup->gridSize);
        $this->assertEqualsCanonicalizing(['gridSize'], array_keys((array)$setup));
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "gridSize": []
            }', false);
        }, 400, '/ gridSize not integer between /');
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "gridSize": 17
            }', false);
        }, 400, '/ gridSize not integer between /');

        $setup = $this->fbg->validateSetupJSON('{
            "gridWidth": 64
        }', false);
        $this->assertEqualsCanonicalizing(['gridWidth'], array_keys((array)$setup));
        $this->assertEquals(64, $setup->gridWidth);
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "gridWidth": 15
            }', false);
        }, 400, '/ gridWidth not integer between /');
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "gridWidth": []
            }', false);
        }, 400, '/ gridWidth not integer between /');

        $setup = $this->fbg->validateSetupJSON('{
            "snap": true
        }', false);
        $this->assertEqualsCanonicalizing(['snap'], array_keys((array)$setup));
        $this->assertEquals(true, $setup->snap);
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "snap": "blue"
            }', false);
        }, 400, '/ snap not a boolean/');
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "snap": []
            }', false);
        }, 400, '/ snap not a boolean/');

        $setup = $this->fbg->validateSetupJSON('{
            "colors": [
              { "name": "Black", "value": "#202020" }
            ]
        }', false);
        $this->assertEquals('Black', $setup->colors[0]->name);
        $this->assertEqualsCanonicalizing(['colors'], array_keys((array)$setup));
        $this->assertEquals('#202020', $setup->colors[0]->value);
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "colors": "blue"
            }', false);
        }, 400, '/ colors is not an array/');
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "colors": []
            }', false);
        }, 400, '/ colors is not an array/');


        $setup = $this->fbg->validateSetupJSON('{
            "borders": [
              { "name": "Black", "value": "#202020" }
            ]
        }', false);
        $this->assertEquals('Black', $setup->borders[0]->name);
        $this->assertEqualsCanonicalizing(['borders'], array_keys((array)$setup));
        $this->assertEquals('#202020', $setup->borders[0]->value);
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "borders": "blue"
            }', false);
        }, 400, '/ borders is not an array/');
        $this->assertHTTPStatus(function () {
            $setup = $this->fbg->validateSetupJSON('{
                "borders": []
            }', false);
        }, 400, '/ borders is not an array/');
    }

    public function testCleanupColorJSON()
    {
        $color = $this->fbg->cleanupColorJSON('{}');
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$color));
        $this->assertEquals('NoName', $color->name);
        $this->assertEquals('#808080', $color->value);

        $color = $this->fbg->cleanupColorJSON('I am not JSON.');
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$color));

        $color = $this->fbg->cleanupColorJSON('[]');
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$color));

        $color = $this->fbg->cleanupColorJSON('{ "name": "Black", "value": "#202020", "extra": 1 }');
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$color));
        $this->assertEquals('Black', $color->name);
        $this->assertEquals('#202020', $color->value);

        $color = $this->fbg->cleanupColorJSON('{ "name": "Bl$ck", "value": "#2x2020" }');
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$color));
        $this->assertEquals('NoName', $color->name);
        $this->assertEquals('#808080', $color->value);
    }

    public function testCleanupSetupJSON()
    {
        $setup = $this->fbg->cleanupSetupJSON('{}');
        $this->assertEqualsCanonicalizing([
            'engine',
            'version',
            'type',
            'gridSize',
            'gridWidth',
            'gridHeight',
            'colors',
            'borders'
        ], array_keys((array)$setup));
        $this->assertMatchesRegularExpression($this->REGEXP_SEMVER, $setup->engine);
        $this->assertMatchesRegularExpression($this->REGEXP_SEMVER, $setup->version);
        $this->assertEquals('grid-square', $setup->type);
        $this->assertEquals(64, $setup->gridSize);
        $this->assertEquals(48, $setup->gridWidth);
        $this->assertEquals(32, $setup->gridHeight);
        $this->assertIsArray($setup->colors);
        $this->assertGreaterThan(4, count($setup->colors));
        $this->assertIsArray($setup->borders);
        $this->assertGreaterThan(4, count($setup->borders));

        $setup = $this->fbg->cleanupSetupJSON('I am not JSON.');
        $this->assertEqualsCanonicalizing([
            'engine',
            'version',
            'type',
            'gridSize',
            'gridWidth',
            'gridHeight',
            'colors',
            'borders'
        ], array_keys((array)$setup));

        $setup = $this->fbg->cleanupSetupJSON('[]');
        $this->assertEqualsCanonicalizing([
            'engine',
            'version',
            'type',
            'gridSize',
            'gridWidth',
            'gridHeight',
            'colors',
            'borders'
        ], array_keys((array)$setup));

        $setup = $this->fbg->cleanupSetupJSON('{
            "type": "grid-hex",
            "extra": "some",
            "version": "1.1.1",
            "engine": "0.1.2",

            "gridSize": 32,
            "gridWidth": 128,
            "gridHeight": 129,

            "colors": [
              { "name": "Black", "value": "#202020" },
              { "name": "Räd", "value": "#g01c16", "extra": 1 }
            ],

            "borders": [
              { "value": "#202020" },
              { "name": "Orange" }
            ]
          }
        ');
        $this->assertEquals('1.1.1', $setup->version);
        $this->assertEquals($this->fbg->unpatchSemver($this->fbg->getEngine()), $setup->engine);
        $this->assertEquals('grid-hex', $setup->type);
        $this->assertEquals(64, $setup->gridSize);
        $this->assertEquals(128, $setup->gridWidth);
        $this->assertEquals(129, $setup->gridHeight);
        $this->assertIsArray($setup->colors);
        $this->assertEquals(2, count($setup->colors));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$setup->colors[0]));
        $this->assertEquals("Black", $setup->colors[0]->name);
        $this->assertEquals("#202020", $setup->colors[0]->value);
        $this->assertEquals("NoName", $setup->colors[1]->name);
        $this->assertEquals("#808080", $setup->colors[1]->value);
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$setup->colors[1]));
        $this->assertIsArray($setup->borders);
        $this->assertEquals(2, count($setup->borders));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$setup->borders[0]));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$setup->borders[1]));
        $this->assertEquals("NoName", $setup->borders[0]->name);
        $this->assertEquals("#202020", $setup->borders[0]->value);
        $this->assertEquals("Orange", $setup->borders[1]->name);
        $this->assertEquals("#808080", $setup->borders[1]->value);

        $setup = $this->fbg->cleanupSetupJSON('{
            "type": "grid-hex2",
            "extra": "some",
            "version": "1.1.1",
            "engine": "0.1.2",

            "gridSize": 32,
            "gridWidth": 128,
            "gridHeight": 129,

            "colors": [
              { "name": "Black", "value": "#202020" },
              { "name": "Räd", "value": "#g01c16", "extra": 1 }
            ],

            "borders": [
              { "value": "#202020" },
              { "name": "Orange" }
            ]
          }
        ');
        $this->assertEquals('1.1.1', $setup->version);
        $this->assertEquals($this->fbg->unpatchSemver($this->fbg->getEngine()), $setup->engine);
        $this->assertEquals('grid-hex2', $setup->type);
        $this->assertEquals(64, $setup->gridSize);
        $this->assertEquals(128, $setup->gridWidth);
        $this->assertEquals(129, $setup->gridHeight);
        $this->assertIsArray($setup->colors);
        $this->assertEquals(2, count($setup->colors));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$setup->colors[0]));
        $this->assertEquals("Black", $setup->colors[0]->name);
        $this->assertEquals("#202020", $setup->colors[0]->value);
        $this->assertEquals("NoName", $setup->colors[1]->name);
        $this->assertEquals("#808080", $setup->colors[1]->value);
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$setup->colors[1]));
        $this->assertIsArray($setup->borders);
        $this->assertEquals(2, count($setup->borders));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$setup->borders[0]));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$setup->borders[1]));
        $this->assertEquals("NoName", $setup->borders[0]->name);
        $this->assertEquals("#202020", $setup->borders[0]->value);
        $this->assertEquals("Orange", $setup->borders[1]->name);
        $this->assertEquals("#808080", $setup->borders[1]->value);
    }

    public function testCleanupTableJSON()
    {
        $library = (object) [
            'sticker' => [],
            'tile' => [],
            'token' => [],
            'other' => [],
            'badge' => [],
            'material' => []
        ];
        $table = $this->fbg->cleanupTableJSON('[]', $library);
        $this->assertEqualsCanonicalizing([], $table);

        $table = $this->fbg->cleanupTableJSON('I am not JSON.', $library);
        $this->assertEqualsCanonicalizing([], $table);

        $table = $this->fbg->cleanupTableJSON('{
            "invalid": 1,
            "invalid2": "value"
        }', $library);
        $this->assertEqualsCanonicalizing([], $table);

        $table = $this->fbg->cleanupTableJSON('[{}]', $library);
        $this->assertEquals(1, sizeof($table));
        $this->assertEqualsCanonicalizing(['id', 'l', 'a', 'x', 'y', 'z'], array_keys((array)$table[0]));
        $this->assertMatchesRegularExpression($this->REGEXP_ID, $table[0]->id);
        $this->assertMatchesRegularExpression($this->REGEXP_ID, $table[0]->a);
        $this->assertEquals(1, $table[0]->l);
        $this->assertEquals(0, $table[0]->x);
        $this->assertEquals(0, $table[0]->y);
        $this->assertEquals(0, $table[0]->z);
    }

    public function testValidatePiece()
    {
        $this->assertHTTPStatus(function () {
            $this->fbg->validatePiece(json_decode('{}'));
        }, 400, '/ l missing/');

        $piece = $this->fbg->validatePiece(json_decode('{
            "l":4,
            "a":"b5X9-7_f",
            "x":1056,
            "y":352,
            "z":43
        }'));
        $this->assertEqualsCanonicalizing(['l', 'a', 'x', 'y', 'z'], array_keys((array)$piece));

        $piece = $this->fbg->validatePiece(json_decode('{
            "l":4,
            "a":"b5X9-7_f",
            "x":1056,
            "y":352,
            "z":43,
            "unknown":true,
            "id":"5X9-7_fb",
            "c":[5,0]
        }'));
        $this->assertEqualsCanonicalizing([
            'id',
            'l',
            'a',
            'x',
            'y',
            'z',
            'c',
        ], array_keys((array)$piece));
    }

    public function testCleanupPieceJSON()
    {
        $piece = $this->fbg->cleanupPieceJSON('{}');
        $this->assertEqualsCanonicalizing(['id', 'l', 'a', 'x', 'y', 'z'], array_keys((array)$piece));
        $this->assertMatchesRegularExpression($this->REGEXP_ID, $piece->id);
        $this->assertMatchesRegularExpression($this->REGEXP_ID, $piece->a);
        $this->assertEquals(1, $piece->l);
        $this->assertEquals(0, $piece->x);
        $this->assertEquals(0, $piece->y);
        $this->assertEquals(0, $piece->z);

        $piece = $this->fbg->cleanupPieceJSON('I am not JSON.');
        $this->assertEqualsCanonicalizing(['id', 'l', 'a', 'x', 'y', 'z'], array_keys((array)$piece));

        $piece = $this->fbg->cleanupPieceJSON('[]');
        $this->assertEqualsCanonicalizing(['id', 'l', 'a', 'x', 'y', 'z'], array_keys((array)$piece));

        $piece = $this->fbg->cleanupPieceJSON('{
            "id":"5X9-7_fb",
            "a":"b5X9-7_f",
            "l": 2,
            "x": "11",
            "y": "22",
            "z": "33"
        }');
        $this->assertEqualsCanonicalizing(['id', 'l', 'a', 'x', 'y', 'z'], array_keys((array)$piece));
        $this->assertEquals("5X9-7_fb", $piece->id);
        $this->assertEquals("b5X9-7_f", $piece->a);
        $this->assertEquals(2, $piece->l);
        $this->assertEquals(11, $piece->x);
        $this->assertEquals(22, $piece->y);
        $this->assertEquals(33, $piece->z);

        $piece = $this->fbg->cleanupPieceJSON('{
            "id":"5X9-7_fb",
            "a":"b5X9-7_f",
            "l": 2,
            "x": "11",
            "y": "22",
            "z": "33",
            "expires": 2641364536,
            "s": 3,
            "n": 4,
            "n": 5,
            "r": 90,
            "h": 6,
            "w": 7,
            "t": ["text"],
            "c": [1, 2],
            "b": ["12345678", "abcdefgh"],
            "f": 3
        }');
        $this->assertMatchesRegularExpression($this->REGEXP_ID, $piece->id);
        $this->assertEquals("5X9-7_fb", $piece->id);
        $this->assertEquals("b5X9-7_f", $piece->a);
        $this->assertEquals(2, $piece->l);
        $this->assertEquals(11, $piece->x);
        $this->assertEquals(22, $piece->y);
        $this->assertEquals(33, $piece->z);
        $this->assertEquals(2641364536, $piece->expires);
        $this->assertEquals(3, $piece->s);
        $this->assertEquals(5, $piece->n);
        $this->assertEquals(90, $piece->r);
        $this->assertEquals(6, $piece->h);
        $this->assertEquals(7, $piece->w);
        $this->assertEquals(["text"], $piece->t);
        $this->assertEquals([1, 2], $piece->c);
        $this->assertEquals(["12345678", "abcdefgh"], $piece->b);
        $this->assertEquals(3, $piece->f);

        $piece = $this->fbg->cleanupPieceJSON('{
            "id":"5X9-7_fb",
            "a":"b5X9-7_f",
            "l": 1,
            "x": 0,
            "y": 0,
            "z": 0,
            "expires": 0,
            "s": 0,
            "n": 0,
            "r": 0,
            "h": 2,
            "w": 2,
            "t": [""],
            "c": [0, 0, 0],
            "b": ["invalid-asset-id"],
            "f": 0
        }');
        $this->assertEqualsCanonicalizing(
            ['id', 'l', 'a', 'x', 'y', 'z', 'w', 'expires'],
            array_keys((array)$piece)
        );
        $this->assertMatchesRegularExpression($this->REGEXP_ID, $piece->id);
        $this->assertEquals("5X9-7_fb", $piece->id);
        $this->assertEquals("b5X9-7_f", $piece->a);
        $this->assertEquals(1, $piece->l);
        $this->assertEquals(0, $piece->x);
        $this->assertEquals(0, $piece->y);
        $this->assertEquals(0, $piece->z);
        $this->assertEquals(2, $piece->w);
        $this->assertEquals(0, $piece->expires);

        $piece = $this->fbg->cleanupPieceJSON('{
            "id": false,
            "a": false,
            "l": false,
            "x": false,
            "y": false,
            "z": false,
            "expries": false,
            "s": false,
            "n": false,
            "n": false,
            "r": false,
            "h": false,
            "w": false,
            "t": false,
            "c": false,
            "b": false,
            "extra": false,
            "f": false
        }');
        $this->assertEqualsCanonicalizing(
            ['id', 'l', 'a', 'x', 'y', 'z'],
            array_keys((array)$piece)
        );
        $this->assertMatchesRegularExpression($this->REGEXP_ID, $piece->id);
        $this->assertEquals("NO_ASSET", $piece->a);
        $this->assertEquals(1, $piece->l);
        $this->assertEquals(0, $piece->x);
        $this->assertEquals(0, $piece->y);
        $this->assertEquals(0, $piece->z);
    }

    public function testVersionMismatch()
    {
        // setup
        $this->fbg->installSnapshot('versionMismatchRoom', $this->pathToCache('snapshots/empty.zip'), []);
        $this->fbg->cleanupRoom('versionMismatchRoom');
        $meta = $this->fbg->getRoomMeta('versionMismatchRoom');
        $this->assertTrue(is_dir($meta->folder));

        // load ordinary room
        $this->assertHTTPStatus(function () {
            $room = $this->fbg->getRoom($this->fbg->getRoomMeta('versionMismatchRoom'));
        }, 200);
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $setup = json_decode(file_get_contents($meta->folder . 'setup.json'));
        $this->assertEquals($this->p->versionEngine, $room->engine);
        $this->assertEquals($this->semver($this->p->versionEngine, 0, 0, '0'), $setup->engine); // got patched

        // major room engine too new for us (major + 1) will reject
        $version = $this->semver($this->p->versionEngine, 1, 0, 0);
        $room->engine = $version;
        $room->dirty = 'dirty';
        $room->setup->engine = $version;
        $setup->engine = $version;
        file_put_contents($meta->folder . 'room.json', json_encode($room));
        file_put_contents($meta->folder . 'setup.json', json_encode($setup));
        $this->assertHTTPStatus(function () {
            $this->fbg->getRoom($this->fbg->getRoomMeta('versionMismatchRoom'));
        }, 400, '/INVALID_ENGINE.*' . $version . '/');
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $setup = json_decode(file_get_contents($meta->folder . 'setup.json'));
        $this->assertEquals($version, $room->engine); // room/engine unchanged
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals($version, $setup->engine);

        // major room engine too old for us (major - 1) will reject
        $version = $this->semver($this->p->versionEngine, -1, 0, 0);
        $room->engine = $version;
        $room->dirty = 'dirty';
        $room->setup->engine = $version;
        $setup->engine = $version;
        file_put_contents($meta->folder . 'room.json', json_encode($room));
        file_put_contents($meta->folder . 'setup.json', json_encode($setup));
        $this->assertHTTPStatus(function () {
            $this->fbg->getRoom($this->fbg->getRoomMeta('versionMismatchRoom'));
        }, 400, '/INVALID_ENGINE.*' . $version . '/');
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $setup = json_decode(file_get_contents($meta->folder . 'setup.json'));
        $this->assertEquals($version, $room->engine); // room/engine unchanged
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals($version, $setup->engine);

        // minor room engine too new for us (minor + 1) will reject
        $version = $this->semver($this->p->versionEngine, 0, 1, 0);
        $room->engine = $version;
        $room->dirty = 'dirty';
        $room->setup->engine = $version;
        $setup->engine = $version;
        file_put_contents($meta->folder . 'room.json', json_encode($room));
        file_put_contents($meta->folder . 'setup.json', json_encode($setup));
        $this->assertHTTPStatus(function () {
            $this->fbg->getRoom($this->fbg->getRoomMeta('versionMismatchRoom'));
        }, 400, '/INVALID_ENGINE.*' . $version . '/');
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $setup = json_decode(file_get_contents($meta->folder . 'setup.json'));
        $this->assertEquals($version, $room->engine); // room/engine unchanged
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals($version, $setup->engine);

        // minor room engine older (minor - 1) will auto-update room
        $version = $this->semver($this->p->versionEngine, 0, -1, 0);
        $room->engine = $version;
        $room->dirty = 'dirty';
        $room->setup->engine = $version;
        $setup->engine = $version;
        file_put_contents($meta->folder . 'room.json', json_encode($room));
        file_put_contents($meta->folder . 'setup.json', json_encode($setup));
        $room = json_decode($this->assertHTTPStatus(function () {
            $this->fbg->getRoom($this->fbg->getRoomMeta('versionMismatchRoom'));
        }, 200)->getMessage());
        $this->assertEquals($this->fbg->getEngine(), $room->engine);
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $setup = json_decode(file_get_contents($meta->folder . 'setup.json'));
        $this->assertEquals($this->p->versionEngine, $room->engine); // uses current engine now
        $this->assertObjectNotHasProperty('dirty', $room);
        $this->assertEquals($this->semver($this->p->versionEngine, 0, 0, '0'), $setup->engine); // got patched

        // room with older patch level (-1) will auto-update room
        $version = $this->semver($this->p->versionEngine, 0, 0, -1);
        $room->engine = $version;
        $room->dirty = 'dirty';
        $room->setup->engine = $version;
        $setup->engine = $version;
        file_put_contents($meta->folder . 'room.json', json_encode($room));
        file_put_contents($meta->folder . 'setup.json', json_encode($setup));
        $room = json_decode($this->assertHTTPStatus(function () {
            $this->fbg->getRoom($this->fbg->getRoomMeta('versionMismatchRoom'));
        }, 200)->getMessage());
        $this->assertEquals($this->fbg->getEngine(), $room->engine);
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $setup = json_decode(file_get_contents($meta->folder . 'setup.json'));
        $this->assertEquals($this->p->versionEngine, $room->engine); // uses current engine now
        $this->assertObjectNotHasProperty('dirty', $room);
        $this->assertEquals($this->semver($this->p->versionEngine, 0, 0, '0'), $setup->engine); // got patched

        // room with equal patch level won't touch room
        $version = $this->p->versionEngine;
        $room->engine = $version;
        $room->dirty = 'dirty';
        $room->setup->engine = $version;
        $setup->engine = $version;
        file_put_contents($meta->folder . 'room.json', json_encode($room));
        file_put_contents($meta->folder . 'setup.json', json_encode($setup));
        $room = json_decode($this->assertHTTPStatus(function () {
            $this->fbg->getRoom($this->fbg->getRoomMeta('versionMismatchRoom'));
        }, 200)->getMessage());
        $this->assertEquals($this->fbg->getEngine(), $room->engine);
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $setup = json_decode(file_get_contents($meta->folder . 'setup.json'));
        $this->assertEquals($this->p->versionEngine, $room->engine); // uses current engine
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals($version, $setup->engine);

        // room with newer patch level (+1) will reject
        $version = $this->semver($this->p->versionEngine, 0, 0, 1);
        $room->engine = $version;
        $room->dirty = 'dirty';
        $room->setup->engine = $version;
        $setup->engine = $version;
        file_put_contents($meta->folder . 'room.json', json_encode($room));
        file_put_contents($meta->folder . 'setup.json', json_encode($setup));
        $this->assertHTTPStatus(function () {
            $this->fbg->getRoom($this->fbg->getRoomMeta('versionMismatchRoom'));
        }, 400, '/INVALID_ENGINE.*' . $version . '/');
        $room = json_decode(file_get_contents($meta->folder . 'room.json'));
        $setup = json_decode(file_get_contents($meta->folder . 'setup.json'));
        $this->assertEquals($version, $room->engine); // room/engine unchanged
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals($version, $setup->engine);
    }

    public function testSetIfMissing()
    {
        $o = new \stdClass();
        $o->hello = 'world';
        $o->one = 1;

        FreeBeeGeeAPI::setIfMissing($o, 'another', 'value');
        $this->assertEquals('world', $o->hello);
        $this->assertEquals(1, $o->one);
        $this->assertEquals('value', $o->another);
    }

    public function testMerge()
    {
        $o1 = new \stdClass();
        $o1->hello = 'hi';
        $o1->there = 'there';

        $o2 = new \stdClass();
        $o2->hello = 'hello';
        $o2->world = 'world';

        $o3 = FreeBeeGeeAPI::merge($o1, $o2);
        $this->assertEquals('hello', $o3->hello);
        $this->assertEquals('world', $o3->world);
        $this->assertEquals('there', $o3->there);
    }

    public function testFileToAsset()
    {
        $asset = FreeBeeGeeAPI::fileToAsset('a.png', 'token');
        $this->assertEquals(['a.png'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('a', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('camelCase.jpeg', 'token');
        $this->assertEquals(['camelCase.jpeg'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('camelCase', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('camelCase.caseCamel.SVG', 'token');
        $this->assertEquals(['camelCase.caseCamel.SVG'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('camelCase.caseCamel', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('b.2x3x4.jpg', 'token');
        $this->assertEquals(['b.2x3x4.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('b', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('b.2x3.jpg', 'token');
        $this->assertEquals(['b.2x3.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('b', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('c.22x33x04.jpg', 'token');
        $this->assertEquals(['c.22x33x04.jpg'], $asset->media);
        $this->assertEquals(22, $asset->w);
        $this->assertEquals(33, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('c', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('c.22x33.jpg', 'token');
        $this->assertEquals(['c.22x33.jpg'], $asset->media);
        $this->assertEquals(22, $asset->w);
        $this->assertEquals(33, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('c', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.2x3x4.invalid.jpg', 'token');
        $this->assertEquals(['d.2x3x4.invalid.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('d', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.2x3.invalid.jpg', 'token');
        $this->assertEquals(['d.2x3.invalid.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('d', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.abcdef.jpg', 'token');
        $this->assertEquals(['d.e.2x3x4.abcdef.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#abcdef', $asset->bg);
        $this->assertEquals('d.e', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3.abcdef.jpg', 'token');
        $this->assertEquals(['d.e.2x3.abcdef.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#abcdef', $asset->bg);
        $this->assertEquals('d.e', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('eE.2x3x4.transparent.jpg', 'token');
        $this->assertEquals(['eE.2x3x4.transparent.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('transparent', $asset->bg);
        $this->assertEquals('eE', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('eE.2x3.transparent.jpg', 'token');
        $this->assertEquals(['eE.2x3.transparent.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('transparent', $asset->bg);
        $this->assertEquals('eE', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('eE.2x3x4.1.jpg', 'token');
        $this->assertEquals(['eE.2x3x4.1.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('1', $asset->bg);
        $this->assertEquals('eE', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('eE.2x3.1.jpg', 'token');
        $this->assertEquals(['eE.2x3.1.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('1', $asset->bg);
        $this->assertEquals('eE', $asset->name);
        $this->assertObjectNotHasProperty('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.1.wood.jpg', 'token');
        $this->assertEquals(['d.e.2x3x4.1.wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('1', $asset->bg);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('d.e', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3.1.wood.jpg', 'token');
        $this->assertEquals(['d.e.2x3.1.wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('1', $asset->bg);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('d.e', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.abcdef.rough.jpg', 'token');
        $this->assertEquals(['d.e.2x3x4.abcdef.rough.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#abcdef', $asset->bg);
        $this->assertEquals('rough', $asset->tx);
        $this->assertEquals('d.e', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3.abcdef.rough.jpg', 'token');
        $this->assertEquals(['d.e.2x3.abcdef.rough.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#abcdef', $asset->bg);
        $this->assertEquals('rough', $asset->tx);
        $this->assertEquals('d.e', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('soSo.2x3x4.transparent-paper.jpg', 'token');
        $this->assertEquals(['soSo.2x3x4.transparent-paper.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('transparent', $asset->bg);
        $this->assertEquals('paper', $asset->tx);
        $this->assertEquals('soSo', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('soSo.2x3.transparent-paper.jpg', 'token');
        $this->assertEquals(['soSo.2x3.transparent-paper.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('transparent', $asset->bg);
        $this->assertEquals('paper', $asset->tx);
        $this->assertEquals('soSo', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('soSo.2x3xX.1.wood.jpg', 'token');
        $this->assertEquals(['soSo.2x3xX.1.wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals('X', $asset->s);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('soSo', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('soSo.2x3xXx6.1.wood.jpg', 'token');
        $this->assertEquals(['soSo.2x3xXx6.1.wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(6, $asset->d);
        $this->assertEquals('X', $asset->s);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('soSo', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('soSo.2x3xXx2.1.wood.jpg', 'token');
        $this->assertEquals(['soSo.2x3xXx2.1.wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(2, $asset->d);
        $this->assertEquals('X', $asset->s);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('soSo', $asset->name);
    }

    public function testrtrimArray()
    {
        $this->assertEquals(
            [],
            FreeBeeGeeAPI::rtrimArray([], 1)
        );
        $this->assertEquals(
            [],
            FreeBeeGeeAPI::rtrimArray([], '1')
        );
        $this->assertEquals(
            [1, 0, 2],
            FreeBeeGeeAPI::rtrimArray([1, 0, 2, 0, 0], 0)
        );
        $this->assertEquals(
            [1, 0, 2],
            FreeBeeGeeAPI::rtrimArray([1, 0, 2], 0)
        );
        $this->assertEquals(
            ['', '', 'x'],
            FreeBeeGeeAPI::rtrimArray(['', '  ', ' x ', '', '  '], '')
        );
    }

    public function testUnpatchSemver(): void
    {
        $this->assertEquals('1.2.0', FreeBeeGeeAPI::unpatchSemver('1.2.3'));
        $this->assertEquals('1.2.0-dev', FreeBeeGeeAPI::unpatchSemver('1.2.3-dev'));
        $this->assertEquals('11.22.0', FreeBeeGeeAPI::unpatchSemver('11.22.33'));

        $this->assertEquals('1.2.0-1.2.3', FreeBeeGeeAPI::unpatchSemver('1.2.3-1.2.3'));
    }

    public function testGet(): void
    {
        $o = (object) [
            'one' => 1,
            'two' => 2,
            'null' => null,
        ];
        $this->assertEquals(1, FreeBeeGeeAPI::get($o, 'one'));
        $this->assertEquals(2, FreeBeeGeeAPI::get($o, 'two'));
        $this->assertEquals(null, FreeBeeGeeAPI::get($o, 'null'));
        $this->assertEquals(null, FreeBeeGeeAPI::get($o, 'undefined'));
        $this->assertEquals(null, FreeBeeGeeAPI::get($o, 'One'));
    }

    public function testArrayContainsPrefix(): void
    {
        $array = [
            'entryOne',
            'entryTwo',
            'entryThree'
        ];
        $this->assertEquals(true, FreeBeeGeeAPI::arrayContainsPrefix($array, ''));
        $this->assertEquals(true, FreeBeeGeeAPI::arrayContainsPrefix($array, 'entry'));
        $this->assertEquals(true, FreeBeeGeeAPI::arrayContainsPrefix($array, 'entryOne'));
        $this->assertEquals(true, FreeBeeGeeAPI::arrayContainsPrefix($array, 'entryT'));
        $this->assertEquals(true, FreeBeeGeeAPI::arrayContainsPrefix($array, 'entryThree'));
        $this->assertEquals(false, FreeBeeGeeAPI::arrayContainsPrefix($array, 'ntry'));
        $this->assertEquals(false, FreeBeeGeeAPI::arrayContainsPrefix($array, 'Three'));
    }
}
