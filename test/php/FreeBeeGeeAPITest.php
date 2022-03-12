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
        $this->p = json_decode(file_get_contents(dirname(__FILE__, 3) . '/package.json'));
        $this->fbg = $this->createApi(true);
    }

    private function createApi(
        $fs = false,
        $docroot = '/src/php'
    ): object {
        global $_SERVER;
        $_SERVER['DOCUMENT_ROOT'] = dirname(__FILE__, 3) . $docroot;
        $fbg = new FreeBeeGeeAPI();
        $fbg->setDebug(sys_get_temp_dir() . '/php-fbg/', $this->p->version, $this->p->versionEngineTest);
        if ($fs) {
            $this->tempDir = sys_get_temp_dir() . '/php-fbg/' . time() . '/';
            if (!is_dir($this->tempDir)) {
                mkdir($this->tempDir, 0777, true);
            }
            $fbg->setDebug($this->tempDir, $this->p->version, $this->p->versionEngineTest);
        }
        return $fbg;
    }

    private function pathToTestData($relative)
    {
        return dirname(__FILE__, 2) . '/data/' . $relative;
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

    // --- tests ---------------------------------------------------------------

    public function testValidateSnapshot()
    {
        $validEntries = $this->fbg->validateSnapshot($this->pathToTestData('empty.zip'));
        $this->assertEqualsCanonicalizing([], $validEntries);

        $validEntries = $this->fbg->validateSnapshot($this->pathToTestData('extra.zip'));
        $this->assertEqualsCanonicalizing([
            'template.json',
            'LICENSE.md',
            'tables/1.json'
        ], $validEntries);

        $validEntries = $this->fbg->validateSnapshot($this->pathToTestData('full.zip'));
        $this->assertEqualsCanonicalizing([
            'template.json',
            'LICENSE.md',
            'assets/overlay/area.1x1.1x1x1.svg',
            'assets/other/dicemat.4x4x1.transparent-wood.jpg',
            'assets/tile/go.9x9x1.svg',
            'assets/token/generic.plain.1x1x2.0d0d0d.svg',
            'assets/token/generic.plain.1x1x1.ffffff.svg',
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
            "template": "some"
        }', false);
        $this->assertEqualsCanonicalizing(['convert', 'template'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);
        $this->assertEquals('some', $room->template);

        $room = $this->fbg->validateRoomJSON('{
            "extra": "some"
        }', false);
        $this->assertEqualsCanonicalizing(['convert'], array_keys((array)$room));
        $this->assertEquals(false, $room->convert);
    }

    public function testValidateTemplateJSON()
    {
        $template = $this->fbg->validateTemplateJSON('{}', false);
        $this->assertEqualsCanonicalizing([], array_keys((array)$template));

        $template = $this->fbg->validateTemplateJSON('I am not JSON.', false);
        $this->assertEqualsCanonicalizing([], array_keys((array)$template));

        $template = $this->fbg->validateTemplateJSON('["invalid", "array"]', false);
        $this->assertEqualsCanonicalizing([], array_keys((array)$template));

        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{}');
        }, 400, '/ engine missing/');

        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "engine": "x"
            }');
        }, 400, '/ type missing/');

        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "engine": "x",
                "type": "grid-square"
            }');
        }, 400, '/ gridSize missing/');

        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "engine": "x",
                "type": "grid-square",
                "gridSize": 8
            }');
        }, 400, '/ gridWidth missing/');

        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "engine": "x",
                "type": "grid-square",
                "gridSize": 8,
                "gridWidth": 8
            }');
        }, 400, '/ gridHeight missing/');

        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "engine": "x",
                "type": "grid-hex"
            }');
        }, 400, '/ gridSize missing/');

        $template = $this->fbg->validateTemplateJSON('{
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

        $template = $this->fbg->validateTemplateJSON('{
            "type": "grid-square"
        }', false);
        $this->assertEqualsCanonicalizing(['type'], array_keys((array)$template));
        $this->assertEquals('grid-square', $template->type);
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "type": []
            }', false);
        }, 400, '/ type invalid/');
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "type": "some"
            }', false);
        }, 400, '/ type invalid/');

        $template = $this->fbg->validateTemplateJSON('{
            "engine": "1.2.3"
        }', false);
        $this->assertEqualsCanonicalizing(['engine'], array_keys((array)$template));
        $this->assertEquals('1.2.3', $template->engine);
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "engine": []
            }', false);
        }, 400, '/ engine is not a Semver/');
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "engine": "some"
            }', false);
        }, 400, '/ engine is not a Semver/');

        $template = $this->fbg->validateTemplateJSON('{
            "version": "1.2.3"
        }', false);
        $this->assertEqualsCanonicalizing(['version'], array_keys((array)$template));
        $this->assertEquals('1.2.3', $template->version);
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "version": []
            }', false);
        }, 400, '/ version is not a Semver/');
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "version": "some"
            }', false);
        }, 400, '/ version is not a Semver/');

        $template = $this->fbg->validateTemplateJSON('{
            "gridSize": 64
        }', false);
        $this->assertEquals(64, $template->gridSize);
        $this->assertEqualsCanonicalizing(['gridSize'], array_keys((array)$template));
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "gridSize": []
            }', false);
        }, 400, '/ gridSize not between /');
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "gridSize": 17
            }', false);
        }, 400, '/ gridSize not between /');

        $template = $this->fbg->validateTemplateJSON('{
            "gridWidth": 64
        }', false);
        $this->assertEqualsCanonicalizing(['gridWidth'], array_keys((array)$template));
        $this->assertEquals(64, $template->gridWidth);
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "gridWidth": 15
            }', false);
        }, 400, '/ gridWidth not between /');
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "gridWidth": []
            }', false);
        }, 400, '/ gridWidth not between /');

        $template = $this->fbg->validateTemplateJSON('{
            "snap": true
        }', false);
        $this->assertEqualsCanonicalizing(['snap'], array_keys((array)$template));
        $this->assertEquals(true, $template->snap);
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "snap": "blue"
            }', false);
        }, 400, '/ snap not a boolean/');
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "snap": []
            }', false);
        }, 400, '/ snap not a boolean/');

        $template = $this->fbg->validateTemplateJSON('{
            "colors": [
              { "name": "Black", "value": "#202020" }
            ]
        }', false);
        $this->assertEquals('Black', $template->colors[0]->name);
        $this->assertEqualsCanonicalizing(['colors'], array_keys((array)$template));
        $this->assertEquals('#202020', $template->colors[0]->value);
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "colors": "blue"
            }', false);
        }, 400, '/ colors is not an array/');
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "colors": []
            }', false);
        }, 400, '/ colors is not an array/');


        $template = $this->fbg->validateTemplateJSON('{
            "borders": [
              { "name": "Black", "value": "#202020" }
            ]
        }', false);
        $this->assertEquals('Black', $template->borders[0]->name);
        $this->assertEqualsCanonicalizing(['borders'], array_keys((array)$template));
        $this->assertEquals('#202020', $template->borders[0]->value);
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
                "borders": "blue"
            }', false);
        }, 400, '/ borders is not an array/');
        $this->assertHTTPStatus(function () {
            $template = $this->fbg->validateTemplateJSON('{
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

    public function testCleanupTemplateJSON()
    {
        $template = $this->fbg->cleanupTemplateJSON('{}');
        $this->assertEqualsCanonicalizing([
            'engine',
            'version',
            'type',
            'gridSize',
            'gridWidth',
            'gridHeight',
            'colors',
            'borders'
        ], array_keys((array)$template));
        $this->assertMatchesRegularExpression($this->REGEXP_SEMVER, $template->engine);
        $this->assertMatchesRegularExpression($this->REGEXP_SEMVER, $template->version);
        $this->assertEquals('grid-square', $template->type);
        $this->assertEquals(64, $template->gridSize);
        $this->assertEquals(48, $template->gridWidth);
        $this->assertEquals(32, $template->gridHeight);
        $this->assertIsArray($template->colors);
        $this->assertGreaterThan(4, count($template->colors));
        $this->assertIsArray($template->borders);
        $this->assertGreaterThan(4, count($template->borders));

        $template = $this->fbg->cleanupTemplateJSON('I am not JSON.');
        $this->assertEqualsCanonicalizing([
            'engine',
            'version',
            'type',
            'gridSize',
            'gridWidth',
            'gridHeight',
            'colors',
            'borders'
        ], array_keys((array)$template));

        $template = $this->fbg->cleanupTemplateJSON('[]');
        $this->assertEqualsCanonicalizing([
            'engine',
            'version',
            'type',
            'gridSize',
            'gridWidth',
            'gridHeight',
            'colors',
            'borders'
        ], array_keys((array)$template));

        $template = $this->fbg->cleanupTemplateJSON('{
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
        $this->assertEquals('1.1.1', $template->version);
        $this->assertEquals($this->fbg->unpatchSemver($this->fbg->getEngine()), $template->engine);
        $this->assertEquals('grid-hex', $template->type);
        $this->assertEquals(64, $template->gridSize);
        $this->assertEquals(128, $template->gridWidth);
        $this->assertEquals(129, $template->gridHeight);
        $this->assertIsArray($template->colors);
        $this->assertEquals(2, count($template->colors));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$template->colors[0]));
        $this->assertEquals("Black", $template->colors[0]->name);
        $this->assertEquals("#202020", $template->colors[0]->value);
        $this->assertEquals("NoName", $template->colors[1]->name);
        $this->assertEquals("#808080", $template->colors[1]->value);
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$template->colors[1]));
        $this->assertIsArray($template->borders);
        $this->assertEquals(2, count($template->borders));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$template->borders[0]));
        $this->assertEqualsCanonicalizing(['name', 'value'], array_keys((array)$template->borders[1]));
        $this->assertEquals("NoName", $template->borders[0]->name);
        $this->assertEquals("#202020", $template->borders[0]->value);
        $this->assertEquals("Orange", $template->borders[1]->name);
        $this->assertEquals("#808080", $template->borders[1]->value);
    }

    public function testCleanupTableJSON()
    {
        $table = $this->fbg->cleanupTableJSON('[]');
        $this->assertEqualsCanonicalizing([], $table);

        $table = $this->fbg->cleanupTableJSON('I am not JSON.');
        $this->assertEqualsCanonicalizing([], $table);

        $table = $this->fbg->cleanupTableJSON('{
            "invalid": 1,
            "invalid2": "value"
        }');
        $this->assertEqualsCanonicalizing([], $table);

        $table = $this->fbg->cleanupTableJSON('[{}]');
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
            "b": ["12345678", "abcdefgh"]
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
            "b": ["invalid-asset-id"]
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
            "extra": false
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

    public function testLoadOldRoom()
    {
        // setup
        $this->fbg->installSnapshot('tooOldRoom', $this->pathToTestData('empty.zip'), []);
        $this->fbg->cleanupRoom('tooOldRoom');
        $folder = $this->tempDir . '/data/rooms/tooOldRoom/';
        $this->assertTrue(is_dir($folder));

        // load ordinary room
        $this->assertHTTPStatus(function () {
            $room = $this->fbg->getRoom('tooOldRoom');
        }, 200);
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $template = json_decode(file_get_contents($folder . 'template.json'));
        $this->assertEquals('2.3.4', $room->engine);
        $this->assertEquals('2.3.0', $template->engine);

        // room engine too new for us (major)
        $room->engine = '3.2.3';
        $room->dirty = 'dirty';
        $room->template->engine = '3.2.0';
        $template->engine = '3.2.0';
        file_put_contents($folder . 'room.json', json_encode($room));
        file_put_contents($folder . 'template.json', json_encode($template));
        $this->assertHTTPStatus(function () {
            $this->fbg->getRoom('tooOldRoom');
        }, 400, '/INVALID_ENGINE.*3.2.0/');
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $template = json_decode(file_get_contents($folder . 'template.json'));
        $this->assertEquals('3.2.3', $room->engine);
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals('3.2.0', $template->engine);

        // room engine too old for us (major)
        $room->engine = '1.2.3';
        $room->dirty = 'dirty';
        $room->template->engine = '1.2.0';
        $template->engine = '1.2.0';
        file_put_contents($folder . 'room.json', json_encode($room));
        file_put_contents($folder . 'template.json', json_encode($template));
        $this->assertHTTPStatus(function () {
            $this->fbg->getRoom('tooOldRoom');
        }, 400, '/INVALID_ENGINE.*1.2.0/');
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $template = json_decode(file_get_contents($folder . 'template.json'));
        $this->assertEquals('1.2.3', $room->engine);
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals('1.2.0', $template->engine);

        // room engine too new for us (minor)
        $room->engine = '2.4.0';
        $room->dirty = 'dirty';
        $room->template->engine = '2.4.0';
        $template->engine = '2.4.0';
        file_put_contents($folder . 'room.json', json_encode($room));
        file_put_contents($folder . 'template.json', json_encode($template));
        $this->assertHTTPStatus(function () {
            $this->fbg->getRoom('tooOldRoom');
        }, 400, '/INVALID_ENGINE.*2.4.0/');
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $template = json_decode(file_get_contents($folder . 'template.json'));
        $this->assertEquals('2.4.0', $room->engine);
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals('2.4.0', $template->engine);

        // room engine old but not too old for us (minor) will clean room
        $room->engine = '2.2.3';
        $room->dirty = 'dirty';
        $room->template->engine = '2.2.0';
        $template->engine = '2.2.0';
        file_put_contents($folder . 'room.json', json_encode($room));
        file_put_contents($folder . 'template.json', json_encode($template));
        $room = json_decode($this->assertHTTPStatus(function () {
            $this->fbg->getRoom('tooOldRoom');
        }, 200)->getMessage());
        $this->assertEquals($this->fbg->getEngine(), $room->engine);
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $template = json_decode(file_get_contents($folder . 'template.json'));
        $this->assertEquals('2.3.4', $room->engine);
        $this->assertObjectNotHasAttribute('dirty', $room);
        $this->assertEquals('2.3.0', $template->engine);

        // room with older patch level will clean room
        $room->engine = '2.3.2';
        $room->dirty = 'dirty';
        $room->template->engine = '2.3.0';
        $template->engine = '2.3.0';
        file_put_contents($folder . 'room.json', json_encode($room));
        file_put_contents($folder . 'template.json', json_encode($template));
        $room = json_decode($this->assertHTTPStatus(function () {
            $this->fbg->getRoom('tooOldRoom');
        }, 200)->getMessage());
        $this->assertEquals($this->fbg->getEngine(), $room->engine);
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $template = json_decode(file_get_contents($folder . 'template.json'));
        $this->assertEquals('2.3.4', $room->engine);
        $this->assertObjectNotHasAttribute('dirty', $room);
        $this->assertEquals('2.3.0', $template->engine);

        // room with equal patch level won't clean room
        $room->engine = '2.3.4';
        $room->dirty = 'dirty';
        $room->template->engine = '2.3.0';
        $template->engine = '2.3.0';
        file_put_contents($folder . 'room.json', json_encode($room));
        file_put_contents($folder . 'template.json', json_encode($template));
        $room = json_decode($this->assertHTTPStatus(function () {
            $this->fbg->getRoom('tooOldRoom');
        }, 200)->getMessage());
        $this->assertEquals($this->fbg->getEngine(), $room->engine);
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $template = json_decode(file_get_contents($folder . 'template.json'));
        $this->assertEquals('2.3.4', $room->engine);
        $this->assertEquals('dirty', $room->dirty);
        $this->assertEquals('2.3.0', $template->engine);

        // room with higher patch level will clean room
        $room->engine = '2.3.13';
        $room->dirty = 'dirty';
        $room->template->engine = '2.3.0';
        $template->engine = '2.3.0';
        file_put_contents($folder . 'room.json', json_encode($room));
        file_put_contents($folder . 'template.json', json_encode($template));
        $room = json_decode($this->assertHTTPStatus(function () {
            $this->fbg->getRoom('tooOldRoom');
        }, 200)->getMessage());
        $this->assertEquals($this->fbg->getEngine(), $room->engine);
        $room = json_decode(file_get_contents($folder . 'room.json'));
        $template = json_decode(file_get_contents($folder . 'template.json'));
        $this->assertEquals('2.3.4', $room->engine);
        $this->assertObjectNotHasAttribute('dirty', $room);
        $this->assertEquals('2.3.0', $template->engine);
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
        $asset = FreeBeeGeeAPI::fileToAsset('a.png');
        $this->assertEquals(['a.png'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('a', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('camelCase.jpeg');
        $this->assertEquals(['camelCase.jpeg'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('camelCase', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('camelCase.caseCamel.SVG');
        $this->assertEquals(['camelCase.caseCamel.SVG'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('camelCase.caseCamel', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('b.2x3x4.jpg');
        $this->assertEquals(['b.2x3x4.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('b', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('c.22x33x04.jpg');
        $this->assertEquals(['c.22x33x04.jpg'], $asset->media);
        $this->assertEquals(22, $asset->w);
        $this->assertEquals(33, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('c', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.2x3x4.invalid.jpg');
        $this->assertEquals(['d.2x3x4.invalid.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('d', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.abcdef.jpg');
        $this->assertEquals(['d.e.2x3x4.abcdef.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#abcdef', $asset->bg);
        $this->assertEquals('d.e', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('eE.2x3x4.transparent.jpg');
        $this->assertEquals(['eE.2x3x4.transparent.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('transparent', $asset->bg);
        $this->assertEquals('eE', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('eE.2x3x4.1.jpg');
        $this->assertEquals(['eE.2x3x4.1.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('1', $asset->bg);
        $this->assertEquals('eE', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.1-wood.jpg');
        $this->assertEquals(['d.e.2x3x4.1-wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('1', $asset->bg);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('d.e', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.abcdef-wood.jpg');
        $this->assertEquals(['d.e.2x3x4.abcdef-wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#abcdef', $asset->bg);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('d.e', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('soSo.2x3x4.transparent-paper.jpg');
        $this->assertEquals(['soSo.2x3x4.transparent-paper.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('transparent', $asset->bg);
        $this->assertEquals('paper', $asset->tx);
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
}
